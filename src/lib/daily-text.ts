import d2026 from "@/data/daily-text/2026.json";

/** Daily scripture lookup. Imports the year data, so use it in server components only (time helpers live in lib/nairobi.ts). */
export type DailyText = { text: string; ref: string };
type Year = { year: number; days: Record<string, { t: string; r: string }> };

// To add a year: run `npm run daily-text -- data-source/<file>.md <year>`, then import its JSON here.
const YEARS: Record<string, Year> = { "2026": d2026 as Year };

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
