// Return-visit view buckets and the overdue rule (RV-01, RV-04). Pure functions so both the client component
// and any future test can share them, same spirit as summarize.ts for the Elder console.

export type RvStatus = "interested" | "study_started" | "not_interested" | "moved";
export type RvView = "today" | "upcoming" | "overdue" | "all";

export interface RvRow {
  id: string;
  first_name: string;
  phone: string | null;
  area: string | null;
  first_met_on: string | null;
  topic: string | null;
  literature: string | null;
  interest_level: number | null;
  status: RvStatus;
  next_visit_at: string | null;
  notes: string | null;
  last_visited_at: string | null;
  created_at: string;
}

const ACTIVE: RvStatus[] = ["interested", "study_started"];

/** No logged visit in 14 days and the visit is still active (RV-04). Moved/not-interested visits never go overdue. */
export function isOverdue(rv: RvRow, now = new Date()): boolean {
  if (!ACTIVE.includes(rv.status)) return false;
  const since = rv.last_visited_at ?? rv.first_met_on ?? rv.created_at;
  return now.getTime() - new Date(since).getTime() > 14 * 24 * 3_600_000;
}

function isSameDay(iso: string, now: Date): boolean {
  const d = new Date(iso);
  return d.toDateString() === now.toDateString();
}

/** Which of the four views (RV-01) a visit belongs in. A visit can appear in more than one bucket except "all". */
export function matchesView(rv: RvRow, view: RvView, now = new Date()): boolean {
  switch (view) {
    case "all": return true;
    case "overdue": return isOverdue(rv, now);
    case "today": return !!rv.next_visit_at && isSameDay(rv.next_visit_at, now);
    case "upcoming": return !!rv.next_visit_at && new Date(rv.next_visit_at) > now && !isSameDay(rv.next_visit_at, now);
  }
}

export function matchesSearch(rv: RvRow, q: string): boolean {
  if (!q.trim()) return true;
  const needle = q.trim().toLowerCase();
  return [rv.first_name, rv.area, rv.topic].some((v) => v?.toLowerCase().includes(needle));
}

export function sortByNextVisit(rows: RvRow[]): RvRow[] {
  return [...rows].sort((a, b) => {
    if (a.next_visit_at && b.next_visit_at) return a.next_visit_at < b.next_visit_at ? -1 : 1;
    if (a.next_visit_at) return -1;
    if (b.next_visit_at) return 1;
    return a.first_name.localeCompare(b.first_name);
  });
}

/** Home screen "Upcoming Return Visits" card: anything scheduled from right now through `days` days ahead
 * (default 7), soonest first. Deliberately forward-looking only — overdue items surface as a separate count
 * so the two ideas ("what's coming" vs. "what's slipped") never get mixed in one list. */
export function upcomingWithin(rows: RvRow[], days = 7, now = new Date()): RvRow[] {
  const cutoff = new Date(now.getTime() + days * 24 * 3_600_000);
  return sortByNextVisit(
    rows.filter((r) => r.next_visit_at && new Date(r.next_visit_at) >= now && new Date(r.next_visit_at) <= cutoff),
  );
}

export function overdueCount(rows: RvRow[], now = new Date()): number {
  return rows.filter((r) => isOverdue(r, now)).length;
}
