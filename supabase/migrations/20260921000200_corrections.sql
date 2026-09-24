-- Corrections flow (COR-01 to 06). A locked report stays locked until an Elder approves a correction request
-- (which reopens it for the publisher to fix and resubmit) or edits it directly. Either way the generic audit
-- trigger on `reports` already captures before/after; the functions below add the semantic entry and reason.

create type public.correction_status as enum ('pending', 'approved', 'declined');

create table public.report_corrections (
  id               uuid primary key default gen_random_uuid(),
  congregation_id  uuid not null references public.congregations(id),
  report_id        uuid not null references public.reports(id),
  requested_by     uuid not null references public.members(id),
  what_is_wrong    text[] not null check (what_is_wrong <@ array['hours', 'studies', 'participation', 'comment', 'other']
                                            and cardinality(what_is_wrong) between 1 and 5),
  reason           text not null check (char_length(reason) between 3 and 300),
  status           public.correction_status not null default 'pending',
  decided_by       uuid references public.members(id),
  decided_at       timestamptz,
  decision_note    text,
  created_at       timestamptz not null default now()
);
-- Only one open request per report (COR-01).
create unique index one_open_correction on public.report_corrections (report_id) where status = 'pending';
create index corrections_cong_status_idx on public.report_corrections (congregation_id, status);

alter table public.report_corrections enable row level security;
create policy corrections_self on public.report_corrections for select to authenticated using (requested_by = private.current_member_id());
create policy corrections_elder on public.report_corrections for select to authenticated
  using (private.is_elder() and congregation_id = private.current_congregation_id());
grant select on public.report_corrections to authenticated;

-- Tracks whether a report was ever corrected after submission, for the Elder console flag (COR-06). Who last
-- edited it directly stands apart from who originally submitted it (`submitted_by`), which on-behalf already used.
alter table public.reports add column was_corrected boolean not null default false;
alter table public.reports add column last_edited_by uuid references public.members(id);
alter table public.reports add column last_edited_at timestamptz;

-- COR-01: request a correction on a locked report. One open request at a time; the report itself is untouched
-- until an Elder decides.
create or replace function public.request_correction(p_report_id uuid, p_what_wrong text[], p_reason text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare m public.members; r public.reports; v_id uuid;
begin
  m := private.caller_member();
  if m.id is null then raise exception 'not_active'; end if;
  select * into r from public.reports where id = p_report_id and member_id = m.id;
  if not found then raise exception 'not_found'; end if;
  if r.status <> 'submitted' then raise exception 'not_pending'; end if; -- already reopened, or a closed month has no report to correct
  if char_length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'reason_required'; end if;
  if p_what_wrong is null or cardinality(p_what_wrong) = 0 then raise exception 'bad_kind'; end if;
  begin
    insert into public.report_corrections (congregation_id, report_id, requested_by, what_is_wrong, reason)
    values (m.congregation_id, r.id, m.id, p_what_wrong, btrim(p_reason))
    returning id into v_id;
  exception when unique_violation then raise exception 'not_pending'; -- a request is already open (one_open_correction)
  end;
  perform private.notify_elders(m.congregation_id, 'correction_requested', jsonb_build_object('member_id', m.id, 'month', r.month));
  return v_id;
end $$;
grant execute on function public.request_correction(uuid, text[], text) to authenticated;

-- COR-02, COR-03: approve reopens the report (audit keeps the pre-correction values); decline needs a reason.
create or replace function public.decide_correction(p_id uuid, p_approve boolean, p_note text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.members; corr public.report_corrections;
begin
  c := private.require_role('elder');
  select * into corr from public.report_corrections where id = p_id for update;
  if not found or corr.congregation_id <> c.congregation_id then raise exception 'not_found'; end if;
  if corr.status <> 'pending' then raise exception 'not_pending'; end if;
  if not p_approve and char_length(btrim(coalesce(p_note, ''))) < 3 then raise exception 'reason_required'; end if;
  if p_approve then
    update public.reports set status = 'reopened' where id = corr.report_id and status = 'submitted';
  end if;
  update public.report_corrections
     set status = case when p_approve then 'approved'::public.correction_status else 'declined'::public.correction_status end,
         decided_by = c.id, decided_at = now(), decision_note = nullif(btrim(p_note), '')
   where id = corr.id;
  perform private.audit(c.congregation_id, 'correction.decide', 'report_corrections', corr.id, null,
    jsonb_build_object('approved', p_approve), p_note);
  perform private.notify(corr.requested_by, 'correction_decided', jsonb_build_object('approved', p_approve, 'note', nullif(btrim(p_note), '')), null, true);
end $$;
grant execute on function public.decide_correction(uuid, boolean, text) to authenticated;

-- COR-02: "Edit directly". Fixes a locked report's values in place (it stays locked, unlike a reopen) and closes
-- the correction request that prompted it. Flagged in the Elder console whether or not the Elder edited their own.
create or replace function public.elder_edit_report(
  p_correction_id uuid, p_category public.report_category, p_participated boolean, p_hours int, p_studies int,
  p_comment text, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.members; corr public.report_corrections; r public.reports; n record;
begin
  c := private.require_role('elder');
  if char_length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'reason_required'; end if;
  select * into corr from public.report_corrections where id = p_correction_id for update;
  if not found or corr.congregation_id <> c.congregation_id or corr.status <> 'pending' then raise exception 'not_pending'; end if;
  select * into r from public.reports where id = corr.report_id for update;
  if p_category <> 'publisher' and not private.has_arrangement(r.member_id, p_category, r.month) then raise exception 'arrangement_not_approved'; end if;
  select * into n from private.normalize_report(p_category, p_participated, p_hours, p_studies, p_comment);
  update public.reports
     set category = p_category, participated = n.participated, hours = n.hours, studies = n.studies, comment = n.comment,
         goal_hours = private.goal_for(r.member_id, p_category, r.month), was_corrected = true,
         last_edited_by = c.id, last_edited_at = now(), version = r.version + 1
   where id = r.id;
  update public.report_corrections set status = 'approved', decided_by = c.id, decided_at = now(), decision_note = btrim(p_reason) where id = corr.id;
  perform private.audit(c.congregation_id, 'correction.edit_directly', 'reports', r.id,
    jsonb_build_object('category', r.category, 'hours', r.hours, 'studies', r.studies),
    jsonb_build_object('category', p_category, 'hours', n.hours, 'studies', n.studies), btrim(p_reason));
  perform private.notify(corr.requested_by, 'correction_decided', jsonb_build_object('approved', true, 'note', btrim(p_reason)), null, true);
end $$;
grant execute on function public.elder_edit_report(uuid, public.report_category, boolean, int, int, text, text) to authenticated;

-- REP-05/06 for a reopened report: fix and resubmit. No extra deadline (COR-03) — the original received time and
-- late flag are left exactly as they were; only the content changes.
create or replace function public.resubmit_report(
  p_report_id uuid, p_category public.report_category, p_participated boolean, p_hours int, p_studies int,
  p_comment text, p_request_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare m public.members; r public.reports; n record; v_id uuid;
begin
  m := private.caller_member();
  if m.id is null then raise exception 'not_active'; end if;
  if p_request_id is null then raise exception 'request_id_required'; end if;
  select id into v_id from public.reports where request_id = p_request_id and member_id = m.id;
  if found then return v_id; end if; -- idempotent retry
  select * into r from public.reports where id = p_report_id and member_id = m.id for update;
  if not found or r.status <> 'reopened' then raise exception 'not_pending'; end if;
  if p_category <> 'publisher' and not private.has_arrangement(m.id, p_category, r.month) then raise exception 'arrangement_not_approved'; end if;
  select * into n from private.normalize_report(p_category, p_participated, p_hours, p_studies, p_comment);
  update public.reports
     set category = p_category, participated = n.participated, hours = n.hours, studies = n.studies, comment = n.comment,
         goal_hours = private.goal_for(m.id, p_category, r.month), status = 'submitted', was_corrected = true,
         request_id = p_request_id, version = r.version + 1
   where id = r.id
   returning id into v_id;
  return v_id;
end $$;
grant execute on function public.resubmit_report(uuid, public.report_category, boolean, int, int, text, uuid) to authenticated;

-- Extend my_report_state(): a reopened report takes priority over the normal "next open month" flow (§6.8, COR-03).
create or replace function public.my_report_state() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  m public.members; tz text; v_now timestamptz := now();
  v_cur date; v_latest date; v_target date; v_from date; w record; v_opts jsonb; v_reopened public.reports;
begin
  m := private.caller_member();
  if m.id is null then return jsonb_build_object('state', 'not_active'); end if;

  select * into v_reopened from public.reports where member_id = m.id and status = 'reopened' order by month limit 1;
  if found then
    return jsonb_build_object('state', 'reopened', 'month', v_reopened.month, 'report_id', v_reopened.id,
      'category', v_reopened.category, 'participated', v_reopened.participated, 'hours', v_reopened.hours,
      'studies', v_reopened.studies, 'comment', v_reopened.comment);
  end if;

  select c.timezone into tz from public.congregations c where c.id = m.congregation_id;
  v_cur  := date_trunc('month', v_now at time zone tz)::date;
  v_from := coalesce(m.first_report_month, v_cur);
  select * into w from public.report_window(m.congregation_id, v_cur);
  v_latest := case when v_now >= w.opens_at then v_cur else (v_cur - interval '1 month')::date end;

  select g.mo::date into v_target
    from generate_series(v_from::timestamp, v_latest::timestamp, interval '1 month') g(mo)
   where not exists (select 1 from public.reports r where r.member_id = m.id and r.month = g.mo::date)
   order by g.mo limit 1;

  if v_target is null then
    v_target := (v_latest + interval '1 month')::date;
    select * into w from public.report_window(m.congregation_id, v_target);
    return jsonb_build_object('state', 'up_to_date', 'month', v_target, 'opens_at', w.opens_at);
  end if;

  select * into w from public.report_window(m.congregation_id, v_target);
  select coalesce(jsonb_agg(k order by k), '[]'::jsonb) into v_opts from (
    select 'publisher' as k
    union
    select distinct a.kind::text from public.service_arrangements a
     where a.member_id = m.id and a.status in ('approved', 'ended')
       and a.start_month <= v_target and (a.end_month is null or a.end_month >= v_target)) o;

  return jsonb_build_object(
    'state', case when v_now >= w.late_until then 'blocked' else 'open' end,
    'month', v_target, 'opens_at', w.opens_at, 'on_time_until', w.on_time_until, 'late_until', w.late_until,
    'is_late', v_now >= w.on_time_until, 'options', v_opts);
end $$;

-- admin_month_report: expose was_corrected and who last edited directly (for the self_edited flag, COR-06).
create or replace function public.admin_month_report(p_month date) returns table (
  member_id uuid, full_name text, group_id uuid, group_name text, avatar_path text, phone text, is_managed boolean,
  status text, category public.report_category, participated boolean, hours smallint, studies smallint, comment text,
  is_late boolean, submitted_at timestamptz, received_at timestamptz, submitted_via text, submitted_by_name text,
  time_adjusted boolean, zero_hours boolean, self_edited boolean, was_corrected boolean, report_id uuid)
language sql stable security invoker set search_path = '' as $$
  select m.id, m.full_name, m.group_id, g.name, m.avatar_path, m.phone, (m.user_id is null),
         coalesce(r.status::text, 'missing'), r.category, r.participated, r.hours, r.studies, r.comment,
         coalesce(r.is_late, false), r.server_received_at, r.received_at, r.submitted_via, sb.full_name,
         coalesce(r.time_adjusted, false),
         (r.category is not null and r.category <> 'publisher' and r.hours = 0),
         ((r.submitted_via = 'elder' and r.submitted_by = m.id) or r.last_edited_by = m.id),
         coalesce(r.was_corrected, false), r.id
    from public.members m
    left join public.groups g on g.id = m.group_id
    left join public.reports r on r.member_id = m.id and r.month = p_month
    left join public.members sb on sb.id = r.submitted_by
   where private.is_elder()
     and m.congregation_id = private.current_congregation_id()
     and m.status in ('active', 'inactive')
     and m.first_report_month <= p_month
     and (m.inactive_from_month is null or m.inactive_from_month > p_month)
   order by m.full_name $$;

-- Add the corrections queue count alongside approvals, arrangements and profile changes.
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
    'corrections', case when v_elder then (select count(*) from public.report_corrections rc
                    where rc.congregation_id = c.congregation_id and rc.status = 'pending') else 0 end);
end $$;

-- Realtime: the Corrections queue should update live, same as the other admin queues.
alter publication supabase_realtime add table public.report_corrections;
