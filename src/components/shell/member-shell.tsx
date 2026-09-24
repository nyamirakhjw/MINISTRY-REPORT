import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/emblem";
import { Avatar } from "@/components/ui/avatar";
import { LocaleSwitch } from "@/components/shell/locale";
import { NavLinks, type NavItem } from "@/components/shell/nav-links";
import { ThemeToggle } from "@/components/shell/theme";
import { publicEnv } from "@/lib/env";
import type { Member } from "@/lib/types";

export async function MemberShell({ member, avatarUrl, unread, isPioneer, children }: { member: Member; avatarUrl?: string; unread: number; isPioneer: boolean; children: React.ReactNode }) {
  const t = await getTranslations("nav");
  // Bottom bar stays at 5 items max (PRD §8.3): Home, Log (pioneers only), Report, History, More.
  const items: NavItem[] = [
    { key: "home", href: "/app", exact: true },
    ...(isPioneer ? [{ key: "log" as const, href: "/app/log" }] : []),
    { key: "report", href: "/app/report" },
    { key: "history", href: "/app/history" },
    { key: "more", href: "/app/more", badge: unread || undefined },
  ];
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16rem_1fr]">
      <aside className="hidden border-r border-border bg-surface md:block">
        <div className="sticky top-0 flex h-dvh flex-col gap-6 p-4 pt-safe">
          <Link href="/app" className="rounded-md"><Logo /></Link>
          <div className="flex items-center gap-3"><Avatar name={member.full_name} src={avatarUrl} size={44} alt={t("photoOf", { name: member.full_name })} /><span className="font-semibold">{member.full_name}</span></div>
          <NavLinks items={[...items.filter((i) => i.key !== "more"), { key: "notifications", href: "/app/notifications", badge: unread || undefined }]} label={t("main")} orientation="side" />
          {member.role !== "publisher" ? <Link href="/admin" className="inline-flex min-h-12 items-center rounded-md px-3 font-semibold text-primary hover:bg-tint">{t("admin")}</Link> : null}
          <Link href="/app/settings" className="inline-flex min-h-12 items-center rounded-md px-3 font-semibold hover:bg-tint">{t("settings")}</Link>
          <div className="mt-auto flex items-center gap-1">{publicEnv.enableSw ? <LocaleSwitch /> : null}<ThemeToggle /></div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-2 pt-safe md:hidden">
          <Link href="/app" aria-label={t("home")}><Logo name="JW NYAMIRA" /></Link>
          <div className="flex items-center gap-1">{publicEnv.enableSw ? <LocaleSwitch /> : null}<ThemeToggle /></div>
        </header>
        <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-28 md:pb-10">{children}</main>
        <NavLinks items={items} label={t("main")} orientation="bottom" />
      </div>
    </div>
  );
}
