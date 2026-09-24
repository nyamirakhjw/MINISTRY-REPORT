import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { InstallCard } from "@/components/shell/install-card";
import { ReportStatusCard } from "@/components/report/status-card";
import { requireMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Arrangement, ReportState } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("home") };
}

export default async function Page() {
  const { member } = await requireMember("/app");
  const t = await getTranslations("home");
  const cat = await getTranslations("categories");
  const supabase = await createClient();
  const [{ data: state }, { data: arrangements }] = await Promise.all([
    supabase.rpc("my_report_state"),
    supabase.from("service_arrangements").select("*").in("status", ["pending", "rejected"]).order("requested_at", { ascending: false }).limit(3),
  ]);
  const pendingArr = ((arrangements ?? []) as Arrangement[]).filter((a) => a.status === "pending");
  return (
    <div className="flex flex-col gap-6">
      <h1>{t("greeting", { name: member.full_name.split(" ")[0] ?? member.full_name })}</h1>
      <ReportStatusCard state={(state ?? { state: "not_active" }) as ReportState} />
      {pendingArr.length > 0 && (
        <section aria-labelledby="arr-title" className="rounded-lg border border-border bg-surface p-5">
          <h2 id="arr-title" className="text-lg">{t("arrangementsTitle")}</h2>
          <ul className="mt-2 space-y-2">
            {pendingArr.map((a) => <li key={a.id} className="flex items-center justify-between gap-3"><span>{cat(a.kind)}</span><Badge tone="warning">{t("awaitingElder")}</Badge></li>)}
          </ul>
        </section>
      )}
      <InstallCard compact />
      <p><Link href="/app/history" className="inline-flex min-h-11 items-center underline underline-offset-4">{t("seeHistory")}</Link></p>
    </div>
  );
}
