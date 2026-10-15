-- One-off: rename the congregation. There is no Settings UI field for this (SET-01's general settings form
-- covers tagline, landing text and letterhead lines, but not the core name) — this is the only way to change it.
-- Run in the Supabase SQL editor. Changes the name everywhere at once: the landing page, and every PDF and
-- Excel export's letterhead (src/lib/exports/data.ts reads this same column).
update public.congregations
   set name = 'Nyamira congregation of Jehovah''s Witnesses'
 where slug = 'nyamira';
