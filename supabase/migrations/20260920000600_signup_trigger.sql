-- Sign-up: never trusts client-supplied role or status. Everyone starts as a pending publisher (AUTH-01, AUTH-08).
create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_cong uuid; v_group uuid; v_member uuid; v_user text; v_arr text; v_lang public.app_lang; v_tz text;
begin
  select id, timezone into v_cong, v_tz from public.congregations where slug = v_meta->>'congregation';
  if v_cong is null then raise exception 'unknown_congregation'; end if;

  select g.id into v_group from public.groups g
   where g.id = nullif(v_meta->>'group_id', '')::uuid and g.congregation_id = v_cong and not g.retired;
  if v_group is null then raise exception 'invalid_group'; end if;

  v_user := lower(coalesce(v_meta->>'username', ''));
  if v_user !~ '^[a-z0-9._-]{3,24}$' or private.reserved_username(v_user) then raise exception 'username_invalid'; end if;

  v_lang := case when v_meta->>'language' = 'sw' then 'sw'::public.app_lang else 'en'::public.app_lang end;

  insert into public.members (user_id, congregation_id, group_id, full_name, username, email, phone, language)
  values (new.id, v_cong, v_group, btrim(v_meta->>'full_name'), v_user, new.email,
          nullif(btrim(v_meta->>'phone'), ''), v_lang)
  returning id into v_member;

  if coalesce(v_meta->>'consent_privacy', '') ~ '^[0-9A-Za-z._-]{1,32}$'
     and coalesce(v_meta->>'consent_terms', '') ~ '^[0-9A-Za-z._-]{1,32}$' then
    insert into public.consents (member_id, document, version) values
      (v_member, 'privacy', v_meta->>'consent_privacy'), (v_member, 'terms', v_meta->>'consent_terms');
  else
    raise exception 'consent_required';
  end if;

  -- A requested pioneer arrangement waits for an Elder (D-09, APR-03); the person reports as Publisher until then.
  v_arr := v_meta->>'arrangement';
  if v_arr in ('auxiliary_pioneer', 'regular_pioneer', 'special_pioneer') then
    insert into public.service_arrangements (congregation_id, member_id, kind, start_month, aux_goal_hours)
    values (v_cong, v_member, v_arr::public.report_category, date_trunc('month', now() at time zone v_tz)::date,
            case when v_arr = 'auxiliary_pioneer' then case when v_meta->>'aux_goal' = '30' then 30 else 15 end end);
  end if;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();
