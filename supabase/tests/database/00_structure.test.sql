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

select is(
  (select count(*)::int from pg_policies p
    where p.schemaname = 'public' and p.tablename in ('daily_log_entries', 'return_visits', 'rv_visits', 'report_drafts')),
  0, 'no policy grants anyone access to the private tracker tables (they must not exist yet, or stay owner-only)');

select is(
  (select count(*)::int from information_schema.role_table_grants g
    where g.table_schema = 'public' and g.grantee = 'anon'),
  0, 'anon has no table privileges');

select * from finish();
rollback;
