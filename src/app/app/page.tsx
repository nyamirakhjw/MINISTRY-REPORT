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

  const { data: member } = await supabase
    .from("members")
    .select("id, full_name, role, avatar_path")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          Welcome back, {member?.full_name || "Publisher"}
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Manage your ministry reports and service progress.
        </p>
      </div>

      {/* Main Report Status Card */}
      <StatusCard />

      {/* Hours Ribbon Integration */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-[var(--foreground)]">
          Service Progress
        </h2>
        <HoursRibbon />
      </div>
    </div>
  );
}
