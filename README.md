# Ministry Report — combined fix (v0.2.3 + v0.2.4 + production schema check)

Everything from the last three fixes, combined into one package, plus the new finding
from your latest screenshots: the ribbon and the sync error very likely share **one root
cause** — a missing migration on production — not two separate bugs.

## Do this first: run the diagnostic (no code changes yet)

Open the Supabase SQL editor on the **PRODUCTION** project and run `sql/01-diagnose.sql`.
It checks four things in one pass:
- **A/B)** Was `20260921000100_daily_log.sql` (the migration that created `daily_log_entries`,
  `my_month_goal`, `my_log_seconds`, `apply_log_carryover`) ever applied to production?
- **C)** Does `authenticated` actually have grants on `daily_log_entries`?
- **D)** Is Delmus's `members` row properly linked to his `auth.users` account and active?

### Why this is the likely root cause
Your SQL screenshot confirms Delmus's `regular_pioneer` arrangement is `approved` and
covers September 2026 — so the arrangement itself is fine. But the browser console shows
`PGRST205: Could not find the table 'public.daily_log_entries' in the schema cache` on
**every** sync attempt. That table and the `my_month_goal`/`my_log_seconds` functions were
all created together in the same migration file. If PostgREST can't see one, it's a strong
sign production never got that whole migration — which explains both the missing ribbon
(the RPC call fails, and the app correctly fails safe by hiding it) and the stuck
"Waiting to send" (the table genuinely isn't reachable) with a single explanation.

### Depending on what 01-diagnose.sql shows
- **Migration/objects missing** → run `sql/02-apply-migration.sql`. It's the exact,
  unmodified content of `20260921000100_daily_log.sql` — safe to run once against a
  database that doesn't have these objects yet. If any single statement errors with
  "already exists," **stop and tell me exactly which one** rather than continuing; it
  would mean production has some but not all of these objects, which needs a careful
  hand rather than a blind full re-run.
- **Objects exist, but PostgREST still 404s** → run `sql/03-reload-schema-cache.sql`.
- **Member not linked / not active (part D)** → that's a data-fix in your Elder console
  or a direct `update public.members set status='active', user_id='<correct auth uid>' ...`
  — send me what part D actually shows and I'll give you the exact statement.

## Then apply the application-code fixes (all four files, consolidated)

- `src/app/app/log/page.tsx` — Log page fails safe toward *showing* the page (v0.2.3)
- `src/app/app/page.tsx` — Home fails safe toward *hiding* the ribbon on any uncertainty (v0.2.3)
- `src/lib/offline/log-store.ts` — sync failures are now logged and surfaced instead of silent (v0.2.4)
- `src/components/report/log-client.tsx` — shows a visible banner on sync failure (v0.2.4)
- `add_translation_key.py` / `apply_translation_fix.sh` — adds the `log.syncError` string
  to both language catalogues and verifies it landed, so you don't see a raw `log.syncError`
  key again

### Apply
```bash
cd /path/to/ministry-report

# 1. Copy the four corrected files directly into place (safest — no patch/context risk)
cp -r /path/to/unzipped/src/* src/

# 2. Regenerate translations and verify
cp /path/to/unzipped/add_translation_key.py /path/to/unzipped/apply_translation_fix.sh .
./apply_translation_fix.sh

# 3. Review, commit, push
git status --short
git add -A
git commit -m "fix: redirect loop, silent sync failures, missing sync-error translation (v0.2.3 + v0.2.4)"
git push
```

This time the files are copied wholesale rather than patched, since a diff can silently
fail to apply if your local file has drifted even slightly — a direct copy can't have
that problem, but it also means it will overwrite anything else you've changed in those
four files, so check `git status`/`git diff` before committing.

## After both the SQL fix and the code are live
1. Confirm `sql/01-diagnose.sql` part B now shows the table and all three functions.
2. Reload the app as Delmus, open **Daily log** — the ribbon should show `X / 50` this time.
3. Add an entry — it should sync and disappear from "Waiting to send" within a few seconds,
   not stay stuck. If it still gets stuck, the console error will now be a *different*
   message than PGRST205 — send me that new one.
