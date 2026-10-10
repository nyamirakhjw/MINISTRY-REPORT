import { getTranslations } from "next-intl/server";
import { Landing } from "@/components/landing";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const t = await getTranslations("landing");
  return pageMetadata({ path: "/", locale: "en", title: t("metaTitle"), description: t("metaDescription") });
}
export default function Page() { return <Landing />; }
