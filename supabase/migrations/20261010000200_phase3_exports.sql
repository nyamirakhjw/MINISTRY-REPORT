-- Phase 3, Sprints 4-6 — Exports and backup (EXP-01 to EXP-07). PDF and Excel are rendered on Vercel, under the
-- signed-in Elder's own session (§7.11); this migration only adds what has to run in the database: the audit
-- entry every export must leave, and the aggregation each export reads from. Nothing is generated or stored here.

-- EXP-07 / "each one is recorded in the audit log (who, what, when, which filters)". `private.audit` already
-- exists and is not exposed to PostgREST, so exports need this thin public wrapper, callable only by an Elder.
create or replace function public.log_export(p_kind text, p_filters jsonb default '{}'::jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.members;
begin
  c := private.require_role('elder');
  if p_kind is null or char_length(p_kind) = 0 then raise exception 'bad_kind'; end if;
  perform private.audit(c.congregation_id, 'export.' || p_kind, 'export', null, null, p_filters, null);
end $$;
grant execute on function public.log_export(text, jsonb) to authenticated;

-- EXP-03: the individual service-year record. One row per month, in the shape the PDF's month strip and detail
-- table both need. `p_member` defaults to the caller (any member may pull their own record); an Elder may pass
-- another member's id.
create or replace function public.member_service_year(p_year text, p_member uuid default null)
returns table (month date, status text, category public.report_category, participated boolean, hours smallint,
               studies smallint, comment text, is_late boolean, goal_hours smallint)
language plpgsql stable security definer set search_path = '' as $$
declare c public.members; v_target uuid; v_start int;
begin
  c := private.caller_member();
  if c.id is null then raise exception 'not_active'; end if;
  v_target := coalesce(p_member, c.id);
  if v_target <> c.id and not (private.is_elder()) then raise exception 'forbidden'; end if;
  if v_target <> c.id then
    if not exists (select 1 from public.members m where m.id = v_target and m.congregation_id = c.congregation_id) then
      raise exception 'not_found';
    end if;
  end if;
  v_start := split_part(p_year, '-', 1)::int;
  return query
    with months as (select generate_series(make_date(v_start, 9, 1), make_date(v_start, 9, 1) + interval '11 months', interval '1 month')::date as m)
    select mo.m, coalesce(r.status::text, 'missing'), r.category, r.participated, r.hours, r.studies, r.comment,
           coalesce(r.is_late, false), r.goal_hours
      from months mo left join public.reports r on r.member_id = v_target and r.month = mo.m
     order by mo.m;
end $$;
grant execute on function public.member_service_year(text, uuid) to authenticated;

-- EXP-04: the full encrypted backup (members, arrangements, reports, corrections, audit log, settings — daily
-- logs and return visits are excluded by design, D-35). Assembled server-side (Node, under the Elder's session)
-- from plain `select *` calls under RLS, EXCEPT audit_log and the full member roster, which an ordinary Elder
-- policy already exposes in full for the congregation, so no extra function is needed for those either. The one
-- thing worth a function is a manifest so the archive is self-describing without a second round trip.
create or replace function public.backup_manifest() returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare c public.members;
begin
  c := private.require_role('elder');
  return jsonb_build_object(
    'congregation_id', c.congregation_id,
    'generated_at', now(),
    'generated_by', c.full_name,
    'counts', jsonb_build_object(
      'members', (select count(*) from public.members where congregation_id = c.congregation_id),
      'reports', (select count(*) from public.reports where congregation_id = c.congregation_id),
      'arrangements', (select count(*) from public.service_arrangements where congregation_id = c.congregation_id),
      'corrections', (select count(*) from public.report_corrections where congregation_id = c.congregation_id),
      'audit_log', (select count(*) from public.audit_log where congregation_id = c.congregation_id)));
end $$;
grant execute on function public.backup_manifest() to authenticated;

-- PRO-07 "download my data (JSON)". Everything the person owns, including the two private tables — which is
-- fine here because the request comes from the owner themselves, not from an Elder (§16.5's limit is about
-- OTHER people reading it, not about a person reading their own).
create or replace function public.my_data_export() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare m public.members;
begin
  m := private.caller_member();
  if m.id is null then raise exception 'not_active'; end if;
  return jsonb_build_object(
    'profile', to_jsonb(m) - 'user_id',
    'reports', (select coalesce(jsonb_agg(to_jsonb(r) - 'member_id' - 'congregation_id' order by r.month), '[]'::jsonb) from public.reports r where r.member_id = m.id),
    'arrangements', (select coalesce(jsonb_agg(to_jsonb(a) - 'member_id' order by a.start_month), '[]'::jsonb) from public.service_arrangements a where a.member_id = m.id),
    'personal_goals', (select coalesce(jsonb_agg(to_jsonb(g) order by g.month), '[]'::jsonb) from public.member_goals g where g.member_id = m.id),
    'consents', (select coalesce(jsonb_agg(to_jsonb(c) - 'member_id' order by c.accepted_at), '[]'::jsonb) from public.consents c where c.member_id = m.id),
    'daily_log', (select coalesce(jsonb_agg(to_jsonb(l) - 'member_id' - 'congregation_id' order by l.service_date), '[]'::jsonb) from public.daily_log_entries l where l.member_id = m.id),
    'return_visits', public.my_return_visits_export());
end $$;
grant execute on function public.my_data_export() to authenticated;
