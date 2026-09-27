export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { VisitsClient } from "@/components/visits/visits-client";
import { requireMember } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("visits") };
}

export default async function Page() {
  const { member } = await requireMember("/app/visits");
  return <VisitsClient memberId={member.id} congregationId={member.congregation_id} />;
}
