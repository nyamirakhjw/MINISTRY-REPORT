import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReportStatusCard } from "@/components/report/status-card";
import { HoursRibbon } from "@/components/report/hours-ribbon";
import { monthOf } from "@/lib/domain/time";
import type { ReportState } from "@/lib/types";

export default async function PublisherHomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: member } = await supabase
    .from("members")
    .select("id, full_name, congregation_id")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    redirect("/signin");
  }

  const month = monthOf(new Date());

  // Fetch report state for the status card
  // We can query the existing reports for this member and month
  const { data: existingReport } = await supabase
    .from("reports")
    .select("status, month, is_late")
    .eq("member_id", member.id)
    .eq("month", month)
    .maybeSingle();

  // Construct report state object matching ReportState type
  let reportState: ReportState;
  if (existingReport) {
    reportState = { state: existingReport.status === "reopened" ? "reopened" : "submitted", month };
  } else {
    reportState = { state: "open", month };
  }

  const { data: goal } = await supabase.rpc("my_month_goal", { p_month: month });
  const goalData = goal as { category?: string; goal_hours?: number | null } | null;
  const category = goalData?.category ?? "publisher";
  const goalHours = goalData?.goal_hours ?? null;

  const { data: secondsData } = await supabase.rpc("my_log_seconds", { p_month: month });
  const currentSeconds = Number(secondsData ?? 0);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          Hello, {member.full_name.split(" ")[0]}
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Manage your ministry reports and service progress.
        </p>
      </div>

      {/* Main Report Status Card with required state prop */}
      <ReportStatusCard state={reportState} />

      {/* Hours Ribbon Integration for Pioneers */}
      {category !== "publisher" && goalHours !== null && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-[var(--foreground)]">
            Service Progress
          </h2>
          <HoursRibbon currentSeconds={currentSeconds} goalHours={goalHours} />
        </div>
      )}
    </div>
  );
}
