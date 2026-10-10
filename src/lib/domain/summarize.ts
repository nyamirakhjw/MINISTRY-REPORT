import type { Category } from "./categories";

export interface MonthRow {
  member_id: string;
  group_id: string | null;
  status: "submitted" | "reopened" | "not_reported" | "missing";
  category: Category | null;
  participated: boolean | null;
  hours: number | null;
  studies: number | null;
  is_late: boolean;
}

export interface CategoryTotals { reporting: number; hours: number; studies: number }
export interface MonthSummary {
  obligated: number;
  reported: number;
  notYet: number;
  closed: number;
  reportingPercent: number;
  late: number;
  totalHours: number;
  totalStudies: number;
  participants: number;
  byCategory: Record<Category, CategoryTotals>;
}

const empty = (): CategoryTotals => ({ reporting: 0, hours: 0, studies: 0 });

/** Totals for the Elder overview. "Did not report" (closed) and missing rows never count as reported (§6.4). */
export function summarizeMonth(rows: MonthRow[]): MonthSummary {
  const byCategory: Record<Category, CategoryTotals> = {
    publisher: empty(), auxiliary_pioneer: empty(), regular_pioneer: empty(), special_pioneer: empty(),
  };
  let reported = 0, notYet = 0, closed = 0, late = 0, totalHours = 0, totalStudies = 0, participants = 0;
  for (const r of rows) {
    if (r.status === "missing") { notYet++; continue; }
    if (r.status === "not_reported") { closed++; continue; }
    reported++;
    if (r.is_late) late++;
    if (r.participated) participants++;
    totalHours += r.hours ?? 0;
    totalStudies += r.studies ?? 0;
    if (r.category) {
      const t = byCategory[r.category];
      t.reporting++;
      t.hours += r.hours ?? 0;
      t.studies += r.studies ?? 0;
    }
  }
  const obligated = rows.length;
  return {
    obligated, reported, notYet, closed,
    reportingPercent: obligated === 0 ? 0 : Math.round((reported / obligated) * 100),
    late, totalHours, totalStudies, participants, byCategory,
  };
}
