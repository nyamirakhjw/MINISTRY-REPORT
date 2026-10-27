"use client";
import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { prefersReducedMotion } from "@/lib/motion";

/** Big minus and plus targets; typing is allowed; numeric keypad on phones. */
export function Stepper({ id, value, onChange, min = 0, max = 99, label, describedBy }: {
  id: string; value: number; onChange: (n: number) => void; min?: number; max?: number; label: string; describedBy?: string;
}) {
  const t = useTranslations("common");
  const input = React.useRef<HTMLInputElement>(null);
  // The number slides a few pixels in the direction of change (PRD v1.1 AM-07). A short Web Animations call on the field
  // itself: no re-render, and skipped entirely for reduced motion.
  const nudge = (dir: 1 | -1) => {
    if (prefersReducedMotion()) return;
    input.current?.animate([{ transform: `translateY(${dir * -6}px)`, opacity: 0.6 }, { transform: "translateY(0)", opacity: 1 }], { duration: 160, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
  };
  const clamp = (n: number) => Math.min(max, Math.max(min, Number.isFinite(n) ? Math.trunc(n) : min));
  return (
    <div className="flex items-center gap-3">
      <Button variant="secondary" size="icon" onClick={() => { nudge(-1); onChange(clamp(value - 1)); }} disabled={value <= min} aria-label={t("decrease", { label })}><Minus aria-hidden="true" /></Button>
      <Input ref={input} id={id} inputMode="numeric" pattern="[0-9]*" value={String(value)} aria-describedby={describedBy} className="w-24 text-center text-xl font-semibold tabular"
        onChange={(e) => onChange(clamp(Number(e.target.value.replace(/\D/g, "") || "0")))} />
      <Button variant="secondary" size="icon" onClick={() => { nudge(1); onChange(clamp(value + 1)); }} disabled={value >= max} aria-label={t("increase", { label })}><Plus aria-hidden="true" /></Button>
    </div>
  );
}
