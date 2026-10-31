# Unslop pass: apply notes

Made with the unslop skill by Damir Sokolovsky (@heydamir), CC BY 4.0.
Baseline: `MINISTRY-REPORT-main` v0.3.2 (landing redesign and app motion already in).

## Apply (pick one)

1. Copy: `cp -r unslop-changes/files/* <repo>/` (same paths, 12 files), or
2. Patch: from the repo root, `patch -p1 < unslop-changes/unslop.patch` (or `git apply unslop-changes/unslop.patch`).

Then run `npm run verify`. I could not run it (no `node_modules`, no network here), so nothing below has been built or rendered.

Add to `CHANGELOG.md`:

```
## Unreleased: unslop pass
- Landing copy: headline and short labels no longer end in a full stop (English and Kiswahili).
- Landing: "Sample numbers" is quiet text, not a pill; the scroll drift on the hero wave is gone; scroll reveals stay only on the demo and the three steps.
- Spacing snapped to the 4px grid; nested radii corrected in the step pictures and the ribbon demo track.
- "Private by design" icons are 20px, 1.5 stroke, muted, in one column.
- New tokens `--on-accent` (text-on-accent) and `--float-shadow` (shadow-float). Dialog, sticky action bar and collapsed rail use one soft neutral shadow instead of shadow-lg, shadow-xl and shadow-2xl.
- 18px icons in settings are now size-5 (20px) like the rest of the app.
```

## What changed, by pass

| Pass | Change | Files |
|---|---|---|
| Spacing | Off-grid values (14, 18, 10 px) moved to 12, 16, 20; step pictures and fact rows share one padding | `landing.css` |
| Color | Raw `#0B2E6B` in the gold badge replaced with the `on-accent` token | `badge.tsx`, `globals.css` |
| Icons | Facts icons 20px, stroke 1.5, muted text role; settings icons 18px to 20px | `private-by-design.tsx`, `landing.css`, `settings-nav.tsx`, `groups-manager.tsx` |
| Copy | Trailing full stops removed from the headline, three step lines and one fact (both languages) | `en.json`, `sw.json` |
| Details | Sample pill becomes a muted line; meeting labels use muted color instead of bold; nested radii: ribbon track and mini pictures 4px inside 10px panels | `landing.tsx`, `landing.css` |
| Depth | One neutral float shadow, softer in light and a plain dark one in dark mode | `globals.css`, `dialog.tsx`, `not-reported-list.tsx`, `sidebar-shell.tsx` |
| Motion | Hero wave scroll drift removed; reveals kept only on the demo and steps (PRD v1.0 rule 7 says no fade-ups on every section) | `landing.css`, `landing.tsx`, `private-by-design.tsx` |
| Misc | `max-w-[150px]` to `max-w-40` | `app/app/log/page.tsx` |

## Check by eye after applying

- `/` and `/sw` at 320, 375, 768 and 1280 px, light and dark. The step pictures and fact rows moved by 2 to 4 px.
- Dark mode: `shadow-float` on the dialog should read as a hairline plus a soft dark shadow.
- Kiswahili strings are still drafts (gate G-6); only the full stops changed.

## Not changed on purpose (suggestions)

1. **Hero has no product moment.** It shows the logo on a plate, and the real ribbon sits one scroll below inside a full navy band. Suggestion: show the ribbon demo panel in the hero beside the headline, and let the band become a plain surface. That is a layout change, so it needs your yes.
2. **Gold appears in six places on the landing** (door, threshold, wave line, tagline, step line, ribbon tip, section rule). The door should be the one bright thing. Suggestion: tagline in the normal text color, keep the rest.
3. **Charts in dark mode.** `lib/chart-colors.ts` uses `#0B2E6B` for the regular-pioneer series and the trend line; that is almost invisible on the dark surface `#111B2E`. Needs a dark value (read the theme in the chart component).
4. **Short UI strings with full stops** (hints, errors, empty states: about 150 in `en.json`). Left alone because tests and the Kiswahili catalogue must change with them.
5. **Door glow** is a gold-to-clear gradient. It is the approved brand signature (PRD v1.1), so I kept it.
