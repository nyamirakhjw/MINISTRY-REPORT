import "server-only";
import { createClient } from "@/lib/supabase/server";
import { addMonths, monthOf, type MonthKey } from "@/lib/domain/time";
import { reportWindow } from "@/lib/domain/window";
import type { MonthRow } from "@/lib/domain/summarize";
import type { Category } from "@/lib/domain/categories";

export interface AdminRow extends MonthRow {
  full_name: string;
  group_name: string | null;
  avatar_path: string | null;
  phone: string | null;
  is_managed: boolean;
  comment: string | null;
  submitted_at: string | null;
  received_at: string | null;
  submitted_via: "self" | "elder" | null;
  submitted_by_name: string | null;
  time_adjusted: boolean;
  zero_hours: boolean;
  self_edited: boolean;
  was_corrected: boolean;
  report_id: string | null;
  category: Category | null;
}

/** Latest month whose window is open or has just closed (ADM-01 default). */
export function defaultMonth(now = new Date()): MonthKey {
  const cur = monthOf(now);
  return now >= reportWindow(cur).opens ? cur : addMonths(cur, -1);
}

export function parseMonthParam(v: string | undefined): MonthKey {
  return v && /^\d{4}-\d{2}-01$/.test(v) ? v : defaultMonth();
}

export function recentMonths(count = 14): MonthKey[] {
  const latest = defaultMonth();
  return Array.from({ length: count }, (_, i) => addMonths(latest, -i));
}

export async function getMonthRows(month: MonthKey): Promise<AdminRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_month_report", { p_month: month });
  return ((data ?? []) as AdminRow[]);
}

export async function getGroups(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("groups").select("id, name").eq("retired", false).order("name");
  return data ?? [];
}

export async function getCounts(): Promise<{ approvals: number; arrangements: number; changes: number; corrections: number; deletions: number }> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_queue_counts");
  return { approvals: 0, arrangements: 0, changes: 0, corrections: 0, deletions: 0, ...((data as object | null) ?? {}) };
}

// ---------------------------------------------------------------------------------------------------------
// Phase 3, Sprint 3 — by-group breakdown (ADM-03), trend series (ADM-04/ADM-05) and goal attainment (ADM-04).
// ---------------------------------------------------------------------------------------------------------

export interface GroupBreakdown { group_id: string | null; group_name: string; reported: number; obligated: number; hours: number; studies: number }

/** ADM-03: reuses the same per-member rows the overview already fetches — no extra round trip. */
export function byGroup(rows: AdminRow[]): GroupBreakdown[] {
  const map = new Map<string, GroupBreakdown>();
  for (const r of rows) {
    const key = r.group_id ?? "none";
    const g = map.get(key) ?? { group_id: r.group_id, group_name: r.group_name ?? "—", reported: 0, obligated: 0, hours: 0, studies: 0 };
    g.obligated++;
    if (r.status !== "missing" && r.status !== "not_reported") { g.reported++; g.hours += r.hours ?? 0; g.studies += r.studies ?? 0; }
    map.set(key, g);
  }
  return [...map.values()].sort((a, b) => a.group_name.localeCompare(b.group_name));
}

export interface TrendPoint { month: MonthKey; obligated: number; reported: number; closed: number; late: number; hours: number; studies: number; participants: number }

export async function getMonthTrend(endMonth: MonthKey, months = 24): Promise<TrendPoint[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_month_trend", { p_end_month: endMonth, p_months: months });
  return (data ?? []) as TrendPoint[];
}

export interface GoalAttainment { category: Category; met: number; not_met: number }

export async function getGoalAttainment(month: MonthKey): Promise<GoalAttainment[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_goal_attainment", { p_month: month });
  return (data ?? []) as GoalAttainment[];
}

export interface CategoryMonth { month: MonthKey; category: Category; reporting: number; hours: number; studies: number }

export async function getServiceYearByCategory(serviceYear: string): Promise<CategoryMonth[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_service_year_by_category", { p_year: serviceYear });
  return (data ?? []) as CategoryMonth[];
}

/** Reporting % this month vs previous month and vs the same month last year (ADM-05). */
export function compareTo(trend: TrendPoint[], month: MonthKey) {
  const at = (m: MonthKey) => trend.find((t) => t.month === m);
  const pct = (t?: TrendPoint) => (t && t.obligated > 0 ? Math.round((t.reported / t.obligated) * 100) : null);
  const cur = at(month);
  const prevMonth = at(addMonths(month, -1));
  const yearAgo = at(addMonths(month, -12));
  return {
    current: cur ?? null,
    previousMonth: prevMonth ?? null,
    sameMonthLastYear: yearAgo ?? null,
    reportingPercent: { current: pct(cur), previousMonth: pct(prevMonth), sameMonthLastYear: pct(yearAgo) },
  };
}
