import d2026 from "@/data/daily-text/2026.json";

/** Daily scripture lookup and time-of-day helpers. Pure functions, safe to use on the server and in the browser. */
export type DailyText = { text: string; ref: string };
export type DayPart = "morning" | "afternoon" | "evening";
type Year = { year: number; days: Record<string, { t: string; r: string }> };

// To add a year: run `npm run daily-text -- data-source/<file>.md <year>`, then import its JSON here.
const YEARS: Record<string, Year> = { "2026": d2026 as Year };

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

/** Today's scripture, or null when the year is not loaded or the date has no entry. */
export function dailyTextFor(date: string): DailyText | null {
  const entry = YEARS[date.slice(0, 4)]?.days[date];
  return entry ? { text: entry.t, ref: entry.r } : null;
}

/** Longer scriptures get a smaller size so every one fits the banner without cutting words. */
export function verseSize(length: number): "lg" | "md" | "sm" {
  if (length <= 70) return "lg";
  if (length <= 140) return "md";
  return "sm";
}
