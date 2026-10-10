-- Private avatars bucket: one folder per member (D-08, §14.4). Photos are shown through short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 204800, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = 204800,
  allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png'];

-- A person reads and writes only their own folder (works for pending members too).
create policy avatars_own on storage.objects for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] =
         (select m.id::text from public.members m where m.user_id = (select auth.uid()) limit 1))
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] =
         (select m.id::text from public.members m where m.user_id = (select auth.uid()) limit 1));

-- Elders manage folders in their congregation (managed profiles).
create policy avatars_elder on storage.objects for all to authenticated
  using (bucket_id = 'avatars' and private.is_elder() and exists (
         select 1 from public.members m
          where m.id::text = (storage.foldername(name))[1] and m.congregation_id = private.current_congregation_id()))
  with check (bucket_id = 'avatars' and private.is_elder() and exists (
         select 1 from public.members m
          where m.id::text = (storage.foldername(name))[1] and m.congregation_id = private.current_congregation_id()));

-- Ministerial Servants must see the photo of a pending request to verify it (APR-01). Read only.
create policy avatars_ms_pending on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and private.has_role('ministerial_servant') and private.aal2() and exists (
         select 1 from public.members m
          where m.id::text = (storage.foldername(name))[1] and m.status = 'pending'
            and m.congregation_id = private.current_congregation_id()));
