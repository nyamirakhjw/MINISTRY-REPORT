import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { RequestAccessForm } from "@/components/auth/request-access-form";
import { getPublicCongregation } from "@/lib/congregation";
import { publicEnv } from "@/lib/env";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("requestAccess");
  return pageMetadata({ path: "/request-access", locale: "en", title: t("title"), description: t("description"), index: false });
}
export default async function Page() {
  const t = await getTranslations("requestAccess");
  const cong = await getPublicCongregation();
  return (
    <AuthShell title={t("title")} lead={t("lead")} wide>
      <RequestAccessForm groups={cong?.groups ?? []} swEnabled={publicEnv.enableSw} />
    </AuthShell>
  );
}
