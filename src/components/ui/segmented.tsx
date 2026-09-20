"use client";
import * as React from "react";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SegmentOption { value: string; label: string }

/** Large, thumb-sized single choice. Selection is shown by fill AND a check icon, not colour alone (PRD §10.4). */
export function Segmented({ value, onValueChange, options, label, className }: {
  value: string; onValueChange: (v: string) => void; options: SegmentOption[]; label: string; className?: string;
}) {
  return (
    <ToggleGroup.Root type="single" value={value} onValueChange={(v) => v && onValueChange(v)} aria-label={label} className={cn("grid grid-cols-2 gap-3", className)}>
      {options.map((o) => (
        <ToggleGroup.Item key={o.value} value={o.value}
          className="flex min-h-14 items-center justify-center gap-2 rounded-md border border-input-border bg-surface px-4 text-lg font-semibold text-foreground transition-colors data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
          {value === o.value && <Check className="size-5" aria-hidden="true" />}
          {o.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
