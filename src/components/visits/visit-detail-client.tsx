"use client";
import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronLeft, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VisitFormDialog } from "./visit-form-dialog";
import { LogVisitDialog } from "./log-visit-dialog";
import { QuickActions } from "./quick-actions";
import { useReturnVisits } from "@/lib/offline/visits-store";
import { isOverdue } from "@/lib/domain/visits";
import { createClient } from "@/lib/supabase/browser";

interface HistoryRow { id: string; visited_at: string; notes: string | null; outcome: string | null; next_visit_at: string | null }

/** RV-03: each visit has a history. Best-effort fetch of past rv_visits (owner-only under RLS); the record
 * itself and adding a new visit both work fully offline via useReturnVisits (RV-06). */
export function VisitDetailClient({ memberId, congregationId, rvId }: { memberId: string; congregationId: string; rvId: string }) {
  const t = useTranslations("visits");
  const { rows, loading, addOrEditVisit, deleteVisit, logVisit } = useReturnVisits(memberId, congregationId);
  const [history, setHistory] = React.useState<HistoryRow[] | null>(null);
  const rv = rows.find((r) => r.id === rvId);

  React.useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) { setHistory([]); return; }
    createClient().from("rv_visits").select("id, visited_at, notes, outcome, next_visit_at")
      .eq("return_visit_id", rvId).order("visited_at", { ascending: false })
      .then(({ data, error }) => setHistory(error ? [] : (data as HistoryRow[])));
  }, [rvId]);

  if (loading) return <Skeleton className="h-64 w-full rounded-lg" />;
  if (!rv) return <p className="rounded-lg border border-border bg-surface p-5">{t("notFound")}</p>;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/app/visits" className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary underline underline-offset-4"><ChevronLeft className="size-5" aria-hidden="true" />{t("back")}</Link>

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl">{rv.first_name}</h1>
            {rv.area && <p className="text-muted-foreground">{rv.area}</p>}
          </div>
          <QuickActions rv={rv} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          <Badge>{t(`status_${rv.status}` as "status_interested")}</Badge>
          {isOverdue(rv) && <Badge tone="danger">{t("overdue")}</Badge>}
          {rv.interest_level ? <Badge tone="gold">{t("interestLevel", { level: rv.interest_level })}</Badge> : null}
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {rv.topic && <div><dt className="text-muted-foreground">{t("topic")}</dt><dd>{rv.topic}</dd></div>}
          {rv.literature && <div><dt className="text-muted-foreground">{t("literature")}</dt><dd>{rv.literature}</dd></div>}
          {rv.first_met_on && <div><dt className="text-muted-foreground">{t("firstMet")}</dt><dd>{rv.first_met_on}</dd></div>}
          {rv.next_visit_at && <div><dt className="text-muted-foreground">{t("next")}</dt><dd>{new Date(rv.next_visit_at).toLocaleString()}</dd></div>}
        </dl>
        {rv.notes && <p className="mt-3 whitespace-pre-wrap text-sm">{rv.notes}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <LogVisitDialog returnVisitId={rv.id} onLog={logVisit} />
          <VisitFormDialog existing={rv} onSave={addOrEditVisit} trigger={<Button variant="secondary">{t("edit")}</Button>} />
          <Button variant="danger" onClick={() => deleteVisit(rv.id)}><Trash2 className="size-5" aria-hidden="true" />{t("delete")}</Button>
        </div>
      </div>

      <section aria-labelledby="rv-history">
        <h2 id="rv-history" className="mb-2 text-lg font-semibold">{t("history")}</h2>
        {history === null ? <Skeleton className="h-20 w-full rounded-lg" /> : history.length === 0 ? (
          <p className="text-muted-foreground">{t("noHistory")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {history.map((h) => (
              <li key={h.id} className="rounded-lg border border-border bg-surface p-3">
                <p className="font-semibold">{new Date(h.visited_at).toLocaleString()}</p>
                {h.outcome && <p className="text-sm">{h.outcome}</p>}
                {h.notes && <p className="text-sm text-muted-foreground">{h.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
