"use client";
import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatHMS, ribbonState } from "@/lib/domain/log";

/**
 * The signature element (PRD §10.6). A solid navy fill carries the value; a 4px gold slanted edge at the tip
 * is decorative only. Exposed as a native progressbar with a text alternative, so it never relies on colour.
 * Counts up on change unless the person asked for reduced motion.
 */
export function HoursRibbon({ currentSeconds, goalHours, variant = "monthly" }: { currentSeconds: number; goalHours: number | null; variant?: "monthly" | "service-year" }) {
  const t = useTranslations("log");
  const state = ribbonState(currentSeconds, goalHours);
  const [shown, setShown] = React.useState(currentSeconds);
  const reduced = React.useRef(typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  React.useEffect(() => {
    if (reduced.current) { setShown(currentSeconds); return; }
    const from = shown;
    const start = performance.now();
    const duration = 600;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - p) * (1 - p); // ease-out
      setShown(Math.round(from + (currentSeconds - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animates from the previous shown value on purpose
  }, [currentSeconds]);

  const currentHours = Math.floor(shown / 3600);
  const label = goalHours
    ? state.goalReached ? t("goalReached") : t("hoursToGo", { count: Math.max(0, goalHours - currentHours) })
    : t("noGoal");
  const valueText = goalHours
    ? t("progressValue", { current: currentHours, goal: goalHours, percent: state.percent })
    : t("progressValueNoGoal", { current: currentHours });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-3xl tabular text-foreground">{goalHours ? `${currentHours} / ${goalHours}` : formatHMS(shown)}</span>
        {state.goalReached ? <CheckCircle2 className="size-6 text-success" aria-hidden="true" /> : null}
      </div>
      <p aria-hidden="true" className="text-muted-foreground">{label}</p>
      <div role="progressbar" aria-valuenow={state.percent} aria-valuemin={0} aria-valuemax={100} aria-valuetext={valueText}
        className={`relative w-full overflow-hidden rounded-sm bg-tint ${variant === "monthly" ? "h-7" : "h-4"}`}>
        <div className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-0" style={{ width: `${state.percent}%` }}>
          {state.percent > 0 && state.percent < 100 && (
            <span aria-hidden="true" className="absolute inset-y-0 right-0 w-1 bg-accent" style={{ transform: "skewX(-20deg)", transformOrigin: "bottom" }} />
          )}
        </div>
        {state.tickPositions.map((p) => (
          <span key={p} aria-hidden="true" className="absolute inset-y-0 w-px bg-border/70" style={{ left: `${p}%` }} />
        ))}
      </div>
    </div>
  );
}

/** Twelve small bars, one per month of the service year, under the year ribbon (LOG-04). */
export function ServiceYearMiniChart({ months }: { months: { label: string; hours: number }[] }) {
  const t = useTranslations("log");
  const max = Math.max(1, ...months.map((m) => m.hours));
  return (
    <div role="img" aria-label={t("miniChartAlt")} className="flex items-end gap-1.5">
      {months.map((m) => (
        <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex h-16 w-full items-end overflow-hidden rounded-sm bg-tint">
            <div className="w-full bg-primary" style={{ height: `${Math.round((m.hours / max) * 100)}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{m.label}</span>
        </div>
      ))}
    </div>
  );
}
