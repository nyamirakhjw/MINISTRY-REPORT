"use client";
import * as React from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/field";
import { PRESET_SECONDS, formatHMS } from "@/lib/domain/log";

/** Two taps from a chip, or type an exact duration. Works fully offline (LOG-01, LOG-07). */
export function LogQuickAdd({ onAdd }: { onAdd: (input: { serviceDate: string; durationSeconds: number; note: string | null }) => Promise<void> }) {
  const t = useTranslations("log");
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = React.useState(today);
  const [seconds, setSeconds] = React.useState(0);
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const hours = Math.floor(seconds / 3600), minutes = Math.floor((seconds % 3600) / 60);

  async function submit() {
    if (seconds <= 0) return;
    setBusy(true);
    await onAdd({ serviceDate: date, durationSeconds: seconds, note: note.trim() || null });
    setSeconds(0); setNote("");
    setBusy(false);
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap gap-2">
        {PRESET_SECONDS.map((s) => (
          <Button key={s} type="button" variant="secondary" size="sm" onClick={() => setSeconds((v) => v + s)}>{t("preset", { time: formatHMS(s) })}</Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field id="qa-date" label={t("date")}><Input id="qa-date" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field id="qa-hours" label={t("hoursLabel")}><Input id="qa-hours" inputMode="numeric" value={String(hours)} onChange={(e) => setSeconds(Number(e.target.value.replace(/\D/g, "") || "0") * 3600 + (seconds % 3600))} /></Field>
        <Field id="qa-minutes" label={t("minutesLabel")}><Input id="qa-minutes" inputMode="numeric" value={String(minutes)} onChange={(e) => setSeconds(hours * 3600 + Math.min(59, Number(e.target.value.replace(/\D/g, "") || "0")) * 60)} /></Field>
      </div>
      <Field id="qa-note" label={t("note")} optional optionalLabel={t("optionalNote")}><Input id="qa-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={140} /></Field>
      <div><Button type="submit" disabled={busy || seconds <= 0}><Plus aria-hidden="true" />{t("addHours")}</Button></div>
    </form>
  );
}
