"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { VisitCard } from "./visit-card";
import { VisitFormDialog } from "./visit-form-dialog";
import { useReturnVisits } from "@/lib/offline/visits-store";
import { matchesSearch, matchesView, sortByNextVisit, type RvView } from "@/lib/domain/visits";
import { cn } from "@/lib/utils";

const VIEWS: RvView[] = ["today", "upcoming", "overdue", "all"];

/** RV-01: four views with search. Offline-first (RV-06) via useReturnVisits; the sync status line matches the
 * daily log's wording exactly so the pattern is familiar across the app (§8.5). */
export function VisitsClient({ memberId, congregationId }: { memberId: string; congregationId: string }) {
  const t = useTranslations("visits");
  const { rows, loading, online, syncError, addOrEditVisit } = useReturnVisits(memberId, congregationId);
  const [view, setView] = React.useState<RvView>("today");
  const [q, setQ] = React.useState("");

  const filtered = sortByNextVisit(rows.filter((r) => matchesView(r, view) && matchesSearch(r, q)));
  const counts = Object.fromEntries(VIEWS.map((v) => [v, rows.filter((r) => matchesView(r, v)).length])) as Record<RvView, number>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1>{t("title")}</h1>
        <VisitFormDialog onSave={addOrEditVisit} />
      </div>

      {!online && <p className="rounded-md border border-border bg-tint px-3 py-2 text-sm">{t("offlineNotice")}</p>}
      {syncError && <p className="rounded-md border border-danger px-3 py-2 text-sm text-danger">{syncError}</p>}

      <div role="tablist" aria-label={t("title")} className="flex gap-1 overflow-x-auto border-b border-border">
        {VIEWS.map((v) => (
          <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
            className={cn("flex min-h-12 shrink-0 items-center gap-1.5 border-b-4 px-3 font-semibold", view === v ? "border-accent text-primary" : "border-transparent text-muted-foreground")}>
            {t(`view_${v}` as "view_today")}<span className="text-sm text-muted-foreground">({counts[v]})</span>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} className="pl-10" aria-label={t("searchPlaceholder")} />
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-5">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">{filtered.map((rv) => <VisitCard key={rv.id} rv={rv} />)}</ul>
      )}
    </div>
  );
}
