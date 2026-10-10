-- Live console (§14.5). Realtime respects RLS, so a person only receives changes they may read.
do $$ declare t text; begin
  foreach t in array array['reports','members','service_arrangements','notifications','profile_change_requests'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
