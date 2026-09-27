export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { requireRole } from "@/lib/auth/session";
import { getCongregationReportData } from "@/lib/exports/data";
import { buildCongregationExcel } from "@/lib/exports/excel/congregation-report";
import { logExport } from "@/lib/exports/audit";

/** EXP-01 (Excel). GET /api/exports/congregation-excel?month=2026-08-01&lang=en&comments=0 */
export async function GET(request: Request) {
  const { member } = await requireRole("elder", "/admin/exports");
  const url = new URL(request.url);
  const month = url.searchParams.get("month") ?? "";
  const lang = (url.searchParams.get("lang") === "sw" ? "sw" : "en") as "en" | "sw";
  const includeComments = url.searchParams.get("comments") === "1";
  if (!/^\d{4}-\d{2}-01$/.test(month)) return new Response("bad_month", { status: 400 });

  const data = await getCongregationReportData(month, member.full_name);
  const buffer = await buildCongregationExcel(data, { lang, includeComments, generatedBy: member.full_name });
  await logExport("congregation_excel", { month, lang, includeComments });

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ministry-report_${data.letterhead.congregationName.toLowerCase().replace(/\s+/g, "-")}_${month.slice(0, 7)}_congregation.xlsx"`,
    },
  });
}
