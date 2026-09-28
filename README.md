# Ministry Report — Sprints 1–7 + the six September change requests

Everything from Sprints 1–7 (congregation settings through deletion & data controls), **plus the six fixes
and features from your screenshots and answered document**. This supersedes the last drop — grab this one
whole rather than layering it on top of the previous zip.

## Your six items, what changed

### 1 & 5 — Untranslated labels, and the "Downloadables" renaming
Fixed properly this time: `src/messages/en.json` and `src/messages/sw.json` are **complete, ready-to-drop-in
files** — every Sprint 1/Phase 3 string is already merged in, and every label you approved in the review
document is applied (Visits → **Return Visits**, Exports → **Downloadables**, Deletions → **Account
Removals**, and all the others from your table). There's no merge script to remember to run this time; just
overwrite the two files.

**One thing to check before you overwrite:** these two files are built from the copy of your repo I have on
file, not a live diff against whatever's in your repo right now. If anyone has hand-edited `en.json` or
`sw.json` since, tell me what changed and I'll re-merge — otherwise, given the bug you hit (raw keys showing
on screen), your live files almost certainly don't have these keys yet either, so this should be a clean
drop-in.

### 2 — "Could not find the table 'public.return_visits'"
You said you paste SQL into the Supabase dashboard's SQL editor by hand, so here's exactly what to do:

1. Open **SQL Editor** in the Supabase dashboard.
2. Paste and run each file under `supabase/migrations/` **in filename order** (the timestamp prefixes already
   sort correctly): the four from Sprints 1–7, in this order —
   `20261003000000_sprint1_congregation_settings.sql`,
   `20261010000000_phase3_return_visits.sql`,
   `20261010000100_phase3_admin_insights.sql`,
   `20261010000200_phase3_exports.sql`,
   `20261010000300_phase3_deletion.sql`.
3. After each one runs without error, either click **Database → Reload schema cache** in the dashboard, or
   run this one line: `NOTIFY pgrst, 'reload schema';`
4. **To check what's already applied without guessing:** run
   `supabase/diagnostics/check_phase3_deployment.sql` in the SQL editor. It's read-only — it just lists every
   new table and function from these five migrations and tells you `present` or `MISSING`, with the exact
   filename to run for anything missing.

### 3 — "Upcoming Return Visits" home card
Built as `src/components/visits/upcoming-visits-card.tsx`. Per your answers: next **7 days**, capped at **4**
rows with a "View all upcoming" link, a small separate "N overdue" link rather than mixing overdue items into
the same list, plain list styling (date/time chip per row, not a calendar grid), and the whole card **hides
itself** when there's nothing upcoming and nothing overdue.

I don't have your actual `src/app/app/page.tsx` (Home) on file, so rather than guess at your layout and risk
overwriting something, this ships as a self-contained component with a one-line drop-in:

```tsx
<UpcomingVisitsCard memberId={member.id} congregationId={member.congregation_id} />
```

Put it where "return visits due today" already sits in your Home layout — after the monthly hours ribbon,
before unread messages, per the original design (§8.4/DSH-01). If you'd rather I place it precisely, send me
that one file and I'll return it wired in exactly, instead of as a snippet.

### 4 — PDF/Excel buttons on the Reports page
Built as `src/components/admin/report-download-buttons.tsx`, reusing the exact same file design and route
handlers as the Downloadables page (no second design to maintain). Per your answers: it always downloads the
**complete official month** for every member — the on-screen Group/Category/Status/search filters in your
screenshot don't affect it — with a small note under the buttons saying so, and it uses the same defaults as
Downloadables (comments off, not-reported list on) rather than exposing those toggles again here. Columns are
exactly what's in your screenshot; Flags stay console-only, not on the record.

Same situation as item 3 — I don't have `src/app/admin/reports/page.tsx` on file, so this is a drop-in
component rather than a guessed full-file rewrite:

```tsx
<ReportDownloadButtons month={month} />
```

Put it next to your existing month picker / "Show month" button. Send me that file if you'd like it wired in
directly rather than as a snippet.

### 6 — Collapsible sidebar, icons-only with hover to expand
New shared pieces: `src/lib/sidebar-collapse.tsx` (the persisted preference) and
`src/components/shell/sidebar-shell.tsx` (the actual collapsible rail), used by both
`src/components/shell/member-shell.tsx` and `src/app/admin/layout.tsx` — same behaviour on both, one shared
preference. Per your answers: starts **expanded** (today's behaviour), your choice is **remembered on that
device** (not synced to your account), applies to **both** the publisher app's rail and the Elder console's
rail, and hovering a collapsed rail **floats it over the page** — nothing else reflows while you're peeking
at a label. A small collapse/expand button sits at the bottom of the rail to pin it either way.

## Everything else (unchanged from the last drop)

Sprints 2–7 — return visits, Elder insights, exports, encrypted backup, deletion & data controls — and the
Sprint 1 fixes (window-rules key-path bug, missing `Switch`/`Select`/`Textarea` imports, nested-layout
double-padding) are all still here. See the "What I found wrong with Sprint 1, and fixed" write-up below;
nothing in it changed this round.

<details>
<summary>Sprint map (click to expand)</summary>

| Sprint | Feature | Key files |
|---|---|---|
| 1 | Congregation settings (SET-01–07) | `supabase/migrations/20261003000000_sprint1_congregation_settings.sql`, `src/lib/settings/**`, `src/app/admin/settings/**`, `src/components/settings/**` |
| 2 | Return visits (RV-01–08) | `supabase/migrations/20261010000000_phase3_return_visits.sql`, `src/lib/offline/{dexie,visits-store}.ts`, `src/lib/domain/visits.ts`, `src/components/visits/*`, `src/app/app/visits/**` |
| 3 | Elder insights (ADM-03/04/05) | `supabase/migrations/20261010000100_phase3_admin_insights.sql`, `src/lib/admin-data.ts`, `src/components/admin/trend-charts.tsx`, `src/app/admin/page.tsx` |
| 4–5 | Exports/Downloadables (EXP-01/02/03/05/06/07) | `supabase/migrations/20261010000200_phase3_exports.sql`, `src/lib/exports/**`, `src/app/api/exports/**`, `src/app/admin/exports/**` |
| 6 | Encrypted backup (EXP-04, gate G-8) | `src/lib/exports/backup.ts`, `src/app/api/exports/backup/route.ts`, `src/components/exports/backup-dialog.tsx` |
| 7 | Deletion & data controls (DEL-01/02/04, PRO-07) | `supabase/migrations/20261010000300_phase3_deletion.sql`, `src/lib/actions/deletion.ts`, `src/app/admin/deletions/**`, `src/app/app/settings/data/**` |

</details>

<details>
<summary>What I found wrong with Sprint 1, and fixed (click to expand — unchanged from last time)</summary>

1. **Window rules didn't actually work.** `update_window_rules()` wrote to `settings.window.on_time_day` /
   `settings.window.late_window_months`, but the live `public.report_window()` reads the top-level
   `settings.on_time_day` / `settings.late_window_months`. Fixed: the migration now writes the top-level keys.
2. **Three missing/wrong UI imports that would fail to build**: `@/components/ui/switch` doesn't exist;
   `@/components/ui/select` and `@/components/ui/textarea` should be `@/components/ui/input`. Fixed: added a
   small dependency-free `Switch`, rewrote the meeting-day picker to your native `Select`.
3. **Nested settings layout double-padded the page.** Fixed.
4. **The Settings nav item didn't exist anywhere** in my own Phase 3 rail. Fixed.

Still not fixed, still worth knowing: none of Sprint 1's components call `useTranslations` — every settings
label is hardcoded English, so `sw.settings.json`'s Kiswahili never actually shows on screen. The translation
files are correct and complete; the components just don't read from them yet. Flagged as the top follow-up.

</details>

## Install steps

1. **Copy files.** Merge this zip's `src/`, `supabase/` folders into your repo. `src/messages/en.json` and
   `sw.json` are full-file replacements (see the note under items 1 & 5 above); everything else under `src/`
   is either new or a full-file replacement of a file I authored in the last drop (`member-shell.tsx`,
   `nav-links.tsx`, `admin/layout.tsx`, `admin/page.tsx`, `admin-data.ts`) — diff before overwriting if you've
   touched any of them since.
2. **New dependencies** (unchanged from last time, still needed for Sprints 3/4–6):
   ```bash
   npm install recharts@^2.15.0 @react-pdf/renderer@^4.4.0 exceljs@^4.4.0 @zip.js/zip.js@^2.8.0
   ```
3. **Apply the SQL** — see item 2 above for the exact SQL-editor steps and the diagnostic query.
4. **Regenerate types**: `npm run db:types`.
5. **Wire in the two drop-in components** (items 3 and 4) — one line each, into your Home page and your
   Reports page respectively; see those sections above.
6. **Run the test suite**: `npm run verify`, plus `npm run test:db` for the pgTAP files under
   `supabase/tests/database/`.

## Known gaps / follow-ups, in priority order

1. Wire Sprint 1's settings components to `useTranslations`/`getTranslations` — the Kiswahili strings exist
   but nothing reads them yet.
2. Send me `src/app/app/page.tsx` and `src/app/admin/reports/page.tsx` and I'll return items 3 and 4 wired in
   directly instead of as drop-in snippets.
3. `goals.auxiliary_options` still has no runtime consumer — `service_arrangements.aux_goal_hours` is
   hard-constrained to 15/30 in the table itself.
4. PDF brand fonts default to Helvetica; add the Lexend/Source Sans 3 `.ttf` files under `public/fonts/` and
   register them in `src/lib/exports/pdf/*.tsx` whenever you're ready to match the brand pair exactly.
5. Extend the pgTAP tests with the authenticated-role scenarios your other `*.test.sql` files already use.
6. Treat gate **G-8** as unmet until you've actually run the restore drill on a real backup file.
