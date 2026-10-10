import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { CloseMonthDialog, OnBehalfDialog } from "@/components/admin/report-dialogs";
import { MonthPicker } from "@/components/admin/month-picker";
import { WhatsAppLink } from "@/components/admin/whatsapp-link";
import { Avatar } from "@/components/ui/avatar";
import { requireRole } from "@/lib/auth/session";
import { signedAvatarUrls } from "@/lib/auth/avatars";
import { getMonthRows, parseMonthParam } from "@/lib/admin-data";
import { publicEnv } from "@/lib/env";
import { formatMonth } from "@/lib/format";
import { reportWindow } from "@/lib/domain/window";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("notReported") };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireRole("elder", "/admin/not-reported");
  const t = await getTranslations("admin");
  const locale = await getLocale();
  const month = parseMonthParam((await searchParams).month);
  const rows = (await getMonthRows(month)).filter((r) => r.status === "missing");
  const avatars = await signedAvatarUrls(rows.map((r) => r.avatar_path));
  const w = reportWindow(month);
  const now = Date.now();
  const daysLeft = Math.ceil((w.onTimeUntil.getTime() - now) / 86_400_000);
  return (
    <div className="flex flex-col gap-6">
      <h1>{t("notReportedTitle", { month: formatMonth(month, locale) })}</h1>
      <MonthPicker month={month} />
      {rows.length === 0 ? <p className="rounded-lg border border-border bg-surface p-5">{t("everyoneReported")}</p> : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {rows.map((r) => (
            <li key={r.member_id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={r.full_name} src={r.avatar_path ? avatars[r.avatar_path] : null} size={44} alt={t("photoOf", { name: r.full_name })} />
                <div><p className="font-semibold">{r.full_name}</p><p className="text-sm text-muted-foreground">{r.group_name ?? ""} · {daysLeft >= 0 ? t("daysLeft", { count: daysLeft }) : t("daysOverdue", { count: -daysLeft })}</p></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <WhatsAppLink phone={r.phone} firstName={r.full_name.split(" ")[0] ?? r.full_name} month={month} dueIso={new Date(w.onTimeUntil.getTime() - 60_000).toISOString()} siteUrl={publicEnv.siteUrl} />
                <OnBehalfDialog memberId={r.member_id} name={r.full_name} month={month} label={t("submitOnBehalf")} />
                <CloseMonthDialog memberId={r.member_id} name={r.full_name} month={month} label={t("closeMonth")} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
