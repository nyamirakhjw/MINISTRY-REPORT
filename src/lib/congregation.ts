import "server-only";
import { unstable_cache } from "next/cache";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

export interface Meeting { day?: string; time?: string }
export interface PublicCongregation {
  name: string;
  tagline: string | null;
  landing: { midweek?: Meeting; weekend?: Meeting; address_lines?: string[]; map_url?: string };
  groups: { id: string; name: string }[];
}

/** Cache tag. Settings actions that change the public profile call updateTag with this so edits show at once. */
export const PUBLIC_CONGREGATION_TAG = "public-congregation";

// The RPC returns only the safe public subset and is open to the anon role, so a cookie-free client is enough.
// Failures throw so they are never cached; the caller turns them into a fallback.
const fetchPublicCongregation = unstable_cache(
  async (slug: string): Promise<PublicCongregation | null> => {
    const supabase = createAnonClient(publicEnv.supabaseUrl, publicEnv.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.rpc("public_congregation", { p_slug: slug });
    if (error) throw error;
    return (data as PublicCongregation | null) ?? null;
  },
  ["public-congregation"],
  { revalidate: 300, tags: [PUBLIC_CONGREGATION_TAG] },
);

/** Safe public subset (name, tagline, meetings, address, groups). Cached for five minutes; no cookies, no auth call. */
export async function getPublicCongregation(): Promise<PublicCongregation | null> {
  if (!publicEnv.supabaseUrl || !publicEnv.anonKey) return null;
  try {
    return await fetchPublicCongregation(publicEnv.defaultCongregation);
  } catch {
    return null;
  }
}
