"use client";
import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { MessageCircle, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CloseMonthDialog, OnBehalfDialog } from "@/components/admin/report-dialogs";
import { WhatsAppLink } from "@/components/admin/whatsapp-link";
import { LiveItem, LiveList } from "@/components/shell/live-list";
import { formatDate, formatMonth } from "@/lib/format";
import { whatsappHref } from "@/lib/whatsapp";

export interface NotReportedRow { memberId: string; fullName: string; groupName: string | null; phone: string | null; avatarUrl: string | null }

/**
 * The not-reported list with selection and a bar that slides up from the bottom (PRD ADM-07, v1.1 EM-07). WhatsApp is one tap
 * per person by design (D-28), so "Message next" opens the next selected person's chat each time it is pressed and marks
 * them opened. Reminders by push and email need the notification engine, which is not built yet, so they are not offered here.
 */
export function NotReportedList({ rows, month, dueIso, siteUrl, daysLeft }: { rows: NotReportedRow[]; month: string; dueIso: string; siteUrl: string; daysLeft: number }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());
  const [opened, setOpened] = React.useState<Set<string>>(() => new Set());

  const chosen = rows.filter((r) => selected.has(r.memberId));
  const reachable = chosen.filter((r) => r.phone);
  const queue = reachable.filter((r) => !opened.has(r.memberId));
  const done = reachable.length - queue.length;
  const allSelected = rows.length > 0 && selected.size === rows.length;

  const toggle = (id: string, on: boolean) => setSelected((prev) => { const next = new Set(prev); if (on) next.add(id); else next.delete(id); return next; });
  const messageFor = (r: NotReportedRow) => t("whatsappMessage", { name: r.fullName.split(" ")[0] ?? r.fullName, month: formatMonth(month, locale), date: formatDate(dueIso, locale), link: `${siteUrl}/app/report` });

  function messageNext() {
    const next = queue[0];
    const href = next ? whatsappHref(next.phone, messageFor(next)) : null;
    if (!next || !href) return;
    window.open(href, "_blank", "noopener,noreferrer"); // inside the tap, so the browser allows it
    setOpened((prev) => new Set(prev).add(next.memberId));
  }

  const open = selected.size > 0;
  return (
    <LiveList className="flex flex-col overflow-y-clip">
      <div className="rounded-lg border border-border bg-surface">
        <label className="flex min-h-12 items-center gap-3 border-b border-border px-4 py-2 font-semibold">
          <Checkbox checked={allSelected} onCheckedChange={(v) => setSelected(v ? new Set(rows.map((r) => r.memberId)) : new Set())} />
          {t("selectAll")}
        </label>
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <LiveItem key={r.memberId} sig={r.memberId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <label className="-m-2 flex size-11 items-center justify-center">
                  <Checkbox checked={selected.has(r.memberId)} onCheckedChange={(v) => toggle(r.memberId, !!v)} aria-label={t("selectPerson", { name: r.fullName })} />
                </label>
                <Avatar name={r.fullName} src={r.avatarUrl} size={44} alt={t("photoOf", { name: r.fullName })} />
                <div>
                  <p className="font-semibold">{r.fullName}{opened.has(r.memberId) ? <Badge tone="success" className="m-pop ml-2">{t("opened")}</Badge> : null}</p>
                  <p className="text-sm text-muted-foreground">{r.groupName ?? ""} · {daysLeft >= 0 ? t("daysLeft", { count: daysLeft }) : t("daysOverdue", { count: -daysLeft })}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <WhatsAppLink phone={r.phone} firstName={r.fullName.split(" ")[0] ?? r.fullName} month={month} dueIso={dueIso} siteUrl={siteUrl} />
                <OnBehalfDialog memberId={r.memberId} name={r.fullName} month={month} label={t("submitOnBehalf")} />
                <CloseMonthDialog memberId={r.memberId} name={r.fullName} month={month} label={t("closeMonth")} />
              </div>
            </LiveItem>
          ))}
        </ul>
      </div>

      <div className="m-sticky-bar" data-open={open ? "true" : "false"} inert={!open} aria-hidden={open ? undefined : true}>
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 shadow-lg">
          <p aria-live="polite" className="font-semibold">{t("selectedCount", { count: selected.size })}</p>
          <p className="text-sm text-muted-foreground">{reachable.length === 0 ? t("noneHavePhone") : t("messageProgress", { done, total: reachable.length })}</p>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" onClick={messageNext} disabled={queue.length === 0}>
              <MessageCircle aria-hidden="true" />{reachable.length > 0 && queue.length === 0 ? t("allOpened") : t("messageNext")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}><X aria-hidden="true" />{t("clearSelection")}</Button>
          </div>
        </div>
      </div>
    </LiveList>
  );
}
