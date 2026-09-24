import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LogClient } from "@/components/report/log-client";
import { requireMember } from "@/lib/auth/session";
import { monthOf, serviceYearMonths, serviceYearOf } from "@/lib/domain/time";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("log") };
}

/** Publishers without a pioneer arrangement do not see hour bars (LOG-05); send them back to Home. */
export default async function Page() {
  const { member } = await requireMember("/app/log");
  const supabase = await createClient();
  const month = monthOf(new Date());
  const { data: goal } = await supabase.rpc("my_month_goal", { p_month: month });
  const category = (goal as { category: string } | null)?.category ?? "publisher";
  if (category === "publisher") redirect("/app");

  const year = serviceYearOf(month);
  const months = serviceYearMonths(year);
  const totals = await Promise.all(months.map((m) => supabase.rpc("my_log_seconds", { p_month: m })));
  const yearSeconds = totals.reduce((sum, r) => sum + Number(r.data ?? 0), 0);
  const yearGoal = (goal as { goal_hours: number | null } | null)?.goal_hours ? months.length * ((goal as { goal_hours: number }).goal_hours) : null;

  return (
    <LogClient
      memberId={member.id} congregationId={member.congregation_id} month={month}
      goalHours={(goal as { goal_hours: number | null } | null)?.goal_hours ?? null}
      yearLabel={year} yearSeconds={yearSeconds} yearGoalHours={yearGoal}
      monthlyBreakdown={months.map((m, i) => ({ month: m, seconds: Number(totals[i]?.data ?? 0) }))}
    />
  );
}
