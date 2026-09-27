-- Phase 3, Sprint 3 — Elder overview & infographics (ADM-03 by-group, ADM-04 infographics, ADM-05 comparisons).
-- Kept as thin, `security invoker` aggregation functions (same shape as the existing `admin_month_report`), so
-- RLS still does the real access control and every number here is something an Elder could already read row
-- by row. All maths for 6/12-month trends, MoM/YoY comparisons and service-year-to-date is done in TypeScript
-- from the one trailing-months series below (mirrors how `summarizeMonth` already works) — no ranking, ever
-- (D-44): these functions return congregation-wide and category-wide counts only, never a per-person row.

-- ADM-05: a trailing series of monthly totals, used for the 6- and 12-month trend charts, the "same month last
-- year" comparison and service-year-to-date (which is just this series sliced to the year's months).
create or replace function public.admin_month_trend(p_end_month date, p_months int default 24)
returns table (month date, obligated int, reported int, closed int, late int, hours int, studies int, participants int)
language plpgsql stable security invoker set search_path = '' as $$
declare c public.members;
begin
  c := private.require_role('elder');
  return query
    with months as (
      select generate_series(date_trunc('month', p_end_month) - ((p_months - 1) || ' months')::interval,
                              date_trunc('month', p_end_month), interval '1 month')::date as m
    ),
    obligated as (
      select mo.m, count(*) filter (
               where mm.first_report_month <= mo.m and (mm.inactive_from_month is null or mm.inactive_from_month > mo.m)
             ) as n
        from months mo cross join public.members mm
       where mm.congregation_id = c.congregation_id and mm.status in ('active', 'inactive')
       group by mo.m
    ),
    reps as (
      select r.month as m,
             count(*) filter (where r.status <> 'not_reported') as reported,
             count(*) filter (where r.status = 'not_reported') as closed,
             count(*) filter (where r.is_late) as late,
             coalesce(sum(r.hours), 0)::int as hours,
             coalesce(sum(r.studies), 0)::int as studies,
             count(*) filter (where r.participated) as participants
        from public.reports r
       where r.congregation_id = c.congregation_id and r.month between (date_trunc('month', p_end_month) - ((p_months - 1) || ' months')::interval) and p_end_month
       group by r.month
    )
    select mo.m, coalesce(o.n, 0)::int, coalesce(rp.reported, 0)::int, coalesce(rp.closed, 0)::int, coalesce(rp.late, 0)::int,
           coalesce(rp.hours, 0), coalesce(rp.studies, 0), coalesce(rp.participants, 0)::int
      from months mo left join obligated o on o.m = mo.m left join reps rp on rp.m = mo.m
     order by mo.m;
end $$;
grant execute on function public.admin_month_trend(date, int) to authenticated;

-- ADM-04 "hours by category" trend and EXP-02 service-year summary share this shape: one row per month per category.
create or replace function public.admin_service_year_by_category(p_year text)
returns table (month date, category public.report_category, reporting int, hours int, studies int)
language plpgsql stable security invoker set search_path = '' as $$
declare c public.members; v_start int;
begin
  c := private.require_role('elder');
  v_start := split_part(p_year, '-', 1)::int;
  return query
    with months as (select generate_series(make_date(v_start, 9, 1), make_date(v_start, 9, 1) + interval '11 months', interval '1 month')::date as m),
         cats as (select unnest(enum_range(null::public.report_category)) as k)
    select mo.m, ca.k,
           count(r.id) filter (where r.category = ca.k)::int,
           coalesce(sum(r.hours) filter (where r.category = ca.k), 0)::int,
           coalesce(sum(r.studies) filter (where r.category = ca.k), 0)::int
      from months mo cross join cats ca
      left join public.reports r on r.month = mo.m and r.category = ca.k and r.congregation_id = c.congregation_id and r.status <> 'not_reported'
     group by mo.m, ca.k
     order by mo.m, ca.k;
end $$;
grant execute on function public.admin_service_year_by_category(text) to authenticated;

-- ADM-04 "pioneer goal attainment (counts only, no names)".
create or replace function public.admin_goal_attainment(p_month date)
returns table (category public.report_category, met int, not_met int)
language plpgsql stable security invoker set search_path = '' as $$
declare c public.members;
begin
  c := private.require_role('elder');
  return query
    select r.category, count(*) filter (where r.hours >= coalesce(r.goal_hours, 0))::int,
           count(*) filter (where r.hours < coalesce(r.goal_hours, 0))::int
      from public.reports r
     where r.congregation_id = c.congregation_id and r.month = p_month
       and r.category <> 'publisher' and r.status <> 'not_reported' and r.goal_hours is not null
     group by r.category;
end $$;
grant execute on function public.admin_goal_attainment(date) to authenticated;

-- ADM-03 by-group breakdown reuses admin_month_report's per-member rows (already returns group_id/group_name),
-- so no new query is needed there — see getByGroup() in src/lib/admin-data.ts.
