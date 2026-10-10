"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Field } from "@/components/forms/field";
import { PhotoCropper } from "@/components/forms/photo-cropper";
import { requestArrangementAction, requestProfileChangeAction, updateProfileAction } from "@/lib/actions/profile";

function useResult() {
  const te = useTranslations("errors");
  return (r: { ok: boolean; code?: string; fields?: Record<string, string> }, okMessage: string) => {
    if (r.ok) return toast.success(okMessage);
    const code = r.fields ? Object.values(r.fields)[0] : r.code;
    toast.error(code && te.has(code) ? te(code) : te("unknown"));
  };
}

export function ProfileForm({ phone, language, swEnabled }: { phone: string; language: "en" | "sw"; swEnabled: boolean }) {
  const t = useTranslations("settings");
  const c = useTranslations("common");
  const router = useRouter();
  const report = useResult();
  const [p, setP] = React.useState(phone);
  const [l, setL] = React.useState(language);
  const [pending, start] = React.useTransition();
  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); start(async () => { report(await updateProfileAction({ phone: p, language: l }), t("saved")); router.refresh(); }); }}>
      <Field id="phone" label={t("phone")} hint={t("phoneHint")}><Input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={p} onChange={(e) => setP(e.target.value)} /></Field>
      {swEnabled && <Field id="language" label={t("language")}><Select id="language" value={l} onChange={(e) => setL(e.target.value as "en" | "sw")}><option value="en">English</option><option value="sw">Kiswahili</option></Select></Field>}
      <div><Button type="submit" disabled={pending}>{pending ? c("saving") : t("saveProfile")}</Button></div>
    </form>
  );
}

export function PhotoChange({ memberId, name }: { memberId: string; name: string }) {
  const t = useTranslations("settings");
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  if (!open) return <Button variant="secondary" onClick={() => setOpen(true)}>{t("changePhoto")}</Button>;
  return <PhotoCropper memberId={memberId} name={name} onSaved={() => { setOpen(false); toast.success(t("photoSaved")); router.refresh(); }} />;
}

export function ArrangementRequest({ nextMonth }: { nextMonth: string }) {
  const t = useTranslations("settings");
  const cat = useTranslations("categories");
  const c = useTranslations("common");
  const router = useRouter();
  const report = useResult();
  const [kind, setKind] = React.useState("regular_pioneer");
  const [aux, setAux] = React.useState("15");
  const [start, setStart] = React.useState(nextMonth.slice(0, 7));
  const [pending, run] = React.useTransition();
  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); run(async () => { report(await requestArrangementAction({ kind, start_month: `${start}-01`, aux_goal: kind === "auxiliary_pioneer" ? aux : undefined }), t("requestSent")); router.refresh(); }); }}>
      <Field id="kind" label={t("arrangementKind")}>
        <Select id="kind" value={kind} onChange={(e) => setKind(e.target.value)}>{(["regular_pioneer", "auxiliary_pioneer", "special_pioneer"] as const).map((k) => <option key={k} value={k}>{cat(k)}</option>)}</Select>
      </Field>
      {kind === "auxiliary_pioneer" && <Field id="aux" label={t("auxGoal")}><Select id="aux" value={aux} onChange={(e) => setAux(e.target.value)}><option value="15">{t("hours", { n: 15 })}</option><option value="30">{t("hours", { n: 30 })}</option></Select></Field>}
      <Field id="start" label={t("startMonth")} hint={t("startMonthHint")}><Input id="start" type="month" value={start} onChange={(e) => setStart(e.target.value)} required /></Field>
      <div><Button type="submit" disabled={pending}>{pending ? c("submitting") : t("sendRequest")}</Button></div>
    </form>
  );
}

export function ChangeRequest() {
  const t = useTranslations("settings");
  const c = useTranslations("common");
  const router = useRouter();
  const report = useResult();
  const [kind, setKind] = React.useState<"full_name" | "username">("full_name");
  const [value, setValue] = React.useState("");
  const [pending, run] = React.useTransition();
  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); run(async () => { const r = await requestProfileChangeAction({ kind, value }); report(r, t("requestSent")); if (r.ok) setValue(""); router.refresh(); }); }}>
      <Field id="change-kind" label={t("changeWhat")}>
        <Select id="change-kind" value={kind} onChange={(e) => setKind(e.target.value as "full_name" | "username")}><option value="full_name">{t("officialName")}</option><option value="username">{t("usernameLabel")}</option></Select>
      </Field>
      <Field id="change-value" label={t("newValue")} hint={t("changeHint")}><Input id="change-value" value={value} onChange={(e) => setValue(e.target.value)} autoCapitalize="none" required minLength={2} /></Field>
      <div><Button type="submit" disabled={pending || value.trim().length < 2}>{pending ? c("submitting") : t("sendRequest")}</Button></div>
    </form>
  );
}
