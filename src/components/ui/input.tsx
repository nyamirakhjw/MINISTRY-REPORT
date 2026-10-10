import * as React from "react";
import { cn } from "@/lib/utils";

const field = "w-full min-h-12 rounded-md border border-input-border bg-surface px-3 text-base text-foreground placeholder:text-muted-foreground disabled:opacity-60 aria-[invalid=true]:border-danger";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type = "text", ...props }, ref) => (
  <input ref={ref} type={type} className={cn(field, className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(field, "min-h-28 py-2", className)} {...props} />
));
Textarea.displayName = "Textarea";

/** Native select: best keyboard and screen-reader behaviour on Android, no extra JavaScript. */
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(field, "pr-8", className)} {...props}>{children}</select>
));
Select.displayName = "Select";
