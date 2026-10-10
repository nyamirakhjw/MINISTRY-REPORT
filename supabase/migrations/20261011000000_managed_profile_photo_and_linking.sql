-- Elder-scoped avatar set (managed profiles have no login of their own to call set_my_avatar with) and
-- account linking (a person who started out as a managed profile, and later gets a phone/email of their
-- own, can be merged into their existing history instead of starting a second, empty account).

-- =====================================================================
-- admin_set_avatar: Elder sets a member's photo (new managed profiles, or an existing one being edited).
-- Mirrors set_my_avatar's own-path validation, scoped to "any member of my congregation" instead of self.
-- =====================================================================
create or replace function public.admin_set_avatar(p_member uuid, p_path text) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.members; t public.members;
begin
  c := private.require_role('elder');
  select * into t from public.members where id = p_member;
  if not found or t.congregation_id <> c.congregation_id then raise exception 'not_found'; end if;
  if p_path not in (t.id::text || '/avatar.webp', t.id::text || '/avatar.jpg') then raise exception 'bad_path'; end if;
  update public.members set avatar_path = p_path, photo_note = null where id = t.id;
  perform private.audit(c.congregation_id, 'member.set_avatar', 'members', t.id, null, null, null);
end $$;

-- =====================================================================
-- link_managed_profile: merge a brand-new sign-up (still pending approval) into an existing, unclaimed
-- managed profile, so the person keeps their reporting history instead of starting over at zero. Elder-
-- initiated only (never self-service), so this can never be used to claim someone else's record by guessing
-- a name — the Elder who already has to recognize the person for ordinary approval (D-06) does the matching.
-- =====================================================================
create or replace function public.link_managed_profile(p_pending uuid, p_managed uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.members; pend public.members; mgd public.members;
begin
  c := private.require_role('elder');
  select * into pend from public.members where id = p_pending for update;
  select * into mgd  from public.members where id = p_managed for update;
  if not found or pend.congregation_id <> c.congregation_id then raise exception 'not_found'; end if;
  if mgd.id is null or mgd.congregation_id <> c.congregation_id then raise exception 'not_found'; end if;
  if pend.status <> 'pending' then raise exception 'not_pending'; end if;
  if pend.user_id is null then raise exception 'not_a_signup'; end if;
  if mgd.user_id is not null then raise exception 'already_claimed'; end if;
  if mgd.id = pend.id then raise exception 'same_member'; end if;

  -- Keep the managed profile's id (and therefore every report, arrangement and audit entry already tied
  -- to it); adopt the new sign-up's login, contact details and photo onto that same row.
  update public.members set
    user_id    = pend.user_id,
    email      = pend.email,
    username   = pend.username,
    phone      = coalesce(pend.phone, mgd.phone),
    language   = pend.language,
    avatar_path = coalesce(mgd.avatar_path, pend.avatar_path),
    status     = 'active',
    approved_by = c.id,
    approved_at = now()
  where id = mgd.id;

  -- The sign-up's consent record (privacy/terms acceptance, §16.4) must survive the merge even though the
  -- row it was recorded against is about to go away.
  update public.consents set member_id = mgd.id where member_id = pend.id
    and not exists (select 1 from public.consents x where x.member_id = mgd.id and x.document = consents.document and x.version = consents.version);

  delete from public.members where id = pend.id;

  perform private.audit(c.congregation_id, 'member.link_managed_profile', 'members', mgd.id,
    jsonb_build_object('managed_profile_id', mgd.id), jsonb_build_object('merged_pending_id', pend.id));
end $$;

revoke all on function public.admin_set_avatar from public, anon;
grant execute on function public.admin_set_avatar to authenticated;
revoke all on function public.link_managed_profile from public, anon;
grant execute on function public.link_managed_profile to authenticated;
