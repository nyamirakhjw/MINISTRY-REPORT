# Changelog

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
