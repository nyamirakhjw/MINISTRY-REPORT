"use client";
import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";

export interface AuditEntry { id: number; at: string; actor: string | null; action: string; entity_type: string; reason: string | null; before: unknown; after: unknown }

/** Read-only. Entries can never be edited or deleted (D-26). */
export function AuditTable({ entries }: { entries: AuditEntry[] }) {
  const t = useTranslations("admin");
  const c = useTranslations("common");
  const locale = useLocale();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState<AuditEntry | null>(null);
  const shown = entries.filter((e) => !q || `${e.actor ?? ""} ${e.action} ${e.entity_type} ${e.reason ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="flex flex-col gap-4">
      <div><label htmlFor="audit-q" className="font-semibold">{c("search")}</label><Input id="audit-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("auditSearch")} className="max-w-md" /></div>
      <p role="status" className="text-muted-foreground">{t("showing", { shown: shown.length, total: entries.length })}</p>
      <Table>
        <THead><TR><TH>{t("when")}</TH><TH>{t("who")}</TH><TH>{t("action")}</TH><TH>{t("reason")}</TH><TH><span className="sr-only">{t("details")}</span></TH></TR></THead>
        <TBody>
          {shown.map((e) => (
            <TR key={e.id}>
              <TD className="whitespace-nowrap">{formatDateTime(e.at, locale)}</TD>
              <TD>{e.actor ?? t("system")}</TD>
              <TD><code className="text-sm">{e.action}</code></TD>
              <TD className="max-w-xs">{e.reason ?? ""}</TD>
              <TD><Button size="sm" variant="ghost" onClick={() => setOpen(e)}>{t("details")}</Button></TD>
            </TR>
          ))}
        </TBody>
      </Table>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        {open && (
          <DialogContent title={open.action} description={formatDateTime(open.at, locale)} closeLabel={c("close")}>
            <p className="font-semibold">{t("before")}</p><pre className="max-h-48 overflow-auto rounded-md bg-tint p-3 text-sm">{JSON.stringify(open.before, null, 2) ?? "–"}</pre>
            <p className="mt-3 font-semibold">{t("after")}</p><pre className="max-h-48 overflow-auto rounded-md bg-tint p-3 text-sm">{JSON.stringify(open.after, null, 2) ?? "–"}</pre>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
