export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LogClient } from "@/components/report/log-client";
import { requireMember } from "@/lib/auth/session";
import { monthOf, serviceYearMonths, serviceYearOf } from "@/lib/domain/time";
import { createClient } from "@/lib/supabase/server";
import { savePersonalGoalAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("log") };
}

export default async function Page() {
  const { member } = await requireMember("/app/log");
  const supabase = await createClient();
  const month = monthOf(new Date());

  const { data: goal, error: goalError } = await supabase.rpc("my_month_goal", { p_month: month });
  if (goalError) console.error("my_month_goal failed:", goalError.message);

  const category = !goalError && (goal as any)?.category ? (goal as any).category : "publisher";
  const parsedGoalHours = (goal as any)?.goal_hours ?? null;

  const year = serviceYearOf(month);
  const months = serviceYearMonths(year);
  const totals = await Promise.all(months.map((m) => supabase.rpc("my_log_seconds", { p_month: m })));
  const yearSeconds = totals.reduce((sum, r) => sum + Number(r.data ?? 0), 0);
  const yearGoal = parsedGoalHours ? months.length * parsedGoalHours : null;

  const canSetPersonalGoal = category === "publisher" || category === "personal";

  return (
    <div className="flex flex-col gap-6">
      {canSetPersonalGoal && (
        <section className="rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-2 text-lg font-semibold">Personal Monthly Goal</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Set a custom hour target to unlock the progress ribbon and track your pace this month.
          </p>
          <form action={savePersonalGoalAction} className="flex items-center gap-3">
            <input type="hidden" name="month" value={month} />
            <input
              type="number"
              name="hours"
              min="0"
              defaultValue={category === "personal" ? parsedGoalHours || "" : ""}
              placeholder="Hours (e.g. 15)"
              className="flex h-11 w-full max-w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Save Goal
            </button>
          </form>
        </section>
      )}

      <LogClient
        memberId={member.id} 
        congregationId={member.congregation_id} 
        month={month}
        goalHours={parsedGoalHours}
        yearLabel={year} 
        yearSeconds={yearSeconds} 
        yearGoalHours={yearGoal}
        monthlyBreakdown={months.map((m, i) => ({ month: m, seconds: Number(totals[i]?.data ?? 0) }))}
      />
    </div>
  );
}