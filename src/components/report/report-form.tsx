"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Field } from "@/components/forms/field";
import { Stepper } from "@/components/forms/stepper";
import { submitReportAction } from "@/lib/actions/report";
import { COMMENT_WORD_LIMIT, countWords } from "@/lib/domain/words";
import { isPioneer, type Category } from "@/lib/domain/categories";
import { formatDateTime, formatMonth } from "@/lib/format";

interface Props { month: string; options: Category[]; windowNote: string }
type Step = "edit" | "review" | "done";

export function ReportForm({ month, options, windowNote }: Props) {
  const t = useTranslations("report");
  const cat = useTranslations("categories");
  const te = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  // One key per form so a double tap or a retry after a weak connection creates one report (REP-10).
  const requestId = React.useRef(crypto.randomUUID());
  const [step, setStep] = React.useState<Step>("edit");
  const [category, setCategory] = React.useState<Category>(options.find((o) => o !== "publisher") ?? "publisher");
  const [participated, setParticipated] = React.useState<"yes" | "no" | "">("");
  const [hours, setHours] = React.useState("");
  const [studies, setStudies] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [doneAt, setDoneAt] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const summary = React.useRef<HTMLDivElement>(null);

  const pioneer = isPioneer(category);
  const words = countWords(comment);
  const saidNo = !pioneer && participated === "no";
  const hoursNum = hours === "" ? null : Number(hours);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!pioneer && participated === "") e.participated = te("participation_required");
    if (pioneer && (hoursNum === null || !Number.isInteger(hoursNum) || hoursNum < 0 || hoursNum > 744)) e.hours = te(hoursNum === null ? "hours_required" : "hours_out_of_range");
    if (words > COMMENT_WORD_LIMIT) e.comment = te("comment_too_long");
    setErrors(e);
    if (Object.keys(e).length > 0) { setTimeout(() => summary.current?.focus(), 0); return false; }
    return true;
  }

  function submit() {
    setServerError(null);
    start(async () => {
      const r = await submitReportAction({
        month, category, request_id: requestId.current,
        participated: pioneer ? null : participated === "yes",
        hours: pioneer ? hoursNum : null,
        studies: saidNo ? 0 : studies,
        comment: saidNo ? "" : comment.trim(),
      });
      if (r.ok) { setDoneAt(new Date().toISOString()); setStep("done"); router.refresh(); return; }
      setServerError(r.code === "earlier_month_pending" ? (r.hint ? te("earlier_month_pending", { month: formatMonth(r.hint, locale) }) : te("unknown")) : te.has(r.code) ? te(r.code) : te("unknown"));
      setStep("edit");
    });
  }

  if (step === "done") {
    return (
      <div role="status" className="rounded-lg border border-border bg-surface p-5">
        <CheckCircle2 className="size-8 text-success" aria-hidden="true" />
        <h2 className="mt-3 text-xl">{t("submittedTitle")}</h2>
        <p className="mt-2">{t("submittedBody", { month: formatMonth(month, locale), time: formatDateTime(doneAt ?? new Date().toISOString(), locale) })}</p>
        <div className="mt-4"><Button onClick={() => router.push("/app")}>{t("backHome")}</Button></div>
      </div>
    );
  }

  if (step === "review") {
    const bigHours = pioneer && (hoursNum ?? 0) > 300;
    return (
      <div className="flex flex-col gap-5">
        <h2 className="text-xl">{t("reviewTitle")}</h2>
        <dl className="divide-y divide-border rounded-lg border border-border bg-surface">
          <Row k={t("month")} v={formatMonth(month, locale)} />
          <Row k={t("category")} v={cat(category)} />
          {pioneer ? <Row k={t("hours")} v={String(hoursNum)} /> : <Row k={t("participated")} v={participated === "yes" ? t("yes") : t("no")} />}
          {!saidNo && <Row k={t("studies")} v={String(studies)} />}
          {!saidNo && comment.trim() && <Row k={t("comment")} v={comment.trim()} />}
        </dl>
        <p className="text-muted-foreground">{windowNote}</p>
        {pioneer && hoursNum === 0 && <p role="alert" className="rounded-md border-2 border-warning p-3 font-semibold">{t("zeroHoursConfirm")}</p>}
        {bigHours && <p role="alert" className="rounded-md border-2 border-warning p-3 font-semibold">{t("bigHoursConfirm", { hours: hoursNum ?? 0 })}</p>}
        <p className="font-semibold">{t("lockWarning")}</p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={submit} disabled={pending}>{pending ? t("submitting") : t("submit")}</Button>
          <Button variant="secondary" onClick={() => setStep("edit")} disabled={pending}>{t("edit")}</Button>
        </div>
      </div>
    );
  }

  const items = [...Object.entries(errors).map(([id, message]) => ({ id, message })), ...(serverError ? [{ id: "category", message: serverError }] : [])];
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (validate()) setStep("review"); }} noValidate className="flex flex-col gap-6">
      {items.length > 0 && (
        <div ref={summary} role="alert" tabIndex={-1} className="rounded-md border-2 border-danger bg-surface p-4">
          <h2 className="text-lg text-danger">{te("summaryTitle")}</h2>
          <ul className="mt-2 list-disc pl-5">{items.map((i) => <li key={i.id}><a href={`#${i.id}`} className="font-semibold underline">{i.message}</a></li>)}</ul>
        </div>
      )}
      <p className="text-muted-foreground">{windowNote}</p>
      {options.length > 1 && (
        <Field id="category" label={t("category")}>
          <Select id="category" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {options.map((o) => <option key={o} value={o}>{cat(o)}</option>)}
          </Select>
        </Field>
      )}
      {!pioneer ? (
        <div id="participated" tabIndex={-1} className="flex flex-col gap-2">
          <p className="text-base font-semibold" id="participated-label">{t("didYouParticipate")}</p>
          <Segmented label={t("didYouParticipate")} value={participated} onValueChange={(v) => setParticipated(v as "yes" | "no")} options={[{ value: "yes", label: t("yes") }, { value: "no", label: t("no") }]} />
          {errors.participated ? <p role="alert" className="text-sm font-semibold text-danger">{errors.participated}</p> : null}
        </div>
      ) : (
        <Field id="hours" label={t("hours")} hint={t("hoursHint")} error={errors.hours}>
          <Input id="hours" inputMode="numeric" pattern="[0-9]*" value={hours} aria-invalid={!!errors.hours} onChange={(e) => setHours(e.target.value.replace(/\D/g, ""))} className="text-xl font-semibold tabular" />
        </Field>
      )}
      {!saidNo && (
        <>
          <Field id="studies" label={t("studies")}>
            <Stepper id="studies" value={studies} onChange={setStudies} label={t("studies")} />
          </Field>
          <Field id="comment" label={t("comment")} optional optionalLabel={t("optional")} hint={t("commentHint")} error={errors.comment}>
            <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} aria-invalid={!!errors.comment} aria-describedby="comment-count comment-hint" />
            <p id="comment-count" aria-live="polite" className={`text-sm tabular ${words > COMMENT_WORD_LIMIT ? "font-semibold text-danger" : "text-muted-foreground"}`}>{t("wordCount", { count: words, max: COMMENT_WORD_LIMIT })}</p>
          </Field>
        </>
      )}
      {saidNo && <p className="rounded-md bg-tint p-3">{t("noLocks")}</p>}
      <Button type="submit">{t("review")}</Button>
    </form>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-4 p-3"><dt className="text-muted-foreground">{k}</dt><dd className="max-w-[60%] text-right font-semibold">{v}</dd></div>;
}
