# Landing redesign: how to apply

This zip holds only the files that changed or are new, in the same folders as the repo. Copy them over the repo root
(`MINISTRY-REPORT-main/`), keeping the paths. Nothing was installed or built here, so run these before pushing:

```bash
npm run check:i18n        # new landing.* keys exist in en.json and sw.json
npx tsc --noEmit          # the repo has ignoreBuildErrors on, so check types yourself
npm run build             # then look at the route table: "/" should stay under the bundle budget
npm run check:bundles
npm run test:e2e          # includes e2e/landing.spec.ts
```

## What changed
New: `src/components/landing/*` (hero, ribbon-demo, steps, private-by-design, reveal-observer, landing.css),
`src/lib/motion.ts`, `public/brand/mark-128.webp`, `public/brand/mark-394.webp`, `e2e/landing.spec.ts`.
Edited: `globals.css`, `landing.tsx`, `emblem.tsx`, `public-chrome.tsx`, `theme.tsx`, `button.tsx`, `proxy.ts`,
`lib/congregation.ts`, `lib/settings/actions.ts`, `messages/en.json`, `messages/sw.json`, `public/service-worker.js`,
`docs/DECISIONS.md`, `CHANGELOG.md`.

## Things to check first
1. `lib/congregation.ts` uses `unstable_cache`, and `settings/actions.ts` uses `updateTag` (Next 16, server actions only).
   If your installed Next version rejects either, tell me the error and I will adjust.
