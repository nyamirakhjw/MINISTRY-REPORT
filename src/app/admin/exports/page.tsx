import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ExportForm } from "@/components/exports/export-form";
import { BackupDialog } from "@/components/exports/backup-dialog";
import { requireRole } from "@/lib/auth/session";
import { defaultMonth } from "@/lib/admin-data";
import { serviceYearOf } from "@/lib/domain/time";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("exports") };
}

/** EXP-01 to EXP-07: every export runs under the signed-in Elder's own session, is never stored server-side,
 * and is recorded in the audit log (§7.11). */
export default async function Page() {
  await requireRole("elder", "/admin/exports");
  const t = await getTranslations("exports");
  const month = defaultMonth();
  const serviceYear = serviceYearOf(month);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1>{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("intro")}</p>
      </div>
      <ExportForm defaultMonth={month} defaultServiceYear={serviceYear} />
      <section aria-labelledby="backup" className="rounded-lg border border-border bg-surface p-5">
        <h2 id="backup" className="text-lg font-semibold">{t("backupTitle")}</h2>
        <p className="mt-1 text-muted-foreground">{t("backupIntro")}</p>
        <div className="mt-4"><BackupDialog /></div>
      </section>
    </div>
  );
}
