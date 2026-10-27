import * as React from "react";

/**
 * Folds content away with a short height and fade (PRD v1.1 AM-06). Closed content is also `inert` and hidden from
 * assistive technology, so it cannot be focused or read while folded. Content stays mounted, so typed values survive.
 */
export function Collapse({ open, children, className }: { open: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={`m-collapse ${className ?? ""}`} data-open={open ? "true" : "false"} aria-hidden={open ? undefined : true} inert={!open}>
      <div className="m-collapse-inner">{children}</div>
    </div>
  );
}
