"use client";
import * as React from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Field } from "@/components/forms/field";
import { createManagedProfileAction, setRoleAction, setStatusAction, updateMemberAction } from "@/lib/actions/admin";
import { createRecoveryLinkAction } from "@/lib/actions/auth";
import { FormDialog } from "./form-dialog";

export function ManagedProfileDialog({ groups }: { groups: { id: string; name: string }[] }) {
  const t = useTranslations("admin");
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [group, setGroup] = React.useState(groups[0]?.id ?? "");
  return (
    <FormDialog trigger={t("addManaged")} triggerVariant="primary" triggerSize="md" title={t("managedTitle")} description={t("managedDescription")} submitLabel={t("managedSubmit")} successLabel={t("managedDone")} valid={name.trim().length >= 2 && !!group}
      onSubmit={() => createManagedProfileAction({ full_name: name.trim(), group_id: group, phone: phone.trim() || undefined })}>
      <Field id="mp-name" label={t("officialName")}><Input id="mp-name" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field id="mp-phone" label={t("phone")} optional optionalLabel={t("optional")}><Input id="mp-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
      <Field id="mp-group" label={t("group")}><Select id="mp-group" value={group} onChange={(e) => setGroup(e.target.value)}>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</Select></Field>
    </FormDialog>
  );
}

export interface MemberLite { id: string; full_name: string; group_id: string | null; role: string; status: string; is_managed: boolean; email: string | null }

export function EditMemberDialog({ m, groups }: { m: MemberLite; groups: { id: string; name: string }[] }) {
  const t = useTranslations("admin");
  const [name, setName] = React.useState(m.full_name);
  const [group, setGroup] = React.useState(m.group_id ?? groups[0]?.id ?? "");
  return (
    <FormDialog trigger={t("edit")} title={t("editTitle", { name: m.full_name })} submitLabel={t("saveChanges")} successLabel={t("saved")} valid={name.trim().length >= 2 && !!group} onSubmit={() => updateMemberAction({ member_id: m.id, group_id: group, full_name: name.trim() })}>
      <Field id="em-name" label={t("officialName")}><Input id="em-name" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field id="em-group" label={t("group")}><Select id="em-group" value={group} onChange={(e) => setGroup(e.target.value)}>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</Select></Field>
    </FormDialog>
  );
}

/** Elders grant or remove Ministerial Servant. Only the Platform Owner can touch the Elder role (D-04). */
export function ServantRoleDialog({ m }: { m: MemberLite }) {
  const t = useTranslations("admin");
  const isServant = m.role === "ministerial_servant";
  return (
    <FormDialog trigger={isServant ? t("removeServant") : t("makeServant")} title={isServant ? t("removeServantTitle", { name: m.full_name }) : t("makeServantTitle", { name: m.full_name })} description={isServant ? undefined : t("makeServantDescription")}
      submitLabel={isServant ? t("removeServant") : t("makeServant")} successLabel={t("saved")} danger={isServant} onSubmit={() => setRoleAction({ member_id: m.id, role: isServant ? "publisher" : "ministerial_servant" })}>
      <p>{isServant ? t("removeServantBody") : t("makeServantBody")}</p>
    </FormDialog>
  );
}

export function StatusDialog({ m, defaultMonth }: { m: MemberLite; defaultMonth: string }) {
  const t = useTranslations("admin");
  const [month, setMonth] = React.useState(defaultMonth.slice(0, 7));
  const inactive = m.status === "inactive";
  return (
    <FormDialog trigger={inactive ? t("reactivate") : t("markInactive")} title={inactive ? t("reactivateTitle", { name: m.full_name }) : t("inactiveTitle", { name: m.full_name })} description={inactive ? undefined : t("inactiveDescription")}
      submitLabel={inactive ? t("reactivate") : t("markInactive")} successLabel={t("saved")} danger={!inactive} valid={inactive || !!month}
      onSubmit={() => setStatusAction(inactive ? { member_id: m.id, status: "active" } : { member_id: m.id, status: "inactive", effective_month: `${month}-01` })}>
      {inactive ? <p>{t("reactivateBody")}</p> : <Field id="st-month" label={t("effectiveMonth")} hint={t("effectiveMonthHint")}><Input id="st-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></Field>}
    </FormDialog>
  );
}

/** One-time recovery link to hand over in person (AUTH-07). The Elder never sees or sets a password. */
export function RecoveryLinkButton({ m }: { m: MemberLite }) {
  const t = useTranslations("admin");
  const te = useTranslations("errors");
  const [link, setLink] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  if (m.is_managed || !m.email) return null;
  return (
    <div className="flex flex-col gap-2">
      <Button size="sm" variant="secondary" disabled={pending} onClick={() => start(async () => { const r = await createRecoveryLinkAction(m.id); if (r.ok && r.data) setLink(r.data.link); else toast.error(te("unknown")); })}>{t("recoveryLink")}</Button>
      {link ? (
        <div role="status" className="rounded-md border border-border bg-surface p-3">
          <p className="text-sm text-muted-foreground">{t("recoveryLinkHelp")}</p>
          <code className="mt-1 block break-all text-sm">{link}</code>
          <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(link); toast.success(t("copied")); }}><Copy aria-hidden="true" />{t("copy")}</Button>
        </div>
      ) : null}
    </div>
  );
}
