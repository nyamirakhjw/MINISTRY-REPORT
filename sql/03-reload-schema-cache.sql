-- Run this if 01-diagnose.sql part B showed the table and functions DO exist, but
-- PostgREST still returns PGRST205 ("could not find ... in the schema cache").
-- This is a known Supabase behavior when DDL is applied without going through a path
-- that notifies PostgREST (e.g. pasted directly into the SQL editor rather than
-- `supabase db push`). It's harmless to run even if this isn't the issue.
notify pgrst, 'reload schema';

-- If that doesn't clear it within ~10 seconds, use the Dashboard instead:
-- Settings -> API -> "Reload schema cache" button (does the same thing via the API, not SQL).
