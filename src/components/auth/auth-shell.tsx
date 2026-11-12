import type * as React from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/emblem";
import { LocaleSwitch } from "@/components/shell/locale";
import { ThemeToggle } from "@/components/shell/theme";

export async function AuthShell({ title, lead, children, wide }: { title: string; lead?: string; children: React.ReactNode; wide?: boolean }) {
  const t = await getTranslations("common");
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface pt-safe">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2">
          <Link href="/" className="rounded-md" aria-label={t("appName")}><Logo /></Link>
          <div className="flex items-center gap-1"><LocaleSwitch /><ThemeToggle /></div>
        </div>
      </header>
      <main id="main" className={`mx-auto w-full flex-1 px-4 py-8 ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <h1 className="m-enter">{title}</h1>
        {lead ? <p className="m-enter mt-2 text-lg text-muted-foreground" style={{ "--i": 1 } as React.CSSProperties}>{lead}</p> : null}
        <div className="m-enter mt-6" style={{ "--i": 2 } as React.CSSProperties}>{children}</div>
      </main>
    </div>
  );
}
