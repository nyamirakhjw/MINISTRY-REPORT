## What changed and why

## Requirement IDs (from docs/PRD.md)

## Definition of done (PRD §18.5)
- [ ] Requirement met; loading, empty, error, offline and success states designed
- [ ] English and Kiswahili strings added (edit `scripts/build-messages.py`, run it)
- [ ] Light and dark checked; keyboard checked
- [ ] Tests written and passing (unit, database rules for any policy or function change, end to end for journeys)
- [ ] Audit entry for any Elder action
- [ ] No console warnings; no TODO, FIXME, XXX or HACK left in code
- [ ] Documented in the runbook if it needs Elder action

## Security check
- [ ] No new table without RLS and an explicit grant
- [ ] No service-role key or server-only import in client code
- [ ] Any new database function has a stable error code and a pgTAP test
