"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/input";
import { Field } from "@/components/forms/field";
import { requestCorrectionAction } from "@/lib/actions/report";
import { FormDialog } from "@/components/admin/form-dialog"; // generic dialog shell, not admin-specific

const KINDS = ["hours", "studies", "participation", "comment", "other"] as const;

/** COR-01. From a locked report the publisher picks what's wrong and gives a reason; an Elder decides from there. */
export function CorrectionRequestDialog({ reportId, month }: { reportId: string; month: string }) {
  const t = useTranslations("history");
  const [picked, setPicked] = React.useState<Set<string>>(new Set());
  const [reason, setReason] = React.useState("");
  const toggle = (k: string) => setPicked((s) => { const next = new Set(s); next.has(k) ? next.delete(k) : next.add(k); return next; });

  return (
    <FormDialog trigger={t("requestCorrection")} triggerVariant="secondary" triggerSize="sm" title={t("correctionTitle", { month })}
      description={t("correctionDescription")} submitLabel={t("correctionSubmit")} successLabel={t("correctionSent")}
      valid={picked.size > 0 && reason.trim().length >= 3}
      onSubmit={() => requestCorrectionAction({ report_id: reportId, what_wrong: [...picked], reason: reason.trim() })}>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-base font-semibold">{t("whatIsWrong")}</legend>
        {KINDS.map((k) => (
          <label key={k} htmlFor={`cw-${k}`} className="flex min-h-11 items-center gap-3">
            <Checkbox id={`cw-${k}`} checked={picked.has(k)} onCheckedChange={() => toggle(k)} />
            {t(`kind_${k}`)}
          </label>
        ))}
      </fieldset>
      <Field id="cr-reason" label={t("correctionReason")} hint={t("shownToElder")}>
        <Textarea id="cr-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} className="min-h-20" />
      </Field>
    </FormDialog>
  );
}
