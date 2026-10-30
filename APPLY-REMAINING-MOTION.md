# Remaining motion: how to apply

Copy these files over the repo root, keeping paths. No new packages. Apply after the landing, app-motion and exports-fix zips.

```bash
npm run check:i18n && npx tsc --noEmit && npm run build && npm run test:e2e
```

## Try these by hand
1. **Moving around:** tap Home, Log, Report, History: each page rises in softly. In the Elder console pages only fade.
2. **Language:** switch EN / SW (on the landing page and in the signed-in app): the page crossfades once the new language shows.
3. **Return visits (phone):** drag a card left past the line, release: "Log this visit" opens and the card springs back. A short drag springs back with nothing opening. Scrolling up and down still scrolls. The tick button on each card does the same for keyboard users.
4. **Visit tabs:** the gold underline glides between Today / Upcoming / Overdue / All and the list fades in.
5. **Elder overview:** numbers count up once after you sign in; changing the month or a live refresh updates them instantly.
6. **Reports page downloads:** the PDF and Excel buttons show a ring, then a check. If the server cannot make the file you now get a message instead of a blank page.
7. **Empty lists** (no visits, no messages) draw the small door. Open a wrong address (404): the gold door swings open.
8. **Reduced motion on:** all of the above show their finished state at once; swiping still works.

## Not included
Month-picker crossfade (the picker reloads the page, so the page fade covers it), the sticky action bar on the not-reported list, and
download progress on the Exports page (only the Reports page buttons use the new download button so far).
