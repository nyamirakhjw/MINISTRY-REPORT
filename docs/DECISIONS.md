# Decisions and deviations

| # | Decision | Reason |
|---|---|---|
| ADR-1 | **Hand-written service worker** (`public/service-worker.js`) instead of Serwist | Keeps the PWA skeleton independent of a bundler plugin that could not be tested here. It caches only static assets and an offline page and never touches personal data. Revisit in Phase 2 when the offline queue needs precache manifests |
| ADR-2 | **No TanStack Table**; small sort and filter logic in the reports table | At a few hundred rows it is simpler and lighter. Revisit if tables grow |
| ADR-3 | **Native `<select>`** styled with tokens | Best keyboard and screen-reader behaviour on Android, no extra JavaScript |
| ADR-4 | **Brevo HTTP API** for the app's own emails (Edge Function); Supabase Auth still uses SMTP | `fetch` is the most reliable transport in the Edge runtime. Same Brevo account. Swap the `sendEmail` function to change provider |
| ADR-5 | **Server actions and server components** call the database under the user's session; the browser talks to Supabase only for Storage uploads and Realtime | Smaller client bundle, one place for error mapping. RLS still applies |
| ADR-6 | **Realtime is a signal to refetch** (`useLiveRefresh`), never the source of truth | PRD §14.5. The app works if Realtime is down |
| ADR-7 | **Elder console**: top tab strip below 768px, left rail from 768px | Matches the PRD navigation intent with one shared item list |
| ADR-8 | **Delivered early** (small, no extra infrastructure): overview KPIs and category totals (ADM-01, 02), WhatsApp click-to-chat (part of ADM-07), audit-log search | They reuse data the Phase 1 screens already load |
| ADR-9 | **Hardening fixes to Appendix A SQL**: request id must belong to the caller; Ministerial Servants can read pending photos in Storage; explicit `hours_required`; deny-by-default grant sweep; `not_reported` months can be reversed by submitting on behalf | Found while turning the reference schema into migrations |
| ADR-10 | **`recovery_codes` and `profile_change_requests` tables added** | Required by AUTH-09 (hashed recovery codes) and PRO-04 (name and username change requests); not in the PRD data model |
| ADR-11 | **Kiswahili gated by `NEXT_PUBLIC_ENABLE_SW`** | Gate G-6: nothing in draft Kiswahili reaches members |
| ADR-12 | **Landing meeting times and address come from settings and are hidden until real values exist** | PRD rule: no invented content |
| ADR-13 | **First launch runs without custom SMTP**, with "Confirm email" turned off in Supabase | The Owner chose speed over gate G-1 for the initial go-live, with a single Elder. `requestAccessAction`/`RequestAccessForm` handle both cases (email confirmation on or off) so this is a config toggle, not a code fork. Traded away: self-service password reset (replaced by the Elder recovery link, which needs no email) and email delivery of approval/rejection notices (in-app notification still fires). Revisit before congregation-wide launch — gate G-1 still applies before real volume |
