# How we keep this build professional

## 1. What was verified, and what was not

This codebase was written in an environment with **no network access**, so packages could not be installed and the app could not be compiled or run against a database. Be clear-eyed about that.

**Verified here**

| Check | Result |
|---|---|
| Domain logic unit tests (windows incl. the PRD worked example and exact 23:59:59 / 00:00:00 boundaries, service year, words, passwords, usernames, totals) | 20 of 20 pass |
| TypeScript syntax, every source and Edge Function file | 0 errors |
| Best-effort semantic type check (without React or Next types installed) | No undefined names, wrong argument counts or bad property access in our code. Remaining errors were all caused by the missing `@types/*` packages |
| i18n: 521 keys, English and Kiswahili parity, 443 static key usages resolve | 0 problems |
| Every database error code the functions raise has a translated message | Yes |
| Service worker syntax | OK |
| Generated icons and emblem rendering | Checked visually |

**Not verified yet (your first hour of work)**

| Not run | Why it matters | How to run |
|---|---|---|
| `npm install` and `next build` | Version pins were chosen from the design-system data and may need a bump | `npm install && npm run build` |
| `supabase db reset` | The SQL was reviewed line by line but never executed | `npm run db:start && npm run db:reset` |
| `supabase test db` | Written, never executed. A failing test may be a test mistake or a real bug | `npm run test:db` |
| Playwright and axe | Written, never executed | `npm run test:e2e` |
| Edge Functions in Deno | Written, never executed | `npm run fn:serve` |

Expect a short fix-up round. That is normal, and the checks above are what make it fast. **Do not deploy before `npm run verify`, `npm run test:db` and `npm run test:e2e` are all green.**

### Things most likely to need a small fix on first run

1. Next.js 16 renames `middleware.ts` to `proxy.ts`. This repo uses `src/proxy.ts`. If your installed Next version disagrees, rename it and its export.
2. `pg_cron` may need `create extension ... with schema pg_catalog` (used) or the dashboard toggle first on hosted projects.
3. pgTAP tests insert straight into `auth.users`; a newer GoTrue schema may require extra NOT NULL columns.
4. `@hookform/resolvers` with Zod 4: if a type error appears, upgrade both together.
5. `next-intl` v4 plugin path detection: `src/i18n/request.ts` is the expected location.

## 2. The professional-build method

**Gates, not dates** (PRD §17). Nothing moves to the next gate until the previous is green.

| Gate | Condition |
|---|---|
| G-0 (now) | `npm run verify`, `npm run test:db`, `npm run test:e2e` all green on a clean clone |
| G-1 | Custom SMTP delivers a sign-up email to an outside address (Brevo). Supabase's built-in email cannot reach publishers |
| G-2 | Access-rule tests green; second factor enforced in policies; service key absent from browser bundles |
| G-3 to G-9 | As in PRD §17.3 (domain, Pro plan, adviser review, Kiswahili approval, checklist, restore drill, acceptance) |

**Rules that make the code trustworthy**

1. **The database decides.** Windows, order, locking, roles and second-factor checks live in SQL functions and policies. The browser can be modified by anyone; the database cannot be talked around.
2. **Deny by default.** Every table has row-level security; browser roles start with no table privileges and receive only `SELECT` where a policy exists. All writes go through named functions with stable error codes.
3. **Private means private.** No policy lets Elders read a person's log, drafts or return visits (those tables arrive in Phase 2 and stay owner-only; `00_structure.test.sql` already guards this).
4. **Every Elder action is audited** with who, when, before and after, and a reason. The audit table cannot be updated or deleted, even by the service role.
5. **One source for strings.** Both languages come from one table, so they cannot drift.
6. **Tokens, not colours.** Components use semantic design tokens. Light and dark are separate designed themes.
7. **Small, reviewable pull requests** with the template in `.github/`, required CI checks, and a protected `main`.

## 3. Working agreement for the next phases

| Step | What to do |
|---|---|
| 1 | Turn on branch protection for `main`: require the three CI jobs, require one review, block force pushes |
| 2 | Create two Supabase projects (development and production). Never test on production |
| 3 | Add Vercel project; preview deployments use the development project; protect previews |
| 4 | Do the manual setup in `SETUP.md` (SMTP, bootstrap owner, secrets) |
| 5 | Run the pilot with about five Elders and Ministerial Servants against real but low-risk use |
| 6 | Build Phase 2 in vertical slices, each with its pgTAP tests and e2e journey |
| 7 | Hold a restore drill before launch: backups you have never restored are not backups |

## 4. Decisions only you can make

See PRD §21 (OI-01 to OI-13). The ones that block work soonest: **OI-03** email provider, **OI-04** first live month, **OI-09** second Elder as recovery co-owner, **OI-13** meeting times and address for the landing page.

## 5. Deliberate deviations from the PRD

Recorded in `DECISIONS.md`: hand-written service worker instead of Serwist, no TanStack Table, native `<select>`, Brevo HTTP API for the app's own emails, top tab strip below 768px for the Elder console, a few Phase 2 and 3 items delivered early.
