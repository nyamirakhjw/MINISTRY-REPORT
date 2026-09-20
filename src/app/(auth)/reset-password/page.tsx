import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetRequestForm } from "@/components/auth/reset-forms";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reset");
  return pageMetadata({ path: "/reset-password", locale: "en", title: t("title"), description: t("description"), index: false });
}
export default async function Page() {
  const t = await getTranslations("reset");
  return <AuthShell title={t("title")} lead={t("lead")}><ResetRequestForm /></AuthShell>;
}
