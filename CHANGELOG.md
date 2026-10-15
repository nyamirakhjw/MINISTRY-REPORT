# Changelog

## 0.3.1

- Renamed the congregation from "Nyamira Kingdom Hall of Jehovah's Witnesses" to "Nyamira Congregation of
  Jehovah's Witnesses" everywhere it's sourced from code: the dev seed (`supabase/seed.sql`), the landing page's
  fallback name (shown only if the database fetch fails), and a settings-form placeholder example. Also renamed
  the header's short subtitle label from `common.kingdomHallShort` ("Nyamira Kingdom Hall") to
  `common.congregationShort` ("Nyamira Congregation") — the key name was stale otherwise.
- **The actual live site needs a database update, not just a code deploy** — `congregations.name` is the one
  column both the landing page and every PDF/Excel export letterhead read from, and it was seeded once, not
  re-read from `seed.sql` on every deploy. Added `supabase/scripts/rename-congregation.sql` to run in the SQL
  editor; there's no Settings UI field for this (general settings covers tagline and letterhead address lines,
  not the core name).
- Left `docs/PRD.md` untouched — it's the original source requirements document, not live configuration.

## 0.3.0

- **New congregation logo.** Replaced the original hand-drawn shield-and-monogram emblem with the supplied
  illustration (globe, house, door-to-door ministers, "NYAMIRA CONGREGATION"). See `brand-src/README.md` for
  exactly how every size was derived and why the congregation name stays live text rather than baked into the
  image. Per the PRD (gate G-5), this should still get the body of elders' sign-off before it's in front of the
  whole congregation, the same as the original emblem needed.
- Replaced every icon derived from the old emblem: favicon, `src/app/icon.png`, the PWA manifest icons (192, 512,
  maskable), the Apple touch icon, the notification badge, and the Open Graph/Twitter share image.
- Fixed a broken prior patch: `Emblem`, `Logo` and `BrandWave` had all been collapsed into one raw `<img>` tag
  (likely a quick fix to get a build passing), which silently deleted the congregation name text from every
  header and replaced the landing page's decorative wave banner with a tiny duplicate logo image. Rebuilt all
  three as distinct components again. `public/icons/icon.svg` was also a PNG wearing an `.svg` extension
  (unopenable) and `src/app/favicon.ico` was missing entirely; both replaced with real files.
- Fixed: `log.syncError` was referenced by `log-client.tsx` but didn't exist in either message catalogue —
  this was unfinished work of mine from an earlier session that evidently never fully landed. Added directly to
  the compiled `src/messages/*.json` rather than regenerating from `build-messages.py`, since that script would
  have overwritten the Sprint 1 and Phase 3 message fragments merged in since. `build-messages.py` is no longer
  the sole source of truth for the catalogues — see the note added at its "log" section.
- Also caught `src/app/apple-icon.png` — a second, separate Apple-touch-icon file Next.js auto-detects by its
  location, independent of the one `layout.tsx` references explicitly — still carrying the old emblem. Replaced
  it too, so there's no longer a stale icon competing with the new one.
- Also found and fixed while verifying (unrelated to the logo, pre-existing): three other missing keys
  (`admin.close`, `exports.close`, `settings.close`/`settings.processing`) on dialogs that clearly meant to reuse
  the common "Close"/"Processing" wording. Left one harmless false-positive alone: the i18n checker flags a
  `_note` metadata key in `sw.json` (Kiswahili review-status tracking for gate G-6) as an en/sw parity mismatch —
  it's intentional, not a translation gap.

## 0.2.2

- Fixed: the hours ribbon (DSH-01) was built for the Log page but never actually added to Home, despite the PRD
  requiring it there and my own traceability doc incorrectly marking it done. Home now shows the monthly ribbon
  for pioneers, with a link into the Log page to add hours.

## 0.2.1

- Fixed: the Elder console had no visible link to `/platform`, so the Platform Owner's own account had to type the
  URL from memory to grant or remove the Elder role. Added a "Platform" link (desktop sidebar and phone header),
  shown only when the signed-in account is actually the Platform Owner.

## 0.2.0

- **Daily log** (LOG-01 to 08, PRO-06): quick-add hours that works fully offline via IndexedDB (Dexie), the hours
  ribbon (monthly and service-year, with a 12-month mini chart), personal goal override, leftover-minute carry-over.
- **Corrections flow** (COR-01 to 03, 06): publishers request a correction on a locked report; Elders approve
  (reopens it for resubmission, no extra deadline), edit it directly, or decline with a reason. Elder console gains
  a Corrections queue and a "corrected" flag alongside the existing zero-hours and self-edited flags.
- The report form now pre-fills pioneer hours from the daily log.
- Two migrations, two new pgTAP test files, one tightened structure test (the private-tracker-tables guard now
  checks for an `is_elder()` reference specifically, not "zero policies", since daily_log_entries has an owner-only
  policy).

## 0.1.0

- Phase 0 (foundations) and Phase 1 (core): accounts, approvals, two-factor, the monthly report form and its window
  and order rules, the Elder console (overview, reports table, not-reported list, arrangements, members, audit log),
  the public site, and the full Supabase/Next.js/CI scaffold. See `docs/TRACEABILITY.md` for the full requirement map.
