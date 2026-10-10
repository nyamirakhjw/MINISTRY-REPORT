-- Run this ONLY if 01-diagnose.sql part A/B showed the migration is missing on production.
-- This is the exact, unmodified content of supabase/migrations/20260921000100_daily_log.sql.
-- Safe to run once against a database that does not already have these objects.
-- If any statement errors with "already exists", stop and tell me exactly which one — it means
-- production has SOME of these objects already and we should not blindly continue.

-- Daily log (LOG-01 to 08, PRO-06). Private: owner-only, never Elder-readable (§5.3, §15.3).
create table public.daily_log_entries (
  id                uuid primary key,                        -- device-generated, so a retry never duplicates (LOG-07)
  congregation_id   uuid not null references public.congregations(id),
  member_id         uuid not null references public.members(id) on delete cascade,
  service_date      date not null,
  duration_seconds  integer not null check (duration_seconds between 1 and 86400),
  note              text check (note is null or char_length(note) <= 140),
  is_carryover      boolean not null default false,
  created_at        timestamptz not null default now()
);
create index daily_log_member_date_idx on public.daily_log_entries (member_id, service_date);
-- At most one carry-over entry per person per target month, so re-running the carry-over step twice never duplicates it.
create unique index one_carryover_per_month on public.daily_log_entries (member_id, date_trunc('month', service_date))
  where is_carryover;

alter table public.daily_log_entries enable row level security;
create policy log_owner on public.daily_log_entries for all to authenticated
  using (member_id = private.current_member_id())
  with check (member_id = private.current_member_id());
-- Direct CRUD under RLS (not through a function), same pattern as the return-visit tracker will use later.
grant select, insert, update, delete on public.daily_log_entries to authenticated;

-- LOG-02: entries lock the moment that month's report is submitted. (A reopened report leaves the log editable
-- again; the log itself is never part of a correction, so this is a deliberate, documented simplification.)
create or replace function private.check_log_editable() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_member uuid := coalesce(new.member_id, old.member_id); v_date date := coalesce(new.service_date, old.service_date);
begin
  if exists (select 1 from public.reports r
              where r.member_id = v_member and r.month = date_trunc('month', v_date)::date and r.status = 'submitted') then
    raise exception 'month_locked';
  end if;
  return coalesce(new, old);
end $$;
create trigger log_locked before insert or update or delete on public.daily_log_entries
  for each row execute function private.check_log_editable();

-- What the report form pre-fills from (REP-04: "from your log: 42 h 35 min").
create or replace function public.my_log_seconds(p_month date) returns bigint
language sql stable security definer set search_path = '' as $$
  select coalesce(sum(e.duration_seconds), 0) from public.daily_log_entries e
   where e.member_id = private.current_member_id() and date_trunc('month', e.service_date)::date = date_trunc('month', p_month)::date $$;
grant execute on function public.my_log_seconds(date) to authenticated;

-- The goal in force for the signed-in member this month, from their approved arrangement or personal override (§6.6).
create or replace function public.my_month_goal(p_month date) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare m public.members; v_kind public.report_category;
begin
  m := private.caller_member();
  if m.id is null then return jsonb_build_object('category', null, 'goal_hours', null); end if;
  select a.kind into v_kind from public.service_arrangements a
   where a.member_id = m.id and a.status in ('approved', 'ended') and a.kind <> 'publisher'
     and a.start_month <= p_month and (a.end_month is null or a.end_month >= p_month) limit 1;
  if v_kind is null then return jsonb_build_object('category', 'publisher', 'goal_hours', null); end if;
  return jsonb_build_object('category', v_kind, 'goal_hours', private.goal_for(m.id, v_kind, p_month));
end $$;
grant execute on function public.my_month_goal(date) to authenticated;

-- LOG-08: leftover minutes carry over as a labelled, deletable entry on the 1st of next month (§6.5, congregation
-- setting carry_over_default). Called once by the client right after a successful pioneer submission; safe to
-- retry because of the unique index above, and it changes nothing if the publisher edited the pre-filled hours.
create or replace function public.apply_log_carryover(p_report_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare m public.members; r public.reports; v_total bigint; v_leftover int; v_carry_on boolean; v_next date;
begin
  m := private.caller_member();
  select * into r from public.reports where id = p_report_id and member_id = m.id;
  if not found or r.category = 'publisher' or r.hours is null then return; end if;
  select coalesce((c.settings->>'carry_over_default')::boolean, true) into v_carry_on from public.congregations c where c.id = m.congregation_id;
  if not v_carry_on then return; end if;
  v_total := public.my_log_seconds(r.month);
  if r.hours <> (v_total / 3600) then return; end if; -- publisher edited the pre-filled value: no carry-over
  v_leftover := v_total % 3600;
  if v_leftover <= 0 then return; end if;
  v_next := (r.month + interval '1 month')::date;
  insert into public.daily_log_entries (id, congregation_id, member_id, service_date, duration_seconds, note, is_carryover)
  values (gen_random_uuid(), m.congregation_id, m.id, v_next, v_leftover, 'carryover:' || to_char(r.month, 'YYYY-MM'), true)
  on conflict (member_id, date_trunc('month', service_date)) where is_carryover do nothing;
  update public.reports set carryover_seconds = v_leftover where id = r.id;
end $$;
grant execute on function public.apply_log_carryover(uuid) to authenticated;

-- Record that this migration has now been applied, so "supabase migration list" stays accurate
-- and a future "supabase db push" doesn't try to run it again.
insert into supabase_migrations.schema_migrations (version, name) values ('20260921000100', 'daily_log') on conflict do nothing;
