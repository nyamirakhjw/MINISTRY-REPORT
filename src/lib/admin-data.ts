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

export async function getCounts(): Promise<{ approvals: number; arrangements: number; changes: number; corrections: number }> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_queue_counts");
  return { approvals: 0, arrangements: 0, changes: 0, corrections: 0, ...((data as object | null) ?? {}) };
}
