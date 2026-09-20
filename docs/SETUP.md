# Setup

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
