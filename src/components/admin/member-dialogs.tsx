"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/forms/field";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PhotoCropper } from "@/components/forms/photo-cropper";
import { createManagedProfileAction, adminSetAvatarAction, adminCreateArrangementAction, adminDeleteMemberAction, setRoleAction, setStatusAction, updateMemberAction } from "@/lib/actions/admin";
import { createRecoveryLinkAction } from "@/lib/actions/auth";
import { FormDialog } from "./form-dialog";

type Arrangement = "publisher" | "regular_pioneer" | "auxiliary_pioneer" | "special_pioneer";

/** Two steps: create the profile (name, phone, group, and — PRO-05 — their arrangement right away rather
 * than a separate request later), then an optional photo (D-08: mandatory for self-signups, not managed
 * profiles, so this step can be skipped and added later from the member's row). */
export function ManagedProfileDialog({ groups }: { groups: { id: string; name: string }[] }) {
  const t = useTranslations("admin");
  const ra = useTranslations("requestAccess");
  const cat = useTranslations("categories");
  const c = useTranslations("common");
  const te = useTranslations("errors");
  const router = useRouter();

  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<"form" | "photo">("form");
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [group, setGroup] = React.useState(groups[0]?.id ?? "");
  const [arrangement, setArrangement] = React.useState<Arrangement>("publisher");
  const [auxGoal, setAuxGoal] = React.useState<"15" | "30">("15");
  const [month, setMonth] = React.useState(new Date().toISOString().slice(0, 7));
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const [newId, setNewId] = React.useState<string | null>(null);

  function reset() {
    setStep("form"); setName(""); setPhone(""); setGroup(groups[0]?.id ?? "");
    setArrangement("publisher"); setAuxGoal("15"); setMonth(new Date().toISOString().slice(0, 7)); setError(null); setNewId(null);
  }
  function finish() {
    setOpen(false); reset(); router.refresh();
  }

  function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await createManagedProfileAction({ full_name: name.trim(), group_id: group, phone: phone.trim() || undefined, first_report_month: `${month}-01` });
      if (!r.ok || !r.data) {
        const code = r.ok ? undefined : r.fields ? Object.values(r.fields)[0] : r.code;
        const base = code && te.has(code) ? te(code) : te("unknown");
        setError(r.ok || !code || te.has(code) || !r.hint ? base : `${base} (${r.hint})`);
        return;
      }
      const memberId = r.data;
      if (arrangement !== "publisher") {
        const startMonth = `${new Date().toISOString().slice(0, 7)}-01`;
        const ar = await adminCreateArrangementAction({
          member_id: memberId, kind: arrangement, start_month: startMonth,
          aux_goal: arrangement === "auxiliary_pioneer" ? auxGoal : undefined,
        });
        // The profile itself was created either way — don't block on this, just flag it so it isn't silently lost.
        if (!ar.ok) toast.error(ar.code && te.has(ar.code) ? te(ar.code) : te("unknown"));
      }
      toast.success(t("managedDone"));
      setNewId(memberId);
      setStep("photo");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild><Button variant="primary" size="md">{t("addManaged")}</Button></DialogTrigger>
      <DialogContent
        title={step === "form" ? t("managedTitle") : t("managedPhotoStepTitle")}
        description={step === "form" ? t("managedDescription") : t("managedPhotoStepDescription")}
        closeLabel={c("close")}
      >
        {step === "form" ? (
          <form onSubmit={submitForm} className="flex flex-col gap-4">
            <Field id="mp-name" label={t("officialName")}><Input id="mp-name" value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field id="mp-phone" label={t("phone")} optional optionalLabel={t("optional")}><Input id="mp-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
            <Field id="mp-group" label={t("group")}>
              <Select id="mp-group" value={group} onChange={(e) => setGroup(e.target.value)}>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</Select>
            </Field>
            <Field id="mp-month" label={t("firstMonth")} hint={t("firstMonthHint")}>
              <Input id="mp-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </Field>
            <Field id="mp-arrangement" label={ra("arrangement")} hint={ra("arrangementHint")}>
              <Select id="mp-arrangement" value={arrangement} onChange={(e) => setArrangement(e.target.value as Arrangement)}>
                {(["publisher", "regular_pioneer", "auxiliary_pioneer", "special_pioneer"] as const).map((k) => <option key={k} value={k}>{cat(k)}</option>)}
              </Select>
            </Field>
            {arrangement === "auxiliary_pioneer" && (
              <Field id="mp-aux-goal" label={ra("auxGoal")}>
                <Select id="mp-aux-goal" value={auxGoal} onChange={(e) => setAuxGoal(e.target.value as "15" | "30")}>
                  <option value="15">{ra("hours", { n: 15 })}</option>
                  <option value="30">{ra("hours", { n: 30 })}</option>
                </Select>
              </Field>
            )}
            {error ? <p role="alert" className="font-semibold text-danger">{error}</p> : null}
            <div className="flex flex-wrap justify-end gap-3">
              <DialogClose asChild><Button variant="ghost">{c("cancel")}</Button></DialogClose>
              <Button type="submit" disabled={pending || name.trim().length < 2 || !group}>{pending ? c("saving") : t("managedSubmit")}</Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <PhotoCropper memberId={newId!} name={name} onSave={(path) => adminSetAvatarAction({ member_id: newId, path })} onSaved={finish} />
            <div className="flex justify-end">
              <Button type="button" variant="ghost" onClick={finish}>{t("skipPhoto")}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export interface MemberLite { id: string; full_name: string; group_id: string | null; role: string; status: string; is_managed: boolean; email: string | null; phone?: string | null }

/** Name, phone and group are all editable here now — a managed profile started with no phone often gets one
 * later. For managed profiles only (self-signed-up members manage their own photo), an inline photo section
 * is added below the fields — PhotoCropper saves itself the moment its own "Save" is pressed (it's a plain
 * <div>, every one of its buttons defaults to type="button", so it can't accidentally submit this dialog's
 * own form), independent of this dialog's main "Save changes" button. */
export function EditMemberDialog({ m, groups }: { m: MemberLite; groups: { id: string; name: string }[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [name, setName] = React.useState(m.full_name);
  const [phone, setPhone] = React.useState(m.phone ?? "");
  const [group, setGroup] = React.useState(m.group_id ?? groups[0]?.id ?? "");
  return (
    <FormDialog trigger={t("edit")} title={t("editTitle", { name: m.full_name })} submitLabel={t("saveChanges")} successLabel={t("saved")} valid={name.trim().length >= 2 && !!group}
      onSubmit={() => updateMemberAction({ member_id: m.id, group_id: group, full_name: name.trim(), phone: phone.trim() || undefined })}>
      <Field id="em-name" label={t("officialName")}><Input id="em-name" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field id="em-phone" label={t("phone")} optional optionalLabel={t("optional")}><Input id="em-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
      <Field id="em-group" label={t("group")}><Select id="em-group" value={group} onChange={(e) => setGroup(e.target.value)}>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</Select></Field>
      {m.is_managed && (
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <p className="font-semibold">{t("photoSection")}</p>
          <PhotoCropper memberId={m.id} name={m.full_name}
            onSave={(path) => adminSetAvatarAction({ member_id: m.id, path })}
            onSaved={() => { toast.success(t("photoSaved")); router.refresh(); }} />
        </div>
      )}
    </FormDialog>
  );
}

/** Elder-triggered, immediate version of the self-service 30-day deletion flow (§16.7): same end state
 * (personal details wiped, sign-in removed, past report NUMBERS kept so congregation totals stay correct),
 * just without the wait — and it works whether or not the person ever filed a request themselves. */
export function DeleteMemberDialog({ m }: { m: MemberLite }) {
  const t = useTranslations("admin");
  const [reason, setReason] = React.useState("");
  return (
    <FormDialog trigger={t("deleteMember")} title={t("deleteMemberTitle", { name: m.full_name })} description={t("deleteMemberDescription")}
      submitLabel={t("deleteMemberSubmit")} successLabel={t("deleteMemberDone")} valid={reason.trim().length >= 3} danger
      onSubmit={() => adminDeleteMemberAction({ member_id: m.id, reason: reason.trim() })}>
      <Field id="dm-reason" label={t("deleteMemberReason")} hint={t("deleteMemberReasonHint")}><Textarea id="dm-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-20" /></Field>
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
