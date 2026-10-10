import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/legal-page";
import { privacy as docs } from "@/content/legal";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const t = await getTranslations("legal");
  return pageMetadata({ path: "/privacy", locale: "en", title: docs.en.title, description: t("privacyDescription") });
}
export default async function Page() {
  const t = await getTranslations("common");
  return <LegalPage doc={docs.en} path="/privacy" prefix="" home={t("home")} breadcrumbLabel={t("breadcrumb")} />;
}
