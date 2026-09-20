"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { setLocaleAction } from "@/lib/actions/profile";
import { cn } from "@/lib/utils";

const base = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 text-sm font-semibold";

/** Public pages: separate addresses (/ and /sw) so search engines and people can link to each language. */
export function PublicLocaleSwitch({ path }: { path: string }) {
  const locale = useLocale();
  const t = useTranslations("common");
  return (
    <nav aria-label={t("language")} className="flex items-center">
      <Link href={path || "/"} hrefLang="en" lang="en" aria-current={locale === "en" ? "true" : undefined} className={cn(base, locale === "en" ? "bg-tint text-primary" : "text-muted-foreground")}>EN</Link>
      <Link href={`/sw${path === "/" ? "" : path}`} hrefLang="sw" lang="sw" aria-current={locale === "sw" ? "true" : undefined} className={cn(base, locale === "sw" ? "bg-tint text-primary" : "text-muted-foreground")}>SW</Link>
    </nav>
  );
}

/** Signed-in and auth pages: stored per member, changeable any time. */
export function LocaleSwitch() {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const set = (l: "en" | "sw") => start(async () => { await setLocaleAction(l); router.refresh(); });
  return (
    <div role="group" aria-label={t("language")} className="flex items-center">
      {(["en", "sw"] as const).map((l) => (
        <button key={l} type="button" lang={l} disabled={pending} aria-pressed={locale === l} onClick={() => set(l)}
          className={cn(base, locale === l ? "bg-tint text-primary" : "text-muted-foreground")}>{l.toUpperCase()}</button>
      ))}
    </div>
  );
}
