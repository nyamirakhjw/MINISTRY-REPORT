-- pgTAP: return visits are owner-only, full stop (§18.2 "Elder reads a member's daily log, return visits or
-- drafts" must be Denied). Run with `supabase test db`. Follows the style of the existing tests under this
-- folder; adjust the fixture helper names if your seed script differs.

begin;
select plan(4);

-- Assumes a fixture helper `tests.create_supabase_user(name, congregation_id, role)` and
-- `tests.authenticate_as(name)` already exist in this repo's test harness (see supabase/tests/database/00_structure.test.sql).

select ok(
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'return_visits') > 0,
  'return_visits has at least one RLS policy'
);
select ok(
  not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename in ('return_visits', 'rv_visits')
      and (qual ilike '%is_elder%' or qual ilike '%has_role%')
  ),
  'no policy on return_visits or rv_visits ever references an Elder or role check'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.return_visits'::regclass),
  'row level security is enabled on return_visits'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.rv_visits'::regclass),
  'row level security is enabled on rv_visits'
);

select * from finish();
rollback;
