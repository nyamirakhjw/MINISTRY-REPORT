"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { prefersReducedMotion } from "@/lib/motion";

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

  const add = () => {
    const next = Math.min(GOAL, hours + STEP);
    setHours(next);
    if (next >= GOAL) setTimeout(() => resetRef.current?.focus(), 0); // the Add button is about to disable; keep focus in the panel
  };
  const reset = () => {
    setHours(START);
    setTimeout(() => addRef.current?.focus(), 0);
  };

  return (
    <div className="lp-panel" data-done={done ? "true" : "false"}>
      <div className="lp-demo-row">
        <span className="lp-demo-num" aria-hidden="true"><span ref={numRef}>{START}</span> / {GOAL}</span>
        <svg className="lp-demo-ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M4 12.5l5 5L20 6.5" pathLength={1} />
        </svg>
      </div>
      <p className="lp-pmuted" aria-hidden="true">{done ? t("demoGoalReached") : t("demoToGo", { count: GOAL - hours })}</p>
      <div
        role="progressbar" aria-label={t("demoTitle")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}
        aria-valuetext={t("demoValue", { current: hours, goal: GOAL, percent })}
        className="lp-track" style={{ "--p": hours / GOAL } as React.CSSProperties}
      >
        <div className="lp-fill" />
        <div className="lp-tipwrap" aria-hidden="true"><span className="lp-tip" /></div>
        {[25, 50, 75].map((p) => <span key={p} aria-hidden="true" className="lp-tick" style={{ left: `${p}%` }} />)}
      </div>
      <p className="sr-only" aria-live="polite">{done ? t("demoGoalReached") : ""}</p>
      <div className="lp-demo-actions">
        <Button ref={addRef} onClick={add} disabled={done}>{t("demoAdd")}</Button>
        <Button ref={resetRef} variant="secondary" onClick={reset}>{t("demoReset")}</Button>
      </div>
    </div>
  );
}
