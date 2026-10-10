"use client";
import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CalendarClock, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useReturnVisits } from "@/lib/offline/visits-store";
import { upcomingWithin, overdueCount, recentlyAddedUnscheduled } from "@/lib/domain/visits";

const DAYS_AHEAD = 7;
const MAX_ROWS = 4;

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 3_600_000);
  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (isSameDay(d, today)) return `Today, ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  if (isSameDay(d, tomorrow)) return `Tomorrow, ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) + `, ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

/**
 * Home screen "Upcoming Return Visits" card (item 3 of the September change request). Shows what's coming in
 * the next 7 days, soonest first, capped at 4 rows with a "View all upcoming" link; a separate small line
 * links to anything overdue rather than mixing the two lists. Hidden entirely when there's nothing upcoming,
 * so it never clutters Home for a publisher who isn't doing return visits.
 *
 * Drop this into your Home page (src/app/app/page.tsx) wherever "return visits due today" sits in your
 * current layout — DSH-01 places it after the monthly progress bar and before unread messages:
 *
 *   <UpcomingVisitsCard memberId={member.id} congregationId={member.congregation_id} />
 */
export function UpcomingVisitsCard({ memberId, congregationId }: { memberId: string; congregationId: string }) {
  const t = useTranslations("home");
  const { rows, loading } = useReturnVisits(memberId, congregationId);

  if (loading) return <Skeleton className="h-40 w-full rounded-lg" />;

  const upcoming = upcomingWithin(rows, DAYS_AHEAD).slice(0, MAX_ROWS);
  // Covers the gap above: a visit added without a next-visit date still shows here for 24h, so adding one
  // always gives visible confirmation on Home, not just once a date gets scheduled.
  const recent = recentlyAddedUnscheduled(rows).slice(0, MAX_ROWS - upcoming.length);
  const overdue = overdueCount(rows);
  if (upcoming.length === 0 && overdue === 0 && recent.length === 0) return null;

  return (
    <section aria-labelledby="upcoming-visits" className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="upcoming-visits" className="flex items-center gap-2 text-lg font-semibold">
          <CalendarClock className="size-5 text-primary" aria-hidden="true" />
          {t("upcomingVisits")}
        </h2>
        {overdue > 0 && (
          <Link href="/app/visits?view=overdue" className="text-sm font-semibold text-danger underline underline-offset-4">
            {t("overdueCount", { count: overdue })}
          </Link>
        )}
      </div>

      {upcoming.length === 0 && recent.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("nothingInDays", { days: DAYS_AHEAD })}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {[...upcoming, ...recent].map((rv) => (
            <li key={rv.id}>
              <Link href={`/app/visits/${rv.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-tint">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{rv.first_name}</p>
                  {rv.area && <p className="flex items-center gap-1 truncate text-sm text-muted-foreground"><MapPin className="size-3.5 shrink-0" aria-hidden="true" />{rv.area}</p>}
                </div>
                <span className="shrink-0 whitespace-nowrap rounded-full bg-tint px-2.5 py-1 text-sm font-semibold text-primary">
                  {rv.next_visit_at ? dayLabel(rv.next_visit_at) : t("notScheduledYet")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link href="/app/visits?view=upcoming" className="mt-3 inline-block text-sm font-semibold text-primary underline underline-offset-4">
        {t("viewAllUpcoming")}
      </Link>
    </section>
  );
}
