import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatusCard } from "@/components/report/status-card";
import { HoursRibbon } from "@/components/report/hours-ribbon";

export default async function PublisherHomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Fetch current member details
  const { data: member } = await supabase
    .from("members")
    .select("id, full_name, role")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    redirect("/signin");
  }

  // Check if user has an approved pioneer arrangement for the current month
  const currentMonth = new Date().toISOString().slice(0, 8) + "01";
  const { data: arrangement } = await supabase
    .from("service_arrangements")
    .select("kind, aux_goal_hours")
    .eq("member_id", member.id)
    .eq("status", "approved")
    .lte("start_month", currentMonth)
    .or(`end_month.is.null,end_month.gte.${currentMonth}`)
    .maybeSingle();

  let goalHours: number | null = null;
  if (arrangement) {
    if (arrangement.kind === "regular_pioneer") goalHours = 50;
    else if (arrangement.kind === "special_pioneer") goalHours = 70;
    else if (arrangement.kind === "auxiliary_pioneer") goalHours = arrangement.aux_goal_hours || 15;
  }

  // Fetch sum of daily log seconds for the current month
  const startDate = currentMonth;
  const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().slice(0, 10);
  
  const { data: logs } = await supabase
    .from("daily_log_entries")
    .select("duration_seconds")
    .eq("member_id", member.id)
    .gte("service_date", startDate)
    .lt("service_date", endDate);

  const currentSeconds = logs?.reduce((acc, curr) => acc + curr.duration_seconds, 0) || 0;

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

      {/* Main Report Status Card */}
      <StatusCard />

      {/* Hours Ribbon Integration for Pioneers */}
      {goalHours !== null && (
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
