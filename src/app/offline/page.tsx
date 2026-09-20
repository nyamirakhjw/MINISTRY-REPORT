import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PRIVATE_ROBOTS } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("offline");
  return { title: t("title"), robots: PRIVATE_ROBOTS };
}
export default async function Page() {
  const t = await getTranslations("offline");
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-3 px-4">
      <h1>{t("title")}</h1>
      <p className="text-lg">{t("body")}</p>
    </main>
  );
}
