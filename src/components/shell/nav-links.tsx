"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, History, Menu, Bell, Clock, LayoutDashboard, Users, ClipboardList, ShieldCheck, UserPlus, Briefcase, UserX, PenLine, HeartHandshake, Download, Trash2, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useSidebarCollapse } from "@/lib/sidebar-collapse";

// Sprint 1 adds "settings" (SET-01..07); Phase 3, Sprint 2 adds "visits" (RV-01); Sprint 4 adds "exports"
// (EXP-01); Sprint 7 adds "deletions" (DEL-02).
const ICONS = {
  notifications: Bell, home: Home, log: Clock, report: FileText, history: History, more: Menu,
  visits: HeartHandshake, overview: LayoutDashboard, reports: ClipboardList, notReported: UserX,
  approvals: UserPlus, arrangements: Briefcase, corrections: PenLine, members: Users, audit: ShieldCheck,
  exports: Download, deletions: Trash2, settings: Settings,
} as const;
export type NavKey = keyof typeof ICONS;
export interface NavItem { key: NavKey; href: string; badge?: number; exact?: boolean }

/** Bottom bar on phones (at most 5 items, unaffected by the collapse feature — there's no room to collapse
 * further there), left rail from 768px which collapses via SidebarShell (item 6). */
export function NavLinks({ items, label, orientation }: { items: NavItem[]; label: string; orientation: "bottom" | "side" }) {
  const t = useTranslations("nav");
  const path = usePathname();
  const { collapsed } = useSidebarCollapse();
  const sideCollapsed = orientation === "side" && collapsed;

  return (
    <nav aria-label={label} className={orientation === "bottom" ? "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-safe md:hidden" : undefined}>
      <ul className={orientation === "bottom" ? "mx-auto flex max-w-lg" : "flex flex-col gap-1"}>
        {items.map((i) => {
          const active = i.exact ? path === i.href : path === i.href || path.startsWith(`${i.href}/`);
          const Icon = ICONS[i.key];
          return (
            <li key={i.key} className={orientation === "bottom" ? "flex-1" : undefined}>
              <Link href={i.href} aria-current={active ? "page" : undefined} title={sideCollapsed ? t(i.key) : undefined}
                onClick={(e) => {
                  // Offline, Next's client-side transition has no RSC payload to fetch and just hangs.
                  // Force a real document navigation instead: the service worker's navigate handler
                  // already knows how to serve this route from its cache (or the offline page).
                  if (typeof navigator !== "undefined" && navigator.onLine === false) {
                    e.preventDefault();
                    window.location.href = i.href;
                  }
                }}
                className={cn("relative flex items-center rounded-md font-semibold transition-colors", orientation === "bottom" ? "min-h-14 flex-col justify-center gap-0.5 text-xs" : "min-h-12 gap-3 px-3 text-base", active ? "bg-tint text-primary" : "text-muted-foreground hover:bg-tint")}>
                <Icon className="size-6 shrink-0" aria-hidden="true" />
                <span className={cn(sideCollapsed && "hidden whitespace-nowrap group-hover/rail:inline-block")}>{t(i.key)}</span>
                {i.badge ? <span className={cn("ml-auto min-w-6 rounded-full bg-accent px-1.5 text-center text-sm text-[#0B2E6B]", sideCollapsed && "absolute -right-1 -top-1 ml-0 group-hover/rail:static group-hover/rail:ml-auto")} aria-label={t("pendingCount", { count: i.badge })}>{i.badge}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
