export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { renderToBuffer } from "@react-pdf/renderer";
import { requireMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getLetterhead } from "@/lib/exports/data";
import { IndividualRecordPdf, type MemberYearRow } from "@/lib/exports/pdf/individual-record";
import { logExport } from "@/lib/exports/audit";

/** EXP-03. GET /api/exports/individual?year=2026-2027&member=<uuid optional>. Any member may pull their own
 * record with no `member` param; an Elder may pass another member's id (member_service_year enforces this). */
export async function GET(request: Request) {
  const { member } = await requireMember("/app/settings");
  const url = new URL(request.url);
  const year = url.searchParams.get("year") ?? "";
  const targetId = url.searchParams.get("member") || member.id;
  if (!/^\d{4}-\d{4}$/.test(year)) return new Response("bad_year", { status: 400 });

  const supabase = await createClient();
  const [{ data: months, error }, { data: target }, letterhead] = await Promise.all([
    supabase.rpc("member_service_year", { p_year: year, p_member: targetId }),
    supabase.from("members").select("full_name, group_id, groups(name)").eq("id", targetId).single(),
    getLetterhead(),
  ]);
  if (error) return new Response(error.message, { status: 403 });

  const rows = (months ?? []) as MemberYearRow[];
  const arrangement = rows.find((m) => m.category && m.category !== "publisher")?.category ?? null;
  const groupName = (target as unknown as { groups?: { name?: string } } | null)?.groups?.name ?? "—";
  const memberName = (target as unknown as { full_name?: string } | null)?.full_name ?? "Member";
  const generatedAt = new Date().toLocaleString("en", { timeZone: "Africa/Nairobi" });

  const buffer = await renderToBuffer(IndividualRecordPdf({
    letterhead, memberName, group: groupName, arrangement, serviceYear: year, months: rows, generatedAt,
  }));
  if (targetId !== member.id) await logExport("individual_record", { year, member_id: targetId });

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ministry-report_${memberName.toLowerCase().replace(/\s+/g, "-")}_${year}.pdf"`,
    },
  });
}
