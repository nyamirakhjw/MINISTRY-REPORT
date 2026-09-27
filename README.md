# Ministry Report — Sprints 1–7 combined drop-in

Everything from "Insight and Records" (Phase 3, §17.2), plus Sprint 1 (congregation settings, §7.14),
combined into one set of drop-in files and cross-checked against each other and against your actual repo
(`MINISTRY-REPORT-main`) — not just against the PRD. Drop-in only: no `package.json`, no app shell. Copy the
folders below over the matching paths in your repo, then follow "Install steps."

## What's in each sprint

| Sprint | Feature | Key files |
|---|---|---|
| 1 | Congregation settings (SET-01–07) | `supabase/migrations/20261003000000_sprint1_congregation_settings.sql`, `src/lib/settings/**`, `src/app/admin/settings/**`, `src/components/settings/**` |
| 2 | Return visits (RV-01–08) | `supabase/migrations/20261010000000_phase3_return_visits.sql`, `src/lib/offline/{dexie,visits-store}.ts`, `src/lib/domain/visits.ts`, `src/components/visits/*`, `src/app/app/visits/**` |
| 3 | Elder insights (ADM-03/04/05) | `supabase/migrations/20261010000100_phase3_admin_insights.sql`, `src/lib/admin-data.ts`, `src/components/admin/trend-charts.tsx`, `src/app/admin/page.tsx` |
| 4–5 | Exports (EXP-01/02/03/05/06/07) | `supabase/migrations/20261010000200_phase3_exports.sql`, `src/lib/exports/**`, `src/app/api/exports/**`, `src/app/admin/exports/**` |
| 6 | Encrypted backup (EXP-04, gate G-8) | `src/lib/exports/backup.ts`, `src/app/api/exports/backup/route.ts`, `src/components/exports/backup-dialog.tsx` |
| 7 | Deletion & data controls (DEL-01/02/04, PRO-07) | `supabase/migrations/20261010000300_phase3_deletion.sql`, `src/lib/actions/deletion.ts`, `src/app/admin/deletions/**`, `src/app/app/settings/data/**` |

Also touched, in place, to wire everything into navigation (full-file replacements — diff against yours first):

- `src/components/shell/nav-links.tsx`, `src/components/shell/member-shell.tsx` — Visits added to the bottom
  bar (History moved into **More**, PRD §8.3).
- `src/app/app/more/page.tsx` — History link added.
- `src/app/admin/layout.tsx` — Settings, Exports and Deletions added to the Elder rail.
- `src/app/app/settings/page.tsx` — one new section linking to `/app/settings/data`.
- `src/components/ui/switch.tsx` — new file; Sprint 1's settings forms need it (see "Fixes" below).

## What I found wrong with Sprint 1, and fixed

I reviewed the Sprint 1 zip you got from another assistant properly this time — read every migration, RPC,
and component against your actual repo, not just the PRD. It was **not safe to push as delivered**. Three
of the four problems below would have broken the build or silently done nothing; I fixed all four in this
combined drop:

1. **Window rules didn't actually work.** `update_window_rules()` wrote the on-time day and late-window
   length to `settings.window.on_time_day` / `settings.window.late_window_months` — but the function that
   actually computes report deadlines, `public.report_window()` (already live in your repo, used by
   `submit_report`, corrections, and admin reports), reads the **top-level** keys `settings.on_time_day` /
   `settings.late_window_months`. An Elder changing this setting would see it save successfully and have
   **zero effect on real deadlines**. Fixed: the migration now writes the top-level keys. Same issue existed
   for the auxiliary-pioneer goal option pair (`auxiliary_pioneer_options` vs. the real key `auxiliary_options`)
   — renamed to match, though see the note below, it has no runtime consumer yet either way.
2. **Three missing/wrong UI imports that would fail to build.** `@/components/ui/switch` doesn't exist in
   your repo at all; `@/components/ui/select` and `@/components/ui/textarea` don't exist as separate files —
   your repo exports `Select` and `Textarea` from `@/components/ui/input`, as a plain native `<select>`, not
   the Radix composable pattern (`SelectTrigger`/`SelectContent`/`SelectItem`) Sprint 1 was written against.
   Fixed: added a small dependency-free `Switch` component matching the Radix `checked`/`onCheckedChange`
   API, and rewrote `general-settings-form.tsx`'s meeting-day picker to the native `Select`.
3. **Nested settings layout double-padded the page.** `src/app/admin/settings/layout.tsx` re-wrapped its
   content in its own `mx-auto max-w-5xl px-4 py-8`, inside the admin shell's own page container — cosmetic
   (extra padding, narrower content), not a crash, but fixed.
4. **The Settings nav item didn't exist anywhere.** My own Phase 3 `admin/layout.tsx` rewrite (done before I'd
   reviewed Sprint 1 file-by-file) didn't know Sprint 1 existed, so it never added a link to `/admin/settings`.
   Fixed: added to both `nav-links.tsx` and `admin/layout.tsx`.

### What I did **not** fix — read this before you rely on Settings

- **None of Sprint 1's components call `useTranslations`/`getTranslations`.** Every label is a hardcoded
  English string in JSX. `messages/en.settings.json` and `sw.settings.json` are real, complete translation
  files — but nothing in the components reads them, so the Kiswahili strings will never actually appear
  on screen, and this violates the PRD's "no hard-coded text" rule (§10.2, §19). This is real work I didn't
  do: wiring ~8 components to `t("...")` calls against the existing JSON keys. I'd rather tell you this
  plainly than quietly ship it as if it were done. The JSON is ready and correctly shaped for when this gets
  wired in.
- **Auxiliary-pioneer goal options are cosmetic today regardless of the key-name fix.**
  `service_arrangements.aux_goal_hours` has a hard `check (in (15, 30))` constraint in the table itself
  (Appendix A). Changing the "auxiliary options" setting doesn't loosen that constraint or get consulted by
  anything — you'd need to either widen the CHECK to read from settings dynamically, or accept that this one
  field in Goal Defaults is display-only until that's done.
- **Reminder schedule settings (SET-05) have no consumer yet.** There's no reminder-enqueue function in your
  repo currently (P2 hasn't built it), so `settings.reminders.*` is written correctly but unread. Not a bug —
  just don't expect changing it to do anything until that feature exists. My own Phase 3 return-visit reminder
  job does NOT read from these settings (it uses fixed times per RV-04); if you want congregation-configurable
  reminder timing generally, that's additional wiring.
- **Sprint 1's server actions (`src/lib/settings/actions.ts`) use their own `{ data, error }` result shape**
  and a hand-rolled `friendlyError()` mapper, instead of your existing `src/lib/actions/rpc.ts`'s `callRpc()` /
  `{ ok, code }` pattern that the rest of the app (and my own Phase 3 code) uses. Both work; I left this one
  alone rather than risk a wider, riskier rewrite of 4 pages and 6 forms under time pressure. Worth aligning
  later for consistency, not urgent.
- **`congregations_member` (existing RLS policy) already lets any authenticated member of the congregation —
  not just Elders — read the full `settings` jsonb directly** (`select * from congregations`). Sprint 1's
  `get_congregation_settings()` RPC comment claims "there is deliberately no RLS policy... for direct client
  reads" — that's inaccurate for your repo as it stands (the policy predates Sprint 1 and Sprint 1 doesn't
  touch it). Not a security hole worth losing sleep over — settings aren't sensitive — but the RPC is
  redundant for reads, and the comment is wrong. Left as-is; harmless.

## Install steps

1. **Copy files.** Merge this zip's `src/`, `supabase/`, `messages/` and `scripts/` folders into your repo,
   diffing the "touched in place" files above before overwriting.
2. **New dependencies** (not in your `package.json` yet):
   ```bash
   npm install recharts@^2.15.0 @react-pdf/renderer@^4.4.0 exceljs@^4.4.0 @zip.js/zip.js@^2.8.0
   ```
   (Sprint 1 needs no new dependencies — its one missing piece, `Switch`, is now included as a plain file.)
3. **Merge translations** (adds only, never overwrites an existing key):
   ```bash
   node scripts/merge-messages.mjs
   ```
   Both `sw.*.json` files are **drafts** — same status as your existing `sw.json` — and need your reviewer's
   sign-off before gate G-6. Sprint 1's Kiswahili additionally needs the component wiring described above
   before it can be shown to anyone at all.
4. **Apply migrations** in filename order (Sprint 1's date-stamp sorts before Phase 3's, so a plain
   `supabase db push` / `npm run db:reset` applies them correctly). All four are additive and safe to re-run.
5. **Regenerate types**: `npm run db:types`.
6. **Brand fonts in PDFs (optional):** `src/lib/exports/pdf/*.tsx` fall back to Helvetica so they render
   correctly out of the box. To match Lexend/Source Sans 3 (§10.3), add their `.ttf` files under
   `public/fonts/` and call `Font.register(...)` at the top of `congregation-report.tsx` and
   `individual-record.tsx`.
7. **Run the test suite**: `npm run verify` plus `npm run test:db` for the pgTAP files under
   `supabase/tests/database/` (`09_sprint1_settings.test.sql` has three `TODO` blocks that need wiring to
   your existing test-impersonation fixtures — the assertions themselves don't need to change).

## Other design notes (Phase 3 specifics, unchanged from the last drop)

- Return visits are owner-only everywhere, no exceptions (D-30/R-11) — `10_return_visits.test.sql` asserts no
  policy on either table ever references a role check.
- RV-04 reminders and window/report reminders share the same 5-minute `pg_cron` tick — no new Edge Function.
- Elder insight charts reuse `admin_month_report`'s rows for by-group; the three new RPCs are thin,
  `security invoker` aggregations with a "view as table" toggle on every chart, nothing ever per-person (D-44).
- Exports run under the Elder's own session, are never written to disk, and each one calls `log_export()`
  before responding (EXP-07). Treat gate **G-8** as unmet until you've actually run the restore drill.
- Deletion approval lives at `/admin/deletions` (the PRD's §8.1 route map predates this feature); linked from
  the Elder rail with a live badge from `admin_queue_counts`.
- `push_subscriptions` and `report_drafts` from PRD Appendix A aren't in your schema yet; `anonymize_member()`
  cleans up everything that exists today — add a line for each table the day it lands.

## Known gaps / follow-ups, in priority order

1. Wire Sprint 1's components to `useTranslations`/`getTranslations` (see above) — this is the biggest real
   gap left in the combined drop.
2. Either read `goals.auxiliary_options` when validating an arrangement request, or drop that half of the
   Goal Defaults page until you do — right now it saves a value nothing consults.
3. PDF brand fonts (cosmetic only, ships correctly with Helvetica today).
4. Extend the pgTAP tests with the authenticated-role scenarios your other `*.test.sql` files already use.
5. `/admin/exports`'s individual-record download takes a raw member UUID; swap in the `command` search
   component (§10.4) once the roster grows past a handful of people.
