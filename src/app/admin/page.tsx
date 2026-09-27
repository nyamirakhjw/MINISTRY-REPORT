import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { MonthPicker } from "@/components/admin/month-picker";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ReportingRing, TrendLine, OnTimeVsLate, GoalAttainmentChart, HoursByCategory, CumulativeHours } from "@/components/admin/trend-charts";
import { requireRole } from "@/lib/auth/session";
import { getMonthRows, parseMonthParam, byGroup, getMonthTrend, getGoalAttainment, getServiceYearByCategory, compareTo } from "@/lib/admin-data";
import { summarizeMonth } from "@/lib/domain/summarize";
import { serviceYearOf } from "@/lib/domain/time";
import { formatMonth } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("overview") };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { member } = await requireRole("ministerial_servant", "/admin");
  if (member.role !== "elder") redirect("/admin/approvals");
  const t = await getTranslations("admin");
  const cat = await getTranslations("categories");
  const locale = await getLocale();
  const month = parseMonthParam((await searchParams).month);
  const serviceYear = serviceYearOf(month);

  const [rows, trend, goals, categoryMonths] = await Promise.all([
    getMonthRows(month), getMonthTrend(month, 24), getGoalAttainment(month), getServiceYearByCategory(serviceYear),
  ]);
  const s = summarizeMonth(rows);
  const groups = byGroup(rows);
  const cmp = compareTo(trend, month);
  const syToDate = categoryMonths.filter((c) => c.month <= month);

  const kpis = [
    { label: t("kpiReported"), value: `${s.reported} / ${s.obligated}` },
    { label: t("kpiNotYet"), value: String(s.notYet) },
    { label: t("kpiPercent"), value: `${s.reportingPercent}%` },
    { label: t("kpiLate"), value: String(s.late) },
    { label: t("kpiHours"), value: String(s.totalHours) },
    { label: t("kpiStudies"), value: String(s.totalStudies) },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1>{t("overviewTitle", { month: formatMonth(month, locale) })}</h1>
        <Button asChild variant="secondary"><Link href="/admin/exports">{t("goToExports")}</Link></Button>
      </div>
      <MonthPicker month={month} />
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-y border-border py-4 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (<div key={k.label}><dt className="text-sm text-muted-foreground">{k.label}</dt><dd className="font-heading text-2xl tabular">{k.value}</dd></div>))}
      </dl>

      <section aria-labelledby="by-cat"><h2 id="by-cat" className="mb-2">{t("byCategory")}</h2>
        <Table className="min-w-0">
          <THead><TR><TH>{t("category")}</TH><TH>{t("reporting")}</TH><TH>{t("hours")}</TH><TH>{t("studies")}</TH></TR></THead>
          <TBody>
            {(["publisher", "auxiliary_pioneer", "regular_pioneer", "special_pioneer"] as const).map((k) => (
              <TR key={k}><TD>{cat(k)}</TD><TD>{s.byCategory[k].reporting}</TD><TD>{k === "publisher" ? "–" : s.byCategory[k].hours}</TD><TD>{s.byCategory[k].studies}</TD></TR>
            ))}
            <TR className="font-semibold"><TD>{t("congregationTotal")}</TD><TD>{s.reported}</TD><TD>{s.totalHours}</TD><TD>{s.totalStudies}</TD></TR>
          </TBody>
        </Table>
      </section>
      {s.closed > 0 && <p className="text-muted-foreground">{t("closedNote", { count: s.closed })}</p>}

      {/* ADM-05: comparisons. Never ranks anyone — congregation-wide reporting percent only. */}
      <section aria-labelledby="cmp" className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-surface p-4 sm:grid-cols-3">
        <h2 id="cmp" className="sr-only">{t("comparisons")}</h2>
        <div><p className="text-sm text-muted-foreground">{t("thisMonth")}</p><p className="font-heading text-2xl tabular">{cmp.reportingPercent.current ?? "–"}%</p></div>
        <div><p className="text-sm text-muted-foreground">{t("previousMonth")}</p><p className="font-heading text-2xl tabular">{cmp.reportingPercent.previousMonth ?? "–"}%</p></div>
        <div><p className="text-sm text-muted-foreground">{t("sameMonthLastYear")}</p><p className="font-heading text-2xl tabular">{cmp.reportingPercent.sameMonthLastYear ?? "–"}%</p></div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReportingRing reported={s.reported} notYet={s.notYet} closed={s.closed} groups={groups} />
        <TrendLine trend={trend} />
        <OnTimeVsLate trend={trend} />
        <GoalAttainmentChart data={goals} />
        <HoursByCategory byCategory={s.byCategory} />
        <CumulativeHours byCategoryMonths={syToDate} />
      </div>
    </div>
  );
}
