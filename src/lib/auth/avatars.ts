import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Short-lived signed links (one hour). Photos are never public (PRO-03). */
export async function signedAvatarUrls(paths: (string | null | undefined)[]): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => !!p))];
  if (unique.length === 0) return {};
  const supabase = await createClient();
  const { data } = await supabase.storage.from("avatars").createSignedUrls(unique, 3600);
  const out: Record<string, string> = {};
  for (const item of data ?? []) if (item.path && item.signedUrl) out[item.path] = item.signedUrl;
  return out;
}
