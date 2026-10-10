import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/legal-page";
import { terms as docs } from "@/content/legal";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const t = await getTranslations("legal");
  return pageMetadata({ path: "/terms", locale: "en", title: docs.en.title, description: t("termsDescription") });
}
export default async function Page() {
  const t = await getTranslations("common");
  return <LegalPage doc={docs.en} path="/terms" prefix="" home={t("home")} breadcrumbLabel={t("breadcrumb")} />;
}
