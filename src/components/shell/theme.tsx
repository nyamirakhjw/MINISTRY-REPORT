"use client";
import * as React from "react";
import { ThemeProvider as NextThemes, useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTranslations } from "next-intl";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import { withViewTransition } from "@/lib/motion";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <NextThemes attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>{children}</NextThemes>;
}

/** Cycles Light, Dark, System. Announces the current choice. */
export function ThemeToggle() {
  const t = useTranslations("common");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const order = ["light", "dark", "system"] as const;
  const current = (mounted ? theme : "system") as (typeof order)[number];
  const next = order[(order.indexOf(current) + 1) % order.length] ?? "system";
  const Icon = current === "light" ? Sun : current === "dark" ? Moon : Monitor;
  return (
    <Button variant="ghost" size="icon" onClick={(e) => {
      const box = e.currentTarget.getBoundingClientRect();
      // A circular reveal from the button where the browser supports it; otherwise the theme just switches.
      withViewTransition(() => flushSync(() => setTheme(next)), { x: box.left + box.width / 2, y: box.top + box.height / 2 });
    }} aria-label={t("themeCurrent", { theme: t(current) })}>
      <Icon aria-hidden="true" />
    </Button>
  );
}
