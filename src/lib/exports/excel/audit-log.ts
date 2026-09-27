import ExcelJS from "exceljs";
import { styleHeaderRow, setupPrint, autofitColumns } from "./styling";

export interface AuditRow { at: string; actor_name: string | null; action: string; entity_type: string; entity_id: string | null; reason: string | null }

/** EXP-05. Read-only export of the append-only audit log; exporting it is itself logged (log_export). */
export async function buildAuditLogExcel(rows: AuditRow[], congregationName: string): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Ministry Report";
  wb.title = "Audit log";
  const ws = wb.addWorksheet("Audit log");
  ws.addRow(["When", "Who", "Action", "Entity", "Entity ID", "Reason"]);
  styleHeaderRow(ws.getRow(1));
  for (const r of rows) ws.addRow([r.at, r.actor_name ?? "System", r.action, r.entity_type, r.entity_id ?? "", r.reason ?? ""]);
  ws.autoFilter = { from: "A1", to: "F1" };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  autofitColumns(ws, [22, 22, 26, 18, 24, 40]);
  setupPrint(ws);

  const about = wb.addWorksheet("About");
  about.addRow(["Congregation", congregationName]);
  about.addRow(["Rows", rows.length]);
  about.addRow(["Generated at", new Date().toISOString()]);
  autofitColumns(about, [20, 40]);

  return Buffer.from(await wb.xlsx.writeBuffer());
}
