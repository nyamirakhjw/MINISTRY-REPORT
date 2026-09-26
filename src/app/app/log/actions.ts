"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function savePersonalGoalAction(formData: FormData) {
  const supabase = await createClient();
  const month = formData.get("month")?.toString();
  const hours = parseInt(formData.get("hours")?.toString() || "0", 10);

  if (!month) return;

  // Hit the SQL database directly
  await supabase.rpc("save_personal_goal", {
    p_month: month,
    p_hours: hours
  });

  // Wipe the server cache and reload the page
  revalidatePath("/", "layout");
  redirect("/app/log");
}