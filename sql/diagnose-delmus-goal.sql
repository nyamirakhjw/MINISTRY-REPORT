-- Run this in the Supabase SQL editor (Production project) to find out exactly why
-- my_month_goal() is returning an unconfirmed/null category for Delmus.
--
-- What to look for:
--  1. Does a row come back at all for "member row"? If not, his auth account isn't
--     linked to an active `members` row — that alone explains both symptoms.
--  2. Does a row come back for "arrangement row"? If not, he has no pioneer
--     arrangement on file at all (he's a Publisher as far as the system knows).
--  3. If an arrangement row exists: is `arrangement_status` = 'approved'?
--     Is `current_month` between `start_month` and `end_month` (or end_month null)?
--     If the window doesn't cover September 2026, that's why.

select
  m.id            as member_id,
  m.full_name,
  m.role,
  m.status        as member_status,
  m.user_id       as linked_auth_user
from public.members m
where m.full_name ilike '%delmus%'
order by m.created_at;

select
  m.full_name,
  a.kind,
  a.status        as arrangement_status,
  a.start_month,
  a.end_month,
  a.aux_goal_hours,
  date_trunc('month', (now() at time zone 'Africa/Nairobi'))::date as current_month
from public.members m
left join public.service_arrangements a on a.member_id = m.id
where m.full_name ilike '%delmus%'
order by a.start_month desc nulls last;
