export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { requireRole } from "@/lib/auth/session";
import { buildBackupArchive } from "@/lib/exports/backup";
import { logExport } from "@/lib/exports/audit";

/** EXP-04. POST /api/exports/backup { passphrase } — the archive is never stored, only streamed back once.
 * §16.6: this is the Elder's monthly manual backup, mandatory while the project is on the Supabase Free plan
 * (no automatic daily backups, R-03) and the safety net for gate G-8's restore drill either way. */
export async function POST(request: Request) {
  const { member } = await requireRole("elder", "/admin/exports");
  const body = await request.json().catch(() => null) as { passphrase?: string } | null;
  const passphrase = body?.passphrase ?? "";
  if (passphrase.length < 12) return new Response("passphrase_too_short", { status: 400 });

  const bytes = await buildBackupArchive(passphrase);
  await logExport("backup", { by: member.full_name });

  return new Response(bytes, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="ministry-report_backup_${new Date().toISOString().slice(0, 10)}.zip"`,
    },
  });
}
