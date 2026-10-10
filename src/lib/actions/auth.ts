"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { publicEnv, PRIVACY_VERSION, TERMS_VERSION } from "@/lib/env";
import { requestAccessSchema, resetRequestSchema, newPasswordSchema, signInSchema, totpCodeSchema, type RequestAccessInput, type SignInInput } from "@/lib/schemas/auth";
import { normalizeUsername } from "@/lib/domain/username";
import { invalid, type ActionResult } from "./rpc";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;

function hash(value: string): string {
  const salt = process.env.RATE_LIMIT_SALT;
  if (!salt) throw new Error("RATE_LIMIT_SALT is not set");
  return createHmac("sha256", salt).update(value).digest("hex");
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

/** AUTH-04/05: one field for username or email; identical errors for "no such user" and "wrong password"; throttled. */
export async function signInAction(input: SignInInput): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { identifier, password, next } = parsed.data;
  const id = identifier.toLowerCase();
  const idHash = hash(id);
  const ipHash = hash(await clientIp());
  const service = createServiceClient();
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  const [byId, byIp] = await Promise.all([
    service.from("auth_attempts").select("id", { count: "exact", head: true }).eq("kind", "signin").eq("identifier_hash", idHash).eq("success", false).gte("at", since),
    service.from("auth_attempts").select("id", { count: "exact", head: true }).eq("kind", "signin").eq("ip_hash", ipHash).eq("success", false).gte("at", since),
  ]);
  if ((byId.count ?? 0) >= MAX_FAILS || (byIp.count ?? 0) >= MAX_FAILS) return { ok: false, code: "too_many_attempts" };

  // Resolve a username to its email on the server only; the email is never returned to the browser.
  let email = id;
  if (!id.includes("@")) {
    const { data } = await service.from("members").select("email").eq("username", normalizeUsername(id)).maybeSingle();
    email = data?.email ?? "no-such-user@invalid.example"; // still call sign-in so timing stays similar
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  await service.from("auth_attempts").insert({ kind: "signin", identifier_hash: idHash, ip_hash: ipHash, success: !error });
  if (error) {
    if (error.code === "email_not_confirmed") return { ok: false, code: "email_not_confirmed" };
    return { ok: false, code: "invalid_credentials" };
  }
  redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/app");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function checkUsernameAction(username: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("username_available", { p_username: normalizeUsername(username) });
  return data === true;
}

/**
 * AUTH-01 step 1. The photo comes after email confirmation, because uploads need a signed-in session.
 * If the project has "Confirm email" turned OFF (e.g. while no SMTP provider is configured), Supabase
 * returns a session immediately instead of requiring a click-through link. `emailConfirmed` tells the
 * form which case happened, so it can send the person straight to the photo step instead of showing
 * "check your email" forever.
 */
export async function requestAccessAction(input: RequestAccessInput): Promise<ActionResult<{ emailConfirmed: boolean }>> {
  const parsed = requestAccessSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;

  const service = createServiceClient();
  const ipHash = hash(await clientIp());
  const { count } = await service.from("auth_attempts").select("id", { count: "exact", head: true })
    .eq("kind", "signup").eq("ip_hash", ipHash).gte("at", new Date(Date.now() - 3_600_000).toISOString());
  if ((count ?? 0) >= 5) return { ok: false, code: "too_many_attempts" };
  await service.from("auth_attempts").insert({ kind: "signup", identifier_hash: hash(v.email), ip_hash: ipHash, success: true });

  if (!(await checkUsernameAction(v.username))) return { ok: false, code: "invalid", fields: { username: "username_taken" } };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: v.email,
    password: v.password,
    options: {
      emailRedirectTo: `${publicEnv.siteUrl}/auth/confirm?next=/pending`,
      data: {
        congregation: publicEnv.defaultCongregation,
        full_name: v.full_name, username: v.username, phone: v.phone, group_id: v.group_id,
        arrangement: v.arrangement, aux_goal: v.aux_goal ?? null, language: v.language,
        consent_privacy: PRIVACY_VERSION, consent_terms: TERMS_VERSION,
      },
    },
  });
  if (error) return { ok: false, code: error.code === "weak_password" ? "invalid" : "signup_failed", fields: error.code === "weak_password" ? { password: "password_common" } : undefined };
  // A session on the response means email confirmation is off and sign-up already signed them in.
  return { ok: true, data: { emailConfirmed: !!data.session } };
}

export async function requestPasswordResetAction(input: { email: string }): Promise<ActionResult> {
  const parsed = resetRequestSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  // Same answer whether or not the address exists.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${publicEnv.siteUrl}/auth/confirm?next=/reset-password/update` });
  return { ok: true };
}

export async function updatePasswordAction(input: { password: string; confirm: string }): Promise<ActionResult> {
  const parsed = newPasswordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, code: "unknown" };
  redirect("/app");
}

// ---- Two-factor (TOTP) --------------------------------------------------------------------------------------------

export async function enrollTotpAction(): Promise<ActionResult<{ factorId: string; qr: string; secret: string }>> {
  const supabase = await createClient();
  const { data: list } = await supabase.auth.mfa.listFactors();
  for (const f of list?.all ?? []) if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Ministry Report ${new Date().toISOString().slice(0, 10)}` });
  if (error || !data) return { ok: false, code: "unknown" };
  return { ok: true, data: { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret } };
}

export async function verifyTotpAction(input: { factorId: string; code: string }): Promise<ActionResult> {
  const parsed = totpCodeSchema.safeParse({ code: input.code });
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: input.factorId });
  if (cErr || !challenge) return { ok: false, code: "unknown" };
  const { error } = await supabase.auth.mfa.verify({ factorId: input.factorId, challengeId: challenge.id, code: parsed.data.code });
  if (error) return { ok: false, code: "mfa_invalid" };
  return { ok: true };
}

export async function currentTotpFactorAction(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.listFactors();
  return data?.totp.find((f) => f.status === "verified")?.id ?? null;
}

async function callFunction<T>(name: string, body: Record<string, unknown>): Promise<ActionResult<T>> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { ok: false, code: "forbidden" };
  const res = await fetch(`${publicEnv.supabaseUrl}/functions/v1/${name}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json", apikey: publicEnv.anonKey },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) return { ok: false, code: typeof json.error === "string" ? json.error : "unknown" };
  return { ok: true, data: json as T };
}

export async function issueRecoveryCodesAction(): Promise<ActionResult<{ codes: string[] }>> {
  return callFunction("issue-recovery-codes", {});
}

export async function spendRecoveryCodeAction(input: { code: string }): Promise<ActionResult> {
  const r = await callFunction("use-recovery-code", { code: input.code });
  if (!r.ok) return r.code === "too_many_attempts" ? r : { ok: false, code: "recovery_invalid" };
  const supabase = await createClient();
  await supabase.auth.refreshSession();
  return { ok: true };
}

export async function createRecoveryLinkAction(memberId: string): Promise<ActionResult<{ link: string }>> {
  return callFunction("create-recovery-link", { member_id: memberId });
}
