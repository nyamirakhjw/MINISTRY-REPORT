"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { setLocaleAction } from "@/lib/actions/profile";
import { cn } from "@/lib/utils";
import { waitFor, withViewTransition } from "@/lib/motion";

const base = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 text-sm font-semibold";

/** Public pages: separate addresses (/ and /sw) so search engines and people can link to each language. */
export function PublicLocaleSwitch({ path }: { path: string }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("common");
  // A plain click crossfades to the other language; modified clicks (new tab, etc.) keep their normal behaviour.
  const go = (href: string, lang: "en" | "sw") => (e: React.MouseEvent) => {
    if (lang === locale || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    withViewTransition(async () => { router.push(href); await waitFor(() => document.documentElement.lang === lang); });
  };
  const enHref = path || "/";
  const swHref = `/sw${path === "/" ? "" : path}`;
  return (
    <nav aria-label={t("language")} className="flex items-center">
      <Link href={enHref} onClick={go(enHref, "en")} hrefLang="en" lang="en" aria-current={locale === "en" ? "true" : undefined} className={cn(base, locale === "en" ? "bg-tint text-primary" : "text-muted-foreground")}>EN</Link>
      <Link href={swHref} onClick={go(swHref, "sw")} hrefLang="sw" lang="sw" aria-current={locale === "sw" ? "true" : undefined} className={cn(base, locale === "sw" ? "bg-tint text-primary" : "text-muted-foreground")}>SW</Link>
    </nav>
  );
}

/** Signed-in and auth pages: stored per member, changeable any time. */
export function LocaleSwitch() {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const set = (l: "en" | "sw") => {
    if (l === locale) return;
    // The page crossfades once the new language has actually rendered.
    withViewTransition(() => new Promise<void>((resolve) => {
      start(async () => { await setLocaleAction(l); router.refresh(); await waitFor(() => document.documentElement.lang === l); resolve(); });
    }));
  };
  return (
    <div role="group" aria-label={t("language")} className="flex items-center">
      {(["en", "sw"] as const).map((l) => (
        <button key={l} type="button" lang={l} disabled={pending} aria-pressed={locale === l} onClick={() => set(l)}
          className={cn(base, locale === l ? "bg-tint text-primary" : "text-muted-foreground")}>{l.toUpperCase()}</button>
      ))}
    </div>
  );
}
