"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/** EXP-01, EXP-02, EXP-03, EXP-05: plain downloads, each hitting its own route handler. Every field here maps
 * 1:1 to a query param the handler reads, so there's no client-side generation to keep in sync with the server. */
export function ExportForm({ defaultMonth, defaultServiceYear }: { defaultMonth: string; defaultServiceYear: string }) {
  const t = useTranslations("exports");
  const [month, setMonth] = React.useState(defaultMonth.slice(0, 7));
  const [serviceYear, setServiceYear] = React.useState(defaultServiceYear);
  const [lang, setLang] = React.useState<"en" | "sw">("en");
  const [comments, setComments] = React.useState(false);
  const [notReported, setNotReported] = React.useState(true);
  const [memberId, setMemberId] = React.useState("");

  const monthKey = `${month}-01`;
  const congregationParams = new URLSearchParams({ month: monthKey, lang, comments: comments ? "1" : "0", notReported: notReported ? "1" : "0" }).toString();
  const individualParams = new URLSearchParams({ year: serviceYear, ...(memberId ? { member: memberId } : {}) }).toString();

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">{t("congregationTitle")}</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><Label htmlFor="ex-month">{t("month")}</Label><Input id="ex-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></div>
          <div><Label htmlFor="ex-lang">{t("language")}</Label>
            <Select id="ex-lang" value={lang} onChange={(e) => setLang(e.target.value as "en" | "sw")}><option value="en">English</option><option value="sw">Kiswahili</option></Select>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <label className="flex items-center gap-2"><Checkbox checked={comments} onCheckedChange={(v) => setComments(!!v)} />{t("includeComments")}</label>
          <label className="flex items-center gap-2"><Checkbox checked={notReported} onCheckedChange={(v) => setNotReported(!!v)} />{t("includeNotReported")}</label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild><a href={`/api/exports/congregation?${congregationParams}`}><Download className="size-5" aria-hidden="true" />{t("downloadPdf")}</a></Button>
          <Button asChild variant="secondary"><a href={`/api/exports/congregation-excel?${congregationParams}`}><Download className="size-5" aria-hidden="true" />{t("downloadExcel")}</a></Button>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">{t("serviceYearTitle")}</h2>
        <div className="mt-4"><Label htmlFor="ex-sy">{t("serviceYear")}</Label><Input id="ex-sy" value={serviceYear} onChange={(e) => setServiceYear(e.target.value)} placeholder="2026-2027" /></div>
        <div className="mt-4"><Button asChild variant="secondary"><a href={`/api/exports/service-year?year=${encodeURIComponent(serviceYear)}`}><Download className="size-5" aria-hidden="true" />{t("downloadExcel")}</a></Button></div>
      </section>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">{t("individualTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("individualHint")}</p>
        <div className="mt-4"><Label htmlFor="ex-member">{t("memberId")}</Label><Input id="ex-member" value={memberId} onChange={(e) => setMemberId(e.target.value)} placeholder={t("memberIdPlaceholder")} /></div>
        <div className="mt-4"><Button asChild><a href={`/api/exports/individual?${individualParams}`}><Download className="size-5" aria-hidden="true" />{t("downloadPdf")}</a></Button></div>
      </section>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">{t("auditLogTitle")}</h2>
        <div className="mt-4"><Button asChild variant="secondary"><a href="/api/exports/audit-log"><Download className="size-5" aria-hidden="true" />{t("downloadExcel")}</a></Button></div>
      </section>
    </div>
  );
}
