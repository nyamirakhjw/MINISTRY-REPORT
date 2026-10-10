"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Target, CalendarClock, Bell, Landmark, Users } from "lucide-react";
import type { ComponentType } from "react";

type SettingsNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const ITEMS: SettingsNavItem[] = [
  { href: "/admin/settings/general", label: "General & landing", icon: Landmark },
  { href: "/admin/settings/groups", label: "Groups", icon: Users },
  { href: "/admin/settings/goals", label: "Goal defaults", icon: Target },
  { href: "/admin/settings/window", label: "Window rules", icon: CalendarClock },
  { href: "/admin/settings/reminders", label: "Reminders", icon: Bell },
];

/**
 * Matches PRD §8.3: a left rail on tablet/laptop, a horizontal strip on
 * phone. One icon family (Lucide, 1.75 stroke) per §10.2 anti-slop
 * rule #1 — no emoji.
 */
export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Congregation settings sections"
      className="
        -mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 pb-2
        md:mx-0 md:flex-col md:gap-0.5 md:border-b-0 md:border-r md:px-0 md:pb-0 md:pr-4
      "
    >
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname?.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={[
              "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-primary/5 hover:text-foreground",
            ].join(" ")}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
