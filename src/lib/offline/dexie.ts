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

class MinistryReportDB extends Dexie {
  logEntries!: EntityTable<LocalLogEntry, "id">;
  constructor() {
    super("ministry-report");
    this.version(1).stores({ logEntries: "id, memberId, serviceDate, syncedAt" });
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
}
