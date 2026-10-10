-- Scheduling runs in Supabase (pg_cron + Edge Functions); Vercel cron is not used (R-02).
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

-- Contacts the Edge Function only when something is due. URL and secret live in Vault (never in the cron command):
--   select vault.create_secret('https://<project-ref>.supabase.co/functions/v1', 'functions_base_url');
--   select vault.create_secret('<same value as DISPATCH_SECRET>', 'dispatch_secret');
create or replace function private.invoke_dispatch() returns void
language plpgsql security definer set search_path = '' as $$
declare v_secret text; v_url text;
begin
  if exists (select 1 from public.notification_deliveries where status = 'pending' and send_after <= now()) then
    select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'dispatch_secret';
    select decrypted_secret into v_url from vault.decrypted_secrets where name = 'functions_base_url';
    if v_secret is null or v_url is null then return; end if;
    perform net.http_post(
      url := v_url || '/dispatch-notifications',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_secret),
      body := '{}'::jsonb);
  end if;
end $$;

-- Housekeeping: throttle records 30 days, delivery records 90 days (§15.5).
create or replace function private.housekeeping() returns void
language sql security definer set search_path = '' as $$
  delete from public.auth_attempts where at < now() - interval '30 days';
  delete from public.notification_deliveries where status <> 'pending' and coalesce(sent_at, send_after) < now() - interval '90 days'; $$;

select cron.schedule('dispatch-notifications', '*/5 * * * *', $$select private.invoke_dispatch()$$);
select cron.schedule('housekeeping', '0 0 * * 0', $$select private.housekeeping()$$);
