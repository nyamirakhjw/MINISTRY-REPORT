import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/emblem";
import { NavLinks, type NavItem } from "@/components/shell/nav-links";
import { SidebarShell } from "@/components/shell/sidebar-shell";
import { Live } from "@/components/shell/live";
import { ThemeToggle } from "@/components/shell/theme";
import { SidebarCollapseProvider } from "@/lib/sidebar-collapse";
import { requireRole } from "@/lib/auth/session";
import { getCounts } from "@/lib/admin-data";
import { PRIVATE_ROBOTS } from "@/lib/metadata";
import { AdminTabs } from "@/components/admin/admin-tabs";

export const metadata: Metadata = { robots: PRIVATE_ROBOTS };

/** Elders see everything; Ministerial Servants see only the Approvals queue (D-13). Enforced again in the
 * database. Phase 3 adds Exports/Downloadables (Sprint 4) and Deletions (Sprint 7) to the Elder rail; the
 * rail itself collapses to icons-only with hover-to-expand (item 6), sharing one preference with the
 * publisher app's rail via SidebarCollapseProvider. */
export default async function Layout({ children }: { children: React.ReactNode }) {
  const { member, isPlatformAdmin } = await requireRole("ministerial_servant", "/admin");
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
        { key: "corrections", href: "/admin/corrections", badge: counts.corrections || undefined },
        { key: "members", href: "/admin/members" },
        { key: "exports", href: "/admin/exports" },
        { key: "deletions", href: "/admin/deletions", badge: counts.deletions || undefined },
        { key: "audit", href: "/admin/audit" },
        { key: "settings", href: "/admin/settings" },
      ]
    : [{ key: "approvals", href: "/admin/approvals", badge: counts.approvals || undefined }];
  return (
    <SidebarCollapseProvider>
      <div className="min-h-dvh md:flex">
        <SidebarShell
          footer={
            <>
              {isPlatformAdmin ? <Link href="/platform" className="inline-flex min-h-12 items-center rounded-md px-3 font-semibold text-primary hover:bg-tint"><span className="truncate group-hover/rail:whitespace-nowrap">{t("platform")}</span></Link> : null}
              <Link href="/app" className="inline-flex min-h-12 items-center rounded-md px-3 font-semibold hover:bg-tint"><span className="truncate group-hover/rail:whitespace-nowrap">{t("backToApp")}</span></Link>
              <div className="px-2 pt-1"><ThemeToggle /></div>
            </>
          }
        >
          <Link href="/admin" className="mb-4 block rounded-md"><Logo /></Link>
          <NavLinks items={items} label={t("adminMenu")} orientation="side" />
        </SidebarShell>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-2 pt-safe md:hidden">
            <Link href="/app" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">{t("backToApp")}</Link>
            <div className="flex items-center gap-1">
              {isPlatformAdmin ? <Link href="/platform" className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4">{t("platform")}</Link> : null}
              <ThemeToggle />
            </div>
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
    </SidebarCollapseProvider>
  );
}
