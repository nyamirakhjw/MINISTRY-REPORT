"use client";
import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>>(
  ({ className, ...props }, ref) => (
    // The 48px hit area is the wrapper label in the form; the box itself is 24px.
    <CheckboxPrimitive.Root ref={ref} className={cn("flex size-6 shrink-0 items-center justify-center rounded-sm border border-input-border bg-surface data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground", className)} {...props}>
      <CheckboxPrimitive.Indicator><Check className="size-4" aria-hidden="true" /></CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  ),
);
Checkbox.displayName = "Checkbox";
