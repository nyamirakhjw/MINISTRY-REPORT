import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EnrollForm } from "@/components/auth/mfa-forms";
import { MfaPage } from "@/components/auth/mfa-page";
import { requireUser } from "@/lib/auth/session";
import { PRIVATE_ROBOTS } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mfa");
  return { title: t("enrollTitle"), robots: PRIVATE_ROBOTS };
}
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  await requireUser("/mfa/enroll");
  return <MfaPage titleKey="enrollTitle" leadKey="enrollLead"><EnrollForm next={next} /></MfaPage>;
}
