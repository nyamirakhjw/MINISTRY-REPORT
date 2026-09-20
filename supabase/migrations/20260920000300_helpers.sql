-- Identity helpers, audit helper, notification helpers. All SECURITY DEFINER with a fixed search_path.
create or replace function private.current_member_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select m.id from public.members m where m.user_id = (select auth.uid()) and m.status = 'active' limit 1 $$;

create or replace function private.current_congregation_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select m.congregation_id from public.members m where m.user_id = (select auth.uid()) and m.status = 'active' limit 1 $$;

create or replace function private.has_role(min_role public.member_role) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select m.role >= min_role from public.members m
                   where m.user_id = (select auth.uid()) and m.status = 'active' limit 1), false) $$;

create or replace function private.aal2() returns boolean
language sql stable set search_path = '' as $$
  select coalesce((select auth.jwt() ->> 'aal') = 'aal2', false) $$;

create or replace function private.is_elder() returns boolean
language sql stable set search_path = '' as $$
  select private.has_role('elder') and private.aal2() $$;

create or replace function private.is_platform_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.platform_admins p where p.user_id = (select auth.uid())) and private.aal2() $$;

create or replace function private.caller_member() returns public.members
language sql stable security definer set search_path = '' as $$
  select * from public.members m where m.user_id = (select auth.uid()) and m.status = 'active' limit 1 $$;

-- Raises 'forbidden' / 'mfa_required'. Elder and Ministerial Servant powers need a verified second factor (aal2).
create or replace function private.require_role(min_role public.member_role) returns public.members
language plpgsql stable security definer set search_path = '' as $$
declare c public.members;
begin
  c := private.caller_member();
  if c.id is null or not private.has_role(min_role) then raise exception 'forbidden'; end if;
  if min_role <> 'publisher' and not private.aal2() then raise exception 'mfa_required'; end if;
  return c;
end $$;

create or replace function private.audit(
  p_cong uuid, p_action text, p_entity_type text, p_entity_id uuid,
  p_before jsonb, p_after jsonb, p_reason text default null) returns void
language sql security definer set search_path = '' as $$
  insert into public.audit_log (congregation_id, actor_member_id, action, entity_type, entity_id, before, after, reason)
  values (p_cong, (select m.id from public.members m where m.user_id = (select auth.uid()) limit 1),
          p_action, p_entity_type, p_entity_id, p_before, p_after, p_reason) $$;

create or replace function private.notify(
  p_member uuid, p_kind text, p_payload jsonb default '{}'::jsonb, p_dedupe text default null, p_email boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  insert into public.notifications (member_id, kind, payload, dedupe_key)
  values (p_member, p_kind, coalesce(p_payload, '{}'::jsonb),
          coalesce(p_dedupe, p_kind || ':' || p_member::text || ':' || gen_random_uuid()::text))
  on conflict (dedupe_key) do nothing
  returning id into v_id;
  if v_id is not null and p_email then
    insert into public.notification_deliveries (notification_id, channel) values (v_id, 'email');
  end if;
end $$;

create or replace function private.notify_elders(p_cong uuid, p_kind text, p_payload jsonb default '{}'::jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare e record;
begin
  for e in select id from public.members where congregation_id = p_cong and role = 'elder' and status = 'active' loop
    perform private.notify(e.id, p_kind, p_payload);
  end loop;
end $$;

create or replace function private.reserved_username(p_username text) returns boolean
language sql immutable set search_path = '' as $$
  select lower(p_username) = any (array['admin','administrator','elder','elders','support','root','system','ministry',
    'ministryreport','platform','owner','help','security','privacy','moderator','servant','nyamira','jw','jehovah']) $$;
