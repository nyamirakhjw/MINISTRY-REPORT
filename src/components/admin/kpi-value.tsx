"use client";
import * as React from "react";
import { prefersReducedMotion } from "@/lib/motion";

// Which figures have already counted up in this browser session. A figure counts up the first time it appears and then
// only ever updates instantly, so live refreshes and month changes never replay it (PRD v1.1 EM-01).
const played = new Set<string>();

/** A headline number that counts up once on first load. The server renders the final value, so it is correct without scripts. */
export function KpiValue({ id, value, total, suffix = "" }: { id: string; value: number; total?: number; suffix?: string }) {
  const num = React.useRef<HTMLSpanElement>(null);
  React.useLayoutEffect(() => {
    const node = num.current;
    if (!node || played.has(id) || prefersReducedMotion() || value <= 0) { played.add(id); return; }
    played.add(id);
    node.textContent = "0"; // before the first paint, so the final value never flashes
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / 600);
      node.textContent = String(Math.round(value * (1 - (1 - p) * (1 - p))));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(frame); node.textContent = String(value); };
  }, [id, value]);
  return <><span ref={num}>{value}</span>{total !== undefined ? ` / ${total}` : ""}{suffix}</>;
}
