-- Deny by default. RLS on every table; only explicit SELECT policies; all writes go through functions.
do $$ declare t text; begin
  for t in select unnest(array['congregations','groups','members','service_arrangements','member_goals','reports',
    'notifications','notification_deliveries','consents','audit_log','platform_admins','auth_attempts',
    'recovery_codes','profile_change_requests'])
  loop execute format('alter table public.%I enable row level security', t); end loop;
end $$;

-- members: self, Elders (whole congregation), Ministerial Servants (complete pending requests only)
create policy members_self on public.members for select to authenticated using (user_id = (select auth.uid()));
create policy members_elder on public.members for select to authenticated
  using (private.is_elder() and congregation_id = private.current_congregation_id());
create policy members_ms_pending on public.members for select to authenticated
  using (status = 'pending' and avatar_path is not null and congregation_id = private.current_congregation_id()
         and private.has_role('ministerial_servant') and private.aal2());

create policy congregations_member on public.congregations for select to authenticated
  using (id in (select m.congregation_id from public.members m where m.user_id = (select auth.uid())));
create policy groups_member on public.groups for select to authenticated
  using (congregation_id in (select m.congregation_id from public.members m where m.user_id = (select auth.uid())));

create policy arrangements_self on public.service_arrangements for select to authenticated
  using (member_id in (select m.id from public.members m where m.user_id = (select auth.uid())));
create policy arrangements_elder on public.service_arrangements for select to authenticated
  using (private.is_elder() and congregation_id = private.current_congregation_id());

create policy goals_self on public.member_goals for select to authenticated using (member_id = private.current_member_id());
create policy goals_elder on public.member_goals for select to authenticated
  using (private.is_elder() and member_id in (select m.id from public.members m where m.congregation_id = private.current_congregation_id()));

create policy reports_self on public.reports for select to authenticated using (member_id = private.current_member_id());
create policy reports_elder on public.reports for select to authenticated
  using (private.is_elder() and congregation_id = private.current_congregation_id());

create policy notifications_self on public.notifications for select to authenticated using (member_id = private.current_member_id());

create policy consents_self on public.consents for select to authenticated
  using (member_id in (select m.id from public.members m where m.user_id = (select auth.uid())));
create policy consents_elder on public.consents for select to authenticated
  using (private.is_elder() and member_id in (select m.id from public.members m where m.congregation_id = private.current_congregation_id()));

create policy changes_self on public.profile_change_requests for select to authenticated using (member_id = private.current_member_id());
create policy changes_elder on public.profile_change_requests for select to authenticated
  using (private.is_elder() and congregation_id = private.current_congregation_id());

create policy audit_elder on public.audit_log for select to authenticated
  using (private.is_elder() and congregation_id = private.current_congregation_id());

create policy platform_self on public.platform_admins for select to authenticated using (user_id = (select auth.uid()));
-- notification_deliveries, auth_attempts, recovery_codes: RLS on, NO policies (service role only).

-- Table privileges: start closed, then grant SELECT only where a policy exists.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon;
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant select on public.congregations, public.groups, public.members, public.service_arrangements, public.member_goals,
  public.reports, public.notifications, public.consents, public.audit_log, public.profile_change_requests,
  public.platform_admins to authenticated;
revoke update, delete, truncate on public.audit_log from anon, authenticated, service_role;

-- Function privileges: authenticated may call the public API; only two functions are open to anon.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on all functions in schema public to authenticated;
revoke execute on function public.claim_deliveries(int), public.finish_delivery(bigint, text, text) from authenticated;
grant execute on function public.claim_deliveries(int), public.finish_delivery(bigint, text, text) to service_role;
grant execute on function public.public_congregation(text), public.username_available(text) to anon, authenticated;
revoke execute on all functions in schema private from anon;
