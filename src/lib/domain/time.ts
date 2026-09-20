// Every rule runs in Africa/Nairobi (UTC+3, no daylight saving). Storage is UTC. (PRD §6.1)
export const NAIROBI_OFFSET_HOURS = 3;
export const NAIROBI_TZ = "Africa/Nairobi";

/** A calendar month as "YYYY-MM-01". */
export type MonthKey = string;

export function monthKey(year: number, month1: number): MonthKey {
  return `${year}-${String(month1).padStart(2, "0")}-01`;
}

export function parseMonth(m: MonthKey): { year: number; month1: number } {
  const match = /^(\d{4})-(\d{2})-01$/.exec(m);
  if (!match) throw new Error(`Invalid month key: ${m}`);
  return { year: Number(match[1]), month1: Number(match[2]) };
}

export function addMonths(m: MonthKey, n: number): MonthKey {
  const { year, month1 } = parseMonth(m);
  const idx = year * 12 + (month1 - 1) + n;
  return monthKey(Math.floor(idx / 12), (idx % 12) + 1);
}

/** The instant of 00:00 Nairobi time on the given calendar day. */
export function nairobiMidnight(year: number, month1: number, day: number): Date {
  return new Date(Date.UTC(year, month1 - 1, day, -NAIROBI_OFFSET_HOURS, 0, 0, 0));
}

/** The calendar month containing an instant, in Nairobi time. */
export function monthOf(instant: Date): MonthKey {
  const shifted = new Date(instant.getTime() + NAIROBI_OFFSET_HOURS * 3_600_000);
  return monthKey(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1);
}

/** Service year runs 1 September to 31 August and is written "2026-2027". */
export function serviceYearOf(m: MonthKey): string {
  const { year, month1 } = parseMonth(m);
  const start = month1 >= 9 ? year : year - 1;
  return `${start}-${start + 1}`;
}

export function serviceYearMonths(label: string): MonthKey[] {
  const start = Number(label.slice(0, 4));
  return Array.from({ length: 12 }, (_, i) => addMonths(monthKey(start, 9), i));
}
