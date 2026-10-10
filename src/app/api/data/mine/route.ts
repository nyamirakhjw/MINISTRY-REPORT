export const dynamic = "force-dynamic";

import { requireMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/** PRO-07: download my data (JSON). Everything the person owns, including their private return visits and
 * daily log — fine here because it's their own download, not an Elder's (§16.5's limit is about others). */
export async function GET() {
  const { member } = await requireMember("/app/settings");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_data_export");
  if (error) return new Response(error.message, { status: 400 });
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="ministry-report_my-data_${member.username ?? member.id}.json"`,
    },
  });
}
