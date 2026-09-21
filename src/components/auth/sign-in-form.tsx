/* eslint-disable react-hooks/refs */
"use client";
import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, describedBy } from "@/components/forms/field";
import { ErrorSummary } from "@/components/forms/error-summary";
import { PasswordInput } from "@/components/forms/password-input";
import { signInAction } from "@/lib/actions/auth";
import { signInSchema, type SignInInput } from "@/lib/schemas/auth";
import { useFormErrors } from "./use-form-errors";

export function SignInForm({ next }: { next?: string }) {
  const t = useTranslations("signIn");
  const c = useTranslations("common");
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const { register, handleSubmit, formState: { errors, submitCount } } = useForm<SignInInput>({ resolver: zodResolver(signInSchema), defaultValues: { identifier: "", password: "", next } });
  const extra = serverError ? { id: "identifier", message: serverError } : null;
  const fe = useFormErrors(errors, submitCount, extra);

  const onValid = (v: SignInInput) => {
    setServerError(null);
    start(async () => {
      const r = await signInAction({ ...v, next });
      if (r && !r.ok) setServerError(fe.te.has(r.code) ? fe.te(r.code) : fe.te("unknown"));
    });
  };

  return (
    <form onSubmit={handleSubmit(onValid, fe.focus)} noValidate className="flex flex-col gap-5">
      <ErrorSummary ref={fe.ref} title={fe.te("summaryTitle")} items={fe.items} />
      <Field id="identifier" label={t("identifier")} hint={t("identifierHint")} error={fe.msg(errors.identifier?.message)}>
        <Input id="identifier" autoComplete="username" autoCapitalize="none" spellCheck={false} aria-invalid={!!errors.identifier} aria-describedby={describedBy("identifier", t("identifierHint"), fe.msg(errors.identifier?.message))} {...register("identifier")} />
      </Field>
      <Field id="password" label={t("password")} error={fe.msg(errors.password?.message)}>
        <PasswordInput id="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register("password")} />
      </Field>
      <Button type="submit" disabled={pending}>{pending ? c("signingIn") : t("submit")}</Button>
      <p className="flex flex-wrap gap-x-6 gap-y-1">
        <Link href="/reset-password" className="inline-flex min-h-11 items-center underline underline-offset-4">{t("forgot")}</Link>
        <Link href="/request-access" className="inline-flex min-h-11 items-center underline underline-offset-4">{t("noAccount")}</Link>
      </p>
    </form>
  );
}

