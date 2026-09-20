"use client";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** Big minus and plus targets; typing is allowed; numeric keypad on phones. */
export function Stepper({ id, value, onChange, min = 0, max = 99, label, describedBy }: {
  id: string; value: number; onChange: (n: number) => void; min?: number; max?: number; label: string; describedBy?: string;
}) {
  const t = useTranslations("common");
  const clamp = (n: number) => Math.min(max, Math.max(min, Number.isFinite(n) ? Math.trunc(n) : min));
  return (
    <div className="flex items-center gap-3">
      <Button variant="secondary" size="icon" onClick={() => onChange(clamp(value - 1))} disabled={value <= min} aria-label={t("decrease", { label })}><Minus aria-hidden="true" /></Button>
      <Input id={id} inputMode="numeric" pattern="[0-9]*" value={String(value)} aria-describedby={describedBy} className="w-24 text-center text-xl font-semibold tabular"
        onChange={(e) => onChange(clamp(Number(e.target.value.replace(/\D/g, "") || "0")))} />
      <Button variant="secondary" size="icon" onClick={() => onChange(clamp(value + 1))} disabled={value >= max} aria-label={t("increase", { label })}><Plus aria-hidden="true" /></Button>
    </div>
  );
}
