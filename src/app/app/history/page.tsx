import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { CorrectionRequestDialog } from "@/components/report/correction-request-dialog";
import { requireMember } from "@/lib/auth/session";
import { serviceYearOf } from "@/lib/domain/time";
import { formatDateTime, formatMonth } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { ReportRow } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("history") };
}

export default async function Page() {
  await requireMember("/app/history");
  const t = await getTranslations("history");
  const cat = await getTranslations("categories");
  const st = await getTranslations("status");
  const locale = await getLocale();
  const supabase = await createClient();
  const [{ data }, { data: openCorrections }] = await Promise.all([
    supabase.from("reports").select("*").order("month", { ascending: false }),
    supabase.from("report_corrections").select("report_id").eq("status", "pending"),
  ]);
  const rows = (data ?? []) as ReportRow[];
  const pendingCorrection = new Set((openCorrections ?? []).map((c) => c.report_id as string));
  const byYear = new Map<string, ReportRow[]>();
  for (const r of rows) byYear.set(serviceYearOf(r.month), [...(byYear.get(serviceYearOf(r.month)) ?? []), r]);

  return (
    <div className="flex flex-col gap-6">
      <h1>{t("title")}</h1>
      {rows.length === 0 ? <p className="rounded-lg border border-border bg-surface p-5">{t("empty")}</p> : null}
      {[...byYear.entries()].map(([year, list]) => (
        <section key={year} aria-labelledby={`y-${year}`}>
          <h2 id={`y-${year}`} className="text-lg">{t("serviceYear", { year })}</h2>
          <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-surface">
            {list.map((r) => (
              <li key={r.id} className="flex flex-col gap-1 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-lg font-semibold">{formatMonth(r.month, locale)}</span>
                  {r.status === "not_reported" ? <Badge tone="danger">{st("didNotReport")}</Badge>
                    : r.status === "reopened" ? <Badge tone="warning">{st("reopened")}</Badge>
                    : r.is_late ? <Badge tone="warning">{st("late")}</Badge> : <Badge tone="success">{st("onTime")}</Badge>}
                </div>
                {r.status === "reopened" ? (
                  <p><Link href="/app/report" className="font-semibold underline underline-offset-4">{t("fixItNow")}</Link></p>
                ) : r.status !== "not_reported" && (
                  <p className="text-muted-foreground tabular">
                    {r.category ? cat(r.category) : ""}
                    {r.category === "publisher" ? ` · ${r.participated ? t("participated") : t("didNotParticipate")}` : ` · ${t("hoursCount", { count: r.hours ?? 0 })}`}
                    {r.participated !== false ? ` · ${t("studiesCount", { count: r.studies ?? 0 })}` : ""}
                  </p>
                )}
                {r.comment ? <p className="text-base">{r.comment}</p> : null}
                <p className="text-sm text-muted-foreground">{r.submitted_via === "elder" ? t("byElder") : t("submittedAt", { time: formatDateTime(r.server_received_at, locale) })}</p>
                {r.status === "submitted" && (
                  pendingCorrection.has(r.id)
                    ? <p className="text-sm text-muted-foreground">{t("correctionPending")}</p>
                    : <div><CorrectionRequestDialog reportId={r.id} month={formatMonth(r.month, locale)} /></div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
