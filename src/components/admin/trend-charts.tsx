"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CHART_COLORS, CATEGORY_COLORS } from "@/lib/chart-colors";
import type { TrendPoint, GoalAttainment, CategoryMonth, GroupBreakdown } from "@/lib/admin-data";
import type { Category } from "@/lib/domain/categories";

// ADM-04: every chart here has a "view as table" fallback (§10.8) and never ranks individuals — every series
// below is a congregation- or category-level count, nothing per-person.

function ChartFrame({ title, table, children }: { title: string; table: React.ReactNode; children: React.ReactNode }) {
  const t = useTranslations("admin");
  const [asTable, setAsTable] = React.useState(false);
  return (
    <section aria-labelledby={title} className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 id={title} className="text-lg font-semibold">{title}</h3>
        <Button variant="ghost" size="sm" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
          {asTable ? t("viewAsChart") : t("viewAsTable")}
        </Button>
      </div>
      {asTable ? table : <div className="h-64 w-full">{children}</div>}
    </section>
  );
}

/** Reporting progress ring with the group split shown alongside it (ADM-04, ADM-03). */
export function ReportingRing({ reported, notYet, closed, groups }: { reported: number; notYet: number; closed: number; groups: GroupBreakdown[] }) {
  const t = useTranslations("admin");
  const data = [
    { name: t("kpiReported"), value: reported, color: CHART_COLORS.success },
    { name: t("kpiNotYet"), value: notYet, color: CHART_COLORS.warning },
    { name: t("closedShort"), value: closed, color: CHART_COLORS.muted },
  ];
  const table = (
    <Table><THead><TR><TH>{t("group")}</TH><TH>{t("reporting")}</TH><TH>{t("hours")}</TH><TH>{t("studies")}</TH></TR></THead>
      <TBody>{groups.map((g) => <TR key={g.group_id ?? "none"}><TD>{g.group_name}</TD><TD>{g.reported} / {g.obligated}</TD><TD>{g.hours}</TD><TD>{g.studies}</TD></TR>)}</TBody>
    </Table>
  );
  return (
    <ChartFrame title={t("reportingProgress")} table={table}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Legend />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/** Studies trend and reporting-percent trend, 6- or 12-month (ADM-05), sharing one toggle. */
export function TrendLine({ trend }: { trend: TrendPoint[] }) {
  const t = useTranslations("admin");
  const [span, setSpan] = React.useState<6 | 12>(6);
  const slice = trend.slice(-span).map((p) => ({ ...p, reportingPercent: p.obligated ? Math.round((p.reported / p.obligated) * 100) : 0 }));
  const table = (
    <Table><THead><TR><TH>{t("month")}</TH><TH>{t("reportingPercent")}</TH><TH>{t("studies")}</TH></TR></THead>
      <TBody>{slice.map((p) => <TR key={p.month}><TD>{p.month}</TD><TD>{p.reportingPercent}%</TD><TD>{p.studies}</TD></TR>)}</TBody>
    </Table>
  );
  return (
    <ChartFrame title={t("trend", { months: span })} table={table}>
      <div className="mb-2 flex gap-2">
        {[6, 12].map((n) => <Button key={n} size="sm" variant={span === n ? "primary" : "secondary"} onClick={() => setSpan(n as 6 | 12)}>{n}mo</Button>)}
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={slice}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} opacity={0.3} />
          <XAxis dataKey="month" tickFormatter={(m: string) => m.slice(0, 7)} tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="reportingPercent" name={t("reportingPercent")} stroke={CHART_COLORS.navy} strokeWidth={2} dot={{ r: 3 }} />
          <Line yAxisId="right" type="monotone" dataKey="studies" name={t("studies")} stroke={CHART_COLORS.gold} strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/** On-time vs late, trailing 6 months (ADM-04). */
export function OnTimeVsLate({ trend }: { trend: TrendPoint[] }) {
  const t = useTranslations("admin");
  const slice = trend.slice(-6).map((p) => ({ month: p.month, onTime: Math.max(p.reported - p.late, 0), late: p.late }));
  const table = (
    <Table><THead><TR><TH>{t("month")}</TH><TH>{t("onTime")}</TH><TH>{t("kpiLate")}</TH></TR></THead>
      <TBody>{slice.map((p) => <TR key={p.month}><TD>{p.month}</TD><TD>{p.onTime}</TD><TD>{p.late}</TD></TR>)}</TBody>
    </Table>
  );
  return (
    <ChartFrame title={t("onTimeVsLate")} table={table}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={slice}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} opacity={0.3} />
          <XAxis dataKey="month" tickFormatter={(m: string) => m.slice(0, 7)} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip /><Legend />
          <Bar dataKey="onTime" name={t("onTime")} stackId="s" fill={CHART_COLORS.success} />
          <Bar dataKey="late" name={t("kpiLate")} stackId="s" fill={CHART_COLORS.warning} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/** Pioneer goal attainment — a bullet bar per category, counts only, never names (D-44, ADM-04). */
export function GoalAttainmentChart({ data }: { data: GoalAttainment[] }) {
  const t = useTranslations("admin");
  const cat = useTranslations("categories");
  const rows = data.map((d) => ({ ...d, percent: d.met + d.not_met > 0 ? Math.round((d.met / (d.met + d.not_met)) * 100) : 0 }));
  const table = (
    <Table><THead><TR><TH>{t("category")}</TH><TH>{t("goalMet")}</TH><TH>{t("goalNotMet")}</TH></TR></THead>
      <TBody>{rows.map((r) => <TR key={r.category}><TD>{cat(r.category)}</TD><TD>{r.met}</TD><TD>{r.not_met}</TD></TR>)}</TBody>
    </Table>
  );
  return (
    <ChartFrame title={t("goalAttainment")} table={table}>
      <div className="flex h-full flex-col justify-center gap-3">
        {rows.length === 0 && <p className="text-muted-foreground">{t("noPioneerReports")}</p>}
        {rows.map((r) => (
          <div key={r.category}>
            <div className="mb-1 flex justify-between text-sm"><span>{cat(r.category)}</span><span className="tabular">{r.met}/{r.met + r.not_met}</span></div>
            <div className="h-3 rounded-full bg-tint"><div className="h-3 rounded-full" style={{ width: `${r.percent}%`, background: CATEGORY_COLORS[r.category] }} /></div>
          </div>
        ))}
      </div>
    </ChartFrame>
  );
}

/** Hours by category, current month (ADM-04). */
export function HoursByCategory({ byCategory }: { byCategory: Record<Category, { hours: number }> }) {
  const t = useTranslations("admin");
  const cat = useTranslations("categories");
  const data = (Object.keys(byCategory) as Category[]).filter((k) => k !== "publisher").map((k) => ({ category: cat(k), hours: byCategory[k].hours, fill: CATEGORY_COLORS[k] }));
  const table = <Table><THead><TR><TH>{t("category")}</TH><TH>{t("hours")}</TH></TR></THead><TBody>{data.map((d) => <TR key={d.category}><TD>{d.category}</TD><TD>{d.hours}</TD></TR>)}</TBody></Table>;
  return (
    <ChartFrame title={t("hoursByCategory")} table={table}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} opacity={0.3} />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="category" width={110} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="hours">{data.map((d) => <Cell key={d.category} fill={d.fill} />)}</Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/** Cumulative hours across the service year to date (ADM-04, ADM-05). */
export function CumulativeHours({ byCategoryMonths }: { byCategoryMonths: CategoryMonth[] }) {
  const t = useTranslations("admin");
  const byMonth = new Map<string, number>();
  for (const r of byCategoryMonths) byMonth.set(r.month, (byMonth.get(r.month) ?? 0) + r.hours);
  let running = 0;
  const data = [...byMonth.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([month, hours]) => { running += hours; return { month, cumulative: running }; });
  const table = <Table><THead><TR><TH>{t("month")}</TH><TH>{t("cumulativeHours")}</TH></TR></THead><TBody>{data.map((d) => <TR key={d.month}><TD>{d.month}</TD><TD>{d.cumulative}</TD></TR>)}</TBody></Table>;
  return (
    <ChartFrame title={t("cumulativeHours")} table={table}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} opacity={0.3} />
          <XAxis dataKey="month" tickFormatter={(m: string) => m.slice(0, 7)} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line type="monotone" dataKey="cumulative" stroke={CHART_COLORS.navy} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
