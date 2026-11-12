"use client";
import * as React from "react";
import { Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { carryoverMonth, formatHMS } from "@/lib/domain/log";
import { formatMonth } from "@/lib/format";
import { prefersReducedMotion } from "@/lib/motion";
import type { LocalLogEntry } from "@/lib/offline/dexie";

export function LogList({ entries, online, onDelete }: { entries: LocalLogEntry[]; online: boolean; onDelete: (id: string) => Promise<void> }) {
  const t = useTranslations("log");
  const locale = useLocale();
  // Entries present when the list first showed never animate; one that arrives later (a quick add, a sync) eases in.
  // Deleting is occasional: the row fades and slides 8px toward its button (150ms), then the list closes up.
  const [seen] = React.useState(() => new Set(entries.map((e) => e.id)));
  const remove = async (id: string, row: HTMLElement | null) => {
    if (row && !prefersReducedMotion()) {
      await row.animate([{ opacity: 1, transform: "translateX(0)" }, { opacity: 0, transform: "translateX(8px)" }], { duration: 150, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "forwards" }).finished.catch(() => undefined);
    }
    try { await onDelete(id); } catch (err) { row?.getAnimations().forEach((a) => a.cancel()); throw err; } // a failed delete brings the row back
  };
  if (entries.length === 0) return <p className="rounded-lg border border-border bg-surface p-5 text-muted-foreground">{t("empty")}</p>;
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
      {entries.map((e) => {
        const carry = carryoverMonth(e.note);
        return (
          <li key={e.id} className={`flex items-center justify-between gap-3 p-4${seen.has(e.id) ? "" : " m-enter"}`}>
            <div>
              <p className="font-semibold tabular">{new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(`${e.serviceDate}T00:00:00Z`))} · {formatHMS(e.durationSeconds)}</p>
              {carry ? <Badge tone="gold">{t("carriedOver", { month: formatMonth(carry, locale) })}</Badge> : e.note ? <p className="text-sm text-muted-foreground">{e.note}</p> : null}
              {!e.syncedAt && <p className="text-sm text-muted-foreground">{t("waitingToSend")}</p>}
            </div>
            {online && (
              <Button variant="ghost" size="icon" aria-label={t("deleteEntry")} onClick={(ev) => void remove(e.id, ev.currentTarget.closest("li"))}><Trash2 aria-hidden="true" /></Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
