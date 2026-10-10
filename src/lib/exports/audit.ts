import "server-only";
import { createClient } from "@/lib/supabase/server";

/** EXP-07: every export leaves an audit entry (who, what, when, which filters). Call this after generating
 * the file, before returning the response, from every export route handler. */
export async function logExport(kind: string, filters: Record<string, unknown> = {}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("log_export", { p_kind: kind, p_filters: filters });
  if (error) console.error("log_export failed:", error.code, error.message);
}
