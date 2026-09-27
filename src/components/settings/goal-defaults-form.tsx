"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsSection, type SectionStatus } from "./settings-section";
import { goalDefaultsSchema, type GoalDefaultsValues } from "@/lib/settings/schema";
import { updateGoalDefaults } from "@/lib/settings/actions";
import type { CongregationSettings } from "@/lib/settings/types";

export function GoalDefaultsForm({ settings }: { settings: CongregationSettings }) {
  const [status, setStatus] = useState<SectionStatus>({ type: "idle" });

  const form = useForm<GoalDefaultsValues>({
    resolver: zodResolver(goalDefaultsSchema),
    defaultValues: {
      regularGoalHours: settings.goals.regular_pioneer,
      specialGoalHours: settings.goals.special_pioneer,
      auxiliaryLowerOption: settings.goals.auxiliary_options[0],
      auxiliaryHigherOption: settings.goals.auxiliary_options[1],
    },
  });

  async function onSubmit(values: GoalDefaultsValues) {
    setStatus({ type: "idle" });
    const result = await updateGoalDefaults(values);
    if (result.error) {
      setStatus({ type: "error", message: result.error });
      return;
    }
    setStatus({ type: "success", message: "Goal defaults saved." });
    form.reset(values);
  }

  return (
    <SettingsSection
      title="Goal defaults"
      description="These are the monthly hour goals publishers see until they set a personal goal (§6.6). A snapshot is kept on each submitted report, so changing a default never rewrites past months."
      status={status}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="regularGoalHours">Regular pioneer, monthly hours</Label>
            <Input
              id="regularGoalHours"
              type="number"
              inputMode="numeric"
              min={1}
              max={744}
              className="h-12"
              aria-describedby={form.formState.errors.regularGoalHours ? "regularGoalHours-error" : undefined}
              {...form.register("regularGoalHours")}
            />
            {form.formState.errors.regularGoalHours ? (
              <p id="regularGoalHours-error" className="text-sm text-danger">
                {form.formState.errors.regularGoalHours.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialGoalHours">Special pioneer, monthly hours</Label>
            <Input
              id="specialGoalHours"
              type="number"
              inputMode="numeric"
              min={1}
              max={744}
              className="h-12"
              aria-describedby={form.formState.errors.specialGoalHours ? "specialGoalHours-error" : undefined}
              {...form.register("specialGoalHours")}
            />
            {form.formState.errors.specialGoalHours ? (
              <p id="specialGoalHours-error" className="text-sm text-danger">
                {form.formState.errors.specialGoalHours.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Auxiliary pioneer options</p>
          <p className="text-sm text-muted-foreground">
            A publisher requesting auxiliary service picks one of these two figures for that arrangement.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="auxiliaryLowerOption">Lower option, hours</Label>
              <Input
                id="auxiliaryLowerOption"
                type="number"
                inputMode="numeric"
                min={1}
                max={744}
                className="h-12"
                {...form.register("auxiliaryLowerOption")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auxiliaryHigherOption">Higher option, hours</Label>
              <Input
                id="auxiliaryHigherOption"
                type="number"
                inputMode="numeric"
                min={1}
                max={744}
                className="h-12"
                aria-describedby={
                  form.formState.errors.auxiliaryHigherOption ? "auxiliaryHigherOption-error" : undefined
                }
                {...form.register("auxiliaryHigherOption")}
              />
              {form.formState.errors.auxiliaryHigherOption ? (
                <p id="auxiliaryHigherOption-error" className="text-sm text-danger">
                  {form.formState.errors.auxiliaryHigherOption.message}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <Button type="submit" className="h-12 px-6" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving goal defaults…" : "Save goal defaults"}
        </Button>
      </form>
    </SettingsSection>
  );
}
