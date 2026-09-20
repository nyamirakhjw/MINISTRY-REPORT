"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/forms/field";
import { approveMemberAction, decideArrangementAction, decideProfileChangeAction, endArrangementAction, rejectMemberAction, requestNewPhotoAction } from "@/lib/actions/admin";
import { FormDialog } from "./form-dialog";

export function ApproveDialog({ id, fullName, groupId, groups, defaultMonth }: { id: string; fullName: string; groupId: string | null; groups: { id: string; name: string }[]; defaultMonth: string }) {
  const t = useTranslations("admin");
  const [name, setName] = React.useState(fullName);
  const [group, setGroup] = React.useState(groupId ?? groups[0]?.id ?? "");
  const [month, setMonth] = React.useState(defaultMonth.slice(0, 7));
  return (
    <FormDialog trigger={t("approve")} triggerVariant="primary" title={t("approveTitle", { name: fullName })} description={t("approveDescription")} submitLabel={t("approveSubmit")} successLabel={t("approveDone")} valid={name.trim().length >= 2 && !!group && !!month}
      onSubmit={() => approveMemberAction({ member_id: id, full_name: name.trim(), group_id: group, first_report_month: `${month}-01` })}>
      <Field id="ap-name" label={t("officialName")} hint={t("officialNameHint")}><Input id="ap-name" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field id="ap-group" label={t("group")}><Select id="ap-group" value={group} onChange={(e) => setGroup(e.target.value)}>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</Select></Field>
      <Field id="ap-month" label={t("firstMonth")} hint={t("firstMonthHint")}><Input id="ap-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></Field>
    </FormDialog>
  );
}

export function ReasonDialog({ id, name, mode }: { id: string; name: string; mode: "reject" | "photo" }) {
  const t = useTranslations("admin");
  const [reason, setReason] = React.useState("");
  const reject = mode === "reject";
  return (
    <FormDialog trigger={reject ? t("reject") : t("askNewPhoto")} title={reject ? t("rejectTitle", { name }) : t("photoTitle", { name })} description={reject ? t("rejectDescription") : t("photoDescription")}
      submitLabel={reject ? t("rejectSubmit") : t("photoSubmit")} successLabel={reject ? t("rejectDone") : t("photoDone")} valid={reason.trim().length >= 3} danger={reject}
      onSubmit={() => (reject ? rejectMemberAction : requestNewPhotoAction)({ member_id: id, reason: reason.trim() })}>
      <Field id="rs-reason" label={reject ? t("rejectReason") : t("photoReason")} hint={t("shownToPerson")}><Textarea id="rs-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-24" /></Field>
    </FormDialog>
  );
}

export function DecideDialog({ id, name, kind }: { id: string; name: string; kind: "arrangement" | "change" }) {
  const t = useTranslations("admin");
  const [note, setNote] = React.useState("");
  const act = kind === "arrangement" ? decideArrangementAction : decideProfileChangeAction;
  return (
    <div className="flex flex-wrap gap-2">
      <FormDialog trigger={t("approve")} triggerVariant="primary" title={t("decideApproveTitle", { name })} submitLabel={t("approveSubmit")} successLabel={t("decideApproved")} onSubmit={() => act({ id, approve: true, note: note.trim() || undefined })}>
        <Field id="dc-note-a" label={t("noteOptional")}><Input id="dc-note-a" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </FormDialog>
      <FormDialog trigger={t("decline")} title={t("decideDeclineTitle", { name })} submitLabel={t("declineSubmit")} successLabel={t("decideDeclined")} valid={note.trim().length >= 3} danger onSubmit={() => act({ id, approve: false, note: note.trim() })}>
        <Field id="dc-note-d" label={t("declineReason")} hint={t("shownToPerson")}><Textarea id="dc-note-d" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-20" /></Field>
      </FormDialog>
    </div>
  );
}

export function EndArrangementDialog({ id, name, min }: { id: string; name: string; min: string }) {
  const t = useTranslations("admin");
  const [month, setMonth] = React.useState(min.slice(0, 7));
  return (
    <FormDialog trigger={t("endArrangement")} title={t("endTitle", { name })} description={t("endDescription")} submitLabel={t("endSubmit")} successLabel={t("endDone")} valid={!!month && month >= min.slice(0, 7)} onSubmit={() => endArrangementAction({ id, end_month: `${month}-01` })}>
      <Field id="en-month" label={t("lastMonth")}><Input id="en-month" type="month" min={min.slice(0, 7)} value={month} onChange={(e) => setMonth(e.target.value)} /></Field>
    </FormDialog>
  );
}
