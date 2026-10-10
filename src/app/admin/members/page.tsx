import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ManagedProfileDialog } from "@/components/admin/member-dialogs";
import { MembersListClient, type MemberRow } from "@/components/admin/members-list-client";
import { requireRole } from "@/lib/auth/session";
import { signedAvatarUrls } from "@/lib/auth/avatars";
import { getGroups } from "@/lib/admin-data";
import { monthOf } from "@/lib/domain/time";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("members") };
}

export default async function Page() {
  const { member } = await requireRole("elder", "/admin/members");
  const t = await getTranslations("admin");
  const supabase = await createClient();
  const [{ data }, groups] = await Promise.all([supabase.rpc("admin_members"), getGroups()]);
  const rows = (data ?? []) as MemberRow[];
  const avatars = await signedAvatarUrls(rows.map((r) => r.avatar_path));
  const cur = monthOf(new Date());
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1>{t("membersTitle")}</h1><ManagedProfileDialog groups={groups} /></div>
      <MembersListClient rows={rows} groups={groups} avatars={avatars} selfId={member.id} curMonth={cur} />
    </div>
  );
}
