// Sends due email deliveries. Called every 5 minutes by pg_cron (only when something is due).
// Auth: Bearer DISPATCH_SECRET (verify_jwt is off). One small job per call keeps CPU time low on the free plan.
import { bearer, env, json, safeEqual, serviceClient } from "../_shared/http.ts";
import { render, type Lang } from "../_shared/templates.ts";

interface Claimed {
  delivery_id: number; channel: string; kind: string; payload: Record<string, unknown>;
  member_id: string; email: string | null; full_name: string; language: Lang; attempts: number;
}

const MAX_ATTEMPTS = 5;

async function sendEmail(to: string, toName: string, subject: string, text: string, html: string): Promise<void> {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": env("BREVO_API_KEY"), "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: Deno.env.get("MAIL_FROM_NAME") ?? "Ministry Report", email: env("MAIL_FROM_EMAIL") },
      to: [{ email: to, name: toName }], subject, textContent: text, htmlContent: html,
    }),
  });
  if (!res.ok) throw new Error(`mail provider ${res.status}`);
}

Deno.serve(async (req) => {
  const token = bearer(req);
  if (!token || !safeEqual(token, env("DISPATCH_SECRET"))) return json({ error: "unauthorized" }, 401);

  const db = serviceClient();
  const { data, error } = await db.rpc("claim_deliveries", { p_limit: 25 });
  if (error) return json({ error: "claim_failed" }, 500);

  const siteUrl = env("SITE_URL");
  let sent = 0, failed = 0, skipped = 0;
  for (const d of (data ?? []) as Claimed[]) {
    try {
      if (d.channel !== "email") { await db.rpc("finish_delivery", { p_id: d.delivery_id, p_status: "skipped", p_error: "channel not enabled in this release" }); skipped++; continue; }
      const msg = render(d.kind, d.language, d.full_name, d.payload, siteUrl);
      if (!d.email || !msg) { await db.rpc("finish_delivery", { p_id: d.delivery_id, p_status: "skipped", p_error: d.email ? "no template" : "no email address" }); skipped++; continue; }
      await sendEmail(d.email, d.full_name, msg.subject, msg.text, msg.html);
      await db.rpc("finish_delivery", { p_id: d.delivery_id, p_status: "sent" });
      sent++;
    } catch (e) {
      // Errors are recorded without personal data. Retry until MAX_ATTEMPTS, then mark failed.
      const final = d.attempts >= MAX_ATTEMPTS;
      if (final) await db.rpc("finish_delivery", { p_id: d.delivery_id, p_status: "failed", p_error: (e as Error).message });
      failed++;
    }
  }
  return json({ sent, failed, skipped });
});
