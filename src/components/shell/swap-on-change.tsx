"use client";
import * as React from "react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Cross-fades its content when `k` changes while the page is open (a report window opens, an Elder reopens a report and
 * the screen refreshes). It does nothing on the first render, so it never adds to the page's own entrance, and the
 * children can stay server-rendered. Purpose: state indication. One Web Animations call on the wrapper: no re-render,
 * opacity plus a 4px rise, 180ms ease-out, skipped for reduced motion. Interruption retargets because the old animation
 * is cancelled and the new one starts from the current paint.
 */
export function SwapOnChange({ k, children }: { k: string; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const prev = React.useRef(k);
  React.useEffect(() => {
    if (prev.current === k) return;
    prev.current = k;
    if (prefersReducedMotion()) return;
    ref.current?.getAnimations().forEach((a) => a.cancel());
    ref.current?.animate([{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 180, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
  }, [k]);
  return <div ref={ref}>{children}</div>;
}
