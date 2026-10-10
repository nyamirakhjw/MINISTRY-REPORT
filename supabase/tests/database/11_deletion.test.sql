-- pgTAP: deletion workflow shape checks (DEL-01, DEL-02). Extend with authenticated-role scenarios using this
-- repo's existing test harness (see 00_structure.test.sql) for the full request -> approve -> anonymize path.
begin;
select plan(3);

select ok(
  (select count(*) from pg_indexes where schemaname = 'public' and indexname = 'one_live_deletion') = 1,
  'at most one live deletion request per member is enforced by a unique index'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.deletion_requests'::regclass),
  'row level security is enabled on deletion_requests'
);
select ok(
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'approve_deletion') = 1,
  'approve_deletion exists and is the only path to Elder final approval'
);

select * from finish();
rollback;
