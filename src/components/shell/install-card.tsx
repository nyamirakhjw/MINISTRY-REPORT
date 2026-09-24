"use client";
import * as React from "react";
import { Download, Share } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface InstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

/** PWA install (PRD §9.4): one button on Android, plain steps on iPhone. Dismissible; never shown when already installed. */
export function InstallCard({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("install");
  const [evt, setEvt] = React.useState<InstallPromptEvent | null>(null);
  const [ios, setIos] = React.useState(false);
  const [standalone, setStandalone] = React.useState(true);
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    setStandalone(window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setHidden(localStorage.getItem("install-dismissed") === "1" && compact);
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as InstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, [compact]);

  if (standalone || hidden) return null;
  return (
    <section aria-labelledby="install-title" className="rounded-lg border border-border bg-surface p-4">
      <h2 id="install-title" className="text-lg">{t("title")}</h2>
      <p className="mt-1 text-muted-foreground">{t("intro")}</p>
      {ios ? (
        <p className="mt-3 flex items-start gap-2"><Share className="mt-1 size-5 shrink-0" aria-hidden="true" />{t("iphoneSteps")}</p>
      ) : (
        <p className="mt-3">{t("androidSteps")}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        {evt ? <Button onClick={async () => { await evt.prompt(); setEvt(null); }}><Download aria-hidden="true" />{t("installButton")}</Button> : null}
        {compact ? <Button variant="ghost" onClick={() => { localStorage.setItem("install-dismissed", "1"); setHidden(true); }}>{t("dismiss")}</Button> : null}
      </div>
    </section>
  );
}
