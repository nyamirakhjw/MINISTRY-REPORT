"use client";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errorPage");
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-4">
      <h1>{t("title")}</h1>
      <p className="text-lg text-muted-foreground">{t("body")}</p>
      <div><Button onClick={reset}>{t("retry")}</Button></div>
    </main>
  );
}
