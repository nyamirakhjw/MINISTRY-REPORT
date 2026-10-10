-- Lets an Elder (a) edit a member's phone too, not just name/group, and (b) delete a member's account
-- immediately — reusing the existing anonymization pipeline (§16.7) rather than the self-service 30-day
-- grace period, and overriding any pending self-service deletion request rather than waiting on it.

-- =====================================================================
-- admin_update_member: now also takes phone. Signature changed, so drop the old 3-arg version first —
-- otherwise Postgres keeps both as separate overloads instead of replacing it.
-- =====================================================================
drop function if exists public.admin_update_member(uuid, uuid, text);

create or replace function public.admin_update_member(p_member uuid, p_group uuid, p_full_name text, p_phone text default null)
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

  update public.members set group_id = p_group, full_name = btrim(p_full_name), phone = v_phone where id = t.id;
  perform private.audit(c.congregation_id, 'member.update', 'members', t.id,
    jsonb_build_object('full_name', t.full_name, 'group_id', t.group_id, 'phone', t.phone),
    jsonb_build_object('full_name', btrim(p_full_name), 'group_id', p_group, 'phone', v_phone));
end $$;

revoke all on function public.admin_update_member from public, anon;
grant execute on function public.admin_update_member to authenticated;

-- =====================================================================
-- admin_delete_member_now: Elder-triggered, immediate version of the same anonymization §16.7 already
-- performs after a 30-day grace period — same end state (name becomes "Former publisher", photo, phone,
-- email, username, daily log, return visits, notifications gone, sign-in removed, report NUMBERS stay so
-- past congregation totals never change, D-36/GL-3), just without the wait, and usable whether or not the
-- member ever filed a self-service request. A reason is required and the whole action is audited.
-- =====================================================================
create or replace function public.admin_delete_member_now(p_member uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.members; t public.members;
begin
  c := private.require_role('elder');
  if char_length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'reason_required'; end if;
  select * into t from public.members where id = p_member for update;
  if not found or t.congregation_id <> c.congregation_id then raise exception 'not_found'; end if;
  if t.status = 'anonymized' then raise exception 'already_deleted'; end if;

  -- Close out any self-service request instead of leaving it dangling once this runs.
  update public.deletion_requests set status = 'approved', decided_by = c.id, decided_at = now()
   where member_id = p_member and status = 'pending';

  perform private.audit(c.congregation_id, 'deletion.admin_delete', 'members', p_member,
    jsonb_build_object('full_name', t.full_name, 'status', t.status), null, p_reason);

  perform private.anonymize_member(p_member);
end $$;

revoke all on function public.admin_delete_member_now from public, anon;
grant execute on function public.admin_delete_member_now to authenticated;
