import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Landing } from "@/components/landing";
import { publicEnv } from "@/lib/env";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const t = await getTranslations("landing");
  return pageMetadata({ path: "/", locale: "sw", title: t("metaTitle"), description: t("metaDescription") });
}
export default function Page() {
  if (!publicEnv.enableSw) notFound();
  return <Landing />;
}
