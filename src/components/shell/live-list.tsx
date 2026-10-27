"use client";
import * as React from "react";

const ListBorn = React.createContext<number>(0);

/**
 * Wraps a page whose items can arrive or change live (PRD v1.1 EM-04, EM-06). Items that mount well after the list did,
 * or whose signature changes, get a short gold highlight. Items present when the page opens never flash.
 */
export function LiveList({ children, className }: { children: React.ReactNode; className?: string }) {
  const [born] = React.useState(() => Date.now());
  return <ListBorn.Provider value={born}><div className={className}>{children}</div></ListBorn.Provider>;
}

/** One row or card. `sig` is any string that changes when the item's content changes (status, count, timestamp). */
export function LiveItem({ sig, className, children }: { sig: string; className?: string; children: React.ReactNode }) {
  const listBorn = React.useContext(ListBorn);
  const [flash, setFlash] = React.useState(false);
  const prev = React.useRef(sig);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const trigger = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setFlash(true);
    timer.current = setTimeout(() => setFlash(false), 1300);
  }, []);

  React.useEffect(() => {
    if (listBorn > 0 && Date.now() - listBorn > 1500) trigger(); // arrived after the page was already open
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [listBorn, trigger]);

  React.useEffect(() => {
    if (prev.current !== sig) { prev.current = sig; trigger(); }
  }, [sig, trigger]);

  return <li className={className} data-flash={flash ? "" : undefined}>{children}</li>;
}
