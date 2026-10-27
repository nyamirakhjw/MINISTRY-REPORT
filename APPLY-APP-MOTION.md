# Signed-in app motion: how to apply

Copy these files over the repo root, keeping paths. This slice builds on the landing slice (it uses the tokens and
`lib/motion.ts` from it), so apply the landing zip first if you have not already. No new packages are needed.

```bash
npm run check:i18n && npx tsc --noEmit && npm run build && npm run test:e2e
```

## Try these by hand (they need a signed-in account)
1. **Home / Log:** add time; the ribbon fill springs, numbers count up, ticks pulse. Reach the goal: the check draws once.
2. **Report as a publisher:** tap Yes, then No: the fill slides and studies/comment fold away. Write 51 words, pick No, review: it must submit.
3. **Submit a report:** the check draws, text rises in turn, the report card appears. Download it; on a phone, Share should show too.
4. **History:** every submitted report has a "Report card" link.
5. **Elder console, two devices:** submit a report on one; the row on the other gets a gold wash that fades in about a second. Same for new access requests and corrections, and the tab badge pops.
6. **Settings > accessibility > reduce motion:** nothing travels; state changes are instant, all text still updates.

## Known limits
- The card's photo comes from a signed link, so offline it falls back to initials until the image is cached by the browser.
- Card fonts are read from the page's own font variables (`--font-lexend`, `--font-source-sans`). If those names differ in `layout.tsx`, the card uses the system font; tell me and I will adjust.
- Not done in this slice: route-to-route page transitions, swipe-to-mark-visited, KPI count-up.
