"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export interface LiveTable { table: string; filter?: string }

/**
 * Realtime (PRD §14.5): a change event is a SIGNAL to refetch, never the truth. Row Level Security still decides
 * what this person may receive. The app works fully if Realtime is unavailable; we also refetch on reconnect.
 */
export function useLiveRefresh(channelName: string, tables: LiveTable[]) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const key = JSON.stringify(tables);

  useEffect(() => {
    const supabase = createClient();
    const refresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 400); // coalesce bursts
    };
    let channel = supabase.channel(channelName);
    for (const t of JSON.parse(key) as LiveTable[]) {
      channel = channel.on("postgres_changes", { event: "*", schema: "public", table: t.table, ...(t.filter ? { filter: t.filter } : {}) }, refresh);
    }
    let subscribedOnce = false;
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") { if (subscribedOnce) refresh(); subscribedOnce = true; }
    });
    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [channelName, key, router]);
}
