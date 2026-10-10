import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/emblem";
import { PublicLocaleSwitch } from "@/components/shell/locale";
import { ThemeToggle } from "@/components/shell/theme";
import { publicEnv } from "@/lib/env";

export async function PublicHeader({ path }: { path: string }) {
  const t = await getTranslations("common");
  return (
    <header className="border-b border-border bg-surface pt-safe">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2">
        <Link href="/" className="rounded-md" aria-label={t("appName")}><Logo sub={t("kingdomHallShort")} /></Link>
        <div className="flex items-center gap-1">
          {publicEnv.enableSw ? <PublicLocaleSwitch path={path} /> : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export async function PublicFooter({ prefix = "" }: { prefix?: string }) {
  const t = await getTranslations("common");
  const link = "inline-flex min-h-11 items-center rounded-md px-1 underline underline-offset-4";
  return (
    <footer className="border-t border-border bg-surface pb-safe">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3 text-sm text-muted-foreground">
        <nav aria-label={t("legal")} className="flex flex-wrap gap-x-4">
          <Link className={link} href={`${prefix}/privacy`}>{t("privacy")}</Link>
          <Link className={link} href={`${prefix}/terms`}>{t("terms")}</Link>
          <Link className={link} href="/install">{t("installApp")}</Link>
        </nav>
        <p>{t("appName")}</p>
      </div>
    </footer>
  );
}
