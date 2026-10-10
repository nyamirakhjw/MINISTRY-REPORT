import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getMonthRows, byGroup, type AdminRow } from "@/lib/admin-data";
import { summarizeMonth, type MonthSummary } from "@/lib/domain/summarize";
import type { MonthKey } from "@/lib/domain/time";

export interface Letterhead {
  congregationName: string;
  tagline: string | null;
  lines: string[];
  signatoryTitle: string;
}

export interface CongregationReportData {
  month: MonthKey;
  rows: AdminRow[];
  summary: MonthSummary;
  groups: ReturnType<typeof byGroup>;
  letterhead: Letterhead;
  preparedBy: string;
}

/** Shared by every export and both letterhead renderers (PDF §12.2/§12.3, Excel About sheet). Reads only the
 * public-safe settings subset (§15.2) — nothing here needs an RPC. */
export async function getLetterhead(): Promise<Letterhead & { congregationId: string }> {
  const supabase = await createClient();
  const { data } = await supabase.from("congregations").select("id, name, tagline, settings").single();
  const settings = (data?.settings ?? {}) as { letterhead?: { lines?: string[]; signatory_title?: string } };
  return {
    congregationId: data?.id ?? "",
    congregationName: data?.name ?? "Ministry Report",
    tagline: data?.tagline ?? null,
    lines: settings.letterhead?.lines ?? [],
    signatoryTitle: settings.letterhead?.signatory_title || "Elder",
  };
}

/** EXP-01: everything the congregation PDF and Excel need, gathered once and shared by both renderers. */
export async function getCongregationReportData(month: MonthKey, preparedBy: string): Promise<CongregationReportData> {
  const [rows, letterhead] = await Promise.all([getMonthRows(month), getLetterhead()]);
  return { month, rows, summary: summarizeMonth(rows), groups: byGroup(rows), letterhead, preparedBy };
}
