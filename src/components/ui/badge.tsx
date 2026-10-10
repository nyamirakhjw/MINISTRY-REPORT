import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Status is always text (and usually an icon) as well as colour; colour is never the only signal.
const badgeVariants = cva("inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-sm font-semibold", {
  variants: {
    tone: {
      neutral: "border-border bg-tint text-foreground",
      success: "border-success text-success",
      warning: "border-warning text-warning",
      danger: "border-danger text-danger",
      gold: "border-accent bg-accent text-[#0B2E6B]",
    },
  },
  defaultVariants: { tone: "neutral" },
});
export function Badge({ className, tone, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
