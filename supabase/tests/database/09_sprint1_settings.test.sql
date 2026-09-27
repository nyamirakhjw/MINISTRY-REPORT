-- Sprint 1 access-rule tests, in the style of PRD §18.2.
-- Run with: supabase test db
--
-- This file assumes your existing pgTAP fixtures for impersonating a
-- publisher / an elder without aal2 / an elder with aal2 (the same
-- fixtures your P1 tests use for `submit_report`, etc.). Wire the
-- three `-- TODO` blocks below to whatever your repo's harness calls
-- to set `auth.uid()` and `request.jwt.claims.aal` inside a test
-- transaction; the assertions themselves don't need to change.

begin;
select plan(5);

-- TODO: impersonate a publisher in the seeded test congregation.
-- select tests.authenticate_as('publisher@example.test');

select throws_ok(
  $$ select public.update_congregation_goals(50, 70, array[15,30]::smallint[]) $$,
  'not_elder',
  'A publisher is denied when updating goal defaults'
);

select throws_ok(
  $$ select public.get_congregation_settings() $$,
  'not_elder',
  'A publisher cannot read congregation settings'
);

-- TODO: impersonate an elder whose session has NOT completed 2FA (aal1).
-- select tests.authenticate_as('elder@example.test', aal => 'aal1');

select throws_ok(
  $$ select public.update_congregation_goals(50, 70, array[15,30]::smallint[]) $$,
  'second_factor_required',
  'An elder without a verified second factor is denied'
);

-- TODO: impersonate the same elder with a verified second factor (aal2).
-- select tests.authenticate_as('elder@example.test', aal => 'aal2');

select lives_ok(
  $$ select public.update_congregation_goals(55, 75, array[20,35]::smallint[]) $$,
  'An elder with a verified second factor can update goal defaults'
);

select ok(
  (select count(*) > 0 from public.audit_log where action = 'congregations.update'),
  'Updating settings writes an audit_log entry (SET-07)'
);

select * from finish();
rollback;
