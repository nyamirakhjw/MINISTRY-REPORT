// An Elder generates a one-time password-recovery link to hand over in person (AUTH-07). Audited.
// Elders never see or set another person's password.
import { caller, json, serviceClient } from "../_shared/http.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const c = await caller(req);
  if (!c || !c.status) return json({ error: "unauthorized" }, 401);
  if (c.status.role !== "elder" || !c.status.aal2) return json({ error: "forbidden" }, 403);

  let memberId = "";
  try { memberId = String((await req.json()).member_id ?? ""); } catch { return json({ error: "bad_request" }, 400); }

  const db = serviceClient();
  const { data: caller_m } = await db.from("members").select("congregation_id").eq("id", c.status.member_id).single();
  const { data: target } = await db.from("members").select("id, email, congregation_id, user_id, status").eq("id", memberId).maybeSingle();
  if (!target || !caller_m || target.congregation_id !== caller_m.congregation_id || !target.email || !target.user_id || target.status !== "active") {
    return json({ error: "not_found" }, 404);
  }
  const siteUrl = Deno.env.get("SITE_URL") ?? "";
  const { data, error } = await db.auth.admin.generateLink({ type: "recovery", email: target.email, options: { redirectTo: `${siteUrl}/reset-password/update` } });
  if (error || !data?.properties?.hashed_token) return json({ error: "link_failed" }, 500);

  await db.from("audit_log").insert({
    congregation_id: target.congregation_id, actor_member_id: c.status.member_id, action: "auth.recovery_link_created",
    entity_type: "members", entity_id: target.id,
  });
  const link = `${siteUrl}/auth/confirm?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=recovery&next=/reset-password/update`;
  return json({ link });
});
