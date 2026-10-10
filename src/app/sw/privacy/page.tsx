import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/legal-page";
import { privacy as docs } from "@/content/legal";
import { publicEnv } from "@/lib/env";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const t = await getTranslations("legal");
  return pageMetadata({ path: "/privacy", locale: "sw", title: docs.sw.title, description: t("privacyDescription") });
}
export default async function Page() {
  if (!publicEnv.enableSw) notFound();
  const t = await getTranslations("common");
  return <LegalPage doc={docs.sw} path="/privacy" prefix="/sw" home={t("home")} breadcrumbLabel={t("breadcrumb")} />;
}
