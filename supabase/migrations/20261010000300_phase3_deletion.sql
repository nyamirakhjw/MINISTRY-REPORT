-- Phase 3, Sprint 7 — Deletion and anonymization (DEL-01, DEL-02, DEL-04, §16.7, D-36).
-- Lifecycle: request (30-day grace, cancellable) -> grace ends -> Elder gives final approval -> nightly job
-- anonymizes. Status values follow Appendix A exactly: pending, approved, cancelled, completed.

create table public.deletion_requests (
  id               uuid primary key default gen_random_uuid(),
  congregation_id  uuid not null references public.congregations(id),
  member_id        uuid not null references public.members(id),
  requested_at     timestamptz not null default now(),
  effective_at     timestamptz not null default now() + interval '30 days',
  status           text not null default 'pending' check (status in ('pending', 'approved', 'cancelled', 'completed')),
  decided_by       uuid references public.members(id),
  decided_at       timestamptz
);
-- At most one live (pending or approved) request per member.
create unique index one_live_deletion on public.deletion_requests (member_id) where status in ('pending', 'approved');
create index deletion_status_idx on public.deletion_requests (congregation_id, status, effective_at);

alter table public.deletion_requests enable row level security;
create policy deletion_self on public.deletion_requests for select to authenticated using (member_id = private.current_member_id());
create policy deletion_elder on public.deletion_requests for select to authenticated
  using (private.is_elder() and congregation_id = private.current_congregation_id());
grant select on public.deletion_requests to authenticated;

-- DEL-01: request deletion; starts the 30-day grace period. Idempotent: calling it again while one is already
-- live just returns the existing request rather than erroring, so a double-tap on a slow connection is harmless.
create or replace function public.request_deletion() returns uuid
language plpgsql security definer set search_path = '' as $$
declare m public.members; v_id uuid;
begin
  m := private.caller_member();
  if m.id is null then raise exception 'not_active'; end if;
  select id into v_id from public.deletion_requests where member_id = m.id and status in ('pending', 'approved');
  if found then return v_id; end if;
  insert into public.deletion_requests (congregation_id, member_id) values (m.congregation_id, m.id) returning id into v_id;
  perform private.audit(m.congregation_id, 'deletion.request', 'deletion_requests', v_id, null, jsonb_build_object('member_id', m.id));
  perform private.notify_elders(m.congregation_id, 'deletion_requested', jsonb_build_object('member_id', m.id));
  return v_id;
end $$;
grant execute on function public.request_deletion() to authenticated;

-- DEL-01: cancel during the grace period, self-service, no Elder involved.
create or replace function public.cancel_deletion() returns void
language plpgsql security definer set search_path = '' as $$
declare m public.members;
begin
  m := private.caller_member();
  if m.id is null then raise exception 'not_active'; end if;
  update public.deletion_requests set status = 'cancelled'
   where member_id = m.id and status = 'pending';
  if not found then raise exception 'not_found'; end if;
  perform private.audit(m.congregation_id, 'deletion.cancel', 'deletion_requests', null, null, jsonb_build_object('member_id', m.id));
end $$;
grant execute on function public.cancel_deletion() to authenticated;

-- DEL-02: Elder's final approval, only once the grace period has actually elapsed. The nightly job (below)
-- does the anonymizing so this stays fast and so the effect is auditable as two distinct, separate steps.
create or replace function public.approve_deletion(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.members; d public.deletion_requests;
begin
  c := private.require_role('elder');
  select * into d from public.deletion_requests where id = p_id and congregation_id = c.congregation_id for update;
  if not found or d.status <> 'pending' then raise exception 'not_pending'; end if;
  if d.effective_at > now() then raise exception 'grace_period_active'; end if;
  update public.deletion_requests set status = 'approved', decided_by = c.id, decided_at = now() where id = d.id;
  perform private.audit(c.congregation_id, 'deletion.approve', 'deletion_requests', d.id, null, jsonb_build_object('member_id', d.member_id));
end $$;
grant execute on function public.approve_deletion(uuid) to authenticated;

-- §16.7 step 3: name becomes "Former publisher"; photo, phone, email, username, comments, daily log, return
-- visits, notifications deleted; sign-in account removed. Numeric report rows stay so past totals remain
-- correct. `push_subscriptions` and `report_drafts` from Appendix A are not yet part of this codebase, so
-- they are intentionally left out here — add them to this function the day those tables are created.
create or replace function private.anonymize_member(p_member uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_user uuid;
begin
  select user_id into v_user from public.members where id = p_member;

  delete from public.daily_log_entries where member_id = p_member;
  delete from public.return_visits where owner_id = p_member;      -- cascades to rv_visits
  delete from public.notifications where member_id = p_member;
  update public.reports set comment = null where member_id = p_member;

  update public.members
     set full_name = 'Former publisher', username = null, email = null, phone = null,
         avatar_path = null, status = 'anonymized'
   where id = p_member;

  if v_user is not null then delete from auth.users where id = v_user; end if;  -- members.user_id -> set null on delete

  perform private.audit(null, 'deletion.anonymize', 'members', p_member, null, jsonb_build_object('member_id', p_member));
end $$;

-- Runs daily 02:00 Nairobi (§14.6). Only processes requests an Elder has already approved.
create or replace function private.process_deletions() returns void
language plpgsql security definer set search_path = '' as $$
declare d record;
begin
  for d in select id, member_id from public.deletion_requests where status = 'approved' loop
    perform private.anonymize_member(d.member_id);
    update public.deletion_requests set status = 'completed' where id = d.id;
    perform private.notify_elders(
      (select congregation_id from public.deletion_requests where id = d.id), 'deletion_ready', jsonb_build_object('member_id', d.member_id));
  end loop;
end $$;

select cron.schedule('process-deletions', '0 23 * * *', $$select private.process_deletions()$$);  -- 02:00 Nairobi (UTC+3)

-- Surface pending, grace-elapsed deletion requests in the same queue-count endpoint the console already polls.
create or replace function public.admin_queue_counts() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare c public.members; v_elder boolean;
begin
  c := private.require_role('ministerial_servant');
  v_elder := c.role = 'elder';
  return jsonb_build_object(
    'approvals', (select count(*) from public.members m where m.congregation_id = c.congregation_id
                    and m.status = 'pending' and m.avatar_path is not null),
    'arrangements', case when v_elder then (select count(*) from public.service_arrangements a
                    where a.congregation_id = c.congregation_id and a.status = 'pending'
                      and exists (select 1 from public.members x where x.id = a.member_id and x.status = 'active')) else 0 end,
    'changes', case when v_elder then (select count(*) from public.profile_change_requests p
                    where p.congregation_id = c.congregation_id and p.status = 'pending') else 0 end,
    'deletions', case when v_elder then (select count(*) from public.deletion_requests d
                    where d.congregation_id = c.congregation_id and d.status = 'pending' and d.effective_at <= now()) else 0 end);
end $$;
