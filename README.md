# Fix: hours ribbon missing + "Waiting to send" stuck (v0.2.4)

## What this contains
- `src/lib/offline/log-store.ts` — full corrected file (offline sync no longer swallows errors)
- `src/components/report/log-client.tsx` — full corrected file (shows a sync-error banner)
- `add_translation_key.py` — adds the one new translation key (`log.syncError`) to
  `scripts/build-messages.py` in the project's existing EN/SW format
- `daily-log-sync-fix.patch` — unified diff for the two TSX/TS files, `git apply`-ready
- `sql/diagnose-delmus-goal.sql` — read-only diagnostic query for the ribbon issue

## Issue 1: "Waiting to send" never clears — FIXED

### Root cause
`log-store.ts`'s `sync()` destructured `{ error }` from every Supabase call and never
checked it. If a write was rejected for *any* reason, the entry just sat in IndexedDB
forever marked unsynced, with nothing anywhere explaining why.

### Fix
- Every sync attempt is now wrapped in `try/catch`, and every failure is logged to the
  console with its code and message.
- A failed sync is exposed as `syncError` from the hook, and `log-client.tsx` now shows
  a visible banner when that happens (§8.5's rule: never a silent stuck state).
- Added a 30-second retry loop, so a transient failure (network blip, a brief session
  hiccup) clears itself without the person needing to reload.

### Apply
```bash
cd /path/to/ministry-report
git apply daily-log-sync-fix.patch
python3 add_translation_key.py        # adds log.syncError to both EN and SW catalogues
python3 scripts/build-messages.py     # regenerate messages/en.json and messages/sw.json
git add -A
git commit -m "fix: surface daily-log sync failures instead of a silent stuck state (v0.2.4)"
git push
```
If `git apply` fails on context, or `add_translation_key.py`'s assertion fails, your
`log-store.ts` / `build-messages.py` have drifted from what's described above — paste
me their current contents and I'll re-diff against reality.

### After deploying
Add hours again. If it still gets stuck, the browser console (not just the server logs)
will now show `daily_log_entries sync failed: <code> <message>` — send me that exact line.

## Issue 2: Hours ribbon missing on Home, no goal shown on Log — NOT YET FIXED, needs your data

This is not a code bug I can patch blind — it's your live Supabase data. Both pages
call the same `my_month_goal` RPC, and it's returning `{category: null, goal_hours: null}`
for Delmus's account. That happens when `private.caller_member()` finds no active
`members` row for his signed-in session — either:

- he has no `service_arrangements` row at all (system currently thinks he's a Publisher), or
- that row exists but its `status` isn't `'approved'`, or
- that row's `start_month`/`end_month` window doesn't cover September 2026

**Run `sql/diagnose-delmus-goal.sql` in the Supabase SQL editor (Production project)**
and send me the two result sets. That tells us definitively which of the three it is,
and the fix from there is a one-line data correction (approve/extend the arrangement),
not a code change — unless the first query comes back completely empty, in which case
his account isn't linked to a `members` row at all and we'll need to look at that.

## Issue 3: Multiple hour entries per day — already works, no fix needed

The schema has no per-day uniqueness constraint on `daily_log_entries`, and the Quick
Add form creates a new row with a fresh UUID on every submission — it doesn't check or
merge with existing entries for that date. The ribbon and month total already sum every
entry for the month (`entries.reduce((sum, e) => sum + e.durationSeconds, 0)`). So
logging, say, three separate visits on the same day already accumulates correctly once
sync is working — this was really Issue 1 in disguise: entries *were* accumulating
locally, they just looked "stuck" because the sync status never resolved.

## Issue 4: Goal rules — confirming against the PRD, no change made

| Category | Goal source | Where in code |
|---|---|---|
| Publisher | None — no ribbon at all | `LOG-05`, enforced by the redirect on `/app/log` |
| Regular pioneer | Congregation default (50h), overridable per person via `member_goals` | `private.goal_for()` |
| Special pioneer | Congregation default (70h), overridable per person | `private.goal_for()` |
| Auxiliary pioneer | **Not** a congregation default — chosen as 15 or 30 when the arrangement itself is requested/approved, stored on `service_arrangements.aux_goal_hours` | `private.goal_for()`, PRD §6.6 |

This matches the PRD as written. If you want auxiliary pioneers to *also* have an
editable personal-goal override independent of their arrangement's 15/30 choice, that's
a real product decision (not in the PRD as it stands) — tell me and I'll scope it.
