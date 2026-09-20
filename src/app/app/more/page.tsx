import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Settings, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SignOutButton } from "@/components/shell/sign-out";
import { requireMember } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("more") };
}

export default async function Page() {
  const { member } = await requireMember("/app/more");
  const t = await getTranslations("nav");
  const row = "flex min-h-14 items-center gap-3 px-4 font-semibold hover:bg-tint";
  return (
    <div className="flex flex-col gap-6">
      <h1>{t("more")}</h1>
      <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
        <li><Link href="/app/notifications" className={row}><Bell className="size-6" aria-hidden="true" />{t("notifications")}</Link></li>
        <li><Link href="/app/settings" className={row}><Settings className="size-6" aria-hidden="true" />{t("settings")}</Link></li>
        {member.role !== "publisher" && <li><Link href="/admin" className={row}><ShieldCheck className="size-6" aria-hidden="true" />{t("admin")}</Link></li>}
      </ul>
      <SignOutButton />
    </div>
  );
}
