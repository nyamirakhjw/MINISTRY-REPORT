# Animation-master pass: how to apply

Copy these files over the repo root, keeping paths. No new packages.

```bash
npm run check:i18n && npx tsc --noEmit && npm run build && npm run test:e2e
python3 audit_motion.py src   # expect 0 errors, 1 warning (floating nav, accepted)
```

Try by hand:
1. **Checkboxes** (Not reported list): tick pops in.
2. **Sign in with a wrong password / submit a form with errors:** the message and summary ease in.
3. **Auth pages:** title, lead and form rise in turn.
4. **Log:** add time, the new row eases in; delete a row, it fades out first. Turn off the network mid-delete: the row returns.
5. **Home status card:** reopen a report from another device; the card cross-fades.
6. **Install card (Home):** Dismiss folds it away with no leftover gap.
7. **Reduced motion on:** none of the above travels; text still updates.

Not run: this environment has no `node_modules`, so the build, type check and e2e tests have not been run on these changes.
