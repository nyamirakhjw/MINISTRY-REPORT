/** Small motion helpers (PRD v1.1 §10.2). Safe to import from client components only. */

export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void) => unknown };

/**
 * Runs `update` inside a View Transition when the browser supports it and the person has not asked for reduced
 * motion; otherwise just runs it. With an origin, the new view grows as a circle from that point (see vt-reveal
 * in globals.css). Never blocks: the update itself always runs immediately.
 */
export function withViewTransition(update: () => void, origin?: { x: number; y: number }): void {
  const doc = document as ViewTransitionDocument;
  if (!doc.startViewTransition || prefersReducedMotion()) {
    update();
    return;
  }
  if (origin) {
    const root = document.documentElement.style;
    const radius = Math.hypot(Math.max(origin.x, window.innerWidth - origin.x), Math.max(origin.y, window.innerHeight - origin.y));
    root.setProperty("--vt-x", `${origin.x}px`);
    root.setProperty("--vt-y", `${origin.y}px`);
    root.setProperty("--vt-r", `${Math.ceil(radius)}px`);
  }
  doc.startViewTransition(update);
}
