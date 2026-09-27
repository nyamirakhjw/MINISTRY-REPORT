export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getLetterhead } from "@/lib/exports/data";
import { buildServiceYearExcel } from "@/lib/exports/excel/service-year";
import { logExport } from "@/lib/exports/audit";
import type { CategoryMonth } from "@/lib/admin-data";

/** EXP-02 (Excel). GET /api/exports/service-year?year=2026-2027 */
export async function GET(request: Request) {
  await requireRole("elder", "/admin/exports");
  const url = new URL(request.url);
  const year = url.searchParams.get("year") ?? "";
  if (!/^\d{4}-\d{4}$/.test(year)) return new Response("bad_year", { status: 400 });

  const supabase = await createClient();
  const [{ data: rows }, letterhead] = await Promise.all([
    supabase.rpc("admin_service_year_by_category", { p_year: year }),
    getLetterhead(),
  ]);
  const buffer = await buildServiceYearExcel(year, (rows ?? []) as CategoryMonth[], letterhead.congregationName);
  await logExport("service_year_excel", { year });

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ministry-report_${letterhead.congregationName.toLowerCase().replace(/\s+/g, "-")}_${year}_service-year.xlsx"`,
    },
  });
}
