"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, Textarea } from "@/components/ui/input";
import { SettingsSection, type SectionStatus } from "./settings-section";
import {
  landingSettingsSchema,
  type LandingSettingsValues,
  letterheadSettingsSchema,
  type LetterheadFormInput,
  MEETING_DAY_OPTIONS,
} from "@/lib/settings/schema";
import { updateLandingSettings, updateLetterheadSettings } from "@/lib/settings/actions";
import type { CongregationSettings } from "@/lib/settings/types";

function MeetingDaySelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select id={id} className="h-12" value={value} onChange={(e) => onChange(e.target.value)}>
      {MEETING_DAY_OPTIONS.map((day) => (
        <option key={day} value={day}>
          {day}
        </option>
      ))}
    </Select>
  );
}

function LandingSettingsForm({ settings }: { settings: CongregationSettings }) {
  const [status, setStatus] = useState<SectionStatus>({ type: "idle" });

  const form = useForm<LandingSettingsValues>({
    resolver: zodResolver(landingSettingsSchema),
    defaultValues: {
      midweekDay: settings.landing.midweek_day,
      midweekTime: settings.landing.midweek_time,
      weekendDay: settings.landing.weekend_day,
      weekendTime: settings.landing.weekend_time,
      address: settings.landing.address,
      mapLink: settings.landing.map_link ?? "",
      contactLine: settings.landing.contact_line ?? "",
    },
  });

  async function onSubmit(values: LandingSettingsValues) {
    setStatus({ type: "idle" });
    const result = await updateLandingSettings(values);
    if (result.error) {
      setStatus({ type: "error", message: result.error });
      return;
    }
    setStatus({ type: "success", message: "Landing page details saved." });
    form.reset(values);
  }

  return (
    <SettingsSection
      title="Landing page"
      description="Shown to visitors before they sign in — meeting times, address and contact line (PUB-01). No meeting details are invented; leave a field blank rather than guess."
      status={status}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Midweek meeting</p>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="midweekDay">Day</Label>
              <MeetingDaySelect
                id="midweekDay"
                value={form.watch("midweekDay")}
                onChange={(v) => form.setValue("midweekDay", v as LandingSettingsValues["midweekDay"], { shouldDirty: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="midweekTime">Time</Label>
              <Input id="midweekTime" type="time" className="h-12" {...form.register("midweekTime")} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Weekend meeting</p>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="weekendDay">Day</Label>
              <MeetingDaySelect
                id="weekendDay"
                value={form.watch("weekendDay")}
                onChange={(v) => form.setValue("weekendDay", v as LandingSettingsValues["weekendDay"], { shouldDirty: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekendTime">Time</Label>
              <Input id="weekendTime" type="time" className="h-12" {...form.register("weekendTime")} />
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t border-border pt-6">
          <Label htmlFor="address">Kingdom Hall address</Label>
          <Textarea id="address" rows={2} className="min-h-12" {...form.register("address")} />
          {form.formState.errors.address ? (
            <p className="text-sm text-danger">{form.formState.errors.address.message}</p>
          ) : null}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="mapLink">Map link (optional)</Label>
            <Input id="mapLink" type="url" placeholder="https://" className="h-12" {...form.register("mapLink")} />
            {form.formState.errors.mapLink ? (
              <p className="text-sm text-danger">{form.formState.errors.mapLink.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactLine">Public contact line (optional)</Label>
            <Input id="contactLine" className="h-12" {...form.register("contactLine")} />
          </div>
        </div>

        <Button type="submit" className="h-12 px-6" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving landing details…" : "Save landing details"}
        </Button>
      </form>
    </SettingsSection>
  );
}

function LetterheadSettingsForm({ settings }: { settings: CongregationSettings }) {
  const [status, setStatus] = useState<SectionStatus>({ type: "idle" });

  const form = useForm<LetterheadFormInput>({
    resolver: zodResolver(letterheadSettingsSchema),
    defaultValues: {
      letterheadLines: settings.letterhead.lines.join("\n"),
      signatoryTitle: settings.letterhead.signatory_title,
    },
  });

  async function onSubmit(values: LetterheadFormInput) {
    setStatus({ type: "idle" });
    const result = await updateLetterheadSettings(values);
    if (result.error) {
      setStatus({ type: "error", message: result.error });
      return;
    }
    setStatus({ type: "success", message: "Letterhead saved." });
    form.reset(values);
  }

  return (
    <SettingsSection
      title="Letterhead & exports"
      description="Appears on the congregation PDF and Excel exports and the individual service-year record (§12.2, §12.3)."
      status={status}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>
        <div className="space-y-2">
          <Label htmlFor="letterheadLines">Letterhead lines</Label>
          <Textarea
            id="letterheadLines"
            rows={4}
            placeholder={"Nyamira Kingdom Hall of Jehovah's Witnesses\nP.O. Box …, Nyamira"}
            aria-describedby="letterheadLines-hint"
            {...form.register("letterheadLines")}
          />
          <p id="letterheadLines-hint" className="text-sm text-muted-foreground">
            One line per line of text. Up to six lines.
          </p>
          {form.formState.errors.letterheadLines ? (
            <p className="text-sm text-danger">{form.formState.errors.letterheadLines.message as string}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="signatoryTitle">Signatory title</Label>
          <Input
            id="signatoryTitle"
            className="h-12"
            placeholder="Presiding overseer"
            {...form.register("signatoryTitle")}
          />
          {form.formState.errors.signatoryTitle ? (
            <p className="text-sm text-danger">{form.formState.errors.signatoryTitle.message}</p>
          ) : null}
        </div>

        <Button type="submit" className="h-12 px-6" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving letterhead…" : "Save letterhead"}
        </Button>
      </form>
    </SettingsSection>
  );
}

export function GeneralSettingsForm({ settings }: { settings: CongregationSettings }) {
  return (
    <div className="space-y-12">
      <LandingSettingsForm settings={settings} />
      <LetterheadSettingsForm settings={settings} />
    </div>
  );
}
