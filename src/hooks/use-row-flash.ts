"use client";
import * as React from "react";

/**
 * For client-rendered tables (PRD v1.1 EM-04). Returns the ids of rows that are new or whose signature changed since the
 * previous render, for about 1.3 seconds. The first render never flashes. `signature` should be cheap and stable.
 */
export function useRowFlash<T>(rows: T[], id: (row: T) => string, signature: (row: T) => string): Set<string> {
  const prev = React.useRef<Map<string, string> | null>(null);
  const [flashing, setFlashing] = React.useState<Set<string>>(() => new Set());
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const next = new Map<string, string>();
    for (const r of rows) next.set(id(r), signature(r));
    const before = prev.current;
    prev.current = next;
    if (!before) return;
    const changed = new Set<string>();
    for (const [key, sig] of next) if (before.get(key) !== sig) changed.add(key);
    if (changed.size === 0) return;
    if (timer.current) clearTimeout(timer.current);
    setFlashing(changed);
    timer.current = setTimeout(() => setFlashing(new Set()), 1300);
  }, [rows, id, signature]);

  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return flashing;
}
