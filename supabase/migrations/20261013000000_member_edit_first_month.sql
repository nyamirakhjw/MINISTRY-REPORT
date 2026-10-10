-- Lets an Elder change an EXISTING member's first reporting month from Edit, not just at creation (§6.3:
-- "A member's first reportable month defaults to the month their account was created. The approver can set
-- it earlier" — that already worked at approval/creation time; this extends the same control to Edit, for
-- a member who's returning after a gap or was set up wrong the first time). Unchanged: submit_report's own
-- gap check (A.7) still requires every month between the new first_report_month and whatever they submit
-- next to have a report row — Submit on behalf / Close month are still how an Elder fills or skips a gap.
drop function if exists public.admin_update_member(uuid, uuid, text, text);

create or replace function public.admin_update_member(p_member uuid, p_group uuid, p_full_name text, p_phone text default null, p_first_report_month date default null)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.members; t public.members; v_phone text;
begin
  c := private.require_role('elder');
  select * into t from public.members where id = p_member for update;
  if not found or t.congregation_id <> c.congregation_id then raise exception 'not_found'; end if;
  if not exists (select 1 from public.groups g where g.id = p_group and g.congregation_id = c.congregation_id) then
    raise exception 'invalid_group'; end if;
  if char_length(btrim(coalesce(p_full_name, ''))) < 2 then raise exception 'name_required'; end if;
  v_phone := nullif(btrim(coalesce(p_phone, '')), '');
  if v_phone is not null and v_phone !~ '^\+?[0-9]{9,15}$' then raise exception 'phone_invalid'; end if;
  if p_first_report_month is not null and p_first_report_month <> date_trunc('month', p_first_report_month)::date then
    raise exception 'bad_month'; end if;

  update public.members set
    group_id = p_group, full_name = btrim(p_full_name), phone = v_phone,
    first_report_month = coalesce(p_first_report_month, t.first_report_month)
  where id = t.id;

  perform private.audit(c.congregation_id, 'member.update', 'members', t.id,
    jsonb_build_object('full_name', t.full_name, 'group_id', t.group_id, 'phone', t.phone, 'first_report_month', t.first_report_month),
    jsonb_build_object('full_name', btrim(p_full_name), 'group_id', p_group, 'phone', v_phone,
      'first_report_month', coalesce(p_first_report_month, t.first_report_month)));
end $$;

revoke all on function public.admin_update_member from public, anon;
grant execute on function public.admin_update_member to authenticated;
