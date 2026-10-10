import "server-only";
import { ZipWriter, Uint8ArrayWriter, TextReader, Uint8ArrayReader } from "@zip.js/zip.js";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { styleHeaderRow, autofitColumns } from "./excel/styling";

/** EXP-04: encrypted archive (Excel + JSON), members/arrangements/reports/corrections/audit log/settings.
 * Return visits and daily logs are deliberately excluded (D-35). Runs under the Elder's own session so RLS
 * naturally scopes every query to their one congregation — no service role is used here. */
export async function buildBackupArchive(passphrase: string): Promise<Uint8Array> {
  const supabase = await createClient();
  const [{ data: manifest }, { data: congregation }, { data: members }, { data: groups }, { data: arrangements },
         { data: reports }, { data: corrections }, { data: audit }] = await Promise.all([
    supabase.rpc("backup_manifest"),
    supabase.from("congregations").select("id, slug, name, tagline, timezone, settings").single(),
    supabase.from("members").select("*"),
    supabase.from("groups").select("*"),
    supabase.from("service_arrangements").select("*"),
    supabase.from("reports").select("*"),
    supabase.from("report_corrections").select("*"),
    supabase.from("audit_log").select("*").order("at", { ascending: false }),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Ministry Report";
  wb.title = "Full backup";
  const addSheet = (name: string, rows: Record<string, unknown>[] | null) => {
    const ws = wb.addWorksheet(name);
    const cols = rows && rows.length > 0 ? Object.keys(rows[0]) : ["(no rows)"];
    ws.addRow(cols);
    styleHeaderRow(ws.getRow(1));
    (rows ?? []).forEach((r) => ws.addRow(cols.map((c) => { const v = r[c]; return typeof v === "object" && v !== null ? JSON.stringify(v) : (v as string | number | boolean | null); })));
    autofitColumns(ws, cols.map(() => 22));
    ws.views = [{ state: "frozen", ySplit: 1 }];
  };
  addSheet("Members", members);
  addSheet("Groups", groups);
  addSheet("Arrangements", arrangements);
  addSheet("Reports", reports);
  addSheet("Corrections", corrections);
  addSheet("AuditLog", audit);
  const excelBuffer = new Uint8Array(await wb.xlsx.writeBuffer());

  const zipWriter = new ZipWriter(new Uint8ArrayWriter(), { password: passphrase, encryptionStrength: 3, zipCrypto: false });
  await zipWriter.add("manifest.json", new TextReader(JSON.stringify(manifest ?? {}, null, 2)));
  await zipWriter.add("congregation.json", new TextReader(JSON.stringify(congregation ?? {}, null, 2)));
  await zipWriter.add("members.json", new TextReader(JSON.stringify(members ?? [], null, 2)));
  await zipWriter.add("groups.json", new TextReader(JSON.stringify(groups ?? [], null, 2)));
  await zipWriter.add("arrangements.json", new TextReader(JSON.stringify(arrangements ?? [], null, 2)));
  await zipWriter.add("reports.json", new TextReader(JSON.stringify(reports ?? [], null, 2)));
  await zipWriter.add("corrections.json", new TextReader(JSON.stringify(corrections ?? [], null, 2)));
  await zipWriter.add("audit_log.json", new TextReader(JSON.stringify(audit ?? [], null, 2)));
  await zipWriter.add("backup.xlsx", new Uint8ArrayReader(excelBuffer));
  return zipWriter.close();
}
