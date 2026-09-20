import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Member, Role } from "@/lib/types";

export interface Ctx {
  userId: string;
  email: string | null;
  member: Member | null;
  aal: "aal1" | "aal2";
  nextAal: "aal1" | "aal2";
  isPlatformAdmin: boolean;
}

/** One verified lookup per request. getUser() asks the auth server; cookies alone are never trusted. */
export const getContext = cache(async (): Promise<Ctx | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [{ data: member }, { data: aal }, { data: platform }] = await Promise.all([
    supabase.from("members").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.from("platform_admins").select("user_id").maybeSingle(),
  ]);
  return {
    userId: user.id,
    email: user.email ?? null,
    member: (member as Member | null) ?? null,
    aal: aal?.currentLevel === "aal2" ? "aal2" : "aal1",
    nextAal: aal?.nextLevel === "aal2" ? "aal2" : "aal1",
    isPlatformAdmin: !!platform,
  };
});

const RANK: Record<Role, number> = { publisher: 0, ministerial_servant: 1, elder: 2 };

function mfaRedirect(ctx: Ctx, next: string): never {
  redirect(ctx.nextAal === "aal2" ? `/mfa/verify?next=${encodeURIComponent(next)}` : `/mfa/enroll?next=${encodeURIComponent(next)}`);
}

export async function requireUser(next = "/app"): Promise<Ctx> {
  const ctx = await getContext();
  if (!ctx) redirect(`/signin?next=${encodeURIComponent(next)}`);
  return ctx;
}

/** Active member, with the second factor verified when the role needs it (AUTH-09). */
export async function requireMember(next = "/app"): Promise<Ctx & { member: Member }> {
  const ctx = await requireUser(next);
  if (!ctx.member || ctx.member.status !== "active") redirect("/pending");
  if (ctx.member.role !== "publisher" && ctx.aal !== "aal2") mfaRedirect(ctx, next);
  return ctx as Ctx & { member: Member };
}

export async function requireRole(min: Role, next: string): Promise<Ctx & { member: Member }> {
  const ctx = await requireMember(next);
  if (RANK[ctx.member.role] < RANK[min]) redirect("/app");
  return ctx;
}

export async function requirePlatformAdmin(): Promise<Ctx> {
  const ctx = await requireUser("/platform");
  if (!ctx.isPlatformAdmin) redirect("/app");
  if (ctx.aal !== "aal2") mfaRedirect(ctx, "/platform");
  return ctx;
}

/** Elder or Ministerial Servant who already passed the two-factor gate. */
export function isAdmin(role: Role): boolean {
  return role === "elder" || role === "ministerial_servant";
}
