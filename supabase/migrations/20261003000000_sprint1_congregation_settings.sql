-- =====================================================================
-- Sprint 1 — Congregation settings (SET-01..07), PRD §7.14, §15.4
--
-- Assumes the Phase 0/1 schema and helpers already exist and are not
-- redefined here:
--   private.current_member_id(), private.current_congregation_id(),
--   private.has_role(min_role), private.aal2(), private.is_elder(),
--   private.audit_row(), and the tables public.congregations,
--   public.groups, public.audit_log (with its append-only trigger).
--
-- Everything below is additive and safe to re-run: functions use
-- `create or replace`, triggers are dropped and recreated, and the
-- settings backfill only fills missing keys (it never overwrites a
-- value an Elder has already set).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Settings shape (documentation only — congregations.settings is jsonb)
-- ---------------------------------------------------------------------
-- {
--   "goals": {
--     "regular_pioneer": 50, "special_pioneer": 70,
--     "auxiliary_options": [15, 30]
--   },
--   "on_time_day": 10, "late_window_months": 1,
--   "carry_over_default": true,
--   "reminders": {
--     "schedule_days": [3, 5, 8, 10], "final_call_hour": 18,
--     "weekly_after_late_window": true,
--     "quiet_hours_start": "21:00", "quiet_hours_end": "06:00"
--   },
--   "landing": {
--     "midweek_day": "Wednesday", "midweek_time": "19:00",
--     "weekend_day": "Sunday", "weekend_time": "09:30",
--     "address": "", "map_link": null, "contact_line": null
--   },
--   "letterhead": { "lines": [], "signatory_title": "" }
-- }

-- Backfill defaults for any congregation missing a top-level key.
-- Existing values always win (they sit on the right of the `||` merge).
--
-- IMPORTANT: `on_time_day`, `late_window_months` and `carry_over_default` are kept at the TOP LEVEL of
-- `settings`, not nested under a `window` object — that's the shape `public.report_window()` (report_rules.sql)
-- and the daily-log carry-over read (daily_log.sql) already read from. An earlier draft of this migration
-- nested them under `settings.window`, which would have made the Window rules settings page write to a path
-- nothing else ever reads — i.e. changing it would silently have had no effect on real report deadlines.
-- Likewise `goals.auxiliary_options` matches the key name already used by core_tables.sql's default, instead
-- of introducing a second, differently-named key.
update public.congregations
set settings = (
  jsonb_build_object(
    'goals', jsonb_build_object(
      'regular_pioneer', 50, 'special_pioneer', 70,
      'auxiliary_options', jsonb_build_array(15, 30)),
    'on_time_day', 10, 'late_window_months', 1,
    'carry_over_default', true,
    'reminders', jsonb_build_object(
      'schedule_days', jsonb_build_array(3, 5, 8, 10), 'final_call_hour', 18,
      'weekly_after_late_window', true,
      'quiet_hours_start', '21:00', 'quiet_hours_end', '06:00'),
    'landing', jsonb_build_object(
      'midweek_day', 'Wednesday', 'midweek_time', '19:00',
      'weekend_day', 'Sunday', 'weekend_time', '09:30',
      'address', '', 'map_link', null, 'contact_line', null),
    'letterhead', jsonb_build_object('lines', jsonb_build_array(), 'signatory_title', '')
  ) || coalesce(settings, '{}'::jsonb)
);

-- ---------------------------------------------------------------------
-- 1. Audit trigger for congregation settings changes (SET-07)
-- ---------------------------------------------------------------------
-- private.audit_row() keys off a `congregation_id` column on the row,
-- which `congregations` doesn't have (it IS the congregation) — so it
-- gets its own small trigger function instead of reusing audit_row().
create or replace function private.audit_congregation_row() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_log (congregation_id, actor_member_id, action, entity_type, entity_id, before, after)
  values (
    coalesce(new.id, old.id),
    (select id from public.members where user_id = (select auth.uid()) limit 1),
    'congregations.' || lower(tg_op),
    'congregations',
    coalesce(new.id, old.id),
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end
  );
  return new;
end $$;

drop trigger if exists audit_congregations on public.congregations;
create trigger audit_congregations after insert or update on public.congregations
  for each row execute function private.audit_congregation_row();

-- `groups` already has a congregation_id column, so the existing generic
-- audit_row() trigger applies directly.
drop trigger if exists audit_groups on public.groups;
create trigger audit_groups after insert or update on public.groups
  for each row execute function private.audit_row();

-- ---------------------------------------------------------------------
-- 2. Reads
-- ---------------------------------------------------------------------
-- Full settings, Elder only (there is deliberately no RLS policy on
-- `congregations` for direct client reads — everything goes through
-- functions, same pattern as `reports`).
create or replace function public.get_congregation_settings()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_cong uuid; v_settings jsonb;
begin
  if not private.has_role('elder') then raise exception 'not_elder'; end if;
  if not private.aal2() then raise exception 'second_factor_required'; end if;
  v_cong := private.current_congregation_id();
  select settings into v_settings from public.congregations where id = v_cong;
  return v_settings;
end $$;
revoke all on function public.get_congregation_settings from public, anon;
grant execute on function public.get_congregation_settings to authenticated;

-- Groups: any active member of the congregation can list them
-- (needed for profile/sign-up screens too, not just Elders).
create or replace function public.list_groups()
returns setof public.groups language sql stable security definer set search_path = '' as $$
  select g.* from public.groups g
  where g.congregation_id = private.current_congregation_id()
  order by g.retired asc, g.name asc
$$;
revoke all on function public.list_groups from public, anon;
grant execute on function public.list_groups to authenticated;

-- ---------------------------------------------------------------------
-- 3. Writes — each one: Elder role + verified second factor (§16.2),
--    bounds-checked to match the client Zod schema, audited via the
--    trigger above (no manual audit_log insert needed).
-- ---------------------------------------------------------------------

-- SET-03 Goal defaults
create or replace function public.update_congregation_goals(
  p_regular smallint, p_special smallint, p_auxiliary_options smallint[])
returns void language plpgsql security definer set search_path = '' as $$
declare v_cong uuid;
begin
  if not private.has_role('elder') then raise exception 'not_elder'; end if;
  if not private.aal2() then raise exception 'second_factor_required'; end if;
  if p_regular not between 1 and 744 or p_special not between 1 and 744 then
    raise exception 'goal_out_of_range';
  end if;
  if array_length(p_auxiliary_options, 1) <> 2
     or p_auxiliary_options[1] < 1 or p_auxiliary_options[1] > 744
     or p_auxiliary_options[2] < 1 or p_auxiliary_options[2] > 744
     or p_auxiliary_options[1] >= p_auxiliary_options[2] then
    raise exception 'auxiliary_options_invalid';
  end if;
  v_cong := private.current_congregation_id();
  -- `goals.auxiliary_options` — matches the key core_tables.sql's default already uses. Note this is
  -- informational today: `service_arrangements.aux_goal_hours` has a hard `check (in (15, 30))` (Appendix A),
  -- so an Elder narrowing these options doesn't yet constrain what a publisher can request. Loosen that CHECK
  -- (or read this setting when validating an arrangement request) before relying on it to change behaviour.
  update public.congregations
  set settings = jsonb_set(
        jsonb_set(
          jsonb_set(settings, '{goals,regular_pioneer}', to_jsonb(p_regular)),
          '{goals,special_pioneer}', to_jsonb(p_special)),
        '{goals,auxiliary_options}', to_jsonb(p_auxiliary_options))
  where id = v_cong;
end $$;
revoke all on function public.update_congregation_goals from public, anon;
grant execute on function public.update_congregation_goals to authenticated;

-- SET-04 Window rules + SET-06 carry-over default (grouped: both govern month rollover).
-- Writes top-level `on_time_day` / `late_window_months` — the exact path `public.report_window()` reads
-- (report_rules.sql), so a change here takes effect on the next call, same as the PRD's "changes apply to
-- future months only" (SET-04).
create or replace function public.update_window_rules(
  p_on_time_day smallint, p_late_window_months smallint, p_carry_over_default boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_cong uuid;
begin
  if not private.has_role('elder') then raise exception 'not_elder'; end if;
  if not private.aal2() then raise exception 'second_factor_required'; end if;
  if p_on_time_day not between 1 and 27 then raise exception 'on_time_day_out_of_range'; end if;
  if p_late_window_months not between 0 and 12 then raise exception 'late_window_out_of_range'; end if;
  v_cong := private.current_congregation_id();
  update public.congregations
  set settings = jsonb_set(
        jsonb_set(
          jsonb_set(settings, '{on_time_day}', to_jsonb(p_on_time_day)),
          '{late_window_months}', to_jsonb(p_late_window_months)),
        '{carry_over_default}', to_jsonb(p_carry_over_default))
  where id = v_cong;
end $$;
revoke all on function public.update_window_rules from public, anon;
grant execute on function public.update_window_rules to authenticated;

-- SET-05 Reminder schedule + quiet hours
create or replace function public.update_reminder_schedule(
  p_schedule_days smallint[], p_final_call_hour smallint, p_weekly_after boolean,
  p_quiet_start time, p_quiet_end time)
returns void language plpgsql security definer set search_path = '' as $$
declare v_cong uuid; d smallint;
begin
  if not private.has_role('elder') then raise exception 'not_elder'; end if;
  if not private.aal2() then raise exception 'second_factor_required'; end if;
  if array_length(p_schedule_days, 1) is null or array_length(p_schedule_days, 1) < 1 then
    raise exception 'schedule_days_required';
  end if;
  foreach d in array p_schedule_days loop
    if d not between 1 and 31 then raise exception 'schedule_day_out_of_range'; end if;
  end loop;
  if p_final_call_hour not between 0 and 23 then raise exception 'final_call_hour_out_of_range'; end if;
  v_cong := private.current_congregation_id();
  update public.congregations
  set settings = jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(settings, '{reminders,schedule_days}', to_jsonb(p_schedule_days)),
              '{reminders,final_call_hour}', to_jsonb(p_final_call_hour)),
            '{reminders,weekly_after_late_window}', to_jsonb(p_weekly_after)),
          '{reminders,quiet_hours_start}', to_jsonb(to_char(p_quiet_start, 'HH24:MI'))),
        '{reminders,quiet_hours_end}', to_jsonb(to_char(p_quiet_end, 'HH24:MI')))
  where id = v_cong;
end $$;
revoke all on function public.update_reminder_schedule from public, anon;
grant execute on function public.update_reminder_schedule to authenticated;

-- SET-01 (landing portion): meeting days/times, address, map link, contact line
create or replace function public.update_landing_settings(
  p_midweek_day text, p_midweek_time time, p_weekend_day text, p_weekend_time time,
  p_address text, p_map_link text, p_contact_line text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_cong uuid;
  v_days text[] := array['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
begin
  if not private.has_role('elder') then raise exception 'not_elder'; end if;
  if not private.aal2() then raise exception 'second_factor_required'; end if;
  if not (p_midweek_day = any(v_days)) or not (p_weekend_day = any(v_days)) then
    raise exception 'invalid_meeting_day';
  end if;
  if char_length(coalesce(p_address, '')) = 0 or char_length(p_address) > 300 then
    raise exception 'address_length';
  end if;
  v_cong := private.current_congregation_id();
  update public.congregations
  set settings = jsonb_set(settings, '{landing}', jsonb_build_object(
        'midweek_day', p_midweek_day, 'midweek_time', to_char(p_midweek_time, 'HH24:MI'),
        'weekend_day', p_weekend_day, 'weekend_time', to_char(p_weekend_time, 'HH24:MI'),
        'address', p_address,
        'map_link', nullif(btrim(coalesce(p_map_link, '')), ''),
        'contact_line', nullif(btrim(coalesce(p_contact_line, '')), '')))
  where id = v_cong;
end $$;
revoke all on function public.update_landing_settings from public, anon;
grant execute on function public.update_landing_settings to authenticated;

-- SET-01 (letterhead portion): letterhead lines + signatory title
create or replace function public.update_letterhead_settings(p_lines text[], p_signatory_title text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_cong uuid;
begin
  if not private.has_role('elder') then raise exception 'not_elder'; end if;
  if not private.aal2() then raise exception 'second_factor_required'; end if;
  if array_length(p_lines, 1) > 6 then raise exception 'too_many_letterhead_lines'; end if;
  if char_length(coalesce(p_signatory_title, '')) = 0 then raise exception 'signatory_title_required'; end if;
  v_cong := private.current_congregation_id();
  update public.congregations
  set settings = jsonb_set(
        jsonb_set(settings, '{letterhead,lines}', to_jsonb(coalesce(p_lines, array[]::text[]))),
        '{letterhead,signatory_title}', to_jsonb(p_signatory_title))
  where id = v_cong;
end $$;
revoke all on function public.update_letterhead_settings from public, anon;
grant execute on function public.update_letterhead_settings to authenticated;

-- SET-02 Groups: add, rename, retire (never delete)
create or replace function public.add_group(p_name text)
returns public.groups language plpgsql security definer set search_path = '' as $$
declare v_cong uuid; v_group public.groups;
begin
  if not private.has_role('elder') then raise exception 'not_elder'; end if;
  if not private.aal2() then raise exception 'second_factor_required'; end if;
  if char_length(btrim(coalesce(p_name, ''))) < 2 then raise exception 'group_name_too_short'; end if;
  v_cong := private.current_congregation_id();
  insert into public.groups (congregation_id, name) values (v_cong, btrim(p_name))
  returning * into v_group;
  return v_group;
end $$;
revoke all on function public.add_group from public, anon;
grant execute on function public.add_group to authenticated;

create or replace function public.rename_group(p_group_id uuid, p_name text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_cong uuid;
begin
  if not private.has_role('elder') then raise exception 'not_elder'; end if;
  if not private.aal2() then raise exception 'second_factor_required'; end if;
  if char_length(btrim(coalesce(p_name, ''))) < 2 then raise exception 'group_name_too_short'; end if;
  v_cong := private.current_congregation_id();
  update public.groups set name = btrim(p_name)
  where id = p_group_id and congregation_id = v_cong;
  if not found then raise exception 'group_not_found'; end if;
end $$;
revoke all on function public.rename_group from public, anon;
grant execute on function public.rename_group to authenticated;

create or replace function public.set_group_retired(p_group_id uuid, p_retired boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_cong uuid;
begin
  if not private.has_role('elder') then raise exception 'not_elder'; end if;
  if not private.aal2() then raise exception 'second_factor_required'; end if;
  v_cong := private.current_congregation_id();
  update public.groups set retired = p_retired
  where id = p_group_id and congregation_id = v_cong;
  if not found then raise exception 'group_not_found'; end if;
end $$;
revoke all on function public.set_group_retired from public, anon;
grant execute on function public.set_group_retired to authenticated;
