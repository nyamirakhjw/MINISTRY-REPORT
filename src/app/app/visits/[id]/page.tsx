export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { VisitDetailClient } from "@/components/visits/visit-detail-client";
import { requireMember } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("visits");
  return { title: t("title") };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { member } = await requireMember("/app/visits");
  const { id } = await params;
  return <VisitDetailClient memberId={member.id} congregationId={member.congregation_id} rvId={id} />;
}
