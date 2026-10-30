import * as React from "react";

/**
 * Says what belongs here and draws a small open door, line by line, once (PRD v1.1 AM-22). CSS only, so it works in server
 * components. The drawing is decorative; the sentence is the content. Reduced motion: the door is simply there.
 */
export function EmptyState({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  const k = (n: number) => ({ "--k": n }) as React.CSSProperties;
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface p-5">
      <svg className="m-line size-14 shrink-0 text-primary" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M12 50V14a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v36" pathLength={1} style={k(0)} />
        <path d="M6 50h44" pathLength={1} style={k(1)} />
        <path d="M44 14 34 18v32l10-0" pathLength={1} style={k(2)} className="text-accent" />
        <circle cx="30" cy="34" r="1.5" pathLength={1} style={k(3)} />
      </svg>
      <div className="flex min-w-0 flex-1 flex-col gap-3"><p>{children}</p>{action}</div>
    </div>
  );
}
