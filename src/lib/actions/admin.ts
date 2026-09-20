"use server";

import { callRpc, invalid, type ActionResult } from "./rpc";
import * as s from "@/lib/schemas/admin";

export async function approveMemberAction(input: unknown): Promise<ActionResult> {
  const p = s.approveSchema.safeParse(input);
  if (!p.success) return invalid(p.error);
  return callRpc("approve_member", { p_member: p.data.member_id, p_full_name: p.data.full_name, p_group: p.data.group_id, p_first_report_month: p.data.first_report_month ?? null });
}
export async function rejectMemberAction(input: unknown): Promise<ActionResult> {
  const p = s.reasonSchema.safeParse(input);
  if (!p.success) return invalid(p.error);
  return callRpc("reject_member", { p_member: p.data.member_id, p_reason: p.data.reason });
}
export async function requestNewPhotoAction(input: unknown): Promise<ActionResult> {
  const p = s.reasonSchema.safeParse(input);
  if (!p.success) return invalid(p.error);
  return callRpc("request_new_photo", { p_member: p.data.member_id, p_note: p.data.reason });
}
export async function decideArrangementAction(input: unknown): Promise<ActionResult> {
  const p = s.decideSchema.safeParse(input);
  if (!p.success) return invalid(p.error);
  return callRpc("decide_arrangement", { p_id: p.data.id, p_approve: p.data.approve, p_note: p.data.note ?? null });
}
export async function endArrangementAction(input: unknown): Promise<ActionResult> {
  const p = s.endArrangementSchema.safeParse(input);
  if (!p.success) return invalid(p.error);
  return callRpc("end_arrangement", { p_id: p.data.id, p_end_month: p.data.end_month });
}
export async function decideProfileChangeAction(input: unknown): Promise<ActionResult> {
  const p = s.decideSchema.safeParse(input);
  if (!p.success) return invalid(p.error);
  return callRpc("decide_profile_change", { p_id: p.data.id, p_approve: p.data.approve, p_note: p.data.note ?? null });
}
export async function setRoleAction(input: unknown): Promise<ActionResult> {
  const p = s.roleSchema.safeParse(input);
  if (!p.success) return invalid(p.error);
  return callRpc("set_member_role", { p_member: p.data.member_id, p_role: p.data.role });
}
export async function updateMemberAction(input: unknown): Promise<ActionResult> {
  const p = s.memberUpdateSchema.safeParse(input);
  if (!p.success) return invalid(p.error);
  return callRpc("admin_update_member", { p_member: p.data.member_id, p_group: p.data.group_id, p_full_name: p.data.full_name });
}
export async function setStatusAction(input: unknown): Promise<ActionResult> {
  const p = s.statusSchema.safeParse(input);
  if (!p.success) return invalid(p.error);
  return callRpc("set_member_status", { p_member: p.data.member_id, p_status: p.data.status, p_effective_month: p.data.effective_month ?? null });
}
export async function createManagedProfileAction(input: unknown): Promise<ActionResult> {
  const p = s.managedSchema.safeParse(input);
  if (!p.success) return invalid(p.error);
  return callRpc("create_managed_profile", { p_full_name: p.data.full_name, p_group: p.data.group_id, p_phone: p.data.phone || null });
}
export async function submitOnBehalfAction(input: unknown): Promise<ActionResult> {
  const p = s.onBehalfSchema.safeParse(input);
  if (!p.success) return invalid(p.error);
  const v = p.data;
  return callRpc("submit_report_on_behalf", {
    p_member: v.member_id, p_month: v.month, p_category: v.category, p_participated: v.participated, p_hours: v.hours,
    p_studies: v.studies, p_comment: v.comment, p_received_at: v.received_at ? new Date(v.received_at).toISOString() : null,
    p_reason: v.reason, p_request_id: v.request_id,
  });
}
export async function closeMonthAction(input: unknown): Promise<ActionResult> {
  const p = s.closeMonthSchema.safeParse(input);
  if (!p.success) return invalid(p.error);
  return callRpc("close_month_not_reported", { p_member: p.data.member_id, p_month: p.data.month, p_reason: p.data.reason });
}
export async function createCongregationAction(input: unknown): Promise<ActionResult> {
  const p = s.congregationSchema.safeParse(input);
  if (!p.success) return invalid(p.error);
  const groups = p.data.groups.split(",").map((g) => g.trim()).filter(Boolean);
  return callRpc("platform_create_congregation", { p_slug: p.data.slug, p_name: p.data.name, p_tagline: p.data.tagline ?? null, p_groups: groups });
}

export async function platformMembersAction(congregationId: string): Promise<ActionResult<{ id: string; full_name: string; username: string; role: string }[]>> {
  const p = s.uuidOnly.safeParse(congregationId);
  if (!p.success) return invalid(p.error);
  return callRpc("platform_members", { p_congregation: p.data });
}
