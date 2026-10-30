import type { ReactNode } from "react";

/** Elder console: a quick fade only, because these pages are used all day (PRD v1.1 §5.1). CSS only. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="m-route-soft">{children}</div>;
}
