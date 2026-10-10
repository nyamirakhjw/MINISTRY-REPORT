// A person who lost their device signs in with their password (aal1), then spends one recovery code here.
// A valid code removes their TOTP factors so they must enrol a new one immediately (§16.2). Throttled.
import { caller, env, hmacHex, json, serviceClient } from "../_shared/http.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const c = await caller(req);
  if (!c || !c.status) return json({ error: "unauthorized" }, 401);

  let code = "";
  try { code = String((await req.json()).code ?? ""); } catch { return json({ error: "bad_request" }, 400); }
  code = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== 10) return json({ error: "invalid_code" }, 400);

  const db = serviceClient();
  const salt = env("RATE_LIMIT_SALT");
  const idHash = await hmacHex(salt, c.user.id);
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count } = await db.from("auth_attempts").select("id", { count: "exact", head: true })
    .eq("kind", "recovery_code").eq("identifier_hash", idHash).eq("success", false).gte("at", since);
  if ((count ?? 0) >= 5) return json({ error: "too_many_attempts" }, 429);

  const hash = await hmacHex(env("RECOVERY_PEPPER"), code);
  const { data: row } = await db.from("recovery_codes").select("id")
    .eq("member_id", c.status.member_id).eq("code_hash", hash).is("used_at", null).maybeSingle();

  await db.from("auth_attempts").insert({ kind: "recovery_code", identifier_hash: idHash, ip_hash: idHash, success: !!row });
  if (!row) return json({ error: "invalid_code" }, 400);

  await db.from("recovery_codes").update({ used_at: new Date().toISOString() }).eq("id", row.id);
  const { data: factors } = await db.auth.admin.mfa.listFactors({ userId: c.user.id });
  for (const f of factors?.factors ?? []) await db.auth.admin.mfa.deleteFactor({ id: f.id, userId: c.user.id });
  await db.from("audit_log").insert({ actor_member_id: c.status.member_id, action: "auth.recovery_code_used", entity_type: "members", entity_id: c.status.member_id });
  return json({ ok: true });
});
