"use client";
import { useLiveRefresh, type LiveTable } from "@/hooks/use-live-refresh";

/** Drop into any server-rendered page to keep it current without a manual refresh. Renders nothing. */
export function Live({ channel, tables }: { channel: string; tables: LiveTable[] }) {
  useLiveRefresh(channel, tables);
  return null;
}
