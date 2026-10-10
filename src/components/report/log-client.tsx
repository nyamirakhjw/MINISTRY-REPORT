"use client";
import { useLocale, useTranslations } from "next-intl";
import { HoursRibbon, ServiceYearMiniChart } from "@/components/report/hours-ribbon";
import { LogQuickAdd } from "@/components/report/log-quick-add";
import { LogList } from "@/components/report/log-list";
import { useDailyLog } from "@/lib/offline/log-store";
import { formatMonth } from "@/lib/format";

export function LogClient({ memberId, congregationId, month, goalHours, yearLabel, yearSeconds, yearGoalHours, monthlyBreakdown }: {
  memberId: string; congregationId: string; month: string; goalHours: number | null;
  yearLabel: string; yearSeconds: number; yearGoalHours: number | null;
  monthlyBreakdown: { month: string; seconds: number }[];
}) {
  const t = useTranslations("log");
  const locale = useLocale();
  const log = useDailyLog(memberId, congregationId, month);
  const yearTotal = yearSeconds - Math.max(0, (monthlyBreakdown.find((m) => m.month === month)?.seconds ?? 0) - log.totalSeconds);

  return (
    <div className="flex flex-col gap-8">
      <h1>{t("title")}</h1>
      {!log.online && <p role="status" className="rounded-md bg-tint p-3">{t("offlineNote")}</p>}
      {log.pendingCount > 0 && <p role="status" className="text-muted-foreground">{t("syncing", { count: log.pendingCount })}</p>}
      {/* v0.2.4: sync() no longer swallows its errors silently — this makes a genuinely stuck item visible
          instead of leaving the person staring at "Waiting to send" with no explanation. */}
      {log.syncError && <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 p-3 text-danger">{t("syncError")}</p>}
      <section aria-labelledby="monthly-ribbon">
        <h2 id="monthly-ribbon" className="mb-2">{formatMonth(month, locale)}</h2>
        <HoursRibbon currentSeconds={log.totalSeconds} goalHours={goalHours} />
      </section>
      <LogQuickAdd onAdd={log.addEntry} />
      <LogList entries={log.entries} online={log.online} onDelete={log.deleteEntry} />
      <section aria-labelledby="year-ribbon" className="flex flex-col gap-3">
        <h2 id="year-ribbon">{t("serviceYear", { year: yearLabel })}</h2>
        <HoursRibbon currentSeconds={yearTotal} goalHours={yearGoalHours} variant="service-year" />
        <ServiceYearMiniChart months={monthlyBreakdown.map((m) => ({ label: formatMonth(m.month, locale).slice(0, 3), hours: Math.floor((m.month === month ? log.totalSeconds : m.seconds) / 3600) }))} />
      </section>
    </div>
  );
}
