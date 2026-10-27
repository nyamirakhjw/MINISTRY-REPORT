"use client";
import * as React from "react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Fallback for browsers without scroll-driven CSS animations (PRD v1.1 §8.2). Where those are supported, or the
 * person prefers reduced motion, this does nothing. Elements already on screen are never hidden, and content
 * stays visible if this script never runs.
 */
export function RevealObserver() {
  React.useEffect(() => {
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;
    if (typeof CSS !== "undefined" && CSS.supports("animation-timeline", "view()")) return;
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.reveal = "in";
        io.unobserve(entry.target);
      }
    }, { threshold: 0.15 });
    document.querySelectorAll<HTMLElement>(".lp-reveal").forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
      el.dataset.reveal = "out";
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);
  return null;
}
