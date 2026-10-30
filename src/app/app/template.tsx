import type { ReactNode } from "react";

/** Re-mounts on every navigation inside the member app, so each page rises in softly (PRD v1.1 AM-01). CSS only. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="m-route">{children}</div>;
}
