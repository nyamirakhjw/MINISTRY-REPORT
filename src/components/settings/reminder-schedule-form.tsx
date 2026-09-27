"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsSection, type SectionStatus } from "./settings-section";
import {
  reminderScheduleSchema,
  type ReminderScheduleFormInput,
} from "@/lib/settings/schema";
import { updateReminderSchedule } from "@/lib/settings/actions";
import type { CongregationSettings } from "@/lib/settings/types";

export function ReminderScheduleForm({ settings }: { settings: CongregationSettings }) {
  const [status, setStatus] = useState<SectionStatus>({ type: "idle" });

  const form = useForm<ReminderScheduleFormInput>({
    resolver: zodResolver(reminderScheduleSchema),
    defaultValues: {
      scheduleDays: settings.reminders.schedule_days.join(", "),
      finalCallHour: settings.reminders.final_call_hour,
      weeklyAfterLateWindow: settings.reminders.weekly_after_late_window,
      quietHoursStart: settings.reminders.quiet_hours_start,
      quietHoursEnd: settings.reminders.quiet_hours_end,
    },
  });

  async function onSubmit(values: ReminderScheduleFormInput) {
    setStatus({ type: "idle" });
    const result = await updateReminderSchedule(values);
    if (result.error) {
      setStatus({ type: "error", message: result.error });
      return;
    }
    setStatus({ type: "success", message: "Reminder schedule saved." });
    form.reset(values);
  }

  return (
    <SettingsSection
      title="Reminders"
      description="A reminder always goes out on the opening day in addition to the days below (§9.2). Nothing is pushed during quiet hours — it waits until the next morning (§9.3)."
      status={status}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>
        <div className="space-y-2">
          <Label htmlFor="scheduleDays">Reminder days of the month</Label>
          <Input
            id="scheduleDays"
            className="h-12"
            placeholder="3, 5, 8, 10"
            aria-describedby="scheduleDays-hint"
            {...form.register("scheduleDays")}
          />
          <p id="scheduleDays-hint" className="text-sm text-muted-foreground">
            Comma-separated days of the month, for example 3, 5, 8, 10.
          </p>
          {form.formState.errors.scheduleDays ? (
            <p className="text-sm text-danger">{form.formState.errors.scheduleDays.message}</p>
          ) : null}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="finalCallHour">Final-call hour on the on-time day (24-hour)</Label>
            <Input
              id="finalCallHour"
              type="number"
              inputMode="numeric"
              min={0}
              max={23}
              className="h-12"
              {...form.register("finalCallHour")}
            />
            {form.formState.errors.finalCallHour ? (
              <p className="text-sm text-danger">{form.formState.errors.finalCallHour.message}</p>
            ) : null}
          </div>
          <div className="flex items-end justify-between gap-4 pb-3">
            <div className="space-y-1">
              <Label htmlFor="weeklyAfterLateWindow">Continue weekly after that</Label>
              <p className="text-sm text-muted-foreground">Until the report is submitted or the month is closed.</p>
            </div>
            <Switch
              id="weeklyAfterLateWindow"
              checked={form.watch("weeklyAfterLateWindow")}
              onCheckedChange={(checked) => form.setValue("weeklyAfterLateWindow", checked, { shouldDirty: true })}
            />
          </div>
        </div>

        <div className="space-y-3 border-t border-border pt-6">
          <p className="text-sm font-medium text-foreground">Quiet hours (Africa/Nairobi)</p>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quietHoursStart">Starts</Label>
              <Input
                id="quietHoursStart"
                type="time"
                className="h-12"
                {...form.register("quietHoursStart")}
              />
              {form.formState.errors.quietHoursStart ? (
                <p className="text-sm text-danger">{form.formState.errors.quietHoursStart.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="quietHoursEnd">Ends</Label>
              <Input id="quietHoursEnd" type="time" className="h-12" {...form.register("quietHoursEnd")} />
              {form.formState.errors.quietHoursEnd ? (
                <p className="text-sm text-danger">{form.formState.errors.quietHoursEnd.message}</p>
              ) : null}
            </div>
          </div>
        </div>

        <Button type="submit" className="h-12 px-6" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving reminder schedule…" : "Save reminder schedule"}
        </Button>
      </form>
    </SettingsSection>
  );
}
