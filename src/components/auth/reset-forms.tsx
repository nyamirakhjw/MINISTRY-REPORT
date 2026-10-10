"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/field";
import { ErrorSummary } from "@/components/forms/error-summary";
import { PasswordInput } from "@/components/forms/password-input";
import { requestPasswordResetAction, updatePasswordAction } from "@/lib/actions/auth";
import { newPasswordSchema, resetRequestSchema } from "@/lib/schemas/auth";
import { useFormErrors } from "./use-form-errors";

export function ResetRequestForm() {
  const t = useTranslations("reset");
  const c = useTranslations("common");
  const [sent, setSent] = React.useState(false);
  const [pending, start] = React.useTransition();
  const { register, handleSubmit, formState: { errors, submitCount } } = useForm<{ email: string }>({ resolver: zodResolver(resetRequestSchema), defaultValues: { email: "" } });
  const fe = useFormErrors(errors, submitCount);
  if (sent) return <div role="status" className="rounded-lg border border-border bg-surface p-5"><MailCheck className="size-8 text-success" aria-hidden="true" /><p className="mt-3">{t("sent")}</p><p className="mt-2 text-muted-foreground">{t("noEmailHelp")}</p></div>;
  return (
    <form onSubmit={handleSubmit((v) => start(async () => { await requestPasswordResetAction(v); setSent(true); }), fe.focus)} noValidate className="flex flex-col gap-5">
      <ErrorSummary ref={fe.ref} title={fe.te("summaryTitle")} items={fe.items} />
      <Field id="email" label={t("email")} error={fe.msg(errors.email?.message)}>
        <Input id="email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} {...register("email")} />
      </Field>
      <Button type="submit" disabled={pending}>{pending ? c("submitting") : t("submit")}</Button>
    </form>
  );
}

export function NewPasswordForm() {
  const t = useTranslations("reset");
  const c = useTranslations("common");
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const { register, handleSubmit, watch, formState: { errors, submitCount } } = useForm<{ password: string; confirm: string }>({ resolver: zodResolver(newPasswordSchema), defaultValues: { password: "", confirm: "" } });
  const fe = useFormErrors(errors, submitCount, serverError ? { id: "password", message: serverError } : null);
  return (
    <form onSubmit={handleSubmit((v) => { setServerError(null); start(async () => { const r = await updatePasswordAction(v); if (r && !r.ok) setServerError(fe.te("unknown")); }); }, fe.focus)} noValidate className="flex flex-col gap-5">
      <ErrorSummary ref={fe.ref} title={fe.te("summaryTitle")} items={fe.items} />
      <Field id="password" label={t("newPassword")} hint={t("passwordHint")} error={fe.msg(errors.password?.message)}>
        <PasswordInput id="password" autoComplete="new-password" meter aria-invalid={!!errors.password} value={watch("password")} {...register("password")} />
      </Field>
      <Field id="confirm" label={t("confirmPassword")} error={fe.msg(errors.confirm?.message)}>
        <PasswordInput id="confirm" autoComplete="new-password" aria-invalid={!!errors.confirm} {...register("confirm")} />
      </Field>
      <Button type="submit" disabled={pending}>{pending ? c("saving") : t("save")}</Button>
    </form>
  );
}
