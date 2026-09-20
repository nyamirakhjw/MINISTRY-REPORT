"use server";

import { callRpc, invalid, type ActionResult } from "./rpc";
import { reportSchema, type ReportInput } from "@/lib/schemas/report";

export async function submitReportAction(input: ReportInput): Promise<ActionResult> {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  return callRpc("submit_report", {
    p_month: v.month, p_category: v.category, p_participated: v.participated, p_hours: v.hours,
    p_studies: v.studies, p_comment: v.comment, p_request_id: v.request_id,
  });
}
