import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Minimum height 48px (PRD §10.4). Pressed feedback uses colour only, never layout shifts.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:opacity-90 active:opacity-80",
        secondary: "border border-input-border bg-surface text-foreground hover:bg-tint active:bg-tint",
        ghost: "text-foreground hover:bg-tint active:bg-tint",
        danger: "bg-danger text-primary-foreground hover:opacity-90 active:opacity-80",
        link: "h-auto min-h-0 px-0 text-primary underline underline-offset-4 hover:opacity-80",
      },
      size: { md: "min-h-12 px-5 text-base", sm: "min-h-11 px-4 text-sm", icon: "size-12" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, type, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} type={asChild ? undefined : (type ?? "button")} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = "Button";
export { buttonVariants };
