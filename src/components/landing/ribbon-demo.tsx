"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { prefersReducedMotion } from "@/lib/motion";
import "@/components/report/hours-ribbon.css";

const GOAL = 50;
const START = 38;
const STEP = 2;

/**
 * A small, labelled sample of the hours ribbon (PRD v1.1 §8.3, LM-06). It uses made-up numbers and says so.
 * The fill is a transform driven by one CSS variable; the numerals are written straight to the DOM node, so React
 * never re-renders per frame. Pressing again mid-animation continues from the current value.
 */
export function RibbonDemo() {
  const t = useTranslations("landing");
  const [hours, setHours] = React.useState(START);
  const numRef = React.useRef<HTMLSpanElement>(null);
  const shown = React.useRef<number>(START);
  const frame = React.useRef(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const shineRef = React.useRef<HTMLSpanElement>(null);
  const addRef = React.useRef<HTMLButtonElement>(null);
  const resetRef = React.useRef<HTMLButtonElement>(null);
  const done = hours >= GOAL;
  const percent = Math.round((hours / GOAL) * 100);

  React.useEffect(() => {
    const node = numRef.current;
    if (!node) return;
    cancelAnimationFrame(frame.current);
    if (prefersReducedMotion()) {
      shown.current = hours;
      node.textContent = String(hours);
      return;
    }
    const from = shown.current;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / 600);
      const eased = 1 - (1 - p) * (1 - p);
      shown.current = from + (hours - from) * eased;
      node.textContent = String(Math.round(shown.current));
      if (p < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [hours]);

  // the stripes and the pinging knob run only while the demo is on screen
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { el.dataset.live = "true"; return; }
    const io = new IntersectionObserver(([entry]) => { el.dataset.live = entry?.isIntersecting ? "true" : "false"; });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const add = () => {
    if (!prefersReducedMotion()) shineRef.current?.animate([{ opacity: 0.9, transform: "translateX(-120%) skewX(-20deg)" }, { opacity: 0, transform: "translateX(420%) skewX(-20deg)" }], { duration: 900, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
    const next = Math.min(GOAL, hours + STEP);
    setHours(next);
    if (next >= GOAL) setTimeout(() => resetRef.current?.focus(), 0); // the Add button is about to disable; keep focus in the panel
  };
  const reset = () => {
    setHours(START);
    setTimeout(() => addRef.current?.focus(), 0);
  };

  return (
    <div className="lp-panel">
      <div ref={rootRef} className="hr" data-variant="monthly" data-complete={done ? "true" : "false"}>
        <div className="hr-head">
          <span className="hr-num tabular" aria-hidden="true"><span ref={numRef}>{START}</span><span className="hr-goal"> / {GOAL}</span></span>
          {done ? (
            <svg className="size-7 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
            </svg>
          ) : <span aria-hidden="true" className="hr-chip tabular">{percent}%</span>}
        </div>
        <p className="hr-sub" aria-hidden="true">{done ? t("demoGoalReached") : t("demoToGo", { count: GOAL - hours })}</p>
        <div
          role="progressbar" aria-label={t("demoTitle")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}
          aria-valuetext={t("demoValue", { current: hours, goal: GOAL, percent })}
          className="hr-track" style={{ "--p": hours / GOAL } as React.CSSProperties}
        >
          <div className="hr-rail">
            <div className="hr-fill" aria-hidden="true"><span className="hr-flow" /><span ref={shineRef} className="hr-shine" /></div>
            {[25, 50, 75].map((p) => <span key={p} aria-hidden="true" className="hr-dot" data-hit={percent >= p ? "true" : "false"} style={{ left: `${p}%` }} />)}
          </div>
          {percent > 0 ? <div className="hr-tipwrap" aria-hidden="true"><span className="hr-tip" /></div> : null}
        </div>
        <div className="hr-marks" aria-hidden="true">
          {[25, 50, 75].map((p) => <span key={p} className="hr-mark" data-hit={percent >= p ? "true" : "false"} style={{ left: `${p}%` }}>{p}%</span>)}
          <span className="hr-mark" data-hit={done ? "true" : "false"} style={{ left: "100%" }}>{t("demoMilestoneGoal")}</span>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">{done ? t("demoGoalReached") : ""}</p>
      <div className="lp-demo-actions">
        <Button ref={addRef} onClick={add} disabled={done}>{t("demoAdd")}</Button>
        <Button ref={resetRef} variant="secondary" onClick={reset}>{t("demoReset")}</Button>
      </div>
    </div>
  );
}
