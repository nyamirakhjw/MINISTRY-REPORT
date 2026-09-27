export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getLetterhead } from "@/lib/exports/data";
import { buildAuditLogExcel, type AuditRow } from "@/lib/exports/excel/audit-log";
import { logExport } from "@/lib/exports/audit";

interface Raw { at: string; action: string; entity_type: string; entity_id: string | null; reason: string | null; actor: { full_name: string } | null }

/** EXP-05. GET /api/exports/audit-log?from=2026-01-01&to=2026-12-31 (optional range). */
export async function GET(request: Request) {
  await requireRole("elder", "/admin/exports");
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const supabase = await createClient();
  let query = supabase.from("audit_log").select("at, action, entity_type, entity_id, reason, actor:members!audit_log_actor_member_id_fkey(full_name)").order("at", { ascending: false }).limit(20000);
  if (from) query = query.gte("at", from);
  if (to) query = query.lte("at", to);
  const { data } = await query;
  const rows: AuditRow[] = ((data ?? []) as unknown as Raw[]).map((r) => ({ at: r.at, action: r.action, entity_type: r.entity_type, entity_id: r.entity_id, reason: r.reason, actor_name: r.actor?.full_name ?? null }));

  const letterhead = await getLetterhead();
  const buffer = await buildAuditLogExcel(rows, letterhead.congregationName);
  await logExport("audit_log", { from, to, rows: rows.length });

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ministry-report_${letterhead.congregationName.toLowerCase().replace(/\s+/g, "-")}_audit-log.xlsx"`,
    },
  });
}
