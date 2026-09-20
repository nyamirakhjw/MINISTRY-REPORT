import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RecoveryForm } from "@/components/auth/mfa-forms";
import { MfaPage } from "@/components/auth/mfa-page";
import { requireUser } from "@/lib/auth/session";
import { PRIVATE_ROBOTS } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mfa");
  return { title: t("recoveryTitle"), robots: PRIVATE_ROBOTS };
}
export default async function Page() {
  await requireUser("/mfa/recovery");
  return <MfaPage titleKey="recoveryTitle" leadKey="recoveryLead"><RecoveryForm /></MfaPage>;
}
