"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { formatHMS, ribbonState } from "@/lib/domain/log";
import { prefersReducedMotion } from "@/lib/motion";
import { daysLeftInMonth, nairobiNow, paceHoursPerDay } from "@/lib/nairobi";
import "./hours-ribbon.css";

const TICKS = [25, 50, 75];
const subscribeMinute = (onChange: () => void) => { const id = setInterval(onChange, 60_000); return () => clearInterval(id); };

/**
 * The signature element (PRD §10.6, redesigned). The fill is a full-width layer slid into place and the gold knob a
 * separate moved layer, both driven by one CSS variable (--p) and a spring-shaped transition, so nothing animates a
 * layout property and the stripes never stretch. Stripes drift and the knob pings while the goal is open and the
 * ribbon is on screen. The numerals count up by writing straight to one DOM node, so React never
 * re-renders per frame. A new value mid-animation continues from wherever the numerals are. Still a native progressbar
 * with a text alternative; it never relies on colour or motion.
 */
export function HoursRibbon({ currentSeconds, goalHours, variant = "monthly" }: { currentSeconds: number; goalHours: number | null; variant?: "monthly" | "service-year" }) {
  const t = useTranslations("log");
  const state = ribbonState(currentSeconds, goalHours);
  const numRef = React.useRef<HTMLSpanElement>(null);
  const shown = React.useRef(currentSeconds);
  const prevSeconds = React.useRef(currentSeconds);
  const prevPercent = React.useRef(state.percent);
  const prevReached = React.useRef(state.goalReached);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const shineRef = React.useRef<HTMLSpanElement>(null);
  const dotRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
  const today = React.useSyncExternalStore(subscribeMinute, () => nairobiNow().date, () => "");
  const [justReached, setJustReached] = React.useState(false);

  const [initialText] = React.useState(() => (goalHours ? String(Math.floor(currentSeconds / 3600)) : formatHMS(Math.round(currentSeconds))));
  const text = React.useCallback((seconds: number) => (goalHours ? String(Math.floor(seconds / 3600)) : formatHMS(Math.round(seconds))), [goalHours]);

  // The numerals node is written only here, never by React, so a new value cannot flash before the count starts.
  React.useEffect(() => { if (numRef.current) numRef.current.textContent = text(shown.current); }, [text]);

  React.useEffect(() => {
    const node = numRef.current;
    if (!node) return;
    if (prevSeconds.current === currentSeconds) return; // first render and unrelated re-renders: nothing to animate
    prevSeconds.current = currentSeconds;
    if (prefersReducedMotion()) { shown.current = currentSeconds; node.textContent = text(currentSeconds); return; }
    const from = shown.current;
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / 600);
      shown.current = from + (currentSeconds - from) * (1 - (1 - p) * (1 - p)); // ease-out
      node.textContent = text(shown.current);
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [currentSeconds, text]);

  // The drifting stripes and the pinging knob run only while the ribbon is on screen.
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { el.dataset.live = "true"; return; }
    const io = new IntersectionObserver(([entry]) => { el.dataset.live = entry?.isIntersecting ? "true" : "false"; });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // One quiet pulse on each tick the fill passes (25, 50, 75), and the goal check, only when the value rises after mount.
  React.useEffect(() => {
    const before = prevPercent.current;
    prevPercent.current = state.percent;
    if (state.percent > before && !prefersReducedMotion()) {
      // a soft light sweeps along the fill, and each milestone dot passed pops once
      shineRef.current?.animate([{ opacity: 0.9, transform: "translateX(-120%) skewX(-20deg)" }, { opacity: 0, transform: "translateX(420%) skewX(-20deg)" }], { duration: 900, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
      TICKS.forEach((tick, i) => {
        if (before < tick && state.percent >= tick) {
          dotRefs.current[i]?.animate([{ transform: "scale(2.4)" }, { transform: "scale(1)" }], { duration: 520, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
        }
      });
    }
    const reached = state.goalReached;
    const was = prevReached.current;
    prevReached.current = reached;
    if (reached && !was) setJustReached(true);
    else if (!reached && was) setJustReached(false);
  }, [state.percent, state.goalReached]);

  const currentHours = Math.floor(currentSeconds / 3600);
  const label = goalHours
    ? state.goalReached ? t("goalReached") : t("hoursToGo", { count: Math.max(0, goalHours - currentHours) })
    : t("noGoal");
  const valueText = goalHours
    ? t("progressValue", { current: currentHours, goal: goalHours, percent: state.percent })
    : t("progressValueNoGoal", { current: currentHours });

  const pace = variant === "monthly" && goalHours && !state.goalReached && today
    ? paceHoursPerDay(goalHours - currentSeconds / 3600, daysLeftInMonth(today))
    : null;
  const sub = pace ? `${label} · ${t("paceHint", { hours: pace })}` : label;

  return (
    <div ref={rootRef} className="hr" data-variant={variant} data-complete={state.percent >= 100 ? "true" : "false"}>
      <div className="hr-head">
        <span className="hr-num tabular">
          <span ref={numRef}>{initialText}</span>{goalHours ? <span className="hr-goal"> / {goalHours}</span> : null}
        </span>
        {goalHours ? (
          state.goalReached ? (
            <svg className={`size-7 text-success ${justReached ? "m-draw" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" pathLength={1} />
            </svg>
          ) : (
            <span aria-hidden="true" className="hr-chip tabular">{state.percent}%</span>
          )
        ) : null}
      </div>
      <p aria-hidden="true" className="hr-sub">{sub}</p>
      <p className="sr-only" aria-live="polite">{justReached ? t("goalReached") : ""}</p>
      <div className="hr-track" role="progressbar" aria-valuenow={state.percent} aria-valuemin={0} aria-valuemax={100} aria-valuetext={valueText}
        style={{ "--p": state.percent / 100 } as React.CSSProperties}>
        <div className="hr-rail">
          <div className="hr-fill" aria-hidden="true"><span className="hr-flow" /><span ref={shineRef} className="hr-shine" /></div>
          {state.tickPositions.map((p, i) => (
            <span key={p} ref={(el) => { dotRefs.current[i] = el; }} aria-hidden="true" className="hr-dot" data-hit={state.percent >= p ? "true" : "false"} style={{ left: `${p}%` }} />
          ))}
        </div>
        {state.percent > 0 ? <div className="hr-tipwrap" aria-hidden="true"><span className="hr-tip" /></div> : null}
      </div>
      {goalHours && variant === "monthly" ? (
        <div className="hr-marks" aria-hidden="true">
          {state.tickPositions.map((p) => <span key={p} className="hr-mark" data-hit={state.percent >= p ? "true" : "false"} style={{ left: `${p}%` }}>{p}%</span>)}
          <span className="hr-mark" data-hit={state.goalReached ? "true" : "false"} style={{ left: "100%" }}>{t("milestoneGoal")}</span>
        </div>
      ) : null}
    </div>
  );
}

/** Twelve small bars, one per month of the service year, under the year ribbon (LOG-04). */
export function ServiceYearMiniChart({ months }: { months: { label: string; hours: number }[] }) {
  const t = useTranslations("log");
  const max = Math.max(1, ...months.map((m) => m.hours));
  return (
    <div role="img" aria-label={t("miniChartAlt")} className="flex items-end gap-1.5">
      {months.map((m, i) => (
        <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex h-16 w-full items-end overflow-hidden rounded-sm bg-tint">
            <div className="m-bar w-full bg-primary" style={{ height: `${Math.round((m.hours / max) * 100)}%`, "--i": Math.min(i, 11) } as React.CSSProperties} />
          </div>
          <span className="text-xs text-muted-foreground">{m.label}</span>
        </div>
      ))}
    </div>
  );
}
