// Issues ten single-use recovery codes, shown once. Stored only as HMAC hashes (AUTH-09, §16.2).
// Caller must be a signed-in Elder or Ministerial Servant with a verified second factor (aal2).
import { caller, env, hmacHex, json, serviceClient } from "../_shared/http.ts";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no look-alike characters

function makeCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${chars.slice(0, 5)}-${chars.slice(5)}`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const c = await caller(req);
  if (!c || !c.status) return json({ error: "unauthorized" }, 401);
  if (!["elder", "ministerial_servant"].includes(c.status.role) || !c.status.aal2) return json({ error: "forbidden" }, 403);

  const db = serviceClient();
  const pepper = env("RECOVERY_PEPPER");
  const codes = Array.from({ length: 10 }, makeCode);
  await db.from("recovery_codes").delete().eq("member_id", c.status.member_id).is("used_at", null);
  const rows = await Promise.all(codes.map(async (code) => ({ member_id: c.status!.member_id, code_hash: await hmacHex(pepper, code.replace("-", "")) })));
  const { error } = await db.from("recovery_codes").insert(rows);
  if (error) return json({ error: "store_failed" }, 500);
  return json({ codes });
});
