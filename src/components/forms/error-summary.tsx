"use client";
import * as React from "react";

export interface SummaryItem { id: string; message: string }

/** After a failed submit, focus moves here and each item links to its field (PRD §10.9). */
export const ErrorSummary = React.forwardRef<HTMLDivElement, { title: string; items: SummaryItem[] }>(({ title, items }, ref) => {
  if (items.length === 0) return null;
  return (
    <div ref={ref} role="alert" tabIndex={-1} aria-labelledby="error-summary-title" className="rounded-md border-2 border-danger bg-surface p-4">
      <h2 id="error-summary-title" className="text-lg text-danger">{title}</h2>
      <ul className="mt-2 list-disc pl-5">
        {items.map((i) => <li key={i.id}><a href={`#${i.id}`} className="font-semibold underline">{i.message}</a></li>)}
      </ul>
    </div>
  );
});
ErrorSummary.displayName = "ErrorSummary";
