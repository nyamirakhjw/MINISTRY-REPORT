"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, describedBy } from "@/components/forms/field";
import { ErrorSummary } from "@/components/forms/error-summary";
import { PasswordInput } from "@/components/forms/password-input";
import { checkUsernameAction, requestAccessAction } from "@/lib/actions/auth";
import { requestAccessSchema, type RequestAccessInput } from "@/lib/schemas/auth";
import { usernameProblem } from "@/lib/domain/username";
import { useFormErrors } from "./use-form-errors";

export function RequestAccessForm({ groups, swEnabled }: { groups: { id: string; name: string }[]; swEnabled: boolean }) {
  const t = useTranslations("requestAccess");
  const cat = useTranslations("categories");
  const c = useTranslations("common");
  const router = useRouter();
  const [done, setDone] = React.useState<string | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const form = useForm<RequestAccessInput>({
    resolver: zodResolver(requestAccessSchema),
    defaultValues: { full_name: "", username: "", email: "", phone: "", group_id: "", arrangement: "publisher", language: "en", password: "", consent: undefined as unknown as true },
  });
  const { register, handleSubmit, control, watch, setError, formState: { errors, submitCount } } = form;
  const arrangement = watch("arrangement");
  const password = watch("password");
  const extra = serverError ? { id: "full_name", message: serverError } : null;
  const fe = useFormErrors(errors, submitCount, extra);

  async function checkUsername(value: string) {
    if (usernameProblem(value)) return;
    if (!(await checkUsernameAction(value))) setError("username", { message: "username_taken" });
  }

  const onValid = (v: RequestAccessInput) => {
    setServerError(null);
    start(async () => {
      const r = await requestAccessAction(v);
      if (r.ok) {
        // Email confirmation off (no SMTP configured yet): sign-up already signed them in, so skip straight to the photo step.
        if (r.data?.emailConfirmed) { router.push("/pending"); router.refresh(); return; }
        return setDone(v.email);
      }
      if (r.fields) {
        for (const [k, m] of Object.entries(r.fields)) setError(k as keyof RequestAccessInput, { message: m });
        return;
      }
      setServerError(fe.te.has(r.code) ? fe.te(r.code) : fe.te("unknown"));
    });
  };

  if (done) {
    return (
      <div role="status" className="rounded-lg border border-border bg-surface p-5">
        <MailCheck className="size-8 text-success" aria-hidden="true" />
        <h2 className="mt-3 text-xl">{t("checkEmailTitle")}</h2>
        <p className="mt-2">{t("checkEmailBody", { email: done })}</p>
        <p className="mt-2 text-muted-foreground">{t("checkEmailNext")}</p>
      </div>
    );
  }

  const err = (k: keyof RequestAccessInput) => fe.msg(errors[k]?.message);
  return (
    <form onSubmit={handleSubmit(onValid, fe.focus)} noValidate className="flex flex-col gap-5">
      <ErrorSummary ref={fe.ref} title={fe.te("summaryTitle")} items={fe.items} />
      <Field id="full_name" label={t("fullName")} hint={t("fullNameHint")} error={err("full_name")}>
        <Input id="full_name" autoComplete="name" aria-invalid={!!errors.full_name} aria-describedby={describedBy("full_name", t("fullNameHint"), err("full_name"))} {...register("full_name")} />
      </Field>
      <Field id="username" label={t("username")} hint={t("usernameHint")} error={err("username")}>
        <Input id="username" autoComplete="username" autoCapitalize="none" spellCheck={false} aria-invalid={!!errors.username} aria-describedby={describedBy("username", t("usernameHint"), err("username"))}
          {...register("username", { onBlur: (e) => checkUsername(e.target.value) })} />
      </Field>
      <Field id="email" label={t("email")} error={err("email")}>
        <Input id="email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} {...register("email")} />
      </Field>
      <Field id="phone" label={t("phone")} hint={t("phoneHint")} error={err("phone")}>
        <Input id="phone" type="tel" autoComplete="tel" inputMode="tel" aria-invalid={!!errors.phone} aria-describedby={describedBy("phone", t("phoneHint"), err("phone"))} {...register("phone")} />
      </Field>
      <Field id="group_id" label={t("group")} error={err("group_id")}>
        <Select id="group_id" aria-invalid={!!errors.group_id} {...register("group_id")}>
          <option value="">{c("select")}</option>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </Select>
      </Field>
      <Field id="arrangement" label={t("arrangement")} hint={t("arrangementHint")}>
        <Select id="arrangement" {...register("arrangement")}>
          {(["publisher", "regular_pioneer", "auxiliary_pioneer", "special_pioneer"] as const).map((k) => <option key={k} value={k}>{cat(k)}</option>)}
        </Select>
      </Field>
      {arrangement === "auxiliary_pioneer" && (
        <Field id="aux_goal" label={t("auxGoal")}>
          <Select id="aux_goal" defaultValue="15" {...register("aux_goal")}><option value="15">{t("hours", { n: 15 })}</option><option value="30">{t("hours", { n: 30 })}</option></Select>
        </Field>
      )}
      {swEnabled && (
        <Field id="language" label={t("language")}>
          <Select id="language" {...register("language")}><option value="en">English</option><option value="sw">Kiswahili</option></Select>
        </Field>
      )}
      <Field id="password" label={t("password")} hint={t("passwordHint")} error={err("password")}>
        <Controller control={control} name="password" render={({ field }) => (
          <PasswordInput id="password" autoComplete="new-password" meter aria-invalid={!!errors.password} aria-describedby={describedBy("password", t("passwordHint"), err("password"))} {...field} value={password} />
        )} />
      </Field>
      <div className="flex flex-col gap-1.5">
        <Controller control={control} name="consent" render={({ field }) => (
          <label htmlFor="consent" className="flex min-h-12 items-start gap-3">
            <Checkbox id="consent" checked={field.value === true} onCheckedChange={(v) => field.onChange(v === true ? true : undefined)} aria-invalid={!!errors.consent} className="mt-0.5" />
            <span>{t.rich("consent", { privacy: (chunks) => <Link href="/privacy" className="underline underline-offset-4" target="_blank">{chunks}</Link>, terms: (chunks) => <Link href="/terms" className="underline underline-offset-4" target="_blank">{chunks}</Link> })}</span>
          </label>
        )} />
        {errors.consent ? <p role="alert" id="consent-error" className="text-sm font-semibold text-danger">{err("consent")}</p> : null}
      </div>
      <Button type="submit" disabled={pending}>{pending ? c("submitting") : t("submit")}</Button>
    </form>
  );
}
