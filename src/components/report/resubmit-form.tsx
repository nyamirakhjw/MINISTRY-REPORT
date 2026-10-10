"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Field } from "@/components/forms/field";
import { Stepper } from "@/components/forms/stepper";
import { resubmitReportAction } from "@/lib/actions/report";
import { COMMENT_WORD_LIMIT, countWords } from "@/lib/domain/words";
import { isPioneer, type Category } from "@/lib/domain/categories";

interface Props { reportId: string; category: Category; participated: boolean | null; hours: number | null; studies: number | null; comment: string | null }

/** COR-03: fixing a reopened report. No extra deadline — this is a correction, not a fresh submission. */
export function ResubmitForm({ reportId, category, participated: p0, hours: h0, studies: s0, comment: c0 }: Props) {
  const t = useTranslations("report");
  const te = useTranslations("errors");
  const router = useRouter();
  const requestId = React.useRef(crypto.randomUUID());
  const pioneer = isPioneer(category);
  const [participated, setParticipated] = React.useState<"yes" | "no">(p0 === false ? "no" : "yes");
  const [hours, setHours] = React.useState(h0 != null ? String(h0) : "");
  const [studies, setStudies] = React.useState(s0 ?? 0);
  const [comment, setComment] = React.useState(c0 ?? "");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const [pending, start] = React.useTransition();

  const saidNo = !pioneer && participated === "no";
  const words = countWords(comment);
  const hoursNum = hours === "" ? null : Number(hours);

  function submit() {
    const e: Record<string, string> = {};
    if (pioneer && (hoursNum === null || !Number.isInteger(hoursNum) || hoursNum < 0 || hoursNum > 744)) e.hours = te(hoursNum === null ? "hours_required" : "hours_out_of_range");
    if (words > COMMENT_WORD_LIMIT) e.comment = te("comment_too_long");
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setServerError(null);
    start(async () => {
      const r = await resubmitReportAction({
        report_id: reportId, category, request_id: requestId.current,
        participated: pioneer ? null : participated === "yes", hours: pioneer ? hoursNum : null,
        studies: saidNo ? 0 : studies, comment: saidNo ? "" : comment.trim(),
      });
      if (r.ok) { setDone(true); router.refresh(); return; }
      setServerError(te.has(r.code) ? te(r.code) : te("unknown"));
    });
  }

  if (done) {
    return (
      <div role="status" className="rounded-lg border border-border bg-surface p-5">
        <CheckCircle2 className="size-8 text-success" aria-hidden="true" />
        <h2 className="mt-3 text-xl">{t("resubmittedTitle")}</h2>
        <p className="mt-2">{t("resubmittedBody")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate className="flex flex-col gap-6 rounded-lg border-2 border-warning bg-surface p-5">
      <p className="flex items-center gap-2 text-lg font-semibold"><RotateCcw className="size-5" aria-hidden="true" />{t("fixingTitle")}</p>
      {serverError ? <p role="alert" className="font-semibold text-danger">{serverError}</p> : null}
      {!pioneer ? (
        <div className="flex flex-col gap-2">
          <p className="font-semibold">{t("didYouParticipate")}</p>
          <Segmented label={t("didYouParticipate")} value={participated} onValueChange={(v) => setParticipated(v as "yes" | "no")} options={[{ value: "yes", label: t("yes") }, { value: "no", label: t("no") }]} />
        </div>
      ) : (
        <Field id="rs-hours" label={t("hours")} error={errors.hours}>
          <Input id="rs-hours" inputMode="numeric" value={hours} aria-invalid={!!errors.hours} onChange={(e) => setHours(e.target.value.replace(/\D/g, ""))} className="text-xl font-semibold tabular" />
        </Field>
      )}
      {!saidNo && (
        <>
          <Field id="rs-studies" label={t("studies")}><Stepper id="rs-studies" value={studies} onChange={setStudies} label={t("studies")} /></Field>
          <Field id="rs-comment" label={t("comment")} optional optionalLabel={t("optional")} error={errors.comment}>
            <Textarea id="rs-comment" value={comment} onChange={(e) => setComment(e.target.value)} aria-invalid={!!errors.comment} />
            <p className="text-sm text-muted-foreground">{t("wordCount", { count: words, max: COMMENT_WORD_LIMIT })}</p>
          </Field>
        </>
      )}
      <div><Button type="submit" disabled={pending}>{pending ? t("submitting") : t("resubmit")}</Button></div>
    </form>
  );
}
