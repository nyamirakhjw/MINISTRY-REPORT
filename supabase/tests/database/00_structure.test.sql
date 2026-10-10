begin;
select plan(4);

select is(
  (select count(*)::int from pg_tables t
    where t.schemaname = 'public' and not t.rowsecurity),
  0, 'row level security is enabled on every public table');

select is(
  (select count(*)::int from pg_policies p
    where p.schemaname = 'public' and p.tablename in ('recovery_codes', 'auth_attempts', 'notification_deliveries')),
  0, 'service-only tables have no policies');

-- Tightened from "zero policies" now that daily_log_entries has an owner-only policy (Phase 2, §15.3):
-- the actual guarantee is that no policy on these tables ever lets an Elder in, not that no policy exists.
select is(
  (select count(*)::int from pg_policies p
    where p.schemaname = 'public' and p.tablename in ('daily_log_entries', 'return_visits', 'rv_visits', 'report_drafts')
      and (coalesce(p.qual, '') ilike '%is_elder%' or coalesce(p.with_check, '') ilike '%is_elder%')),
  0, 'no policy on the private tracker tables ever references is_elder()');

select is(
  (select count(*)::int from information_schema.role_table_grants g
    where g.table_schema = 'public' and g.grantee = 'anon'),
  0, 'anon has no table privileges');

select * from finish();
rollback;
