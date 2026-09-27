"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { QuickActions } from "./quick-actions";
import { isOverdue, type RvRow } from "@/lib/domain/visits";

const STATUS_TONE = { interested: "neutral", study_started: "success", not_interested: "danger", moved: "warning" } as const;

export function VisitCard({ rv }: { rv: RvRow }) {
  const t = useTranslations("visits");
  const overdue = isOverdue(rv);
  return (
    <li className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/app/visits/${rv.id}`} className="min-w-0 flex-1">
          <p className="text-lg font-semibold">{rv.first_name}</p>
          {rv.area && <p className="text-sm text-muted-foreground">{rv.area}</p>}
          {rv.next_visit_at && <p className="mt-1 text-sm">{t("next")}: {new Date(rv.next_visit_at).toLocaleString()}</p>}
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge tone={STATUS_TONE[rv.status]}>{t(`status_${rv.status}` as "status_interested")}</Badge>
            {overdue && <Badge tone="danger">{t("overdue")}</Badge>}
          </div>
        </Link>
        <QuickActions rv={rv} />
      </div>
    </li>
  );
}
