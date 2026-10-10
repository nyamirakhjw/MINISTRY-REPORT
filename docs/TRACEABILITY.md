# Requirement traceability (PRD v1.0)

| Requirement | Status | Notes |
|---|---|---|
| AUTH-01 Request access (two steps) | Built | Photo step is on `/pending`, after email confirmation, as the PRD specifies |
| AUTH-02, 03 Username and password rules | Built | Enforced in the form, the server and the database trigger |
| AUTH-04, 05 Username or email sign-in, throttling | Built | Server action; identical errors; hashed identifiers |
| AUTH-06, 07 Email confirmation, password reset, Elder recovery link | Built | Needs SMTP (gate G-1) |
| AUTH-08 Pending accounts see only the waiting screens | Built | Enforced by policies and route guards |
| AUTH-09 Two-factor and recovery codes | Built | TOTP, ten hashed single-use codes, Edge Functions |
| AUTH-10 Sign-out wipes local data | Phase 2 | Nothing is stored locally yet |
| APR-01 to 06 Approvals | Built | Live queue, approve, reject, ask for new photo, audited |
| PRO-01 to 03 Photo, crop, private storage | Built | Cropper with slider and arrow buttons, 512 px, 120 KB, signed URLs |
| PRO-04 Name and username change requests | Built | Elder decision in Approvals |
| PRO-05 Arrangements | Built | Request, approve, decline, end. Elder direct-create function exists; no screen yet |
| PRO-06 Personal goal | Built | `member_goals` read by `my_month_goal`; a settings screen to edit it is still pending (with SET-*) |
| PRO-07 Data controls | Phase 3 |  |
| REP-01 to 06 Report form and confirmation | Built | Card button arrives with Phase 2 |
| REP-07, 08 Drafts, offline submit | Phase 2 |  |
| REP-09, 10, 11 Rules in the database, idempotency, zero hours | Built |  |
| LOG-01 to 08 Daily log, hours ribbon | Built | Offline add via IndexedDB (Dexie); edit/delete need a connection (documented simplification, ADR-14) |
| DSH-01 (status), 02, 05, 06 Home and history | Built |  |
| DSH-01 (rest, hours ribbon), 04 (this month's mini chart) | Built | Fixed in 0.2.2: the ribbon existed on `/app/log` but was missing from Home itself until then. Service-year totals card and sync-status text (DSH-03, 07) still pending |
| COR-01 to 03, 06 Correction flow | Built | Publisher requests, Elder approves (reopens) / edits directly / declines, publisher resubmits with no extra deadline; flags for zero-hours, self-edited and corrected-after-submission |
| COR-04, 05 Submit on behalf, close month | Built | Reversible by submitting on behalf |
| CARD-01 to 06 Report card | Phase 2 |  |
| RV-01 to 08 Return visits | Phase 3 | Owner-only by design |
| ADM-01, 02 Overview and category totals | Built (early) |  |
| ADM-03 By group | Phase 3 | Group filter is in the reports table |
| ADM-04, 05 Infographics, comparisons | Phase 3 |  |
| ADM-06 Reports table | Built | Filters, search, sort, drawer |
| ADM-07 Not reported list | Partial | List, WhatsApp, on behalf, close month. In-app and push reminders are Phase 2 |
| ADM-08, 09, 10 Members, queues, audit log | Built | Corrections queue arrives with Phase 2 |
| ADM-11 Settings screen | Phase 3 | Landing details via SQL script for now |
| ADM-12 Live console | Built | Refetch on change |
| EXP-01 to 07 Exports and backup | Phase 3 | Interim manual backup in the runbook |
| PUB-01 to 04 Landing, legal, discovery, indexing rules | Built | Legal text is a draft for adviser review (G-5) |
| DEL-03 Mark inactive | Built | DEL-01, 02, 04 deletion workflow is Phase 3 |
| SET-01 to 07 Settings | Phase 3 |  |
| Notifications: in-app and email | Built | Push and scheduled reminders are Phase 2 |
| Pre-launch checklist automation | Built | content, i18n, bundle and source-map checks, ESLint TODO rule, e2e title and console checks |
