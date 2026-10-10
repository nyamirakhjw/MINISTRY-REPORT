import * as React from "react";
import { cn } from "@/lib/utils";

/** Wide tables scroll inside their own container; the page body never scrolls sideways. */
export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <div className="w-full overflow-x-auto rounded-lg border border-border"><table className={cn("w-full min-w-[40rem] border-collapse text-left text-base", className)} {...props} /></div>;
}
export const THead = (p: React.HTMLAttributes<HTMLTableSectionElement>) => <thead className="sticky top-0 bg-tint" {...p} />;
export const TBody = (p: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody className="divide-y divide-border bg-surface" {...p} />;
export const TR = ({ className, ...p }: React.HTMLAttributes<HTMLTableRowElement>) => <tr className={cn("even:bg-background/60", className)} {...p} />;
export const TH = ({ className, ...p }: React.ThHTMLAttributes<HTMLTableCellElement>) => <th scope="col" className={cn("whitespace-nowrap px-3 py-3 text-sm font-semibold text-foreground", className)} {...p} />;
export const TD = ({ className, ...p }: React.TdHTMLAttributes<HTMLTableCellElement>) => <td className={cn("px-3 py-3 align-middle tabular", className)} {...p} />;
