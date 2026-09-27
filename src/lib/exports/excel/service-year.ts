import ExcelJS from "exceljs";
import { styleHeaderRow, setupPrint, autofitColumns } from "./styling";
import type { CategoryMonth } from "@/lib/admin-data";
import type { Category } from "@/lib/domain/categories";

const LABEL: Record<Category, string> = { publisher: "Publishers", auxiliary_pioneer: "Auxiliary pioneers", regular_pioneer: "Regular pioneers", special_pioneer: "Special pioneers" };

/** EXP-02: month-by-month totals by category for the whole service year, one row per month. */
export async function buildServiceYearExcel(serviceYear: string, rows: CategoryMonth[], congregationName: string): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Ministry Report";
  wb.title = `Service-year summary — ${serviceYear}`;
  const ws = wb.addWorksheet("Service year");
  const cats: Category[] = ["publisher", "auxiliary_pioneer", "regular_pioneer", "special_pioneer"];
  ws.addRow(["Month", ...cats.flatMap((c) => [`${LABEL[c]} — reporting`, `${LABEL[c]} — hours`, `${LABEL[c]} — studies`])]);
  styleHeaderRow(ws.getRow(1));

  const byMonth = new Map<string, Map<Category, CategoryMonth>>();
  for (const r of rows) {
    if (!byMonth.has(r.month)) byMonth.set(r.month, new Map());
    byMonth.get(r.month)!.set(r.category, r);
  }
  for (const [month, byCat] of [...byMonth.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
    ws.addRow([month, ...cats.flatMap((c) => { const v = byCat.get(c); return [v?.reporting ?? 0, v?.hours ?? 0, v?.studies ?? 0]; })]);
  }
  ws.views = [{ state: "frozen", ySplit: 1 }];
  autofitColumns(ws, [14, ...cats.flatMap(() => [16, 12, 12])]);
  setupPrint(ws);

  const about = wb.addWorksheet("About");
  about.addRow(["Service year", serviceYear]);
  about.addRow(["Congregation", congregationName]);
  about.addRow(["Generated at", new Date().toISOString()]);
  autofitColumns(about, [20, 40]);

  return Buffer.from(await wb.xlsx.writeBuffer());
}
