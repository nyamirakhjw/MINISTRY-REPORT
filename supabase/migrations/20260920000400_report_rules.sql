-- Submission window, content rules, reporting state, submit_report. Enforced here so no client can bypass them (PRD §6, §15.4).

-- Upper bounds are exclusive: a moment is on time when  t < on_time_until.
create or replace function public.report_window(p_congregation uuid, p_month date)
returns table (opens_at timestamptz, on_time_until timestamptz, late_until timestamptz)
language sql stable set search_path = '' as $$
  with c as (
    select timezone,
           coalesce((settings->>'on_time_day')::int, 10)       as d,
           coalesce((settings->>'late_window_months')::int, 1) as lw
    from public.congregations where id = p_congregation)
  select
    ((p_month + interval '1 month' - interval '1 day')::timestamp)       at time zone c.timezone, -- 00:00 on last day of M
    ((p_month + interval '1 month' + c.d * interval '1 day')::timestamp) at time zone c.timezone, -- start of day D+1 of M+1
    ((p_month + (c.lw + 1) * interval '1 month')::timestamp)             at time zone c.timezone  -- end of last day of M+lw
  from c $$;

create or replace function private.has_arrangement(p_member uuid, p_kind public.report_category, p_month date) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.service_arrangements a
                 where a.member_id = p_member and a.kind = p_kind and a.status in ('approved', 'ended')
                   and a.start_month <= p_month and (a.end_month is null or a.end_month >= p_month)) $$;

create or replace function private.goal_for(p_member uuid, p_category public.report_category, p_month date) returns smallint
language sql stable security definer set search_path = '' as $$
  select case when p_category = 'publisher' then null else
    coalesce(
      (select g.goal_hours from public.member_goals g where g.member_id = p_member and g.month = p_month),
      (select a.aux_goal_hours from public.service_arrangements a
        where a.member_id = p_member and a.kind = p_category and a.aux_goal_hours is not null
          and a.status in ('approved', 'ended') and a.start_month <= p_month and (a.end_month is null or a.end_month >= p_month)
        limit 1),
      (select (c.settings->'goals'->>(p_category::text))::smallint
         from public.congregations c join public.members m on m.congregation_id = c.id where m.id = p_member))
  end $$;

create or replace function private.normalize_report(
  p_category public.report_category, p_participated boolean, p_hours int, p_studies int, p_comment text)
returns table (participated boolean, hours smallint, studies smallint, comment text)
language plpgsql immutable set search_path = '' as $$
declare v_comment text := nullif(btrim(coalesce(p_comment, '')), '');
begin
  if p_category is null then raise exception 'category_required'; end if;
  if p_studies is not null and (p_studies < 0 or p_studies > 99) then raise exception 'studies_out_of_range'; end if;
  if v_comment is not null and (char_length(v_comment) > 600
     or array_length(regexp_split_to_array(v_comment, '\s+'), 1) > 50) then raise exception 'comment_too_long'; end if;
  if p_category = 'publisher' then
    if p_participated is null then raise exception 'participation_required'; end if;
    if p_participated then
      return query select true, null::smallint, coalesce(p_studies, 0)::smallint, v_comment;
    else -- a "No" locks every other field (D-15)
      return query select false, null::smallint, 0::smallint, null::text;
    end if;
  else
    if p_hours is null then raise exception 'hours_required'; end if;
    if p_hours < 0 or p_hours > 744 then raise exception 'hours_out_of_range'; end if;
    return query select (p_hours > 0), p_hours::smallint, coalesce(p_studies, 0)::smallint, v_comment;
  end if;
end $$;

-- What may the signed-in member report right now? (REP-01)
create or replace function public.my_report_state() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  m public.members; tz text; v_now timestamptz := now();
  v_cur date; v_latest date; v_target date; v_from date; w record; v_opts jsonb;
begin
  m := private.caller_member();
  if m.id is null then return jsonb_build_object('state', 'not_active'); end if;
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

create or replace function public.submit_report(
  p_month date, p_category public.report_category, p_participated boolean, p_hours int, p_studies int,
  p_comment text, p_request_id uuid, p_client_time timestamptz default null, p_last_server_time timestamptz default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  m public.members; w record; n record; v_ex public.reports;
  v_now timestamptz := now(); v_eff timestamptz := now(); v_adj boolean := false;
  v_id uuid; v_pending date;
begin
  m := private.caller_member();
  if m.id is null then raise exception 'not_active'; end if;
  if p_request_id is null then raise exception 'request_id_required'; end if;

  select r.id into v_id from public.reports r where r.request_id = p_request_id and r.member_id = m.id;
  if found then return v_id; end if; -- idempotent retry (REP-10)

  if p_month is null or p_month <> date_trunc('month', p_month)::date then raise exception 'bad_month'; end if;
  if m.first_report_month is not null and p_month < m.first_report_month then raise exception 'before_first_month'; end if;

  select * into w from public.report_window(m.congregation_id, p_month);
  if w.opens_at is null then raise exception 'no_window'; end if;

  select * into v_ex from public.reports r where r.member_id = m.id and r.month = p_month;
  if found then
    if v_ex.status = 'not_reported' then raise exception 'month_closed'; end if;
    raise exception 'already_submitted';
  end if;

  -- Offline: accept the device tap time only inside sane bounds (PRD §14.6).
  if p_client_time is not null then
    if p_client_time <= v_now + interval '5 minutes'
       and p_client_time >= v_now - interval '14 days'
       and p_client_time >= w.opens_at
       and (p_last_server_time is null or p_client_time >= p_last_server_time - interval '10 minutes')
    then v_eff := least(p_client_time, v_now);
    else v_adj := true; end if;
  end if;
  if v_now < w.opens_at then raise exception 'window_not_open'; end if;
  if v_eff >= w.late_until then raise exception 'window_closed'; end if;

  -- Earlier months must be submitted or closed first (D-24).
  if m.first_report_month is not null and p_month > m.first_report_month then
    select g.mo::date into v_pending
      from generate_series(m.first_report_month::timestamp, (p_month - interval '1 month')::timestamp, interval '1 month') g(mo)
     where not exists (select 1 from public.reports r where r.member_id = m.id and r.month = g.mo::date)
     order by g.mo limit 1;
    if v_pending is not null then raise exception 'earlier_month_pending' using hint = v_pending::text; end if;
  end if;

  if p_category <> 'publisher' and not private.has_arrangement(m.id, p_category, p_month) then
    raise exception 'arrangement_not_approved';
  end if;

  select * into n from private.normalize_report(p_category, p_participated, p_hours, p_studies, p_comment);

  begin
    insert into public.reports (congregation_id, member_id, month, category, participated, hours, studies, comment,
                                goal_hours, received_at, client_submitted_at, time_adjusted, is_late, request_id, submitted_by)
    values (m.congregation_id, m.id, p_month, p_category, n.participated, n.hours, n.studies, n.comment,
            private.goal_for(m.id, p_category, p_month), v_eff, p_client_time, v_adj,
            v_eff >= w.on_time_until, p_request_id, m.id)
    returning id into v_id;
  exception when unique_violation then
    select r.id into v_id from public.reports r where r.request_id = p_request_id and r.member_id = m.id;
    if found then return v_id; end if;
    raise exception 'already_submitted';
  end;
  return v_id;
end $$;
