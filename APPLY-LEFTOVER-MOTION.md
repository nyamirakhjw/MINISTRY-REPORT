# Leftover motion: how to apply

Copy these files over the repo root, keeping paths. No new packages.

```bash
npm run check:i18n && npx tsc --noEmit && npm run build
```

Try by hand:
1. **Month picker** (Overview, Reports, Not reported): pick a month; the page does not reload and the content fades. The button still works.
2. **Not reported:** tick two people; a bar slides up from the bottom with "2 people selected". Press "Message next on WhatsApp": a chat opens and that person shows "Opened"; press again for the next. "Clear" slides the bar away. People with no phone are counted in the message "none of them has a phone number" if nobody selected has one.
3. **Exports page:** every button shows a ring, then a check. If the server cannot make the file, a message says so.
4. **Backup:** the button shows a ring while preparing.
5. **Photo (Settings, or a pending account):** pick a photo; it fades in; arrow buttons ease the photo; dragging and the zoom slider follow instantly; Save shows a ring.

Not offered on purpose: "Remind selected" by push or email. It needs the notification engine (not built yet).
