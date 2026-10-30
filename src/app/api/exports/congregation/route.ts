export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { renderToBuffer } from "@react-pdf/renderer";
import { requireRole } from "@/lib/auth/session";
import { getCongregationReportData } from "@/lib/exports/data";
import { CongregationReportPdf } from "@/lib/exports/pdf/congregation-report";
import { logExport } from "@/lib/exports/audit";
import { downloadResponse, safeExport } from "@/lib/exports/respond";

/** EXP-01 (PDF). GET /api/exports/congregation?month=2026-08-01&lang=en&comments=0&notReported=1 */
export async function GET(request: Request) {
  return safeExport("congregation_pdf", async () => {
    const { member } = await requireRole("elder", "/admin/exports");
    const url = new URL(request.url);
    const month = url.searchParams.get("month") ?? "";
    const lang = (url.searchParams.get("lang") === "sw" ? "sw" : "en") as "en" | "sw";
    const includeComments = url.searchParams.get("comments") === "1";
    const includeNotReported = url.searchParams.get("notReported") !== "0";
    if (!/^\d{4}-\d{2}-01$/.test(month)) return new Response("bad_month", { status: 400 });

    const data = await getCongregationReportData(month, member.full_name);
    const generatedAt = new Date().toLocaleString("en", { timeZone: "Africa/Nairobi" });
    const buffer = await renderToBuffer(CongregationReportPdf({ data, lang, includeComments, includeNotReported, generatedAt }));
    await logExport("congregation_pdf", { month, lang, includeComments, includeNotReported });

    return downloadResponse(buffer, "application/pdf", `ministry-report_${data.letterhead.congregationName.toLowerCase().replace(/\s+/g, "-")}_${month.slice(0, 7)}_congregation.pdf`);
  });
}
