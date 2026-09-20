-- Run ONCE per environment in the Supabase SQL editor, after the Owner has signed up and confirmed their email.
-- Makes the Owner the Platform Owner and the first Elder of their congregation (APR-05: nobody can approve the first account).
-- Replace the two values below.
do $$
declare
  v_email text := 'REPLACE_WITH_OWNER_EMAIL';
  v_slug  text := 'nyamira';
  v_user  uuid; v_cong uuid; v_member uuid; v_group uuid;
begin
  select id into v_user from auth.users where lower(email) = lower(v_email);
  if v_user is null then raise exception 'No auth user with that email. Sign up first.'; end if;
  select id into v_cong from public.congregations where slug = v_slug;
  select id into v_member from public.members where user_id = v_user;
  select id into v_group from public.groups where congregation_id = v_cong order by name limit 1;
  update public.members
     set status = 'active', role = 'elder', group_id = coalesce(group_id, v_group),
         first_report_month = coalesce(first_report_month, date_trunc('month', now() at time zone 'Africa/Nairobi')::date),
         avatar_path = coalesce(avatar_path, id::text || '/avatar.webp')
   where id = v_member;
  insert into public.platform_admins (user_id) values (v_user) on conflict do nothing;
end $$;
-- Then sign out, sign in, and enroll two-factor authentication when asked.
