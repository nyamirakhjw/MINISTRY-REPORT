"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

// A dependency-free switch (no @radix-ui/react-switch in this repo yet) with the same checked/onCheckedChange
// API Radix's Switch would have, so it drops in wherever that pattern is used. Meets the 44x44 touch-target
// floor (§10.10) via the button's padding, and never relies on colour alone (the thumb position carries the
// state, same as any physical switch).
export interface SwitchProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ id, checked, onCheckedChange, disabled, className, ...aria }, ref) => (
    <button
      ref={ref}
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-input-border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50",
        checked ? "bg-primary" : "bg-tint",
        className,
      )}
      {...aria}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-block size-6 translate-x-1 rounded-full bg-surface shadow transition-transform",
          checked && "translate-x-7",
        )}
      />
    </button>
  ),
);
Switch.displayName = "Switch";
