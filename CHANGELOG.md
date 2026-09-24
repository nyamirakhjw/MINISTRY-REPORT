# Changelog

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
