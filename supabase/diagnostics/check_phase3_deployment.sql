-- Run this in the Supabase SQL editor any time to see exactly which pieces of Sprints 1-7 have been
-- applied to THIS project. Paste the whole thing and run it — it only reads, it never changes anything.
--
-- Reading the result: every row should say "present". Any row saying "MISSING" tells you exactly which
-- migration file still needs to be pasted in and run (see the "Which migration" column).

with wanted (kind, name, migration) as (
  values
    ('table',    'return_visits',       '20261010000000_phase3_return_visits.sql'),
    ('table',    'rv_visits',           '20261010000000_phase3_return_visits.sql'),
    ('table',    'deletion_requests',   '20261010000300_phase3_deletion.sql'),
    ('function', 'log_rv_visit',        '20261010000000_phase3_return_visits.sql'),
    ('function', 'admin_month_trend',   '20261010000100_phase3_admin_insights.sql'),
    ('function', 'admin_goal_attainment','20261010000100_phase3_admin_insights.sql'),
    ('function', 'log_export',          '20261010000200_phase3_exports.sql'),
    ('function', 'my_data_export',      '20261010000200_phase3_exports.sql'),
    ('function', 'request_deletion',    '20261010000300_phase3_deletion.sql'),
    ('function', 'approve_deletion',    '20261010000300_phase3_deletion.sql'),
    ('function', 'update_window_rules', '20261003000000_sprint1_congregation_settings.sql'),
    ('function', 'get_congregation_settings', '20261003000000_sprint1_congregation_settings.sql')
)
select
  w.kind, w.name,
  case
    when w.kind = 'table' and exists (
      select 1 from information_schema.tables t
      where t.table_schema = 'public' and t.table_name = w.name
    ) then 'present'
    when w.kind = 'function' and exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = w.name
    ) then 'present'
    else 'MISSING'
  end as status,
  w.migration as "which migration to run"
from wanted w
order by (case when w.kind = 'table' then 0 else 1 end), w.migration, w.name;
