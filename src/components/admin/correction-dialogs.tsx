"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Field } from "@/components/forms/field";
import { Stepper } from "@/components/forms/stepper";
import { decideCorrectionAction, elderEditReportAction } from "@/lib/actions/admin";
import { CATEGORIES, isPioneer, type Category } from "@/lib/domain/categories";
import { countWords, COMMENT_WORD_LIMIT } from "@/lib/domain/words";
import { FormDialog } from "./form-dialog";

export function ApproveReopenDialog({ id, name }: { id: string; name: string }) {
  const t = useTranslations("admin");
  return (
    <FormDialog trigger={t("approveReopen")} triggerVariant="primary" title={t("approveReopenTitle", { name })}
      description={t("approveReopenDescription")} submitLabel={t("approveReopenSubmit")} successLabel={t("approveReopenDone")}
      onSubmit={() => decideCorrectionAction({ id, approve: true })}><p>{t("approveReopenBody")}</p></FormDialog>
  );
}

export function DeclineCorrectionDialog({ id, name }: { id: string; name: string }) {
  const t = useTranslations("admin");
  const [note, setNote] = React.useState("");
  return (
    <FormDialog trigger={t("decline")} title={t("declineCorrectionTitle", { name })} submitLabel={t("declineSubmit")} successLabel={t("decideDeclined")}
      valid={note.trim().length >= 3} danger onSubmit={() => decideCorrectionAction({ id, approve: false, note: note.trim() })}>
      <Field id="dc-note" label={t("declineReason")} hint={t("shownToPerson")}><Textarea id="dc-note" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-20" /></Field>
    </FormDialog>
  );
}

/** COR-02 "Edit directly": fixes the report in place (stays locked) and closes the correction request. */
export function EditDirectlyDialog({ correctionId, name, current }: {
  correctionId: string; name: string;
  current: { category: Category; participated: boolean | null; hours: number | null; studies: number | null; comment: string | null };
}) {
  const t = useTranslations("admin");
  const y = useTranslations("report");
  const cat = useTranslations("categories");
  const [category, setCategory] = React.useState<Category>(current.category);
  const [participated, setParticipated] = React.useState<"yes" | "no">(current.participated === false ? "no" : "yes");
  const [hours, setHours] = React.useState(current.hours != null ? String(current.hours) : "");
  const [studies, setStudies] = React.useState(current.studies ?? 0);
  const [comment, setComment] = React.useState(current.comment ?? "");
  const [reason, setReason] = React.useState("");
  const pioneer = isPioneer(category);
  const saidNo = !pioneer && participated === "no";
  const valid = reason.trim().length >= 3 && countWords(comment) <= COMMENT_WORD_LIMIT && (!pioneer || hours !== "");

  return (
    <FormDialog trigger={t("editDirectly")} title={t("editDirectlyTitle", { name })} description={t("editDirectlyDescription")}
      submitLabel={t("editDirectlySubmit")} successLabel={t("editDirectlyDone")} valid={valid}
      onSubmit={() => elderEditReportAction({
        correction_id: correctionId, category, participated: pioneer ? null : participated === "yes",
        hours: pioneer ? Number(hours) : null, studies: saidNo ? 0 : studies, comment: saidNo ? "" : comment.trim(), reason: reason.trim(),
      })}>
      <Field id="ed-category" label={y("category")}>
        <Select id="ed-category" value={category} onChange={(e) => setCategory(e.target.value as Category)}>{CATEGORIES.map((c) => <option key={c} value={c}>{cat(c)}</option>)}</Select>
      </Field>
      {!pioneer ? (
        <Segmented label={y("didYouParticipate")} value={participated} onValueChange={(v) => setParticipated(v as "yes" | "no")} options={[{ value: "yes", label: y("yes") }, { value: "no", label: y("no") }]} />
      ) : (
        <Field id="ed-hours" label={y("hours")}><Input id="ed-hours" inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value.replace(/\D/g, ""))} /></Field>
      )}
      {!saidNo && (
        <>
          <Field id="ed-studies" label={y("studies")}><Stepper id="ed-studies" value={studies} onChange={setStudies} label={y("studies")} /></Field>
          <Field id="ed-comment" label={y("comment")} optional optionalLabel={y("optional")}><Textarea id="ed-comment" value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
        </>
      )}
      <Field id="ed-reason" label={t("reason")} hint={t("reasonHint")}><Textarea id="ed-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-20" /></Field>
    </FormDialog>
  );
}
