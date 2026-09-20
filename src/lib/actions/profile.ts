"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { callRpc, invalid, type ActionResult } from "./rpc";
import { getContext } from "@/lib/auth/session";

const phone = z.string().trim().regex(/^(\+?[0-9]{9,15})?$/, "phone_invalid");

export async function setLocaleAction(locale: "en" | "sw"): Promise<void> {
  (await cookies()).set("locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const ctx = await getContext();
  if (ctx?.member && ctx.member.status !== "rejected") {
    await callRpc("update_my_profile", { p_phone: ctx.member.phone ?? "", p_language: locale });
  }
}

export async function updateProfileAction(input: { phone: string; language: "en" | "sw" }): Promise<ActionResult> {
  const parsed = z.object({ phone, language: z.enum(["en", "sw"]) }).safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const r = await callRpc("update_my_profile", { p_phone: parsed.data.phone, p_language: parsed.data.language });
  if (r.ok) (await cookies()).set("locale", parsed.data.language, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return r;
}

export async function setAvatarAction(path: string): Promise<ActionResult> {
  return callRpc("set_my_avatar", { p_path: path });
}

export async function resubmitRequestAction(): Promise<ActionResult> {
  return callRpc("resubmit_request", {});
}

export async function requestArrangementAction(input: { kind: string; start_month: string; end_month?: string; aux_goal?: string }): Promise<ActionResult> {
  const parsed = z.object({
    kind: z.enum(["auxiliary_pioneer", "regular_pioneer", "special_pioneer"]),
    start_month: z.string().regex(/^\d{4}-\d{2}-01$/),
    end_month: z.string().regex(/^\d{4}-\d{2}-01$/).optional().or(z.literal("")),
    aux_goal: z.enum(["15", "30"]).optional(),
  }).safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  return callRpc("request_arrangement", {
    p_kind: v.kind, p_start_month: v.start_month, p_end_month: v.end_month || null,
    p_aux_goal: v.kind === "auxiliary_pioneer" ? Number(v.aux_goal ?? "15") : null,
  });
}

export async function requestProfileChangeAction(input: { kind: "full_name" | "username"; value: string }): Promise<ActionResult> {
  const parsed = z.object({ kind: z.enum(["full_name", "username"]), value: z.string().trim().min(2).max(120) }).safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return callRpc("request_profile_change", { p_kind: parsed.data.kind, p_new_value: parsed.data.value });
}

export async function markNotificationsReadAction(ids: string[]): Promise<ActionResult> {
  const parsed = z.array(z.string().uuid()).max(100).safeParse(ids);
  if (!parsed.success) return invalid(parsed.error);
  return callRpc("mark_notifications_read", { p_ids: parsed.data });
}
