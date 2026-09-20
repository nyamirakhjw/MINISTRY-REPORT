import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/emblem";
import { NavLinks, type NavItem } from "@/components/shell/nav-links";
import { Live } from "@/components/shell/live";
import { ThemeToggle } from "@/components/shell/theme";
import { requireRole } from "@/lib/auth/session";
import { getCounts } from "@/lib/admin-data";
import { PRIVATE_ROBOTS } from "@/lib/metadata";
import { AdminTabs } from "@/components/admin/admin-tabs";

export const metadata: Metadata = { robots: PRIVATE_ROBOTS };

/** Elders see everything; Ministerial Servants see only the Approvals queue (D-13). Enforced again in the database. */
export default async function Layout({ children }: { children: React.ReactNode }) {
  const { member } = await requireRole("ministerial_servant", "/admin");
  const t = await getTranslations("nav");
  const counts = await getCounts();
  const elder = member.role === "elder";
  const items: NavItem[] = elder
    ? [
        { key: "overview", href: "/admin", exact: true },
        { key: "reports", href: "/admin/reports" },
        { key: "notReported", href: "/admin/not-reported" },
        { key: "approvals", href: "/admin/approvals", badge: counts.approvals + counts.changes || undefined },
        { key: "arrangements", href: "/admin/arrangements", badge: counts.arrangements || undefined },
        { key: "members", href: "/admin/members" },
        { key: "audit", href: "/admin/audit" },
      ]
    : [{ key: "approvals", href: "/admin/approvals", badge: counts.approvals || undefined }];
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16rem_1fr]">
      <aside className="hidden border-r border-border bg-surface md:block">
        <div className="sticky top-0 flex h-dvh flex-col gap-6 p-4 pt-safe">
          <Link href="/admin" className="rounded-md"><Logo /></Link>
          <NavLinks items={items} label={t("adminMenu")} orientation="side" />
          <Link href="/app" className="mt-auto inline-flex min-h-12 items-center rounded-md px-3 font-semibold hover:bg-tint">{t("backToApp")}</Link>
          <div><ThemeToggle /></div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-2 pt-safe md:hidden">
          <Link href="/app" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">{t("backToApp")}</Link>
          <ThemeToggle />
        </header>
        <AdminTabs items={items} label={t("adminMenu")} />
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-12">
          <Live channel={`admin:${member.congregation_id}`} tables={[
            { table: "reports", filter: `congregation_id=eq.${member.congregation_id}` },
            { table: "members", filter: `congregation_id=eq.${member.congregation_id}` },
            { table: "service_arrangements", filter: `congregation_id=eq.${member.congregation_id}` },
            { table: "profile_change_requests", filter: `congregation_id=eq.${member.congregation_id}` },
          ]} />
          {children}
        </main>
      </div>
    </div>
  );
}
