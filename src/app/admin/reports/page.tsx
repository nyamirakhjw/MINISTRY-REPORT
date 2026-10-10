import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { MonthPicker } from "@/components/admin/month-picker";
import { ReportsTable } from "@/components/admin/reports-table";
import { requireRole } from "@/lib/auth/session";
import { signedAvatarUrls } from "@/lib/auth/avatars";
import { getGroups, getMonthRows, parseMonthParam } from "@/lib/admin-data";
import { formatMonth } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("reports") };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireRole("elder", "/admin/reports");
  const t = await getTranslations("admin");
  const locale = await getLocale();
  const month = parseMonthParam((await searchParams).month);
  const [rows, groups] = await Promise.all([getMonthRows(month), getGroups()]);
  const avatars = await signedAvatarUrls(rows.map((r) => r.avatar_path));
  return (
    <div className="flex flex-col gap-6">
      <h1>{t("reportsTitle", { month: formatMonth(month, locale) })}</h1>
      <MonthPicker month={month} />
      <ReportsTable rows={rows} groups={groups} month={month} avatars={avatars} />
    </div>
  );
}
