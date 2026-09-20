# Runbook

## Common fixes for Elders

| Situation | Action |
|---|---|
| Someone cannot receive email | Members, then **One-time recovery link**. Hand it over in person |
| Someone lost their phone (Elder or Ministerial Servant) | They use **Lost your device?** with a recovery code. If both are lost, the Platform Owner removes the factor after confirming identity in person |
| A month is stuck ("can no longer be sent by you") | Reports, open the person, **Submit for them** or **Close month** |
| Someone has no phone or email | Members, **Add a member without a phone**, then submit for them each month |
| A report is wrong | **Known gap in this release.** The correction flow is Phase 2, and submit-on-behalf deliberately cannot overwrite a submitted report. Until Phase 2 the Owner can fix a single row in the Supabase SQL editor; the audit trigger records the change. Do not pilot at scale before Phase 2 corrections exist, or accept this manual step |

## Backups (free plan has none, risk R-03)

Until Supabase Pro is on, a manual backup is mandatory monthly, right after the 10th. The in-app encrypted export arrives in Phase 3; until then:

```bash
supabase db dump --linked --data-only -f backup-$(date +%Y-%m).sql
gpg --symmetric --cipher-algo AES256 backup-$(date +%Y-%m).sql && shred -u backup-$(date +%Y-%m).sql
```

Store the encrypted file with two Elders on separate devices. **Test a restore into the development project before launch and every quarter.**

## Incident note template

What happened, when, who was affected, what was done, what changes. Notify the congregation body and, if required, the regulator (confirm the legal time limits with the adviser).

## Monthly health review

Failed email deliveries (`notification_deliveries` where `status = 'failed'`), Supabase and Vercel error logs, dependency alerts.
