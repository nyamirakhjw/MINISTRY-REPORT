-- Corrections flow: request, approve+reopen, resubmit, decline, and edit directly (COR-01 to 03).
begin;
select plan(12);

insert into public.congregations (id, slug, name) values ('eeeeeeee-0000-0000-0000-000000000001', 'test-cor', 'Test Corrections');
insert into public.groups (id, congregation_id, name) values ('eeeeeeee-1111-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000001', 'G1');

create function pg_temp.mkuser(p_id uuid, p_email text, p_user text, p_cong text, p_group uuid) returns void language plpgsql as $$
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values (p_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email,
          jsonb_build_object('congregation', p_cong, 'group_id', p_group, 'full_name', 'Person ' || p_user, 'username', p_user,
                             'consent_privacy', 'v1', 'consent_terms', 'v1'), now(), now());
end $$;
select pg_temp.mkuser('d0000000-0000-0000-0000-00000000000a', 'pub.cor@example.test', 'pub.cor', 'test-cor', 'eeeeeeee-1111-0000-0000-000000000001');
select pg_temp.mkuser('d0000000-0000-0000-0000-00000000000b', 'elder.cor@example.test', 'elder.cor', 'test-cor', 'eeeeeeee-1111-0000-0000-000000000001');
update public.members set status = 'active', first_report_month = '2026-01-01' where username = 'pub.cor';
update public.members set status = 'active', role = 'elder', first_report_month = '2026-01-01' where username = 'elder.cor';

insert into public.reports (id, congregation_id, member_id, month, category, participated, studies, submitted_via)
select 'ffffffff-0000-0000-0000-000000000001', congregation_id, id, '2026-01-01', 'publisher', true, 3, 'self' from public.members where username = 'pub.cor';

create function pg_temp.as_user(p_user uuid, p_aal text default 'aal2') returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated', 'aal', p_aal)::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

-- Publisher requests a correction ---------------------------------------------------------------------------------
select pg_temp.as_user('d0000000-0000-0000-0000-00000000000a', 'aal1');
select lives_ok($$select public.request_correction('ffffffff-0000-0000-0000-000000000001', array['studies'], 'Typed the wrong number')$$,
  'the report''s own publisher can request a correction');
select throws_ok($$select public.request_correction('ffffffff-0000-0000-0000-000000000001', array['studies'], 'again')$$,
  'P0001', 'not_pending', 'only one open request per report');

-- Elder approves and reopens ---------------------------------------------------------------------------------------
reset role;
select pg_temp.as_user('d0000000-0000-0000-0000-00000000000b');
select lives_ok($$select public.decide_correction((select id from public.report_corrections limit 1), true)$$, 'an elder can approve a correction');
select is((select status::text from public.reports where id = 'ffffffff-0000-0000-0000-000000000001'), 'reopened', 'approval reopens the report');
select is((select status::text from public.report_corrections limit 1), 'approved', 'the correction request is marked approved');

-- Publisher fixes and resubmits, keeping the original submission time -----------------------------------------------
reset role;
select pg_temp.as_user('d0000000-0000-0000-0000-00000000000a', 'aal1');
select lives_ok(
  $$select public.resubmit_report('ffffffff-0000-0000-0000-000000000001', 'publisher', true, null, 5, 'fixed', gen_random_uuid())$$,
  'the publisher can resubmit a reopened report');
select is((select status::text from public.reports where id = 'ffffffff-0000-0000-0000-000000000001'), 'submitted', 'resubmission locks it again');
select is((select studies from public.reports where id = 'ffffffff-0000-0000-0000-000000000001'), 5, 'the corrected value is saved');
select is((select was_corrected from public.reports where id = 'ffffffff-0000-0000-0000-000000000001'), true, 'was_corrected is set');

-- A second correction, declined -------------------------------------------------------------------------------------
select lives_ok($$select public.request_correction('ffffffff-0000-0000-0000-000000000001', array['other'], 'please check again')$$, 'a new request can be made once the last one is resolved');
reset role;
select pg_temp.as_user('d0000000-0000-0000-0000-00000000000b');
select throws_ok($$select public.decide_correction((select id from public.report_corrections where status = 'pending'), false, null)$$,
  'P0001', 'reason_required', 'declining needs a reason');
select lives_ok($$select public.decide_correction((select id from public.report_corrections where status = 'pending'), false, 'Already correct')$$, 'declining with a reason succeeds');

select * from finish();
rollback;
