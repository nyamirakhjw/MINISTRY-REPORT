"use client";

import { useSyncExternalStore } from "react";
import { CalendarDays } from "lucide-react";
import { nairobiNow } from '@/lib/nairobi';

const subscribe = (onChange: () => void) => {
  const id = setInterval(onChange, 60_000);
  return () => clearInterval(id);
};

/** Full date for a Nairobi calendar day (YYYY-MM-DD), e.g. "Friday, 6 November 2026". Noon UTC keeps the day stable. */
function longDate(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${date}T12:00:00Z`));
}

/**
 * Today's full date in the banner. The server sends the Nairobi date so the first paint is right; in the browser it
 * re-checks every minute, so a page left open past midnight rolls over to the new day by itself.
 */
export function TodayDate({ initial, locale, label }: { initial: string; locale: string; label: string }) {
  const date = useSyncExternalStore(subscribe, () => nairobiNow().date, () => initial);
  return (
    <p className="db-date">
      <CalendarDays className="db-date-icon" aria-hidden="true" />
      <span className="sr-only">{label}: </span>
      <time dateTime={date}>{longDate(date, locale)}</time>
    </p>
  );
}
