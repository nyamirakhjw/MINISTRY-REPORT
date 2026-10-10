-- Append-only audit trail (D-26). Row triggers capture every change; functions add semantic entries with reasons.
create or replace function private.audit_row() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_row jsonb;
begin
  v_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  insert into public.audit_log (congregation_id, actor_member_id, action, entity_type, entity_id, before, after)
  values ((v_row->>'congregation_id')::uuid,
          (select m.id from public.members m where m.user_id = (select auth.uid()) limit 1),
          tg_table_name || '.' || lower(tg_op), tg_table_name, (v_row->>'id')::uuid,
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return case when tg_op = 'DELETE' then old else new end;
end $$;

create trigger audit_reports      after insert or update or delete on public.reports
  for each row execute function private.audit_row();
create trigger audit_members      after insert or update or delete on public.members
  for each row execute function private.audit_row();
create trigger audit_arrangements after insert or update or delete on public.service_arrangements
  for each row execute function private.audit_row();

create or replace function private.audit_immutable() returns trigger
language plpgsql set search_path = '' as $$
begin raise exception 'audit_log is append-only'; end $$;

create trigger audit_log_no_change before update or delete on public.audit_log
  for each row execute function private.audit_immutable();
