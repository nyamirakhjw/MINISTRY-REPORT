/** Small motion helpers (PRD v1.1 §10.2). Safe to import from client components only. */

export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void | Promise<void>) => { finished: Promise<unknown> };
};

/**
 * Runs `update` inside a View Transition when the browser supports it and the person has not asked for reduced motion;
 * otherwise just runs it. With an origin the new view grows as a circle from that point (the theme change); without one
 * it is a short crossfade (a language change). `update` may return a promise: the transition waits for it, so pass one
 * that settles when the page has actually changed (see waitFor). Never blocks: the update always runs immediately.
 */
export function withViewTransition(update: () => void | Promise<void>, origin?: { x: number; y: number }): void {
  const doc = document as ViewTransitionDocument;
  if (!doc.startViewTransition || prefersReducedMotion()) {
    void update();
    return;
  }
  const root = document.documentElement;
  if (origin) {
    const radius = Math.hypot(Math.max(origin.x, window.innerWidth - origin.x), Math.max(origin.y, window.innerHeight - origin.y));
    root.style.setProperty("--vt-x", `${origin.x}px`);
    root.style.setProperty("--vt-y", `${origin.y}px`);
    root.style.setProperty("--vt-r", `${Math.ceil(radius)}px`);
  }
  root.dataset.vt = origin ? "reveal" : "fade";
  const clear = () => { delete root.dataset.vt; };
  doc.startViewTransition(update).finished.then(clear, clear);
}

/**
 * Resolves when `test` becomes true, or after `timeoutMs` so a transition can never hang the page. Uses timers, not
 * animation frames: while a view transition waits for its callback the browser pauses rendering, so frames never arrive.
 */
export function waitFor(test: () => boolean, timeoutMs = 1200): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => (test() || Date.now() - start > timeoutMs ? resolve() : void setTimeout(tick, 30));
    tick();
  });
}
