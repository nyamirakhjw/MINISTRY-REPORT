"use server";

import { callRpc, type ActionResult } from "./rpc";
import { z } from "zod";

export async function requestDeletionAction(): Promise<ActionResult<string>> {
  return callRpc<string>("request_deletion", {});
}
export async function cancelDeletionAction(): Promise<ActionResult> {
  return callRpc("cancel_deletion", {});
}
const idSchema = z.string().uuid();
export async function approveDeletionAction(id: string): Promise<ActionResult> {
  const p = idSchema.safeParse(id);
  if (!p.success) return { ok: false, code: "invalid" };
  return callRpc("approve_deletion", { p_id: p.data });
}
