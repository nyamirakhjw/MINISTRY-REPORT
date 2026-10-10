import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

/** Service-role client. Bypasses RLS. Server only; never import from client code (a CI check enforces this). */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(publicEnv.supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
