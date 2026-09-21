-- Access-rule and business-rule tests (PRD §18.2, §18.3). Each case signs in as one person and tries an action.
begin;
select plan(20);

-- Fixtures (as postgres) ----------------------------------------------------------
insert into public.congregations (id, slug, name) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'test-a', 'Test A'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'test-b', 'Test B');
insert into public.groups (id, congregation_id, name) values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Group A1'),
  ('bbbbbbbb-1111-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'Group B1');

create function pg_temp.mkuser(p_id uuid, p_email text, p_user text, p_cong text, p_group uuid) returns void language plpgsql as $$
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values (p_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email,
          jsonb_build_object('congregation', p_cong, 'group_id', p_group, 'full_name', 'Person ' || p_user, 'username', p_user,
                             'consent_privacy', 'v1', 'consent_terms', 'v1'), now(), now());
end $$;

select pg_temp.mkuser('a0000000-0000-0000-0000-00000000000a', 'elder.a@example.test', 'elder.a', 'test-a', 'aaaaaaaa-1111-0000-0000-000000000001');
select pg_temp.mkuser('a0000000-0000-0000-0000-00000000000b', 'ms.a@example.test',    'ms.a',    'test-a', 'aaaaaaaa-1111-0000-0000-000000000001');
select pg_temp.mkuser('a0000000-0000-0000-0000-00000000000c', 'pub1.a@example.test',  'pub1.a',  'test-a', 'aaaaaaaa-1111-0000-0000-000000000001');
select pg_temp.mkuser('a0000000-0000-0000-0000-00000000000d', 'pub2.a@example.test',  'pub2.a',  'test-a', 'aaaaaaaa-1111-0000-0000-000000000001');
select pg_temp.mkuser('a0000000-0000-0000-0000-00000000000e', 'pend.a@example.test',  'pend.a',  'test-a', 'aaaaaaaa-1111-0000-0000-000000000001');
select pg_temp.mkuser('b0000000-0000-0000-0000-00000000000a', 'elder.b@example.test', 'elder.b', 'test-b', 'bbbbbbbb-1111-0000-0000-000000000001');

update public.members set status = 'active', role = 'elder',               first_report_month = '2026-01-01' where username = 'elder.a';
update public.members set status = 'active', role = 'ministerial_servant', first_report_month = '2026-01-01' where username = 'ms.a';
update public.members set status = 'active',                                first_report_month = '2026-01-01' where username in ('pub1.a', 'pub2.a');
update public.members set status = 'active', role = 'elder',               first_report_month = '2026-01-01' where username = 'elder.b';
update public.members set avatar_path = id::text || '/avatar.webp' where username = 'pend.a';

insert into public.reports (congregation_id, member_id, month, category, participated, studies)
select m.congregation_id, m.id, '2026-01-01', 'publisher', true, 0 from public.members m where m.username in ('pub2.a', 'elder.b');

create function pg_temp.as_user(p_user uuid, p_aal text default 'aal2') returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated', 'aal', p_aal)::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

-- Sign-up trigger -------------------------------------------------------------------
select is((select status::text from public.members where username = 'pend.a'), 'pending', 'new sign-ups are pending publishers');
select is((select count(*)::int from public.consents c join public.members m on m.id = c.member_id where m.username = 'pend.a'), 2, 'consent versions are recorded');

-- Publisher isolation ------------------------------------------------------------------
select pg_temp.as_user('a0000000-0000-0000-0000-00000000000c', 'aal1');
select is((select count(*)::int from public.reports), 0, 'publisher cannot read another publisher''s report');
select throws_ok($$insert into public.reports (congregation_id, member_id, month, category, participated, studies)
  select congregation_id, id, '2026-02-01', 'publisher', true, 0 from public.members limit 1$$, '42501', null, 'publisher cannot write reports directly');
select is((select count(*)::int from public.members), 1, 'publisher sees only their own member row');
select is((select count(*)::int from public.audit_log), 0, 'publisher cannot read the audit log');

-- Pending member -----------------------------------------------------------------------
reset role;
select pg_temp.as_user('a0000000-0000-0000-0000-00000000000e', 'aal1');
select is((select count(*)::int from public.reports), 0, 'pending member reads no reports');
select throws_ok($$select public.submit_report('2026-01-01', 'publisher', true, null, 0, null, gen_random_uuid())$$, 'P0001', 'not_active', 'pending member cannot submit');

-- Ministerial Servant --------------------------------------------------------------------
reset role;
select pg_temp.as_user('a0000000-0000-0000-0000-00000000000b');
select is((select count(*)::int from public.reports), 0, 'ministerial servant cannot read reports');
select is((select count(*)::int from public.members where status = 'pending'), 1, 'ministerial servant sees the complete pending request');
select throws_ok($$select public.set_member_role((select id from public.members where username = 'pub1.a'), 'ministerial_servant')$$, 'P0001', 'not_found', 'ministerial servant cannot grant roles');

-- Elder ------------------------------------------------------------------------------------
reset role;
select pg_temp.as_user('a0000000-0000-0000-0000-00000000000a', 'aal1');
select is((select count(*)::int from public.reports), 0, 'elder without a verified second factor reads nothing');
reset role;
select pg_temp.as_user('a0000000-0000-0000-0000-00000000000a');
select is((select count(*)::int from public.reports), 1, 'elder reads congregation A reports only (not congregation B)');
select throws_ok($$select public.set_member_role((select id from public.members where username = 'pub1.a'), 'elder')$$, 'P0001', 'not_found_platform_only', 'elder cannot grant the Elder role');
select lives_ok($$select public.set_member_role((select id from public.members where username = 'pub1.a'), 'ministerial_servant')$$, 'elder can grant ministerial servant');
select throws_ok($$select public.approve_member((select id from public.members where username = 'pend.a'), 'Person pend.a', 'bbbbbbbb-1111-0000-0000-000000000001')$$, 'P0001', 'invalid_group', 'elder cannot use a group from another congregation');
select lives_ok($$select public.approve_member((select id from public.members where username = 'pend.a'), 'Person Pending', 'aaaaaaaa-1111-0000-0000-000000000001', '2026-01-01')$$, 'elder approves a complete request');
select throws_ok($$update public.audit_log set reason = 'x'$$, '42501', null, 'nobody can update the audit log');

-- Approval of self is refused ---------------------------------------------------------------
select throws_ok($$select public.approve_member((select id from public.members where username = 'elder.a'), 'Person elder.a', 'aaaaaaaa-1111-0000-0000-000000000001')$$, 'P0001', 'cannot_approve_self', 'nobody can approve their own account');

-- Business rules -------------------------------------------------------------------------------
select is((select on_time_until from public.report_window('aaaaaaaa-0000-0000-0000-000000000001', '2026-08-01')),
          '2026-09-10 21:00:00+00'::timestamptz, 'August 2026: on time until 23:59:59 Nairobi on the 10th (= 20:59:59 UTC)');

select * from finish();
rollback;

