import type { ReactNode } from "react";

export type SectionStatus = { type: "idle" | "success" | "error"; message?: string };

/**
 * Shared shell for every settings sub-page: a heading, a short
 * description, an inline status banner, and the form itself.
 *
 * Deliberately not a shadcn <Card> — the design idea ("the well-kept
 * record", PRD §10.1) uses a divider under the heading rather than a
 * bordered/shadowed box, per the anti-slop rule against walls of
 * identical rounded cards (§10.2 #3).
 */
export function SettingsSection({
  title,
  description,
  status,
  children,
}: {
  title: string;
  description?: string;
  status?: SectionStatus;
  children: ReactNode;
}) {
  return (
    <section className="max-w-2xl space-y-6">
      <div className="space-y-1 border-b border-border pb-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {status?.type === "success" ? (
        <div
          role="status"
          className="rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
        >
          {status.message ?? "Saved."}
        </div>
      ) : null}

      {status?.type === "error" ? (
        <div
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {status.message ?? "That didn't save. Try again."}
        </div>
      ) : null}

      {children}
    </section>
  );
}
