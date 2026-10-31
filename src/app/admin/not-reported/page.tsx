import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { MonthFade } from "@/components/admin/month-fade";
import { MonthPicker } from "@/components/admin/month-picker";
import { NotReportedList } from "@/components/admin/not-reported-list";
import { EmptyState } from "@/components/ui/empty-state";
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
      <MonthFade month={month}>
        {rows.length === 0 ? <EmptyState>{t("everyoneReported")}</EmptyState> : (
          <NotReportedList
            rows={rows.map((r) => ({ memberId: r.member_id, fullName: r.full_name, groupName: r.group_name, phone: r.phone, avatarUrl: r.avatar_path ? avatars[r.avatar_path] ?? null : null }))}
            month={month} dueIso={new Date(w.onTimeUntil.getTime() - 60_000).toISOString()} siteUrl={publicEnv.siteUrl} daysLeft={daysLeft} />
        )}
      </MonthFade>
    </div>
  );
}
