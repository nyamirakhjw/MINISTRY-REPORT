"use client";
import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Field } from "@/components/forms/field";
import { Stepper } from "@/components/forms/stepper";
import { closeMonthAction, submitOnBehalfAction } from "@/lib/actions/admin";
import { CATEGORIES, isPioneer, type Category } from "@/lib/domain/categories";
import { countWords, COMMENT_WORD_LIMIT } from "@/lib/domain/words";
import { formatMonth } from "@/lib/format";
import { FormDialog } from "./form-dialog";

export function OnBehalfDialog({ memberId, name, month, label }: { memberId: string; name: string; month: string; label: string }) {
  const t = useTranslations("admin");
  const cat = useTranslations("categories");
  const y = useTranslations("report");
  const locale = useLocale();
  const requestId = React.useRef(crypto.randomUUID());
  const [category, setCategory] = React.useState<Category>("publisher");
  const [participated, setParticipated] = React.useState<"yes" | "no">("yes");
  const [hours, setHours] = React.useState("");
  const [studies, setStudies] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [received, setReceived] = React.useState("");
  const [reason, setReason] = React.useState("");
  const pioneer = isPioneer(category);
  const saidNo = !pioneer && participated === "no";
  const valid = reason.trim().length >= 3 && countWords(comment) <= COMMENT_WORD_LIMIT && (!pioneer || hours !== "");

  return (
    <FormDialog trigger={label} title={t("onBehalfTitle", { name })} description={t("onBehalfDescription", { month: formatMonth(month, locale) })} submitLabel={t("onBehalfSubmit")} successLabel={t("onBehalfDone")} valid={valid}
      onSubmit={() => submitOnBehalfAction({ member_id: memberId, month, category, participated: pioneer ? null : participated === "yes", hours: pioneer ? Number(hours) : null, studies: saidNo ? 0 : studies, comment: saidNo ? "" : comment.trim(), received_at: received || undefined, reason: reason.trim(), request_id: requestId.current })}>
      <Field id="ob-category" label={y("category")} hint={t("categoryHint")}>
        <Select id="ob-category" value={category} onChange={(e) => setCategory(e.target.value as Category)}>{CATEGORIES.map((c) => <option key={c} value={c}>{cat(c)}</option>)}</Select>
      </Field>
      {!pioneer ? (
        <Segmented label={y("didYouParticipate")} value={participated} onValueChange={(v) => setParticipated(v as "yes" | "no")} options={[{ value: "yes", label: y("yes") }, { value: "no", label: y("no") }]} />
      ) : (
        <Field id="ob-hours" label={y("hours")}><Input id="ob-hours" inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value.replace(/\D/g, ""))} /></Field>
      )}
      {!saidNo && (
        <>
          <Field id="ob-studies" label={y("studies")}><Stepper id="ob-studies" value={studies} onChange={setStudies} label={y("studies")} /></Field>
          <Field id="ob-comment" label={y("comment")} optional optionalLabel={y("optional")}><Textarea id="ob-comment" value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
        </>
      )}
      <Field id="ob-received" label={t("receivedAt")} hint={t("receivedAtHint")}><Input id="ob-received" type="datetime-local" value={received} onChange={(e) => setReceived(e.target.value)} /></Field>
      <Field id="ob-reason" label={t("reason")} hint={t("reasonHint")}><Textarea id="ob-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-20" /></Field>
    </FormDialog>
  );
}

export function CloseMonthDialog({ memberId, name, month, label }: { memberId: string; name: string; month: string; label: string }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [reason, setReason] = React.useState("");
  return (
    <FormDialog trigger={label} title={t("closeTitle", { name })} description={t("closeDescription", { month: formatMonth(month, locale) })} submitLabel={t("closeSubmit")} successLabel={t("closeDone")} valid={reason.trim().length >= 3} danger
      onSubmit={() => closeMonthAction({ member_id: memberId, month, reason: reason.trim() })}>
      <Field id="cl-reason" label={t("reason")} hint={t("reasonHint")}><Textarea id="cl-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-20" /></Field>
    </FormDialog>
  );
}
