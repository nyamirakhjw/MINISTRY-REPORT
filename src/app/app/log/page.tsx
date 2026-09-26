import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { LogClient } from "@/components/report/log-client";
import { requireMember } from "@/lib/auth/session";
import { monthOf, serviceYearMonths, serviceYearOf } from "@/lib/domain/time";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("log") };
}

export default async function Page() {
  const { member } = await requireMember("/app/log");
  const supabase = await createClient();
  const month = monthOf(new Date());

  // 1. Indestructible Server Action to Save Personal Goal
  async function savePersonalGoal(formData: FormData) {
    "use server";
    const supabaseAction = await createClient();
    const hoursStr = formData.get("hours")?.toString();
    const hours = hoursStr ? parseInt(hoursStr, 10) : 0;
    const targetDate = `${month}-01`;

    // Always delete the old goal for this month first (Foolproof Upsert)
    await supabaseAction.from("personal_goals")
      .delete()
      .match({ member_id: member.id, goal_month: targetDate });

    // Insert new goal if greater than 0
    if (hours > 0) {
      await supabaseAction.from("personal_goals").insert({
        member_id: member.id,
        goal_month: targetDate,
        goal_hours: hours,
      });
    }
    
    // Wipe the cache so both Home and Log pages update instantly
    revalidatePath("/app", "layout");
  }

  // 2. Fetch the current goal (uses our updated my_month_goal RPC)
  const { data: goal, error: goalError } = await supabase.rpc("my_month_goal", { p_month: month });
  if (goalError) console.error("my_month_goal failed:", goalError.message);

  const category = !goalError && (goal as { category?: string } | null)?.category 
    ? (goal as { category?: string } | null)?.category 
    : "publisher";

  const parsedGoalHours = (goal as { goal_hours: number | null } | null)?.goal_hours ?? null;

  // 3. Calculate Service Year Totals
  const year = serviceYearOf(month);
  const months = serviceYearMonths(year);
  const totals = await Promise.all(months.map((m) => supabase.rpc("my_log_seconds", { p_month: m })));
  const yearSeconds = totals.reduce((sum, r) => sum + Number(r.data ?? 0), 0);
  const yearGoal = parsedGoalHours ? months.length * parsedGoalHours : null;

  // Determine if they should see the custom goal UI (Regular Publishers or those with a personal goal)
  const canSetPersonalGoal = category === "publisher" || category === "personal";

  return (
    <div className="flex flex-col gap-6">
      {canSetPersonalGoal && (
        <section className="rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-2 text-lg font-semibold">Personal Monthly Goal</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Set a custom hour target to unlock the progress ribbon and track your pace this month.
          </p>
          <form action={savePersonalGoal} className="flex items-center gap-3">
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