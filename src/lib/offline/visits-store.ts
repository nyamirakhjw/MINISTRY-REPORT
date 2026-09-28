"use client";
import * as React from "react";
import { db, type LocalRv, type LocalRvVisit } from "./dexie";
import { createClient } from "@/lib/supabase/browser";
import type { RvRow, RvStatus } from "@/lib/domain/visits";

export interface RvInput {
  firstName: string; phone: string | null; area: string | null; firstMetOn: string | null;
  topic: string | null; literature: string | null; interestLevel: number | null;
  status: RvStatus; nextVisitAt: string | null; notes: string | null;
}
export interface LogVisitInput { returnVisitId: string; visitedAt: string; notes: string | null; outcome: string | null; nextVisitAt: string | null }

function toRow(l: LocalRv): RvRow {
  return {
    id: l.id, first_name: l.firstName, phone: l.phone, area: l.area, first_met_on: l.firstMetOn,
    topic: l.topic, literature: l.literature, interest_level: l.interestLevel, status: l.status,
    next_visit_at: l.nextVisitAt, notes: l.notes, last_visited_at: l.lastVisitedAt, created_at: l.createdAt,
  };
}

/**
 * Private return-visit tracker (RV-01 to RV-08), offline-first like the daily log: every write lands in
 * IndexedDB first, then syncs when there's a connection. A conflict on the same id means a previous attempt
 * already reached the server — treated as success, which is the idempotency RV-06 asks for.
 */
export function useReturnVisits(memberId: string, congregationId: string) {
  const [rows, setRows] = React.useState<RvRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [online, setOnline] = React.useState(true);
  const [syncError, setSyncError] = React.useState<string | null>(null);

  const refreshFromCache = React.useCallback(async () => {
    const local = await db().returnVisits.where("memberId").equals(memberId).and((r) => !r.pendingDelete).toArray();
    setRows(local.map(toRow));
  }, [memberId]);

  const sync = React.useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.onLine) return;
    const supabase = createClient();
    let lastError: string | null = null;

    const pendingDeletes = await db().returnVisits.where("pendingDelete").equals(1).toArray();
    for (const r of pendingDeletes) {
      const { error } = await supabase.from("return_visits").delete().eq("id", r.id);
      if (!error || error.code === "PGRST116") await db().returnVisits.delete(r.id);
      else { lastError = error.message; console.error("return_visits delete failed:", error.code, error.message); }
    }

    const pending = await db().returnVisits.where("syncedAt").equals("").and((r) => !r.pendingDelete).toArray();
    for (const r of pending) {
      const { error } = await supabase.from("return_visits").upsert({
        id: r.id, congregation_id: r.congregationId, owner_id: r.memberId, first_name: r.firstName,
        phone: r.phone || null, area: r.area || null, first_met_on: r.firstMetOn || null, topic: r.topic || null,
        literature: r.literature || null, interest_level: r.interestLevel, status: r.status,
        next_visit_at: r.nextVisitAt || null, notes: r.notes || null,
      }, { onConflict: "id" });
      if (!error) await db().returnVisits.update(r.id, { syncedAt: new Date().toISOString() });
      else { lastError = error.message; console.error("return_visits upsert failed:", error.code, error.message); }
    }

    const pendingLogs = await db().rvVisitLogs.where("syncedAt").equals("").toArray();
    for (const v of pendingLogs) {
      const { error } = await supabase.rpc("log_rv_visit", {
        p_id: v.id, p_return_visit_id: v.returnVisitId, p_visited_at: v.visitedAt,
        p_notes: v.notes, p_outcome: v.outcome, p_next_visit_at: v.nextVisitAt,
      });
      if (!error) await db().rvVisitLogs.update(v.id, { syncedAt: new Date().toISOString() });
      else { lastError = error.message; console.error("log_rv_visit failed:", error.code, error.message); }
    }
    setSyncError(lastError ? `Database error: ${lastError}` : null);

    try {
      const { data, error } = await supabase.from("return_visits").select("*").order("next_visit_at", { ascending: true, nullsFirst: false });
      if (error) console.error("return_visits fetch failed:", error.code, error.message);
      const serverIds = new Set((data ?? []).map((row) => row.id));
      for (const row of data ?? []) {
        await db().returnVisits.put({
          id: row.id, memberId: row.owner_id, congregationId: row.congregation_id, firstName: row.first_name,
          phone: row.phone, area: row.area, firstMetOn: row.first_met_on, topic: row.topic, literature: row.literature,
          interestLevel: row.interest_level, status: row.status, nextVisitAt: row.next_visit_at, notes: row.notes,
          lastVisitedAt: row.last_visited_at, createdAt: row.created_at, updatedAt: row.updated_at,
          syncedAt: row.updated_at, pendingDelete: 0,
        });
      }
      // Reconcile deletions made on another device: a row this device previously synced (syncedAt is set)
      // that the server no longer returns has been deleted elsewhere, so drop it locally too. A row this
      // device created or edited but hasn't pushed yet (syncedAt === "") is left alone even if the server
      // doesn't know about it yet.
      const localRows = await db().returnVisits.where("memberId").equals(memberId).toArray();
      for (const local of localRows) {
        if (local.syncedAt !== "" && !local.pendingDelete && !serverIds.has(local.id)) {
          await db().returnVisits.delete(local.id);
        }
      }
    } catch (err) { console.error("return_visits refetch threw:", err); }
    await refreshFromCache();
  }, [memberId, refreshFromCache]);

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
    const interval = window.setInterval(sync, 30000);
    return () => { live = false; window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); window.clearInterval(interval); };
  }, [refreshFromCache, sync]);

  const addOrEditVisit = React.useCallback(async (input: RvInput, existingId?: string) => {
    const now = new Date().toISOString();
    const row: LocalRv = {
      id: existingId ?? crypto.randomUUID(), memberId, congregationId, firstName: input.firstName,
      phone: input.phone, area: input.area, firstMetOn: input.firstMetOn, topic: input.topic,
      literature: input.literature, interestLevel: input.interestLevel, status: input.status,
      nextVisitAt: input.nextVisitAt, notes: input.notes,
      lastVisitedAt: existingId ? (await db().returnVisits.get(existingId))?.lastVisitedAt ?? null : null,
      createdAt: existingId ? (await db().returnVisits.get(existingId))?.createdAt ?? now : now,
      updatedAt: now, syncedAt: "", pendingDelete: 0,
    };
    await db().returnVisits.put(row);
    await refreshFromCache();
    sync();
    return row.id;
  }, [memberId, congregationId, refreshFromCache, sync]);

  const deleteVisit = React.useCallback(async (id: string) => {
    await db().returnVisits.update(id, { pendingDelete: 1 });
    await refreshFromCache();
    sync();
  }, [refreshFromCache, sync]);

  const logVisit = React.useCallback(async (input: LogVisitInput) => {
    const entry: LocalRvVisit = {
      id: crypto.randomUUID(), returnVisitId: input.returnVisitId, memberId, visitedAt: input.visitedAt,
      notes: input.notes, outcome: input.outcome, nextVisitAt: input.nextVisitAt, createdAt: new Date().toISOString(), syncedAt: "",
    };
    await db().rvVisitLogs.add(entry);
    const rv = await db().returnVisits.get(input.returnVisitId);
    if (rv) await db().returnVisits.update(input.returnVisitId, { lastVisitedAt: input.visitedAt, nextVisitAt: input.nextVisitAt, syncedAt: "" });
    await refreshFromCache();
    sync();
  }, [memberId, refreshFromCache, sync]);

  return { rows, loading, online, syncError, sync, addOrEditVisit, deleteVisit, logVisit };
}
