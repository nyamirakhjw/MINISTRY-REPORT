import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { DecideDialog, EndArrangementDialog } from "@/components/admin/approval-dialogs";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/session";
import { formatMonth } from "@/lib/format";
import { monthOf } from "@/lib/domain/time";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("arrangements") };
}

interface Row { id: string; kind: string; status: string; start_month: string; end_month: string | null; aux_goal_hours: number | null; members: { full_name: string } | null }

export default async function Page() {
  await requireRole("elder", "/admin/arrangements");
  const t = await getTranslations("admin");
  const cat = await getTranslations("categories");
  const locale = await getLocale();
  const supabase = await createClient();
  const { data } = await supabase.from("service_arrangements").select("id, kind, status, start_month, end_month, aux_goal_hours, members!service_arrangements_member_id_fkey(full_name)").in("status", ["pending", "approved"]).order("requested_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];
  const cur = monthOf(new Date());
  const pending = rows.filter((r) => r.status === "pending");
  const active = rows.filter((r) => r.status === "approved" && (!r.end_month || r.end_month >= cur));
  const line = (r: Row) => `${cat(r.kind as "regular_pioneer")}${r.aux_goal_hours ? ` (${t("hoursGoal", { n: r.aux_goal_hours })})` : ""} · ${formatMonth(r.start_month, locale)}${r.end_month ? ` – ${formatMonth(r.end_month, locale)}` : ""}`;
  return (
    <div className="flex flex-col gap-8">
      <h1>{t("arrangementsTitle")}</h1>
      <section aria-labelledby="pend"><h2 id="pend" className="mb-3">{t("pendingArrangements")}</h2>
        {pending.length === 0 ? <p className="rounded-lg border border-border bg-surface p-5">{t("noPendingArrangements")}</p> : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">{pending.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{r.members?.full_name}</p><p className="text-muted-foreground">{line(r)}</p></div><DecideDialog id={r.id} name={r.members?.full_name ?? ""} kind="arrangement" /></li>))}</ul>)}
      </section>
      <section aria-labelledby="act"><h2 id="act" className="mb-3">{t("activeArrangements")}</h2>
        {active.length === 0 ? <p className="rounded-lg border border-border bg-surface p-5">{t("noActiveArrangements")}</p> : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">{active.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{r.members?.full_name} <Badge tone="success">{t("approved")}</Badge></p><p className="text-muted-foreground">{line(r)}</p></div><EndArrangementDialog id={r.id} name={r.members?.full_name ?? ""} min={r.start_month} /></li>))}</ul>)}
      </section>
    </div>
  );
}
