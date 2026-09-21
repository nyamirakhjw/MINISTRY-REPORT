# Setup

## Fast path: launch now, add email later

If you're skipping custom SMTP (Brevo) for the first launch, do this instead of the "Custom SMTP" bullet in step 1 below:

1. In the Supabase dashboard: **Authentication → Providers → Email**, turn **Confirm email** off. Sign-up now signs the person in immediately instead of waiting for a click-through link; the app already handles this (it sends them straight to the photo step).
2. Skip the Vault secrets in step 5 and the Edge Function secrets `BREVO_API_KEY`, `MAIL_FROM_EMAIL`, `MAIL_FROM_NAME` in step 6. `dispatch-notifications` doesn't need to be deployed at all yet — the cron job checks for those secrets before doing anything and silently does nothing without them, so there's no error to chase. You can leave that function undeployed and add it later.
3. Still deploy `issue-recovery-codes`, `use-recovery-code`, `create-recovery-link` — these use Supabase's own admin API, not email, and two-factor enrolment (mandatory for Elders) depends on the first one.
4. Know what this trades away, and who it affects:
   - **Self-service password reset is broken** for everyone, because it also depends on Supabase's built-in email (same limits as R-01: a couple of messages an hour, team members only). The **Elder-generated one-time recovery link** (`create-recovery-link`) already works without any email provider — it's a string you copy and hand over in person or by WhatsApp — so this is your password-reset path for now. Tell people to ask you rather than use "Forgot your password?".
   - **Approval and rejection notifications queue but never send.** The in-app message still appears (Notifications, and the pending page updates live if they still have it open), but if someone closes the tab they won't get an email nudge. Tell them directly (in person, WhatsApp) when you've approved them, at least until email is on.
   - Every one of those queued notification rows stays `pending` in the database indefinitely. That's harmless at this scale, but before you eventually turn Brevo on, run this once so people don't get emailed about months-old events:
     ```sql
     delete from notification_deliveries where status = 'pending' and send_after < now() - interval '7 days';
     ```
5. Skip the second-Elder requirement for the first launch if you need to. It's a real risk (R-10: if the Owner's device and recovery codes are both lost, nobody can recover the account), not a hard blocker. Add a second Elder as soon as you reasonably can — it's just a role grant plus that person enrolling their own 2FA, no re-deployment needed.

Everything else below still applies as written.

## 1. Supabase (development and production are separate projects)

1. Create the project. **Record its region** (OI-09): it cannot be moved later without migrating data.
2. Link and apply migrations: `supabase link --project-ref <ref>` then `supabase db push`.
3. **Auth settings**
   - Email confirmation: on. Open sign-up: on (approval is enforced by the database).
   - Minimum password length: 10.
   - Multi-factor: TOTP enabled.
   - Site URL and redirect URLs: your `NEXT_PUBLIC_SITE_URL` and `/auth/confirm`.
   - **Custom SMTP (gate G-1).** Supabase's built-in email only reaches your own team members and is limited to a couple of messages an hour. Configure Brevo (free plan) SMTP, then send a test sign-up to an outside address.
   - Paste the two templates from `supabase/templates/` (confirmation and recovery).
4. **Extensions**: enable `pg_cron`, `pg_net` (the migration does this where allowed) and confirm `supabase_vault` exists.
5. **Vault secrets** (SQL editor, once per environment):
   ```sql
   select vault.create_secret('https://<project-ref>.supabase.co/functions/v1', 'functions_base_url');
   select vault.create_secret('<random 32+ chars, same as DISPATCH_SECRET>', 'dispatch_secret');
   ```
6. **Edge Functions**
   ```bash
   supabase secrets set --env-file supabase/functions/.env
   supabase functions deploy dispatch-notifications use-recovery-code issue-recovery-codes create-recovery-link
   ```
   Secrets: `DISPATCH_SECRET`, `RECOVERY_PEPPER`, `RATE_LIMIT_SALT`, `SITE_URL`, `BREVO_API_KEY`, `MAIL_FROM_EMAIL`, `MAIL_FROM_NAME`.
7. Seed the congregation and groups (`supabase/seed.sql` for development; for production run the same two inserts in the SQL editor).
8. **Landing details**: edit and run `supabase/scripts/set-landing-details.sql` with the real meeting times and address. Do not invent values.

## 2. Bootstrap the first Elder (once per environment)

Nobody can approve the first account, so: sign up normally, confirm the email, then run `supabase/scripts/bootstrap-owner.sql` (edit the email at the top). Sign out, sign in, and enrol two-factor. **Store the ten recovery codes offline, with a second Elder** (risk R-10).

## 3. Vercel

- Import the repository. Production branch `main`. Enable deployment protection for previews.
- Environment variables: see `.env.example`. `SUPABASE_SERVICE_ROLE_KEY` and `RATE_LIMIT_SALT` are server-only. Never prefix them with `NEXT_PUBLIC_`.
- Keep `NEXT_PUBLIC_ALLOW_INDEXING=false` until the custom domain is attached (gate G-3). Keep `NEXT_PUBLIC_ENABLE_SW=false` until the Kiswahili reviewer approves every string (gate G-6).
- Choose the Vercel region closest to the Supabase region.

## 4. Before the congregation-wide launch

Supabase Pro (no pausing, daily backups), custom domain with `SITE_URL` updated, adviser review of `src/content/legal.ts`, emblem approved by the body of elders, Kiswahili approved, pre-launch checklist at 100 percent, restore drill done.
