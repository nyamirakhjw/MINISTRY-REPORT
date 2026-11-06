"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { formatHMS, ribbonState } from "@/lib/domain/log";
import { prefersReducedMotion } from "@/lib/motion";
import "./hours-ribbon.css";

const TICKS = [25, 50, 75];
/** Bubble positions (percent across the track), size, duration and delay: fixed values, so server and browser render the same. */
const BUBBLES = [[6, 3, 2.6, 0], [17, 5, 3.4, 0.9], [29, 4, 2.9, 1.7], [41, 3, 3.1, 0.4], [53, 5, 3.6, 2.1], [64, 4, 2.7, 1.2], [77, 3, 3.3, 0.2], [88, 5, 3, 1.5], [96, 4, 2.8, 2.4]] as const;

/**
 * The signature element (PRD §10.6, rewritten per PRD v1.1 §10.5), now a living track (hours-ribbon.css): a moving
 * window reveals a glossy fill with drifting stripes, a sweeping sheen and rising bubbles, led by a slanted gold tip that
 * breathes. All of it is driven by one CSS variable (--p) and a spring-shaped transition on transform, so nothing
 * animates a layout property. The numerals count up by writing straight to one DOM node, so React never
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
  const tickRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
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

  // One quiet pulse on each tick the fill passes (25, 50, 75), and the goal check, only when the value rises after mount.
  React.useEffect(() => {
    const before = prevPercent.current;
    prevPercent.current = state.percent;
    if (state.percent > before && !prefersReducedMotion()) {
      TICKS.forEach((tick, i) => {
        if (before < tick && state.percent >= tick) {
          tickRefs.current[i]?.animate([{ transform: "scaleX(4)", background: "var(--accent)" }, { transform: "scaleX(1)" }], { duration: 520, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-3xl tabular text-foreground">
          <span ref={numRef}>{initialText}</span>{goalHours ? ` / ${goalHours}` : ""}
        </span>
        {state.goalReached ? (
          <svg className={`size-6 self-center text-success ${justReached ? "m-draw" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" pathLength={1} />
          </svg>
        ) : null}
        {goalHours ? <span aria-hidden="true" data-complete={state.goalReached ? "true" : "false"} className="hr-pct ml-auto self-center">{state.percent}%</span> : null}
      </div>
      <p aria-hidden="true" className="text-muted-foreground">{label}</p>
      <p className="sr-only" aria-live="polite">{justReached ? t("goalReached") : ""}</p>
      <div role="progressbar" aria-valuenow={state.percent} aria-valuemin={0} aria-valuemax={100} aria-valuetext={valueText}
        data-complete={state.percent >= 100 ? "true" : "false"} data-size={variant === "monthly" ? "lg" : "sm"}
        style={{ "--p": state.percent / 100 } as React.CSSProperties}
        className="hr-track">
        <div className="hr-reveal" aria-hidden="true">
          <div className="hr-reveal-in">
            <div className="hr-liquid" />
            <div className="hr-stripes" />
            <div className="hr-sheen" />
            {BUBBLES.map(([x, size, dur, delay]) => (
              <span key={x} className="hr-bubble" style={{ "--x": `${x}%`, "--s": `${size}px`, "--t": `${dur}s`, "--d": `${delay}s` } as React.CSSProperties} />
            ))}
          </div>
        </div>
        {state.percent > 0 ? <div className="hr-tipwrap" aria-hidden="true"><span className="hr-halo" /><span className="hr-tip" /></div> : null}
        {state.tickPositions.map((p, i) => (
          <span key={p} ref={(el) => { tickRefs.current[i] = el; }} aria-hidden="true" className="hr-tick" data-passed={state.percent >= p ? "true" : "false"} style={{ left: `${p}%` }} />
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
