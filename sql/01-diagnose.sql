-- Run this FIRST in the Supabase SQL editor, PRODUCTION project.
-- It answers two separate questions in one go: is the daily-log migration
-- actually applied, and is Delmus's account properly linked to his auth session.

-- A) Did migration 20260921000100_daily_log.sql ever run on production?
--    (If Supabase CLI was used to deploy, applied migrations are tracked here.)
select version, name
from supabase_migrations.schema_migrations
where version = '20260921000100';
-- 0 rows = never applied via `supabase db push`. Go straight to 02-apply-migration.sql.
-- 1 row  = it WAS applied; the problem is something else (schema cache, or see part D below).

-- B) Do the objects from that migration actually exist right now, regardless of how they got there?
select to_regclass('public.daily_log_entries')      as daily_log_entries_table;
select proname from pg_proc
 where pronamespace = 'public'::regnamespace and proname in ('my_month_goal', 'my_log_seconds', 'apply_log_carryover');
-- NULL / 0 rows here = the objects genuinely don't exist on production. Go to 02-apply-migration.sql.
-- Table + all 3 functions present = objects exist; try 03-reload-schema-cache.sql next.

-- C) Confirm grants (PostgREST hides a table with no privileges for its API roles, same symptom as "missing").
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'daily_log_entries';
-- Should include authenticated: SELECT, INSERT, UPDATE, DELETE. If this table exists but has 0 rows here,
-- re-run just the grant line from the migration, then 03-reload-schema-cache.sql.

-- D) Is Delmus's account itself properly linked? (Separate from the above — check this too either way.)
select m.id as member_id, m.full_name, m.status as member_status, m.user_id,
       u.id as auth_user_id, u.email
from public.members m
left join auth.users u on u.id = m.user_id
where m.full_name ilike '%delmus%';
-- member_status must be 'active', and auth_user_id must NOT be null (it must match user_id) for
-- my_month_goal to recognize him at all, independent of the migration question above.
