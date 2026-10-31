import * as React from "react";

/** Keyed by month, so choosing another month swaps the page content with a short fade instead of a hard cut (PRD v1.1 EM-10). */
export function MonthFade({ month, children, className }: { month: string; children: React.ReactNode; className?: string }) {
  return <div key={month} className={`m-route-soft ${className ?? ""}`}>{children}</div>;
}
