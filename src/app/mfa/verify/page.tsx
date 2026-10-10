import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { VerifyForm } from "@/components/auth/mfa-forms";
import { MfaPage } from "@/components/auth/mfa-page";
import { requireUser } from "@/lib/auth/session";
import { PRIVATE_ROBOTS } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mfa");
  return { title: t("verifyTitle"), robots: PRIVATE_ROBOTS };
}
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  await requireUser("/mfa/verify");
  const t = await getTranslations("mfa");
  return (
    <MfaPage titleKey="verifyTitle" leadKey="verifyLead">
      <VerifyForm next={next} />
      <p className="mt-6"><Link href="/mfa/recovery" className="inline-flex min-h-11 items-center underline underline-offset-4">{t("lostDevice")}</Link></p>
    </MfaPage>
  );
}
