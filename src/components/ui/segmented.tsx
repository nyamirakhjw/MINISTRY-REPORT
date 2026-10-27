"use client";
import * as React from "react";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SegmentOption { value: string; label: string }

/**
 * Large, thumb-sized single choice (two options). Selection is shown by fill AND a check icon, not colour alone (PRD §10.4).
 * One fill slides between the options (PRD v1.1 AM-06); the label sits above it, so nothing but a transform moves.
 */
export function Segmented({ value, onValueChange, options, label, className }: {
  value: string; onValueChange: (v: string) => void; options: SegmentOption[]; label: string; className?: string;
}) {
  const index = options.findIndex((o) => o.value === value);
  const last = React.useRef(0);
  if (index >= 0) last.current = index; // while nothing is chosen, the fill waits where it last was
  return (
    <ToggleGroup.Root type="single" value={value} onValueChange={(v) => v && onValueChange(v)} aria-label={label}
      className={cn("relative isolate grid grid-cols-2 gap-3", className)} style={{ "--i": index >= 0 ? index : last.current } as React.CSSProperties}>
      <span className="m-seg-ind" data-visible={index >= 0 ? "true" : "false"} aria-hidden="true" />
      {options.map((o) => {
        const on = value === o.value;
        return (
          <ToggleGroup.Item key={o.value} value={o.value}
            className="relative flex min-h-14 items-center justify-center rounded-md border border-input-border bg-surface px-4 text-lg font-semibold text-foreground transition-colors data-[state=on]:border-primary">
            <span className={cn("relative z-20 flex items-center justify-center gap-2 transition-colors", on && "text-primary-foreground")}>
              {on && <Check className="m-pop size-5" aria-hidden="true" />}
              {o.label}
            </span>
          </ToggleGroup.Item>
        );
      })}
    </ToggleGroup.Root>
  );
}
