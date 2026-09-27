-- Phase 3, Sprint 2 — Return visits (RV-01 to RV-08). Private tracker: never reported, never visible to
-- Elders or Ministerial Servants, excluded from exports and backups (D-30). Follows the daily_log_entries
-- pattern: direct CRUD under RLS for the owner, no policy for anyone else, ever (§15.3).

create type public.rv_status as enum ('interested', 'study_started', 'not_interested', 'moved');

create table public.return_visits (
  id               uuid primary key,                          -- device-generated, so offline creates are idempotent (RV-06)
  congregation_id  uuid not null references public.congregations(id),
  owner_id         uuid not null references public.members(id) on delete cascade,
  first_name       text not null check (char_length(btrim(first_name)) between 1 and 40),  -- first name only (R-11, RV-02)
  phone            text check (phone is null or phone ~ '^\+?[0-9 ()-]{6,20}$'),
  area             text check (area is null or char_length(area) <= 140),                  -- landmark, never a home address
  first_met_on     date,
  topic            text check (topic is null or char_length(topic) <= 200),
  literature       text check (literature is null or char_length(literature) <= 200),
  interest_level   smallint check (interest_level between 1 and 5),
  status           public.rv_status not null default 'interested',
  next_visit_at    timestamptz,
  notes            text check (notes is null or char_length(notes) <= 2000),
  last_visited_at  timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index rv_owner_next_idx on public.return_visits (owner_id, next_visit_at);
create index rv_owner_status_idx on public.return_visits (owner_id, status);

create table public.rv_visits (
  id               uuid primary key,                          -- device-generated (idempotent sync, mirrors daily_log_entries)
  return_visit_id  uuid not null references public.return_visits(id) on delete cascade,
  owner_id         uuid not null references public.members(id) on delete cascade,
  visited_at       timestamptz not null,
  notes            text check (notes is null or char_length(notes) <= 2000),
  outcome          text check (outcome is null or char_length(outcome) <= 200),
  next_visit_at    timestamptz,
  created_at       timestamptz not null default now()
);
create index rv_visits_rv_idx on public.rv_visits (return_visit_id, visited_at desc);
create index rv_visits_owner_idx on public.rv_visits (owner_id);

alter table public.return_visits enable row level security;
alter table public.rv_visits enable row level security;

-- Owner only. There is intentionally NO Elder (or Ministerial Servant, or Platform Owner) policy on either
-- table — that is the technical half of D-30 / R-11; the other half is documented in the privacy notice.
create policy rv_owner on public.return_visits for all to authenticated
  using (owner_id = private.current_member_id()) with check (owner_id = private.current_member_id() and congregation_id = private.current_congregation_id());
create policy rv_visits_owner on public.rv_visits for all to authenticated
  using (owner_id = private.current_member_id()) with check (owner_id = private.current_member_id());

grant select, insert, update, delete on public.return_visits to authenticated;
grant select, insert, update, delete on public.rv_visits to authenticated;

-- Keep `return_visits.updated_at` honest without trusting the client to set it (used for offline conflict info only).
create or replace function private.touch_rv() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
create trigger rv_touch before update on public.return_visits
  for each row execute function private.touch_rv();

-- RV-03: logging a visit is two writes (a history row, and the parent's last/next visit) that must succeed or
-- fail together — the one case in this feature that needs a function rather than direct table access.
create or replace function public.log_rv_visit(
  p_id uuid, p_return_visit_id uuid, p_visited_at timestamptz, p_notes text, p_outcome text, p_next_visit_at timestamptz
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_owner uuid := private.current_member_id(); v_rv public.return_visits;
begin
  if v_owner is null then raise exception 'not_active'; end if;
  select * into v_rv from public.return_visits where id = p_return_visit_id and owner_id = v_owner for update;
  if not found then raise exception 'not_found'; end if;

  insert into public.rv_visits (id, return_visit_id, owner_id, visited_at, notes, outcome, next_visit_at)
  values (p_id, p_return_visit_id, v_owner, p_visited_at, nullif(btrim(coalesce(p_notes, '')), ''), nullif(btrim(coalesce(p_outcome, '')), ''), p_next_visit_at)
  on conflict (id) do nothing;  -- idempotent retry (offline sync)

  update public.return_visits
     set last_visited_at = greatest(coalesce(last_visited_at, p_visited_at), p_visited_at),
         next_visit_at = p_next_visit_at
   where id = p_return_visit_id;

  return p_id;
end $$;
grant execute on function public.log_rv_visit(uuid, uuid, timestamptz, text, text, timestamptz) to authenticated;

-- RV-07: a member can download their own return visits (data controls / PRO-07), and delete any of them —
-- deletion is already plain `delete from return_visits where owner_id = ...` under RLS, no function needed.
create or replace function public.my_return_visits_export() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'return_visit', to_jsonb(rv) - 'congregation_id' - 'owner_id',
           'visits', (select coalesce(jsonb_agg(to_jsonb(v) - 'owner_id' order by v.visited_at), '[]'::jsonb)
                        from public.rv_visits v where v.return_visit_id = rv.id))), '[]'::jsonb)
    from public.return_visits rv where rv.owner_id = private.current_member_id() $$;
grant execute on function public.my_return_visits_export() to authenticated;

-- =====================================================================================================
-- Reminder enqueueing (RV-04). Pure SQL, called by pg_cron every 5 minutes (§14.6); the generic dispatch
-- pipeline (private.invoke_dispatch, already scheduled) sends whatever lands in notification_deliveries.
-- Every notification carries a dedupe key with the date baked in, so a retried cron tick never double-sends.
-- =====================================================================================================
create or replace function private.enqueue_visit_reminders() returns void
language plpgsql security definer set search_path = '' as $$
declare r record; v_today date := (now() at time zone 'Africa/Nairobi')::date;
begin
  -- 07:00 Nairobi on the day of the visit (only the window this function is scheduled to run in fires once).
  if (now() at time zone 'Africa/Nairobi')::time between '07:00' and '07:04:59' then
    for r in
      select rv.id, rv.owner_id, rv.next_visit_at from public.return_visits rv
       where rv.next_visit_at is not null
         and (rv.next_visit_at at time zone 'Africa/Nairobi')::date = v_today
    loop
      perform private.notify(r.owner_id, 'rv_due_morning',
        jsonb_build_object('rv_id', r.id, 'time', to_char(r.next_visit_at at time zone 'Africa/Nairobi', 'HH24:MI')),
        'rv_due_morning:' || r.id::text || ':' || v_today::text, true);
    end loop;
  end if;

  -- One hour before the planned time (skipped if that hour falls before 08:00 — the morning reminder already covered it, RV-04).
  for r in
    select rv.id, rv.owner_id, rv.next_visit_at from public.return_visits rv
     where rv.next_visit_at is not null
       and rv.next_visit_at between now() + interval '55 minutes' and now() + interval '60 minutes'
       and (rv.next_visit_at at time zone 'Africa/Nairobi')::time >= '08:00'
  loop
    perform private.notify(r.owner_id, 'rv_due_soon',
      jsonb_build_object('rv_id', r.id, 'time', to_char(r.next_visit_at at time zone 'Africa/Nairobi', 'HH24:MI')),
      'rv_due_soon:' || r.id::text || ':' || to_char(r.next_visit_at, 'YYYY-MM-DD-HH24-MI'), false);
  end loop;

  -- Overdue: no logged visit in 14 days, status still active, at most once a week (RV-04, §9.3 manual-style limit).
  for r in
    select rv.id, rv.owner_id from public.return_visits rv
     where rv.status in ('interested', 'study_started')
       and coalesce(rv.last_visited_at, rv.first_met_on::timestamptz, rv.created_at) < now() - interval '14 days'
       and not exists (
         select 1 from public.notification_deliveries d join public.notifications n on n.id = d.notification_id
          where n.kind = 'rv_overdue' and n.payload->>'rv_id' = rv.id::text
            and n.created_at > now() - interval '7 days')
  loop
    perform private.notify(r.owner_id, 'rv_overdue', jsonb_build_object('rv_id', r.id),
      'rv_overdue:' || r.id::text || ':' || to_char(now(), 'IYYY-IW'), false);
  end loop;
end $$;

select cron.schedule('enqueue-visit-reminders', '*/5 * * * *', $$select private.enqueue_visit_reminders()$$);
