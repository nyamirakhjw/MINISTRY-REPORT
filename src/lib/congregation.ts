import "server-only";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";

export interface Meeting { day?: string; time?: string }
export interface PublicCongregation {
  name: string;
  tagline: string | null;
  landing: { midweek?: Meeting; weekend?: Meeting; address_lines?: string[]; map_url?: string };
  groups: { id: string; name: string }[];
}

/** Safe public subset (name, tagline, meetings, address, groups). Callable without signing in. */
export async function getPublicCongregation(): Promise<PublicCongregation | null> {
  if (!publicEnv.supabaseUrl) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("public_congregation", { p_slug: publicEnv.defaultCongregation });
    return (data as PublicCongregation | null) ?? null;
  } catch {
    return null;
  }
}
