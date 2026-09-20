import { addMonths, nairobiMidnight, parseMonth, type MonthKey } from "./time";

export interface ReportWindow {
  opens: Date;
  /** Exclusive: a moment is on time when t < onTimeUntil. */
  onTimeUntil: Date;
  /** Exclusive end of self-service. */
  lateUntil: Date;
}

export interface WindowSettings { onTimeDay: number; lateWindowMonths: number }
export const DEFAULT_WINDOW: WindowSettings = { onTimeDay: 10, lateWindowMonths: 1 };

/** Mirrors public.report_window() in the database. The database is the authority; this is for display. */
export function reportWindow(month: MonthKey, s: WindowSettings = DEFAULT_WINDOW): ReportWindow {
  const next = addMonths(month, 1);
  const n = parseMonth(next);
  const after = parseMonth(addMonths(month, s.lateWindowMonths + 1));
  // Day 0 of next month = last day of this month.
  return {
    opens: nairobiMidnight(n.year, n.month1, 0),
    onTimeUntil: nairobiMidnight(n.year, n.month1, s.onTimeDay + 1),
    lateUntil: nairobiMidnight(after.year, after.month1, 1),
  };
}

export type WindowState = "not_open" | "on_time" | "late" | "closed";

export function windowState(now: Date, w: ReportWindow): WindowState {
  if (now < w.opens) return "not_open";
  if (now < w.onTimeUntil) return "on_time";
  if (now < w.lateUntil) return "late";
  return "closed";
}

/** The last instant shown to people: "23:59" on the last day of the window. */
export function displayEnd(exclusive: Date): Date {
  return new Date(exclusive.getTime() - 60_000);
}
