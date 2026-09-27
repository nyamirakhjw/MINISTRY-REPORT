"use server";

import { revalidatePath } from "next/cache";
// Assumption: your repo already exports a server-side Supabase client
// from this path (per PRD §14.2, built on @supabase/ssr). Adjust the
// import if your project uses a different path or name.
import { createClient } from "@/lib/supabase/server";
import {
  goalDefaultsSchema,
  type GoalDefaultsValues,
  windowRulesSchema,
  type WindowRulesValues,
  reminderScheduleSchema,
  type ReminderScheduleFormInput,
  landingSettingsSchema,
  type LandingSettingsValues,
  letterheadSettingsSchema,
  type LetterheadFormInput,
  groupNameSchema,
} from "./schema";
import type { ActionResult, CongregationSettings, Group } from "./types";

function friendlyError(error: { message: string } | null): string {
  const code = error?.message ?? "";
  if (code.includes("not_elder")) return "Only Elders can change this setting.";
  if (code.includes("second_factor_required"))
    return "Verify your authenticator app to change settings.";
  if (code.includes("group_name_too_short")) return "Group names need at least 2 characters.";
  if (code.includes("group_not_found")) return "That group no longer exists. Refresh and try again.";
  if (code.includes("auxiliary_options_invalid"))
    return "The auxiliary options must be two figures, lower before higher.";
  if (code.includes("goal_out_of_range")) return "Goals must be between 1 and 744 hours.";
  if (code.includes("on_time_day_out_of_range") || code.includes("late_window_out_of_range"))
    return "Check the window rule figures and try again.";
  if (code.includes("invalid_meeting_day")) return "Choose a day of the week for each meeting.";
  if (code.includes("address_length")) return "Add a Kingdom Hall address (up to 300 characters).";
  if (code.includes("too_many_letterhead_lines")) return "Use six letterhead lines or fewer.";
  if (code.includes("signatory_title_required")) return "Add a signatory title.";
  return "We couldn't save that. Try again in a moment.";
}

// ---------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------
export async function getCongregationSettings(): Promise<ActionResult<CongregationSettings>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_congregation_settings");
  if (error) return { error: friendlyError(error) };
  return { data: data as CongregationSettings };
}

export async function listGroups(): Promise<ActionResult<Group[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_groups");
  if (error) return { error: friendlyError(error) };
  return { data: (data ?? []) as Group[] };
}

// ---------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------
export async function updateGoalDefaults(values: GoalDefaultsValues): Promise<ActionResult> {
  const parsed = goalDefaultsSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the values and try again." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_congregation_goals", {
    p_regular: parsed.data.regularGoalHours,
    p_special: parsed.data.specialGoalHours,
    p_auxiliary_options: [parsed.data.auxiliaryLowerOption, parsed.data.auxiliaryHigherOption],
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/admin/settings/goals");
  return {};
}

export async function updateWindowRules(values: WindowRulesValues): Promise<ActionResult> {
  const parsed = windowRulesSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the values and try again." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_window_rules", {
    p_on_time_day: parsed.data.onTimeDay,
    p_late_window_months: parsed.data.lateWindowMonths,
    p_carry_over_default: parsed.data.carryOverDefault,
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/admin/settings/window");
  return {};
}

export async function updateReminderSchedule(
  values: ReminderScheduleFormInput,
): Promise<ActionResult> {
  const parsed = reminderScheduleSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the values and try again." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_reminder_schedule", {
    p_schedule_days: parsed.data.scheduleDays,
    p_final_call_hour: parsed.data.finalCallHour,
    p_weekly_after: parsed.data.weeklyAfterLateWindow,
    p_quiet_start: parsed.data.quietHoursStart,
    p_quiet_end: parsed.data.quietHoursEnd,
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/admin/settings/reminders");
  return {};
}

export async function updateLandingSettings(values: LandingSettingsValues): Promise<ActionResult> {
  const parsed = landingSettingsSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the values and try again." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_landing_settings", {
    p_midweek_day: parsed.data.midweekDay,
    p_midweek_time: parsed.data.midweekTime,
    p_weekend_day: parsed.data.weekendDay,
    p_weekend_time: parsed.data.weekendTime,
    p_address: parsed.data.address,
    p_map_link: parsed.data.mapLink || null,
    p_contact_line: parsed.data.contactLine || null,
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/admin/settings/general");
  return {};
}

export async function updateLetterheadSettings(
  values: LetterheadFormInput,
): Promise<ActionResult> {
  const parsed = letterheadSettingsSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the values and try again." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_letterhead_settings", {
    p_lines: parsed.data.letterheadLines,
    p_signatory_title: parsed.data.signatoryTitle,
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/admin/settings/general");
  return {};
}

// ---------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------
export async function addGroup(values: { name: string }): Promise<ActionResult<Group>> {
  const parsed = groupNameSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a group name." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("add_group", { p_name: parsed.data.name });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/admin/settings/groups");
  return { data: data as Group };
}

export async function renameGroup(groupId: string, values: { name: string }): Promise<ActionResult> {
  const parsed = groupNameSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a group name." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("rename_group", {
    p_group_id: groupId,
    p_name: parsed.data.name,
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/admin/settings/groups");
  return {};
}

export async function setGroupRetired(groupId: string, retired: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_group_retired", {
    p_group_id: groupId,
    p_retired: retired,
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/admin/settings/groups");
  return {};
}
