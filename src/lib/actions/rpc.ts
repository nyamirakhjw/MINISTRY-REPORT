import "server-only";
import { createClient } from "@/lib/supabase/server";
import { normalizeDbError } from "@/lib/domain/categories";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; code: string; hint?: string; fields?: Record<string, string> };

/** Calls a database function under the caller's own session (RLS and role checks apply) and maps its stable error codes. */
export async function callRpc<T = undefined>(fn: string, args: Record<string, unknown>): Promise<ActionResult<T>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(fn, args);
  if (error) return { ok: false, code: normalizeDbError(error.message), hint: error.hint || undefined };
  return { ok: true, data: (data ?? undefined) as T | undefined };
}

export function invalid(error: { issues: { path: PropertyKey[]; message: string }[] }): ActionResult {
  const fields: Record<string, string> = {};
  for (const i of error.issues) fields[String(i.path[0] ?? "form")] ??= i.message;
  return { ok: false, code: "invalid", fields };
}
