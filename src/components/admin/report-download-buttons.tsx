"use client";
import { useTranslations } from "next-intl";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MonthKey } from "@/lib/domain/time";

/**
 * Item 4 of the September change request: quick PDF/Excel downloads right on the Elder console's Reports
 * page, next to the month picker, instead of only on the Downloadables page. Reuses the exact same route
 * handlers and file design as Downloadables (EXP-01) — this is a second entry point, not a second design.
 *
 * Per your answer: this always downloads the complete official month record for every member, regardless of
 * whatever Group / Category / Status / search filters are set on this page's table — the small note under
 * the buttons says so. Comments stay off and the not-reported list stays on (the Downloadables page's
 * defaults); toggle those there if you want different settings for a particular download.
 *
 * Drop this into src/app/admin/reports/page.tsx next to your existing month picker:
 *
 *   <ReportDownloadButtons month={month} />
 */
export function ReportDownloadButtons({ month }: { month: MonthKey }) {
  const t = useTranslations("admin");
  const params = new URLSearchParams({ month, lang: "en", comments: "0", notReported: "1" }).toString();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="secondary" size="sm">
        <a href={`/api/exports/congregation?${params}`}>
          <FileDown className="size-4" aria-hidden="true" />{t("downloadPdf")}
        </a>
      </Button>
      <Button asChild variant="secondary" size="sm">
        <a href={`/api/exports/congregation-excel?${params}`}>
          <FileSpreadsheet className="size-4" aria-hidden="true" />{t("downloadExcel")}
        </a>
      </Button>
      <p className="w-full text-xs text-muted-foreground sm:w-auto">{t("downloadFullMonthNote")}</p>
    </div>
  );
}
