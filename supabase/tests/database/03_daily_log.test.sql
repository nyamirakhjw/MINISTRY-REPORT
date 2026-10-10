-- Daily log: owner-only, locks the moment a month is submitted, never Elder-readable (LOG-02, LOG-06).
begin;
select plan(6);

insert into public.congregations (id, slug, name) values ('dddddddd-0000-0000-0000-000000000001', 'test-log', 'Test Log');
insert into public.groups (id, congregation_id, name) values ('dddddddd-1111-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001', 'G1');

create function pg_temp.mkuser(p_id uuid, p_email text, p_user text, p_cong text, p_group uuid) returns void language plpgsql as $$
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values (p_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email,
          jsonb_build_object('congregation', p_cong, 'group_id', p_group, 'full_name', 'Person ' || p_user, 'username', p_user,
                             'consent_privacy', 'v1', 'consent_terms', 'v1'), now(), now());
end $$;
select pg_temp.mkuser('c0000000-0000-0000-0000-00000000000a', 'pioneer.a@example.test', 'pioneer.a', 'test-log', 'dddddddd-1111-0000-0000-000000000001');
select pg_temp.mkuser('c0000000-0000-0000-0000-00000000000b', 'elder.log@example.test', 'elder.log', 'test-log', 'dddddddd-1111-0000-0000-000000000001');
update public.members set status = 'active', first_report_month = '2026-01-01' where username = 'pioneer.a';
update public.members set status = 'active', role = 'elder', first_report_month = '2026-01-01' where username = 'elder.log';

create function pg_temp.as_user(p_user uuid, p_aal text default 'aal2') returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated', 'aal', p_aal)::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

select pg_temp.as_user('c0000000-0000-0000-0000-00000000000a', 'aal1');
select lives_ok(
  $$insert into public.daily_log_entries (id, congregation_id, member_id, service_date, duration_seconds)
    select gen_random_uuid(), congregation_id, id, '2026-01-05', 3600 from public.members where username = 'pioneer.a'$$,
  'the owner can add their own log entry');
select is((select public.my_log_seconds('2026-01-01')), 3600::bigint, 'my_log_seconds sums the owner''s own entries');

reset role;
select pg_temp.as_user('c0000000-0000-0000-0000-00000000000b'); -- the Elder
select is((select count(*)::int from public.daily_log_entries), 0, 'an Elder reads no rows from the private log, even their own congregation''s');

reset role;
select pg_temp.as_user('c0000000-0000-0000-0000-00000000000a', 'aal1');
select lives_ok(
  $$insert into public.daily_log_entries (id, congregation_id, member_id, service_date, duration_seconds)
    select gen_random_uuid(), congregation_id, id, '2026-01-06', 1800 from public.members where username = 'pioneer.a'$$,
  'a second entry in the same month is still editable before submission');

insert into public.reports (congregation_id, member_id, month, category, hours, studies, submitted_via)
select congregation_id, id, '2026-01-01', 'regular_pioneer', 1, 0, 'self' from public.members where username = 'pioneer.a';

select throws_ok(
  $$insert into public.daily_log_entries (id, congregation_id, member_id, service_date, duration_seconds)
    select gen_random_uuid(), congregation_id, id, '2026-01-07', 900 from public.members where username = 'pioneer.a'$$,
  'P0001', 'month_locked', 'the log locks once the month''s report is submitted');
select throws_ok(
  $$delete from public.daily_log_entries where service_date = '2026-01-05'$$,
  'P0001', 'month_locked', 'existing entries in a submitted month cannot be deleted either');

select * from finish();
rollback;
