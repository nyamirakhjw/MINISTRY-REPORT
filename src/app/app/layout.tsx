import type { Metadata } from "next";
import { MemberShell } from "@/components/shell/member-shell";
import { requireMember } from "@/lib/auth/session";
import { signedAvatarUrls } from "@/lib/auth/avatars";
import { createClient } from "@/lib/supabase/server";
import { PRIVATE_ROBOTS } from "@/lib/metadata";
import { Live } from "@/components/shell/live";

export const metadata: Metadata = { robots: PRIVATE_ROBOTS };

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { member } = await requireMember("/app");
  const supabase = await createClient();
  const [urls, { count }, { data: goal }] = await Promise.all([
    signedAvatarUrls([member.avatar_path]),
    supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
    supabase.rpc("my_month_goal", { p_month: new Date().toISOString().slice(0, 7) + "-01" }),
  ]);
  const isPioneer = (goal as { category?: string } | null)?.category !== "publisher";
  return (
    <MemberShell member={member} avatarUrl={member.avatar_path ? urls[member.avatar_path] : undefined} unread={count ?? 0} isPioneer={isPioneer}>
      <Live channel={`own:${member.id}`} tables={[{ table: "reports", filter: `member_id=eq.${member.id}` }, { table: "notifications", filter: `member_id=eq.${member.id}` }, { table: "service_arrangements", filter: `member_id=eq.${member.id}` }]} />
      {children}
    </MemberShell>
  );
}
