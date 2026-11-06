/** Nairobi-time helpers. Pure functions with no data imports, so client components can use them without bundle cost. */
export type DayPart = "morning" | "afternoon" | "evening";

/** 05:00 to 11:59 morning, 12:00 to 16:59 afternoon, everything else evening. */
export function dayPart(hour: number): DayPart {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  return "evening";
}

/** The calendar date (YYYY-MM-DD) and hour in Nairobi, where every congregation rule is timed. */
export function nairobiNow(now: Date = new Date()): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}

/** "Thursday, 5 November 2026" (English) or the Kiswahili equivalent, for a YYYY-MM-DD date. */
export function formatLongDate(date: string, locale: string): string {
  const tag = locale === "sw" ? "sw-KE" : "en-GB";
  return new Intl.DateTimeFormat(tag, { timeZone: "Africa/Nairobi", weekday: "long", day: "numeric", month: "long", year: "numeric" })
    .format(new Date(`${date}T12:00:00+03:00`));
}

/** Days left in the month of a YYYY-MM-DD date, counting that day. */
export function daysLeftInMonth(date: string): number {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m, 0)).getUTCDate() - d + 1;
}

/** Hours a day still needed to reach a goal, rounded up to the next half hour. Null when it is not a sensible figure. */
export function paceHoursPerDay(remainingHours: number, daysLeft: number): number | null {
  if (remainingHours <= 0 || daysLeft <= 0) return null;
  const pace = Math.ceil((remainingHours / daysLeft) * 2) / 2;
  return pace > 0 && pace <= 12 ? pace : null;
}
