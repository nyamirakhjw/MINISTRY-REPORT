"use client";
import * as React from "react";
import { db, type LocalLogEntry } from "./dexie";
import { createClient } from "@/lib/supabase/browser";

export interface AddEntryInput { serviceDate: string; durationSeconds: number; note: string | null }

/**
 * Daily log for one month, offline-first (LOG-07). Adding always writes to IndexedDB first (instant, works with
 * no signal), then tries to sync. A conflict on the same id is treated as success: it means a previous attempt
 * already reached the server, which is exactly the idempotency the PRD asks for.
 *
 * v0.2.4: sync() previously discarded every Supabase error silently (`const { error }`, never checked), so a
 * blocked write stayed "Waiting to send" forever with nothing in the logs to explain why. It now: (1) logs every
 * failure with its code and message, (2) exposes the last failure as `syncError` so the UI can tell the person
 * something is actually wrong rather than just "pending", and (3) retries automatically every 30s so a transient
 * failure (a dropped connection, a brief RLS hiccup) clears itself without requiring a reload.
 */
export function useDailyLog(memberId: string, congregationId: string, month: string) {
  const [entries, setEntries] = React.useState<LocalLogEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [online, setOnline] = React.useState(true);
  const [syncError, setSyncError] = React.useState<string | null>(null);

  const monthEntries = React.useCallback(
    () => db().logEntries.where("memberId").equals(memberId).and((e) => e.serviceDate.startsWith(month.slice(0, 7))).toArray(),
    [memberId, month],
  );

  const refreshFromCache = React.useCallback(async () => {
    setEntries((await monthEntries()).sort((a, b) => (a.serviceDate < b.serviceDate ? 1 : -1)));
  }, [monthEntries]);

  const sync = React.useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.onLine) return;
    const supabase = createClient();
    const pending = await db().logEntries.where("syncedAt").equals("").toArray(); // Dexie stores null as "" key for indexing
    let lastError: string | null = null;

    for (const e of pending) {
      try {
        const { error } = await supabase.from("daily_log_entries").upsert(
          { id: e.id, congregation_id: e.congregationId, member_id: e.memberId, service_date: e.serviceDate, duration_seconds: e.durationSeconds, note: e.note === "" ? null : e.note },
          { onConflict: "id", ignoreDuplicates: true },
        );
        if (!error || error.code === "23505") {
          await db().logEntries.update(e.id, { syncedAt: new Date().toISOString() });
        } else {
          lastError = error.message;
          console.error("daily_log_entries sync failed:", error.code, error.message, { entryId: e.id });
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.error("daily_log_entries sync threw:", err, { entryId: e.id });
      }
    }
    setSyncError(lastError ? `Database error: ${lastError}` : null);

    const start = `${month.slice(0, 7)}-01`;
    try {
      const { data, error } = await supabase.from("daily_log_entries").select("*")
        .eq("member_id", memberId).gte("service_date", start).lt("service_date", nextMonthStr(start));
      if (error) console.error("daily_log_entries fetch failed:", error.code, error.message);
      for (const row of data ?? []) {
        await db().logEntries.put({
          id: row.id, memberId: row.member_id, congregationId: row.congregation_id, serviceDate: row.service_date,
          durationSeconds: row.duration_seconds, note: row.note, createdAt: row.created_at, syncedAt: row.created_at,
        });
      }
    } catch (err) {
      console.error("daily_log_entries refetch threw:", err);
    }
    await refreshFromCache();
  }, [memberId, month, refreshFromCache]);

  React.useEffect(() => {
    let live = true;
    setLoading(true);
    refreshFromCache().then(() => { if (live) setLoading(false); });
    sync();
    setOnline(navigator.onLine);
    const goOnline = () => { setOnline(true); sync(); };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    // Self-heal: retry every 30s so an item that failed to sync for a transient reason doesn't stay
    // "Waiting to send" indefinitely once the real cause (network, a brief RLS/session hiccup) clears.
    const interval = window.setInterval(sync, 30000);
    return () => {
      live = false;
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.clearInterval(interval);
    };
  }, [refreshFromCache, sync]);

  const addEntry = React.useCallback(async (input: AddEntryInput) => {
    const row: LocalLogEntry = {
      id: crypto.randomUUID(), memberId, congregationId, serviceDate: input.serviceDate,
      durationSeconds: input.durationSeconds, note: input.note, createdAt: new Date().toISOString(), syncedAt: "",
    };
    await db().logEntries.add(row); // Dexie can't index null; "" stands for "not yet synced"
    await refreshFromCache();
    sync();
  }, [memberId, congregationId, refreshFromCache, sync]);

  /** Deleting needs a connection in this release; the offline case that matters most (adding hours in the field) works fully offline. */
  const deleteEntry = React.useCallback(async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("daily_log_entries").delete().eq("id", id);
    if (error) throw error;
    await db().logEntries.delete(id);
    await refreshFromCache();
  }, [refreshFromCache]);

  const totalSeconds = entries.reduce((sum, e) => sum + e.durationSeconds, 0);
  return {
    entries, totalSeconds, loading, online, addEntry, deleteEntry,
    pendingCount: entries.filter((e) => !e.syncedAt).length,
    syncError,
  };
}

function nextMonthStr(monthStart: string): string {
  const d = new Date(`${monthStart}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString().slice(0, 10);
}


