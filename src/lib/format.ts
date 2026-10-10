import { NAIROBI_TZ } from "@/lib/domain/time";

export function formatMonth(month: string, locale: string): string {
  const d = new Date(`${month.slice(0, 7)}-01T00:00:00Z`);
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}

export function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: NAIROBI_TZ }).format(new Date(iso));
}

export function formatDateTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: NAIROBI_TZ }).format(new Date(iso));
}

/** The last minute people see for a window end: an exclusive bound minus one minute. */
export function formatEnd(exclusiveIso: string, locale: string): string {
  const end = new Date(new Date(exclusiveIso).getTime() - 60_000).toISOString();
  return formatDateTime(end, locale);
}
