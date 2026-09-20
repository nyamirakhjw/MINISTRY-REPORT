"use client";
import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { passwordStrength } from "@/lib/domain/password";
import { cn } from "@/lib/utils";

/** Allows paste and password managers. Show/hide is a button, not hover-only. */
export const PasswordInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { meter?: boolean; value?: string }>(
  ({ meter, value, className, ...props }, ref) => {
    const t = useTranslations("common");
    const [show, setShow] = React.useState(false);
    const strength = passwordStrength(String(value ?? ""));
    return (
      <div>
        <div className="relative">
          <Input ref={ref} type={show ? "text" : "password"} value={value} className={cn("pr-14", className)} autoCapitalize="none" spellCheck={false} {...props} />
          <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} aria-label={show ? t("hidePassword") : t("showPassword")}
            className="absolute right-0 top-0 flex size-12 items-center justify-center rounded-md text-muted-foreground hover:text-foreground">
            {show ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
          </button>
        </div>
        {meter && String(value ?? "").length > 0 ? (
          <div className="mt-2" aria-live="polite">
            <div className="flex gap-1" aria-hidden="true">
              {[1, 2, 3].map((n) => <span key={n} className={cn("h-1.5 flex-1 rounded-sm", strength >= n ? "bg-primary" : "bg-border")} />)}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{t(`strength${strength}`)}</p>
          </div>
        ) : null}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
