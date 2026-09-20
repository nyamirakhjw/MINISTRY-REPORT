"use client";
import * as React from "react";
import { ArrowDown, ArrowUp, Flag, MessageSquare } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import type { AdminRow } from "@/lib/admin-data";
import { CloseMonthDialog, OnBehalfDialog } from "./report-dialogs";

type SortKey = "full_name" | "group_name" | "category" | "hours" | "studies" | "status";

function statusOf(r: AdminRow): "onTime" | "late" | "didNotReport" | "notYet" {
  if (r.status === "missing") return "notYet";
  if (r.status === "not_reported") return "didNotReport";
  return r.is_late ? "late" : "onTime";
}

export function ReportsTable({ rows, groups, month, avatars }: { rows: AdminRow[]; groups: { id: string; name: string }[]; month: string; avatars: Record<string, string> }) {
  const t = useTranslations("admin");
  const st = useTranslations("status");
  const cat = useTranslations("categories");
  const c = useTranslations("common");
  const locale = useLocale();
  const [q, setQ] = React.useState("");
  const [group, setGroup] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [sort, setSort] = React.useState<{ key: SortKey; dir: 1 | -1 }>({ key: "full_name", dir: 1 });
  const [open, setOpen] = React.useState<AdminRow | null>(null);

  const shown = React.useMemo(() => {
    const list = rows.filter((r) =>
      (!q || r.full_name.toLowerCase().includes(q.toLowerCase())) && (!group || r.group_name === group) &&
      (!category || r.category === category) && (!status || statusOf(r) === status));
    const val = (r: AdminRow): string | number => sort.key === "status" ? statusOf(r) : (r[sort.key] ?? "") as string | number;
    return [...list].sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * sort.dir);
  }, [rows, q, group, category, status, sort]);

  const head = (key: SortKey, label: string, className?: string) => (
    <TH className={className} aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button type="button" className="inline-flex min-h-11 items-center gap-1 font-semibold" onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1 }))}>
        {label}{sort.key === key ? (sort.dir === 1 ? <ArrowUp className="size-4" aria-hidden="true" /> : <ArrowDown className="size-4" aria-hidden="true" />) : null}
      </button>
    </TH>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div><label htmlFor="f-q" className="font-semibold">{c("search")}</label><Input id="f-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchName")} /></div>
        <div><label htmlFor="f-g" className="font-semibold">{t("group")}</label><Select id="f-g" value={group} onChange={(e) => setGroup(e.target.value)}><option value="">{c("all")}</option>{groups.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}</Select></div>
        <div><label htmlFor="f-c" className="font-semibold">{t("category")}</label><Select id="f-c" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">{c("all")}</option>{(["publisher", "auxiliary_pioneer", "regular_pioneer", "special_pioneer"] as const).map((k) => <option key={k} value={k}>{cat(k)}</option>)}</Select></div>
        <div><label htmlFor="f-s" className="font-semibold">{t("status")}</label><Select id="f-s" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">{c("all")}</option>{(["onTime", "late", "didNotReport", "notYet"] as const).map((k) => <option key={k} value={k}>{st(k)}</option>)}</Select></div>
      </div>
      <p role="status" className="text-muted-foreground">{t("showing", { shown: shown.length, total: rows.length })}</p>
      {shown.length === 0 ? <p className="rounded-lg border border-border bg-surface p-5">{t("noRows")}</p> : (
        <Table>
          <THead><TR>{head("full_name", t("name"))}{head("group_name", t("group"))}{head("category", t("category"))}{head("hours", t("hoursOrParticipated"))}{head("studies", t("studies"))}{head("status", t("status"))}<TH>{t("flags")}</TH></TR></THead>
          <TBody>
            {shown.map((r) => (
              <TR key={r.member_id}>
                <TD><button type="button" onClick={() => setOpen(r)} className="flex min-h-11 items-center gap-2 text-left font-semibold underline-offset-4 hover:underline"><Avatar name={r.full_name} src={r.avatar_path ? avatars[r.avatar_path] : null} size={32} alt={t("photoOf", { name: r.full_name })} />{r.full_name}</button></TD>
                <TD>{r.group_name ?? "–"}</TD>
                <TD>{r.category ? cat(r.category) : "–"}</TD>
                <TD>{r.status === "missing" || r.status === "not_reported" ? "–" : r.category === "publisher" ? (r.participated ? c("yes") : c("no")) : r.hours}</TD>
                <TD>{r.studies ?? "–"}</TD>
                <TD><Badge tone={{ onTime: "success", late: "warning", didNotReport: "danger", notYet: "neutral" }[statusOf(r)] as "success"}>{st(statusOf(r))}</Badge></TD>
                <TD>
                  <span className="flex items-center gap-2">
                    {r.zero_hours ? <span title={t("flagZeroHours")}><Flag className="size-5 text-warning" aria-label={t("flagZeroHours")} /></span> : null}
                    {r.self_edited ? <span title={t("flagSelfEdited")}><Flag className="size-5 text-danger" aria-label={t("flagSelfEdited")} /></span> : null}
                    {r.submitted_via === "elder" && !r.self_edited ? <Badge>{t("onBehalf")}</Badge> : null}
                    {r.comment ? <MessageSquare className="size-5 text-muted-foreground" aria-label={t("hasComment")} /> : null}
                  </span>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        {open && (
          <DialogContent title={open.full_name} description={open.group_name ?? undefined} closeLabel={c("close")}>
            <dl className="divide-y divide-border">
              <Line k={t("status")} v={st(statusOf(open))} />
              {open.category && <Line k={t("category")} v={cat(open.category)} />}
              {open.status !== "missing" && open.status !== "not_reported" && (open.category === "publisher" ? <Line k={t("participated")} v={open.participated ? c("yes") : c("no")} /> : <Line k={t("hours")} v={String(open.hours ?? 0)} />)}
              {open.studies !== null && <Line k={t("studies")} v={String(open.studies)} />}
              {open.submitted_at && <Line k={t("submittedAt")} v={formatDateTime(open.submitted_at, locale)} />}
              {open.received_at && open.submitted_via === "elder" && <Line k={t("receivedAt")} v={formatDateTime(open.received_at, locale)} />}
              {open.submitted_by_name && open.submitted_via === "elder" && <Line k={t("submittedBy")} v={open.submitted_by_name} />}
              {open.time_adjusted && <Line k={t("timeAdjusted")} v={c("yes")} />}
              {open.comment && <Line k={t("comment")} v={open.comment} />}
            </dl>
            {(open.status === "missing" || open.status === "not_reported") && (
              <div className="mt-4 flex flex-wrap gap-3">
                <OnBehalfDialog memberId={open.member_id} name={open.full_name} month={month} label={t("submitOnBehalf")} />
                {open.status === "missing" && <CloseMonthDialog memberId={open.member_id} name={open.full_name} month={month} label={t("closeMonth")} />}
              </div>
            )}
            <div className="mt-4"><Button variant="ghost" onClick={() => setOpen(null)}>{c("close")}</Button></div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-4 py-2"><dt className="text-muted-foreground">{k}</dt><dd className="max-w-[60%] text-right font-semibold">{v}</dd></div>;
}
