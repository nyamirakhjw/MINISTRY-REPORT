import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { InstallCard } from "@/components/shell/install-card";
import { PublicFooter, PublicHeader } from "@/components/shell/public-chrome";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const t = await getTranslations("install");
  return pageMetadata({ path: "/install", locale: "en", title: t("pageTitle"), description: t("pageDescription") });
}
export default async function Page() {
  const t = await getTranslations("install");
  const c = await getTranslations("common");
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader path="/install" />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8">
        <h1>{t("pageTitle")}</h1>
        <section><h2>{t("androidTitle")}</h2><p className="mt-2 max-w-prose">{t("androidSteps")}</p></section>
        <section><h2>{t("iphoneTitle")}</h2><p className="mt-2 max-w-prose">{t("iphoneSteps")}</p></section>
        <InstallCard />
        <p><Link href="/" className="underline underline-offset-4">{c("home")}</Link></p>
      </main>
      <PublicFooter />
    </div>
  );
}
