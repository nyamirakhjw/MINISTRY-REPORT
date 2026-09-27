"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsSection, type SectionStatus } from "./settings-section";
import { windowRulesSchema, type WindowRulesValues } from "@/lib/settings/schema";
import { updateWindowRules } from "@/lib/settings/actions";
import type { CongregationSettings } from "@/lib/settings/types";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export function WindowRulesForm({ settings }: { settings: CongregationSettings }) {
  const [status, setStatus] = useState<SectionStatus>({ type: "idle" });

  const form = useForm<WindowRulesValues>({
    resolver: zodResolver(windowRulesSchema),
    defaultValues: {
      onTimeDay: settings.on_time_day,
      lateWindowMonths: settings.late_window_months,
      carryOverDefault: settings.carry_over_default,
    },
  });

  const onTimeDay = form.watch("onTimeDay");
  const lateWindowMonths = form.watch("lateWindowMonths");

  const example = useMemo(() => {
    const day = Number(onTimeDay) || 1;
    const months = Number(lateWindowMonths);
    const lateWindowLabel =
      Number.isFinite(months) && months === 0
        ? "the end of the report month itself"
        : `the end of the month ${months > 1 ? `${months} months` : "one month"} after`;
    return `For September, on time until the ${ordinal(day)} of October; late reports accepted until ${lateWindowLabel}.`;
  }, [onTimeDay, lateWindowMonths]);

  async function onSubmit(values: WindowRulesValues) {
    setStatus({ type: "idle" });
    const result = await updateWindowRules(values);
    if (result.error) {
      setStatus({ type: "error", message: result.error });
      return;
    }
    setStatus({ type: "success", message: "Window rules saved." });
    form.reset(values);
  }

  return (
    <SettingsSection
      title="Window rules"
      description="Controls when a monthly report counts as on time or late (§6.2), and whether leftover minutes in the daily log carry over to the next month (§6.5). Changes apply to future months only."
      status={status}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="onTimeDay">On-time day of the following month</Label>
            <Input
              id="onTimeDay"
              type="number"
              inputMode="numeric"
              min={1}
              max={27}
              className="h-12"
              {...form.register("onTimeDay")}
            />
            {form.formState.errors.onTimeDay ? (
              <p className="text-sm text-danger">{form.formState.errors.onTimeDay.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lateWindowMonths">Late window length, in months</Label>
            <Input
              id="lateWindowMonths"
              type="number"
              inputMode="numeric"
              min={0}
              max={12}
              className="h-12"
              {...form.register("lateWindowMonths")}
            />
            {form.formState.errors.lateWindowMonths ? (
              <p className="text-sm text-danger">{form.formState.errors.lateWindowMonths.message}</p>
            ) : null}
          </div>
        </div>

        <p className="rounded-md border border-border bg-primary/5 px-4 py-3 text-sm text-foreground">
          {example}
        </p>

        <div className="flex items-start justify-between gap-6 border-t border-border pt-6">
          <div className="space-y-1">
            <Label htmlFor="carryOverDefault">Carry over leftover minutes</Label>
            <p className="max-w-prose text-sm text-muted-foreground">
              When a report matches the whole hours from the daily log, the leftover minutes are added to next
              month&apos;s log as a labelled entry. A publisher can still turn this off for their own log.
            </p>
          </div>
          <Switch
            id="carryOverDefault"
            checked={form.watch("carryOverDefault")}
            onCheckedChange={(checked) => form.setValue("carryOverDefault", checked, { shouldDirty: true })}
          />
        </div>

        <Button type="submit" className="h-12 px-6" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving window rules…" : "Save window rules"}
        </Button>
      </form>
    </SettingsSection>
  );
}
