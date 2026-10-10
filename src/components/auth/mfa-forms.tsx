"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/field";
import { currentTotpFactorAction, enrollTotpAction, issueRecoveryCodesAction, spendRecoveryCodeAction, verifyTotpAction } from "@/lib/actions/auth";

function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/app";
}

/** Enrolment: scan, confirm a code, then save ten recovery codes that are shown exactly once (AUTH-09). */
export function EnrollForm({ next }: { next?: string }) {
  const t = useTranslations("mfa");
  const te = useTranslations("errors");
  const router = useRouter();
  const [factor, setFactor] = React.useState<{ factorId: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [codes, setCodes] = React.useState<string[] | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [pending, start] = React.useTransition();

  React.useEffect(() => {
    let live = true;
    enrollTotpAction().then((r) => { if (live && r.ok && r.data) setFactor(r.data); else if (live) setError(te("unknown")); });
    return () => { live = false; };
  }, [te]);

  const verify = () => start(async () => {
    if (!factor) return;
    setError(null);
    const r = await verifyTotpAction({ factorId: factor.factorId, code });
    if (!r.ok) return setError(te.has(r.code) ? te(r.code) : te("unknown"));
    const issued = await issueRecoveryCodesAction();
    if (!issued.ok || !issued.data) return setError(te("unknown"));
    setCodes(issued.data.codes);
  });

  if (codes) {
    const text = codes.join("\n");
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl">{t("codesTitle")}</h2>
        <p>{t("codesBody")}</p>
        <ul className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-surface p-4 font-mono text-lg tabular" aria-label={t("codesTitle")}>
          {codes.map((c) => <li key={c}>{c}</li>)}
        </ul>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => navigator.clipboard.writeText(text)}><Copy aria-hidden="true" />{t("copy")}</Button>
          <Button variant="secondary" onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" })); a.download = "ministry-report-recovery-codes.txt"; a.click(); URL.revokeObjectURL(a.href); }}><Download aria-hidden="true" />{t("download")}</Button>
        </div>
        <label className="flex min-h-12 items-center gap-3"><input type="checkbox" className="size-6" checked={saved} onChange={(e) => setSaved(e.target.checked)} />{t("savedConfirm")}</label>
        <Button disabled={!saved} onClick={() => { router.replace(safeNext(next)); router.refresh(); }}>{t("finish")}</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ol className="list-decimal space-y-2 pl-5"><li>{t("step1")}</li><li>{t("step2")}</li></ol>
      {factor ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- data URI from the auth server */}
          <img src={factor.qr} alt={t("qrAlt")} width={200} height={200} className="self-center rounded-md border border-border bg-white p-2" />
          <div><p className="text-sm text-muted-foreground">{t("manual")}</p><code className="mt-1 block break-all rounded-md bg-tint p-3 text-base tabular">{factor.secret}</code></div>
        </>
      ) : <p role="status">{t("preparing")}</p>}
      <Field id="code" label={t("codeLabel")} hint={t("codeHint")} error={error ?? undefined}>
        <Input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} aria-invalid={!!error} />
      </Field>
      <Button onClick={verify} disabled={pending || !factor || code.length !== 6}>{pending ? t("verifying") : t("verify")}</Button>
    </div>
  );
}

export function VerifyForm({ next }: { next?: string }) {
  const t = useTranslations("mfa");
  const te = useTranslations("errors");
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const submit = () => start(async () => {
    setError(null);
    const factorId = await currentTotpFactorAction();
    if (!factorId) return setError(te("unknown"));
    const r = await verifyTotpAction({ factorId, code });
    if (!r.ok) return setError(te.has(r.code) ? te(r.code) : te("unknown"));
    router.replace(safeNext(next));
    router.refresh();
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex flex-col gap-5">
      <Field id="code" label={t("codeLabel")} hint={t("codeHint")} error={error ?? undefined}>
        <Input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} aria-invalid={!!error} />
      </Field>
      <Button type="submit" disabled={pending || code.length !== 6}>{pending ? t("verifying") : t("verify")}</Button>
    </form>
  );
}

export function RecoveryForm() {
  const t = useTranslations("mfa");
  const te = useTranslations("errors");
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const submit = () => start(async () => {
    setError(null);
    const r = await spendRecoveryCodeAction({ code });
    if (!r.ok) return setError(te.has(r.code) ? te(r.code) : te("unknown"));
    router.replace("/mfa/enroll");
    router.refresh();
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex flex-col gap-5">
      <Field id="code" label={t("recoveryLabel")} hint={t("recoveryHint")} error={error ?? undefined}>
        <Input id="code" autoComplete="off" autoCapitalize="characters" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} aria-invalid={!!error} />
      </Field>
      <Button type="submit" disabled={pending || code.replace(/[^A-Za-z0-9]/g, "").length !== 10}>{pending ? t("verifying") : t("recoverySubmit")}</Button>
    </form>
  );
}
