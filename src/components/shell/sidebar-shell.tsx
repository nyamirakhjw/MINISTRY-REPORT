"use client";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useSidebarCollapse } from "@/lib/sidebar-collapse";

/**
 * The collapsible left rail (item 6). Pinned-expanded is the default and behaves exactly as before — full
 * width, part of the normal page layout. Pinned-collapsed reserves a narrow icon-only column in the layout
 * (so nothing else on the page reflows), and hovering it temporarily grows the panel over the content via
 * absolute positioning — nothing underneath shifts while you're just peeking at a label. The same preference
 * (localStorage, not the account) drives both the publisher app's rail and the Elder console's rail.
 */
export function SidebarShell({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  const t = useTranslations("nav");
  const { collapsed, toggle, ready } = useSidebarCollapse();

  return (
    <div
      className="relative hidden shrink-0 md:block"
      style={{ width: collapsed ? "4.5rem" : "16rem", visibility: ready ? "visible" : "hidden" }}
    >
      <div
        className={cn(
          "group/rail absolute inset-y-0 left-0 z-40 flex h-dvh flex-col gap-6 overflow-x-hidden border-r border-border bg-surface p-3 pt-safe transition-[width] duration-150",
          collapsed ? "w-[4.5rem] hover:w-64 hover:shadow-xl" : "w-64 p-4",
        )}
      >
        <div className="flex-1 overflow-y-auto">{children}</div>
        <div className="flex flex-col gap-1">
          {footer}
          <button
            type="button"
            onClick={toggle}
            aria-pressed={collapsed}
            className="mt-2 inline-flex min-h-11 items-center gap-3 rounded-md px-3 font-semibold text-muted-foreground hover:bg-tint hover:text-foreground"
          >
            {collapsed ? <ChevronsRight className="size-5 shrink-0" aria-hidden="true" /> : <ChevronsLeft className="size-5 shrink-0" aria-hidden="true" />}
            <span className={cn(collapsed && "hidden whitespace-nowrap group-hover/rail:inline-block")}>
              {collapsed ? t("expandSidebar") : t("collapseSidebar")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
