"use server";

import { z } from "zod";
import { callRpc, invalid, type ActionResult } from "./rpc";
import { reportSchema, type ReportInput } from "@/lib/schemas/report";

export async function submitReportAction(input: ReportInput): Promise<ActionResult<string>> {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  return callRpc<string>("submit_report", {
    p_month: v.month, p_category: v.category, p_participated: v.participated, p_hours: v.hours,
    p_studies: v.studies, p_comment: v.comment, p_request_id: v.request_id,
  });
}

/** LOG-08: carries leftover minutes into next month's log. Called right after a successful pioneer submission;
 * safe to retry or skip on failure since it only ever adds a convenience entry, never touches the report itself. */
export async function applyLogCarryoverAction(reportId: string): Promise<ActionResult> {
  return callRpc("apply_log_carryover", { p_report_id: reportId });
}

/** COR-01: request a correction on a locked report. Only one open request per report; the database enforces it. */
export async function requestCorrectionAction(input: unknown): Promise<ActionResult> {
  const parsed = z.object({
    report_id: z.string().uuid(), reason: z.string().trim().min(3, "reason_required").max(300),
    what_wrong: z.array(z.enum(["hours", "studies", "participation", "comment", "other"])).min(1, "bad_kind"),
  }).safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return callRpc("request_correction", { p_report_id: parsed.data.report_id, p_what_wrong: parsed.data.what_wrong, p_reason: parsed.data.reason });
}

const resubmitSchema = reportSchema.omit({ month: true }).extend({ report_id: z.string().uuid() });

/** REP-05/06 for a reopened report: no extra deadline, only the content changes (COR-03). */
export async function resubmitReportAction(input: unknown): Promise<ActionResult<string>> {
  const parsed = resubmitSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  return callRpc<string>("resubmit_report", {
    p_report_id: v.report_id, p_category: v.category, p_participated: v.participated, p_hours: v.hours,
    p_studies: v.studies, p_comment: v.comment, p_request_id: v.request_id,
  });
}
