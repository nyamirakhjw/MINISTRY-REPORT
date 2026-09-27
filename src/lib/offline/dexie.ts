import Dexie, { type EntityTable } from "dexie";

/** One row of the daily log, held locally so it works offline (LOG-07) and is wiped on sign-out (§14.7 privacy). */
export interface LocalLogEntry {
  id: string; // device-generated UUID; the same id server-side makes a retry idempotent
  memberId: string;
  congregationId: string;
  serviceDate: string; // "YYYY-MM-DD"
  durationSeconds: number;
  note: string | null;
  createdAt: string;
  /** "" until the server has accepted it, then the sync time. (Dexie can't index `null`, so empty string means unsynced.) */
  syncedAt: string;
}

/** One return visit (RV-02), held locally so the tracker works fully offline (RV-06). */
export interface LocalRv {
  id: string;
  memberId: string;
  congregationId: string;
  firstName: string;
  phone: string | null;
  area: string | null;
  firstMetOn: string | null;
  topic: string | null;
  literature: string | null;
  interestLevel: number | null;
  status: "interested" | "study_started" | "not_interested" | "moved";
  nextVisitAt: string | null;
  notes: string | null;
  lastVisitedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** "" = created or edited locally and not yet pushed; "deleted" = queued for server deletion. */
  syncedAt: string;
  pendingDelete: 0 | 1;
}

/** A logged visit against a return visit (RV-03), queued the same idempotent way as a daily log entry. */
export interface LocalRvVisit {
  id: string;
  returnVisitId: string;
  memberId: string;
  visitedAt: string;
  notes: string | null;
  outcome: string | null;
  nextVisitAt: string | null;
  createdAt: string;
  syncedAt: string;
}

class MinistryReportDB extends Dexie {
  logEntries!: EntityTable<LocalLogEntry, "id">;
  returnVisits!: EntityTable<LocalRv, "id">;
  rvVisitLogs!: EntityTable<LocalRvVisit, "id">;
  constructor() {
    super("ministry-report");
    this.version(1).stores({ logEntries: "id, memberId, serviceDate, syncedAt" });
    // v2 (Phase 3, Sprint 2): return-visit tracker gets the same offline-queue treatment as the daily log.
    this.version(2).stores({
      logEntries: "id, memberId, serviceDate, syncedAt",
      returnVisits: "id, memberId, nextVisitAt, syncedAt, pendingDelete",
      rvVisitLogs: "id, returnVisitId, memberId, syncedAt",
    });
  }
}

let instance: MinistryReportDB | null = null;

/** One database per tab, created lazily so this module is safe to import from server code (it just won't be used there). */
export function db(): MinistryReportDB {
  if (typeof indexedDB === "undefined") throw new Error("IndexedDB is not available in this environment");
  instance ??= new MinistryReportDB();
  return instance;
}

/** Sign-out wipes cached personal data on this device (AUTH-10). */
export async function wipeLocalData(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  await db().logEntries.clear();
  await db().returnVisits.clear();
  await db().rvVisitLogs.clear();
}
