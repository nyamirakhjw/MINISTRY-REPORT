-- Member, approval, arrangement, on-behalf and month-closing functions. Elder-only work is audited (D-26).

create or replace function public.username_available(p_username text) returns boolean
language sql stable security definer set search_path = '' as $$
  select lower(p_username) ~ '^[a-z0-9._-]{3,24}$'
     and not private.reserved_username(p_username)
     and not exists (select 1 from public.members m where m.username = lower(p_username)) $$;

create or replace function public.public_congregation(p_slug text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'name', c.name, 'tagline', c.tagline, 'timezone', c.timezone,
    'landing', coalesce(c.settings->'landing', '{}'::jsonb),
    'groups', coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name) order by g.name)
                          from public.groups g where g.congregation_id = c.id and not g.retired), '[]'::jsonb))
  from public.congregations c where c.slug = p_slug $$;

create or replace function public.my_admin_status() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'member_id', m.id, 'role', m.role, 'aal2', private.aal2(),
    'is_platform_admin', exists (select 1 from public.platform_admins p where p.user_id = (select auth.uid())))
  from public.members m where m.user_id = (select auth.uid()) and m.status = 'active' $$;

create or replace function public.update_my_profile(p_phone text, p_language public.app_lang) returns void
language plpgsql security definer set search_path = '' as $$
declare m public.members;
begin
  select * into m from public.members x where x.user_id = (select auth.uid()) and x.status in ('pending', 'active');
  if not found then raise exception 'forbidden'; end if;
  update public.members set phone = nullif(btrim(p_phone), ''), language = p_language where id = m.id;
end $$;

create or replace function public.set_my_avatar(p_path text) returns void
language plpgsql security definer set search_path = '' as $$
declare m public.members;
begin
  select * into m from public.members x where x.user_id = (select auth.uid()) and x.status in ('pending', 'active');
  if not found then raise exception 'forbidden'; end if;
  if p_path not in (m.id::text || '/avatar.webp', m.id::text || '/avatar.jpg') then raise exception 'bad_path'; end if;
  update public.members set avatar_path = p_path, photo_note = null where id = m.id;
end $$;

create or replace function public.resubmit_request() returns void
language plpgsql security definer set search_path = '' as $$
declare m public.members;
begin
  select * into m from public.members x where x.user_id = (select auth.uid()) and x.status = 'rejected';
  if not found then raise exception 'forbidden'; end if;
  update public.members set status = 'pending' where id = m.id;
end $$;

create or replace function public.admin_pending_requests() returns table (
  id uuid, full_name text, username text, email text, phone text, group_id uuid, group_name text,
  avatar_path text, created_at timestamptz, requested_kind text, requested_aux_goal smallint)
language plpgsql stable security definer set search_path = '' as $$
declare c public.members;
begin
  c := private.require_role('ministerial_servant');
  return query
    select m.id, m.full_name, m.username::text, m.email::text, m.phone, m.group_id, g.name, m.avatar_path, m.created_at,
           (select a.kind::text from public.service_arrangements a where a.member_id = m.id and a.status = 'pending' limit 1),
           (select a.aux_goal_hours from public.service_arrangements a where a.member_id = m.id and a.status = 'pending' limit 1)
      from public.members m left join public.groups g on g.id = m.group_id
     where m.congregation_id = c.congregation_id and m.status = 'pending' and m.avatar_path is not null
     order by m.created_at;
end $$;

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
                    where p.congregation_id = c.congregation_id and p.status = 'pending') else 0 end);
end $$;

create or replace function public.admin_members() returns table (
  id uuid, full_name text, username text, email text, phone text, role public.member_role, status public.member_status,
  language public.app_lang, group_id uuid, group_name text, first_report_month date, inactive_from_month date,
  avatar_path text, is_managed boolean, last_sign_in_at timestamptz, arrangement text)
language plpgsql stable security definer set search_path = '' as $$
declare c public.members;
begin
  c := private.require_role('elder');
  return query
    select m.id, m.full_name, m.username::text, m.email::text, m.phone, m.role, m.status, m.language, m.group_id, g.name,
           m.first_report_month, m.inactive_from_month, m.avatar_path, (m.user_id is null), u.last_sign_in_at,
           (select a.kind::text from public.service_arrangements a
             where a.member_id = m.id and a.status = 'approved' and a.start_month <= date_trunc('month', now())::date
               and (a.end_month is null or a.end_month >= date_trunc('month', now())::date) limit 1)
      from public.members m
      left join public.groups g on g.id = m.group_id
      left join auth.users u on u.id = m.user_id
     where m.congregation_id = c.congregation_id and m.status in ('active', 'inactive')
     order by m.full_name;
end $$;

-- Every obligated member for a month with their report (if any). SECURITY INVOKER: RLS decides what the caller sees.
create or replace function public.admin_month_report(p_month date) returns table (
  member_id uuid, full_name text, group_id uuid, group_name text, avatar_path text, phone text, is_managed boolean,
  status text, category public.report_category, participated boolean, hours smallint, studies smallint, comment text,
  is_late boolean, submitted_at timestamptz, received_at timestamptz, submitted_via text, submitted_by_name text,
  time_adjusted boolean, zero_hours boolean, self_edited boolean)
language sql stable security invoker set search_path = '' as $$
  select m.id, m.full_name, m.group_id, g.name, m.avatar_path, m.phone, (m.user_id is null),
         coalesce(r.status::text, 'missing'), r.category, r.participated, r.hours, r.studies, r.comment,
         coalesce(r.is_late, false), r.server_received_at, r.received_at, r.submitted_via, sb.full_name,
         coalesce(r.time_adjusted, false),
         (r.category is not null and r.category <> 'publisher' and r.hours = 0),
         (r.submitted_via = 'elder' and r.submitted_by = m.id)
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

create or replace function public.approve_member(p_member uuid, p_full_name text, p_group uuid, p_first_report_month date default null)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.members; t public.members; v_first date; v_tz text;
begin
  c := private.require_role('ministerial_servant');
  select * into t from public.members where id = p_member for update;
  if not found or t.congregation_id <> c.congregation_id then raise exception 'not_found'; end if;
  if t.user_id is not distinct from c.user_id then raise exception 'cannot_approve_self'; end if;
  if t.status <> 'pending' then raise exception 'not_pending'; end if;
  if t.avatar_path is null then raise exception 'photo_missing'; end if;
  if char_length(btrim(coalesce(p_full_name, ''))) < 2 then raise exception 'name_required'; end if;
  if not exists (select 1 from public.groups g where g.id = p_group and g.congregation_id = c.congregation_id and not g.retired)
    then raise exception 'invalid_group'; end if;
  select timezone into v_tz from public.congregations where id = c.congregation_id;
  v_first := coalesce(p_first_report_month, date_trunc('month', t.created_at at time zone v_tz)::date);
  if v_first <> date_trunc('month', v_first)::date then raise exception 'bad_month'; end if;
  update public.members
     set status = 'active', full_name = btrim(p_full_name), group_id = p_group, first_report_month = v_first,
         approved_by = c.id, approved_at = now(), rejection_note = null
   where id = t.id;
  perform private.audit(c.congregation_id, 'member.approve', 'members', t.id, null,
    jsonb_build_object('full_name', btrim(p_full_name), 'group_id', p_group, 'first_report_month', v_first));
  perform private.notify(t.id, 'account_approved', '{}'::jsonb, null, true);
end $$;

create or replace function public.reject_member(p_member uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.members; t public.members;
begin
  c := private.require_role('ministerial_servant');
  if char_length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'reason_required'; end if;
  select * into t from public.members where id = p_member for update;
  if not found or t.congregation_id <> c.congregation_id then raise exception 'not_found'; end if;
  if t.user_id is not distinct from c.user_id then raise exception 'cannot_approve_self'; end if;
  if t.status <> 'pending' then raise exception 'not_pending'; end if;
  update public.members set status = 'rejected', rejection_note = btrim(p_reason) where id = t.id;
  perform private.audit(c.congregation_id, 'member.reject', 'members', t.id, null, null, btrim(p_reason));
  perform private.notify(t.id, 'account_rejected', jsonb_build_object('note', btrim(p_reason)), null, true);
end $$;

create or replace function public.request_new_photo(p_member uuid, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.members; t public.members;
begin
  c := private.require_role('ministerial_servant');
  if char_length(btrim(coalesce(p_note, ''))) < 3 then raise exception 'reason_required'; end if;
  select * into t from public.members where id = p_member for update;
  if not found or t.congregation_id <> c.congregation_id then raise exception 'not_found'; end if;
  if t.status <> 'pending' then raise exception 'not_pending'; end if;
  update public.members set avatar_path = null, photo_note = btrim(p_note) where id = t.id;
  perform private.audit(c.congregation_id, 'member.request_photo', 'members', t.id, null, null, btrim(p_note));
  perform private.notify(t.id, 'photo_change_requested', jsonb_build_object('note', btrim(p_note)), null, true);
end $$;

-- Elders grant Ministerial Servant; only the Platform Owner grants or removes Elder (D-04).
create or replace function public.set_member_role(p_member uuid, p_role public.member_role) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.members; t public.members; v_cong uuid;
begin
  select * into t from public.members where id = p_member for update;
  if not found or t.status <> 'active' or t.user_id is null then raise exception 'not_found'; end if;
  if p_role = 'elder' or t.role = 'elder' then
    if not private.is_platform_admin() then raise exception 'forbidden_platform_only'; end if;
    v_cong := t.congregation_id;
  else
    c := private.require_role('elder');
    if t.congregation_id <> c.congregation_id then raise exception 'not_found'; end if;
    v_cong := c.congregation_id;
  end if;
  update public.members set role = p_role where id = t.id;
  perform private.audit(v_cong, 'member.set_role', 'members', t.id,
    jsonb_build_object('role', t.role), jsonb_build_object('role', p_role));
end $$;

create or replace function public.admin_update_member(p_member uuid, p_group uuid, p_full_name text) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.members; t public.members;
begin
  c := private.require_role('elder');
  select * into t from public.members where id = p_member for update;
  if not found or t.congregation_id <> c.congregation_id then raise exception 'not_found'; end if;
  if not exists (select 1 from public.groups g where g.id = p_group and g.congregation_id = c.congregation_id) then
    raise exception 'invalid_group'; end if;
  if char_length(btrim(coalesce(p_full_name, ''))) < 2 then raise exception 'name_required'; end if;
  update public.members set group_id = p_group, full_name = btrim(p_full_name) where id = t.id;
end $$;

create or replace function public.set_member_status(p_member uuid, p_status public.member_status, p_effective_month date default null)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.members; t public.members;
begin
  c := private.require_role('elder');
  if p_status not in ('active', 'inactive') then raise exception 'bad_status'; end if;
  select * into t from public.members where id = p_member for update;
  if not found or t.congregation_id <> c.congregation_id or t.status not in ('active', 'inactive') then raise exception 'not_found'; end if;
  if t.role = 'elder' and t.id = c.id then raise exception 'cannot_deactivate_self'; end if;
  if p_status = 'inactive' then
    if p_effective_month is null or p_effective_month <> date_trunc('month', p_effective_month)::date then raise exception 'bad_month'; end if;
    update public.members set status = 'inactive', inactive_from_month = p_effective_month where id = t.id;
  else
    update public.members set status = 'active', inactive_from_month = null where id = t.id;
  end if;
  perform private.audit(c.congregation_id, 'member.set_status', 'members', t.id,
    jsonb_build_object('status', t.status), jsonb_build_object('status', p_status, 'from', p_effective_month));
end $$;

create or replace function public.create_managed_profile(p_full_name text, p_group uuid, p_phone text default null, p_first_report_month date default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare c public.members; v_id uuid; v_tz text; v_first date;
begin
  c := private.require_role('elder');
  if char_length(btrim(coalesce(p_full_name, ''))) < 2 then raise exception 'name_required'; end if;
  if not exists (select 1 from public.groups g where g.id = p_group and g.congregation_id = c.congregation_id and not g.retired) then
    raise exception 'invalid_group'; end if;
  select timezone into v_tz from public.congregations where id = c.congregation_id;
  v_first := coalesce(p_first_report_month, date_trunc('month', now() at time zone v_tz)::date);
  insert into public.members (congregation_id, group_id, full_name, phone, role, status, first_report_month, approved_by, approved_at)
  values (c.congregation_id, p_group, btrim(p_full_name), nullif(btrim(p_phone), ''), 'publisher', 'active', v_first, c.id, now())
  returning id into v_id;
  return v_id;
end $$;

-- Arrangements (D-09, PRO-05)
create or replace function public.request_arrangement(p_kind public.report_category, p_start_month date, p_end_month date, p_aux_goal smallint)
returns uuid language plpgsql security definer set search_path = '' as $$
declare m public.members; v_id uuid;
begin
  m := private.caller_member();
  if m.id is null then raise exception 'not_active'; end if;
  if p_kind = 'publisher' then raise exception 'bad_kind'; end if;
  if p_start_month <> date_trunc('month', p_start_month)::date then raise exception 'bad_month'; end if;
  insert into public.service_arrangements (congregation_id, member_id, kind, start_month, end_month, aux_goal_hours)
  values (m.congregation_id, m.id, p_kind, p_start_month, p_end_month,
          case when p_kind = 'auxiliary_pioneer' then coalesce(p_aux_goal, 15) end)
  returning id into v_id;
  perform private.notify_elders(m.congregation_id, 'arrangement_requested', jsonb_build_object('member_id', m.id, 'kind', p_kind));
  return v_id;
end $$;

create or replace function public.decide_arrangement(p_id uuid, p_approve boolean, p_note text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.members; a public.service_arrangements;
begin
  c := private.require_role('elder');
  select * into a from public.service_arrangements where id = p_id for update;
  if not found or a.congregation_id <> c.congregation_id then raise exception 'not_found'; end if;
  if a.status <> 'pending' then raise exception 'not_pending'; end if;
  if not p_approve and char_length(btrim(coalesce(p_note, ''))) < 3 then raise exception 'reason_required'; end if;
  update public.service_arrangements
     set status = case when p_approve then 'approved'::public.arrangement_status else 'rejected'::public.arrangement_status end,
         decided_by = c.id, decided_at = now(), decision_note = nullif(btrim(p_note), '')
   where id = a.id;
  perform private.audit(c.congregation_id, 'arrangement.decide', 'service_arrangements', a.id, null,
    jsonb_build_object('approved', p_approve), p_note);
  perform private.notify(a.member_id, 'arrangement_decided',
    jsonb_build_object('approved', p_approve, 'kind', a.kind, 'note', nullif(btrim(p_note), '')), null, true);
end $$;

create or replace function public.end_arrangement(p_id uuid, p_end_month date) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.members; a public.service_arrangements;
begin
  c := private.require_role('elder');
  select * into a from public.service_arrangements where id = p_id for update;
  if not found or a.congregation_id <> c.congregation_id then raise exception 'not_found'; end if;
  if p_end_month <> date_trunc('month', p_end_month)::date or p_end_month < a.start_month then raise exception 'bad_month'; end if;
  update public.service_arrangements
     set end_month = p_end_month,
         status = case when p_end_month < date_trunc('month', now())::date then 'ended'::public.arrangement_status else status end
   where id = a.id;
  perform private.audit(c.congregation_id, 'arrangement.end', 'service_arrangements', a.id, null,
    jsonb_build_object('end_month', p_end_month));
end $$;

create or replace function public.admin_create_arrangement(p_member uuid, p_kind public.report_category, p_start_month date, p_end_month date, p_aux_goal smallint)
returns uuid language plpgsql security definer set search_path = '' as $$
declare c public.members; t public.members; v_id uuid;
begin
  c := private.require_role('elder');
  select * into t from public.members where id = p_member;
  if not found or t.congregation_id <> c.congregation_id then raise exception 'not_found'; end if;
  if p_kind = 'publisher' then raise exception 'bad_kind'; end if;
  insert into public.service_arrangements (congregation_id, member_id, kind, start_month, end_month, aux_goal_hours, status, decided_by, decided_at)
  values (c.congregation_id, t.id, p_kind, p_start_month, p_end_month,
          case when p_kind = 'auxiliary_pioneer' then coalesce(p_aux_goal, 15) end, 'approved', c.id, now())
  returning id into v_id;
  perform private.audit(c.congregation_id, 'arrangement.create', 'service_arrangements', v_id, null,
    jsonb_build_object('member_id', t.id, 'kind', p_kind));
  return v_id;
end $$;

-- Profile change requests (PRO-04)
create or replace function public.request_profile_change(p_kind text, p_new_value text) returns void
language plpgsql security definer set search_path = '' as $$
declare m public.members; v text := btrim(coalesce(p_new_value, ''));
begin
  m := private.caller_member();
  if m.id is null then raise exception 'not_active'; end if;
  if p_kind = 'username' then
    v := lower(v);
    if not public.username_available(v) then raise exception 'username_unavailable'; end if;
  elsif p_kind = 'full_name' then
    if char_length(v) < 2 then raise exception 'name_required'; end if;
  else raise exception 'bad_kind'; end if;
  update public.profile_change_requests set status = 'declined', decision_note = 'replaced'
   where member_id = m.id and kind = p_kind and status = 'pending';
  insert into public.profile_change_requests (congregation_id, member_id, kind, new_value) values (m.congregation_id, m.id, p_kind, v);
  perform private.notify_elders(m.congregation_id, 'profile_change_requested', jsonb_build_object('member_id', m.id, 'kind', p_kind));
end $$;

create or replace function public.decide_profile_change(p_id uuid, p_approve boolean, p_note text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.members; r public.profile_change_requests;
begin
  c := private.require_role('elder');
  select * into r from public.profile_change_requests where id = p_id for update;
  if not found or r.congregation_id <> c.congregation_id then raise exception 'not_found'; end if;
  if r.status <> 'pending' then raise exception 'not_pending'; end if;
  if p_approve then
    if r.kind = 'username' then
      if not public.username_available(r.new_value) then raise exception 'username_unavailable'; end if;
      update public.members set username = r.new_value where id = r.member_id;
    else
      update public.members set full_name = r.new_value where id = r.member_id;
    end if;
  end if;
  update public.profile_change_requests
     set status = case when p_approve then 'approved' else 'declined' end, decided_by = c.id, decided_at = now(),
         decision_note = nullif(btrim(p_note), '')
   where id = r.id;
  perform private.audit(c.congregation_id, 'profile_change.decide', 'profile_change_requests', r.id, null,
    jsonb_build_object('approved', p_approve, 'kind', r.kind), p_note);
  perform private.notify(r.member_id, 'profile_change_decided', jsonb_build_object('approved', p_approve, 'kind', r.kind), null, true);
end $$;

-- Reports on behalf, closing months (D-10, COR-04, COR-05)
create or replace function public.submit_report_on_behalf(
  p_member uuid, p_month date, p_category public.report_category, p_participated boolean, p_hours int, p_studies int,
  p_comment text, p_received_at timestamptz, p_reason text, p_request_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  c public.members; t public.members; w record; n record; v_ex public.reports;
  v_now timestamptz := now(); v_recv timestamptz; v_id uuid;
begin
  c := private.require_role('elder');
  if p_request_id is null then raise exception 'request_id_required'; end if;
  select r.id into v_id from public.reports r where r.request_id = p_request_id;
  if found then return v_id; end if;
  select * into t from public.members where id = p_member;
  if not found or t.congregation_id <> c.congregation_id or t.status not in ('active', 'inactive') then raise exception 'not_found'; end if;
  if p_month is null or p_month <> date_trunc('month', p_month)::date then raise exception 'bad_month'; end if;
  if t.first_report_month is not null and p_month < t.first_report_month then raise exception 'before_first_month'; end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'reason_required'; end if;

  select * into w from public.report_window(c.congregation_id, p_month);
  if w.opens_at is null then raise exception 'no_window'; end if;
  if v_now < w.opens_at then raise exception 'window_not_open'; end if;
  v_recv := coalesce(p_received_at, v_now);
  if v_recv > v_now + interval '5 minutes' then raise exception 'received_in_future'; end if;
  if v_recv < w.opens_at then raise exception 'received_before_open'; end if;
  v_recv := least(v_recv, v_now);

  if p_category <> 'publisher' and not private.has_arrangement(t.id, p_category, p_month) then
    raise exception 'arrangement_not_approved'; end if;
  select * into n from private.normalize_report(p_category, p_participated, p_hours, p_studies, p_comment);

  select * into v_ex from public.reports r where r.member_id = t.id and r.month = p_month for update;
  if found then
    if v_ex.status <> 'not_reported' then raise exception 'already_submitted'; end if;
    update public.reports
       set status = 'submitted', category = p_category, participated = n.participated, hours = n.hours, studies = n.studies,
           comment = n.comment, goal_hours = private.goal_for(t.id, p_category, p_month), submitted_via = 'elder',
           submitted_by = c.id, received_at = v_recv, is_late = v_recv >= w.on_time_until, request_id = p_request_id,
           server_received_at = v_now, version = v_ex.version + 1
     where id = v_ex.id returning id into v_id;
  else
    insert into public.reports (congregation_id, member_id, month, category, participated, hours, studies, comment, goal_hours,
                                submitted_via, submitted_by, received_at, is_late, request_id)
    values (c.congregation_id, t.id, p_month, p_category, n.participated, n.hours, n.studies, n.comment,
            private.goal_for(t.id, p_category, p_month), 'elder', c.id, v_recv, v_recv >= w.on_time_until, p_request_id)
    returning id into v_id;
  end if;
  perform private.audit(c.congregation_id, case when t.id = c.id then 'report.on_behalf_self' else 'report.on_behalf' end,
    'reports', v_id, null, jsonb_build_object('month', p_month, 'received_at', v_recv), btrim(p_reason));
  if t.user_id is not null then
    perform private.notify(t.id, 'report_submitted_on_behalf', jsonb_build_object('month', p_month, 'by', c.full_name), null, true);
  end if;
  return v_id;
end $$;

create or replace function public.close_month_not_reported(p_member uuid, p_month date, p_reason text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare c public.members; t public.members; v_id uuid;
begin
  c := private.require_role('elder');
  select * into t from public.members where id = p_member;
  if not found or t.congregation_id <> c.congregation_id then raise exception 'not_found'; end if;
  if p_month is null or p_month <> date_trunc('month', p_month)::date then raise exception 'bad_month'; end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'reason_required'; end if;
  if exists (select 1 from public.reports r where r.member_id = t.id and r.month = p_month) then raise exception 'already_submitted'; end if;
  insert into public.reports (congregation_id, member_id, month, status, submitted_via, submitted_by)
  values (c.congregation_id, t.id, p_month, 'not_reported', 'elder', c.id) returning id into v_id;
  perform private.audit(c.congregation_id, 'report.close_month', 'reports', v_id, null,
    jsonb_build_object('month', p_month, 'member_id', t.id), btrim(p_reason));
  return v_id;
end $$;

create or replace function public.mark_notifications_read(p_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
declare m public.members;
begin
  m := private.caller_member();
  if m.id is null then raise exception 'not_active'; end if;
  update public.notifications set read_at = now() where member_id = m.id and id = any (p_ids) and read_at is null;
end $$;

-- Platform Owner (D-01, D-04)
create or replace function public.platform_create_congregation(p_slug text, p_name text, p_tagline text, p_groups text[])
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; g text;
begin
  if not private.is_platform_admin() then raise exception 'forbidden'; end if;
  insert into public.congregations (slug, name, tagline) values (lower(btrim(p_slug)), btrim(p_name), nullif(btrim(p_tagline), ''))
  returning id into v_id;
  foreach g in array coalesce(p_groups, array[]::text[]) loop
    if char_length(btrim(g)) >= 2 then insert into public.groups (congregation_id, name) values (v_id, btrim(g)); end if;
  end loop;
  perform private.audit(v_id, 'congregation.create', 'congregations', v_id, null, jsonb_build_object('slug', p_slug));
  return v_id;
end $$;

create or replace function public.platform_overview() returns table (
  id uuid, slug text, name text, active_members bigint, pending_members bigint, elders bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_platform_admin() then raise exception 'forbidden'; end if;
  return query
    select c.id, c.slug, c.name,
      (select count(*) from public.members m where m.congregation_id = c.id and m.status = 'active'),
      (select count(*) from public.members m where m.congregation_id = c.id and m.status = 'pending'),
      (select count(*) from public.members m where m.congregation_id = c.id and m.status = 'active' and m.role = 'elder')
    from public.congregations c order by c.name;
end $$;

create or replace function public.platform_members(p_congregation uuid) returns table (
  id uuid, full_name text, username text, role public.member_role)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_platform_admin() then raise exception 'forbidden'; end if;
  return query select m.id, m.full_name, m.username::text, m.role from public.members m
    where m.congregation_id = p_congregation and m.status = 'active' and m.user_id is not null order by m.full_name;
end $$;

-- Notification dispatch support (service role only; see hardening migration)
create or replace function public.claim_deliveries(p_limit int default 25) returns table (
  delivery_id bigint, channel text, kind text, payload jsonb, member_id uuid, email text, full_name text, language public.app_lang, attempts smallint)
language plpgsql security definer set search_path = '' as $$
begin
  return query
  with due as (
    select d.id from public.notification_deliveries d
     where d.status = 'pending' and d.send_after <= now()
     order by d.send_after limit p_limit for update skip locked),
  claimed as (
    update public.notification_deliveries d
       set attempts = d.attempts + 1, send_after = now() + interval '10 minutes' -- lease: a crashed run retries later
      from due where d.id = due.id
    returning d.id, d.channel, d.notification_id, d.attempts)
  select cl.id, cl.channel, n.kind, n.payload, m.id, m.email::text, m.full_name, m.language, cl.attempts
    from claimed cl
    join public.notifications n on n.id = cl.notification_id
    join public.members m on m.id = n.member_id;
end $$;

create or replace function public.finish_delivery(p_id bigint, p_status text, p_error text default null) returns void
language sql security definer set search_path = '' as $$
  update public.notification_deliveries
     set status = p_status, last_error = left(p_error, 300), sent_at = case when p_status = 'sent' then now() end
   where id = p_id $$;
