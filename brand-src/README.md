# Brand source files

## Current mark (2026-10)

`logo-full-lockup.png` — the full logo as supplied (globe, house, door-to-door ministers, "NYAMIRA CONGREGATION
/ MONTHLY MINISTRY REPORTS"), background removed. Keep this as the master; regenerate everything else from it if
the artwork ever changes.

`mark-only.png` — just the pictorial mark (globe + house + ministers), cropped above the gold horizon line,
transparent background. This is what every icon, favicon, header logo and OG image is actually built from — the
full lockup's baked-in English text doesn't survive small sizes and can't follow the Kiswahili toggle or dark
mode, so the congregation name stays live, translatable text in the `Logo` component instead (see
`src/components/brand/emblem.tsx`).

Regenerated from `mark-only.png`: `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`,
`apple-touch-icon.png`, `badge-96.png` (a navy-linework silhouette, not a crop — notification badges need a
simple monochrome glyph, not a full-colour illustration), `src/app/favicon.ico` and `src/app/icon.png`, and the
small base64 copy embedded in `src/lib/og.tsx` for the Open Graph image (the Satori renderer behind `next/og`
needs real image data, not a relative URL).

**Known tradeoff:** at 16px (browser tab favicon) a detailed illustration like this reads as a blurred blob —
that's inherent to using a photographic/illustrated mark instead of flat geometry, not a bug. 32px and larger are
legible.

## Retired

`shield.svg` — the original hand-drawn shield-and-monogram emblem (v0.1.0–0.2.x). Kept for reference; nothing
references it anymore.

## Before this goes to the whole congregation

Per the PRD (R-12, gate G-5), a logo change like this should still get sign-off from the body of elders before
congregation-wide launch — the same gate that applied to the original emblem.
