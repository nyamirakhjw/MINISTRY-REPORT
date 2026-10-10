import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { NewPasswordForm } from "@/components/auth/reset-forms";
import { requireUser } from "@/lib/auth/session";
import { PRIVATE_ROBOTS } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reset");
  return { title: t("updateTitle"), robots: PRIVATE_ROBOTS };
}
export default async function Page() {
  await requireUser("/reset-password/update");
  const t = await getTranslations("reset");
  return <AuthShell title={t("updateTitle")}><NewPasswordForm /></AuthShell>;
}
