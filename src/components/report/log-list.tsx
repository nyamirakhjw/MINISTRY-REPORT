"use client";
import { Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { carryoverMonth, formatHMS } from "@/lib/domain/log";
import { formatMonth } from "@/lib/format";
import type { LocalLogEntry } from "@/lib/offline/dexie";

export function LogList({ entries, online, onDelete }: { entries: LocalLogEntry[]; online: boolean; onDelete: (id: string) => Promise<void> }) {
  const t = useTranslations("log");
  const locale = useLocale();
  if (entries.length === 0) return <p className="rounded-lg border border-border bg-surface p-5 text-muted-foreground">{t("empty")}</p>;
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
      {entries.map((e) => {
        const carry = carryoverMonth(e.note);
        return (
          <li key={e.id} className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold tabular">{new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(`${e.serviceDate}T00:00:00Z`))} · {formatHMS(e.durationSeconds)}</p>
              {carry ? <Badge tone="gold">{t("carriedOver", { month: formatMonth(carry, locale) })}</Badge> : e.note ? <p className="text-sm text-muted-foreground">{e.note}</p> : null}
              {!e.syncedAt && <p className="text-sm text-muted-foreground">{t("waitingToSend")}</p>}
            </div>
            {online && (
              <Button variant="ghost" size="icon" aria-label={t("deleteEntry")} onClick={() => onDelete(e.id)}><Trash2 aria-hidden="true" /></Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
