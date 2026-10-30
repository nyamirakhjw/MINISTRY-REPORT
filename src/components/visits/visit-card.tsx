"use client";
import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QuickActions } from "./quick-actions";
import { LogVisitDialog } from "./log-visit-dialog";
import { isOverdue, type RvRow } from "@/lib/domain/visits";
import { prefersReducedMotion } from "@/lib/motion";
import type { LogVisitInput } from "@/lib/offline/visits-store";

const STATUS_TONE = { interested: "neutral", study_started: "success", not_interested: "danger", moved: "warning" } as const;
const THRESHOLD = 72;   // pixels of leftward drag that count as "mark visited"
const MAX_PULL = 120;

interface Drag { x: number; y: number; id: number; mode: "idle" | "horizontal"; dx: number }

/**
 * A return visit. On a phone, drag the card left past 72px to log the visit (PRD v1.1 AM-16): it follows the finger, the
 * action shows underneath, and the card springs back. Position is written straight to the element, never through state.
 * Everyone, including keyboard and screen-reader users, can use the "Mark visited" button instead.
 */
export function VisitCard({ rv, onLog }: { rv: RvRow; onLog?: (input: LogVisitInput) => Promise<void> }) {
  const t = useTranslations("visits");
  const overdue = isOverdue(rv);
  const fg = React.useRef<HTMLDivElement>(null);
  const hint = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<Drag | null>(null);
  const swallowClick = React.useRef(false);
  const [logOpen, setLogOpen] = React.useState(false);

  const move = (dx: number, animate: boolean) => {
    const el = fg.current;
    if (!el) return;
    el.style.transition = animate && !prefersReducedMotion() ? "transform 420ms var(--ease-spring)" : "none";
    el.style.transform = dx ? `translateX(${dx}px)` : "";
    if (hint.current) hint.current.style.opacity = String(Math.min(1, Math.abs(dx) / THRESHOLD));
  };

  const swipe = onLog ? {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId, mode: "idle", dx: 0 };
    },
    onPointerMove: (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (d.mode === "idle") {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { drag.current = null; return; } // a vertical scroll: leave it alone
        if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        d.mode = "horizontal";
        fg.current?.setPointerCapture(e.pointerId);
      }
      d.dx = Math.max(-MAX_PULL, Math.min(0, dx)); // leftward only
      move(d.dx, false);
    },
    onPointerUp: (e: React.PointerEvent) => finish(e, true),
    onPointerCancel: (e: React.PointerEvent) => finish(e, false),
  } : {};

  function finish(e: React.PointerEvent, committed: boolean) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (d.mode !== "horizontal") return;
    swallowClick.current = true; // the click that follows a drag must not open the visit
    setTimeout(() => { swallowClick.current = false; }, 60);
    move(0, true);
    if (committed && d.dx <= -THRESHOLD) setLogOpen(true);
  }

  return (
    <li className="relative overflow-hidden rounded-lg border border-border bg-surface">
      {onLog ? (
        <div ref={hint} aria-hidden="true" style={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-end gap-2 bg-tint px-5 font-semibold text-success">
          <CheckCircle2 className="size-5" />{t("markVisited")}
        </div>
      ) : null}
      <div ref={fg} className="m-swipe-fg relative bg-surface p-4" {...swipe} onClickCapture={(e) => { if (swallowClick.current) { e.preventDefault(); e.stopPropagation(); } }}>
        <div className="flex items-start justify-between gap-3">
          <Link href={`/app/visits/${rv.id}`} className="min-w-0 flex-1" draggable={false}>
            <p className="text-lg font-semibold">{rv.first_name}</p>
            {rv.area && <p className="text-sm text-muted-foreground">{rv.area}</p>}
            {rv.next_visit_at && <p className="mt-1 text-sm">{t("next")}: {new Date(rv.next_visit_at).toLocaleString()}</p>}
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge tone={STATUS_TONE[rv.status]}>{t(`status_${rv.status}` as "status_interested")}</Badge>
              {overdue && <Badge tone="danger">{t("overdue")}</Badge>}
            </div>
          </Link>
          <div className="flex gap-2">
            <QuickActions rv={rv} />
            {onLog ? (
              <button type="button" onClick={() => setLogOpen(true)} aria-label={t("markVisited")}
                className="press inline-flex size-11 items-center justify-center rounded-md border border-input-border hover:bg-tint">
                <CheckCircle2 className="size-5" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {onLog ? <LogVisitDialog returnVisitId={rv.id} onLog={onLog} trigger={null} open={logOpen} onOpenChange={setLogOpen} /> : null}
    </li>
  );
}
