import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { EditMemberDialog, ManagedProfileDialog, RecoveryLinkButton, ServantRoleDialog, StatusDialog, type MemberLite } from "@/components/admin/member-dialogs";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/session";
import { signedAvatarUrls } from "@/lib/auth/avatars";
import { getGroups } from "@/lib/admin-data";
import { monthOf } from "@/lib/domain/time";
import { formatDateTime, formatMonth } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("members") };
}

interface Row extends MemberLite { username: string | null; phone: string | null; group_name: string | null; first_report_month: string | null; inactive_from_month: string | null; avatar_path: string | null; last_sign_in_at: string | null; arrangement: string | null }

export default async function Page() {
  const { member } = await requireRole("elder", "/admin/members");
  const t = await getTranslations("admin");
  const cat = await getTranslations("categories");
  const roles = await getTranslations("roles");
  const locale = await getLocale();
  const supabase = await createClient();
  const [{ data }, groups] = await Promise.all([supabase.rpc("admin_members"), getGroups()]);
  const rows = (data ?? []) as Row[];
  const avatars = await signedAvatarUrls(rows.map((r) => r.avatar_path));
  const cur = monthOf(new Date());
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1>{t("membersTitle")}</h1><ManagedProfileDialog groups={groups} /></div>
      <p className="text-muted-foreground">{t("membersCount", { count: rows.length })}</p>
      <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-start gap-3">
              <Avatar name={r.full_name} src={r.avatar_path ? avatars[r.avatar_path] : null} size={48} alt={t("photoOf", { name: r.full_name })} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-lg font-semibold">{r.full_name}
                  {r.role !== "publisher" && <Badge tone="gold">{roles(r.role as "elder")}</Badge>}
                  {r.status === "inactive" && <Badge tone="warning">{t("inactive")}</Badge>}
                  {r.is_managed && <Badge>{t("managed")}</Badge>}
                </p>
                <p className="text-muted-foreground">{r.group_name ?? "–"}{r.arrangement ? ` · ${cat(r.arrangement as "regular_pioneer")}` : ""}{r.username ? ` · @${r.username}` : ""}</p>
                <p className="text-sm text-muted-foreground">{t("firstMonthLine", { month: r.first_report_month ? formatMonth(r.first_report_month, locale) : "–" })}{r.last_sign_in_at ? ` · ${t("lastSignIn", { time: formatDateTime(r.last_sign_in_at, locale) })}` : ""}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <EditMemberDialog m={r} groups={groups} />
              {r.role !== "elder" && !r.is_managed && r.status === "active" && <ServantRoleDialog m={r} />}
              {r.id !== member.id && <StatusDialog m={r} defaultMonth={cur} />}
              {r.status === "active" && <RecoveryLinkButton m={r} />}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
