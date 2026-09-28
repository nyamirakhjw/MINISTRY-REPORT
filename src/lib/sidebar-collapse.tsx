"use client";
import * as React from "react";

const STORAGE_KEY = "mr:sidebar-collapsed";

/**
 * Item 6 of the September change request: one shared collapsed/expanded preference for BOTH the publisher
 * app's left rail and the Elder console's left rail, so it stays consistent whichever side of the app you're
 * on, remembered per device (localStorage, not synced to the account). Starts expanded, same as before — the
 * person opts into collapsing it, not the other way round.
 */
interface Ctx { collapsed: boolean; toggle: () => void; ready: boolean }
const SidebarCollapseContext = React.createContext<Ctx>({ collapsed: false, toggle: () => {}, ready: false });

export function SidebarCollapseProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // localStorage unavailable (private browsing, etc.) — fall back to the "start expanded" default silently.
    }
    setReady(true);
  }, []);

  const toggle = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try { window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0"); } catch { /* best-effort only */ }
      return next;
    });
  }, []);

  return <SidebarCollapseContext.Provider value={{ collapsed, toggle, ready }}>{children}</SidebarCollapseContext.Provider>;
}

export function useSidebarCollapse() {
  return React.useContext(SidebarCollapseContext);
}
