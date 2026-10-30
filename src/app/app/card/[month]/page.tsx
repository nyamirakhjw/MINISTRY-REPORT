import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ReportCard } from "@/components/report/report-card";
import { requireMember } from "@/lib/auth/session";
import { signedAvatarUrls } from "@/lib/auth/avatars";
import { getPublicCongregation } from "@/lib/congregation";
import { formatMonth } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { ReportRow } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("card");
  return { title: t("pageTitle") };
}

/** Re-download a past card (CARD-05). Only the person's own submitted reports; the image is drawn on the device. */
export default async function Page({ params }: { params: Promise<{ month: string }> }) {
  const { month } = await params;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) notFound();
  const { member } = await requireMember(`/app/card/${month}`);
  const t = await getTranslations("card");
  const locale = await getLocale();
  const supabase = await createClient();
  const { data } = await supabase.from("reports").select("*").eq("member_id", member.id).eq("month", `${month}-01`).maybeSingle();
  const r = data as ReportRow | null;
  if (!r || r.status === "not_reported" || !r.category) notFound();
  const [avatars, cong] = await Promise.all([signedAvatarUrls([member.avatar_path]), getPublicCongregation()]);
  return (
    <div className="flex flex-col gap-4">
      <h1>{t("heading", { month: formatMonth(r.month, locale) })}</h1>
      <ReportCard data={{
        month: r.month, category: r.category, participated: r.participated, hours: r.hours, studies: r.studies ?? 0,
        name: member.full_name, username: member.username, avatarUrl: member.avatar_path ? avatars[member.avatar_path] ?? null : null,
        tagline: cong?.tagline ?? "",
      }} />
      <p><Link href="/app/history" className="font-semibold underline underline-offset-4">{t("back")}</Link></p>
    </div>
  );
}
