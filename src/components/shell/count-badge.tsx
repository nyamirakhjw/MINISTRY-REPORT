"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/** A count badge that pops once when the number changes after the page is open (PRD v1.1 AM-18, EM-06). */
export function CountBadge({ count, label, className }: { count: number; label: string; className?: string }) {
  const prev = React.useRef(count);
  const [pop, setPop] = React.useState(false);
  React.useEffect(() => {
    if (prev.current === count) return;
    prev.current = count;
    setPop(true);
    const timer = setTimeout(() => setPop(false), 400);
    return () => clearTimeout(timer);
  }, [count]);
  return <span className={cn(className, pop && "m-badge-pop")} aria-label={label}>{count}</span>;
}
