"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/components/shell/nav-links";

/** Phone: a scrolling top tab strip (PRD §8.3). Hidden from 768px, where the left rail takes over. */
export function AdminTabs({ items, label }: { items: NavItem[]; label: string }) {
  const t = useTranslations("nav");
  const path = usePathname();
  return (
    <nav aria-label={label} className="border-b border-border bg-surface md:hidden">
      <ul className="flex overflow-x-auto px-2">
        {items.map((i) => {
          const active = i.exact ? path === i.href : path === i.href || path.startsWith(`${i.href}/`);
          return (
            <li key={i.key} className="shrink-0">
              <Link href={i.href} aria-current={active ? "page" : undefined} className={cn("flex min-h-12 items-center gap-2 border-b-4 px-3 font-semibold", active ? "border-accent text-primary" : "border-transparent text-muted-foreground")}>
                {t(i.key)}{i.badge ? <span className="rounded-full bg-accent px-1.5 text-sm text-[#0B2E6B]" aria-label={t("pendingCount", { count: i.badge })}>{i.badge}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
