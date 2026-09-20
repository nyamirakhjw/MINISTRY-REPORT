-- Window boundaries (PRD §6.2, §18.3). Nairobi is UTC+3 all year; bounds are exclusive.
begin;
select plan(7);
insert into public.congregations (id, slug, name) values ('cccccccc-0000-0000-0000-000000000001', 'test-w', 'Test W');

select is((select opens_at from public.report_window('cccccccc-0000-0000-0000-000000000001', '2026-08-01')),
  '2026-08-30 21:00:00+00'::timestamptz, 'August opens 00:00 Nairobi on 31 Aug');
select is((select on_time_until from public.report_window('cccccccc-0000-0000-0000-000000000001', '2026-08-01')),
  '2026-09-10 21:00:00+00'::timestamptz, 'August on time until end of 10 Sep');
select is((select late_until from public.report_window('cccccccc-0000-0000-0000-000000000001', '2026-08-01')),
  '2026-09-30 21:00:00+00'::timestamptz, 'August late until end of 30 Sep');
select is((select opens_at from public.report_window('cccccccc-0000-0000-0000-000000000001', '2026-09-01')),
  '2026-09-29 21:00:00+00'::timestamptz, 'September opens 00:00 Nairobi on 30 Sep');
select is((select late_until from public.report_window('cccccccc-0000-0000-0000-000000000001', '2026-09-01')),
  '2026-10-31 21:00:00+00'::timestamptz, 'September late until end of 31 Oct');
select is((select opens_at from public.report_window('cccccccc-0000-0000-0000-000000000001', '2028-02-01')),
  '2028-02-28 21:00:00+00'::timestamptz, 'leap-year February opens on the 29th');
select is((select late_until from public.report_window('cccccccc-0000-0000-0000-000000000001', '2026-12-01')),
  '2027-01-31 21:00:00+00'::timestamptz, 'December late window crosses the year boundary');
select * from finish();
rollback;
