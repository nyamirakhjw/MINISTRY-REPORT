import Link from "next/link";
import { CheckCircle2, Clock, Lock } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatEnd, formatMonth } from "@/lib/format";
import type { ReportState } from "@/lib/types";

/** The single status card with the primary action (DSH-01). Plain language; late is factual, never alarming. */
export async function ReportStatusCard({ state, action = true }: { state: ReportState; action?: boolean }) {
  const t = await getTranslations("report");
  const locale = await getLocale();
  const month = state.month ? formatMonth(state.month, locale) : "";

  if (state.state === "open") {
    return (
      <section aria-labelledby="status-title" className="rounded-lg border border-border bg-surface p-5">
        <h2 id="status-title" className="text-xl">{t("reportFor", { month })}</h2>
        <p className="mt-2 flex items-start gap-2 text-muted-foreground"><Clock className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          {state.is_late ? t("bannerLate", { end: formatEnd(state.late_until ?? "", locale) }) : t("bannerOnTime", { end: formatEnd(state.on_time_until ?? "", locale) })}
        </p>
        {action ? <Link href="/app/report" className={`${buttonVariants()} mt-4`}>{t("reportNow")}</Link> : null}
      </section>
    );
  }
  if (state.state === "blocked") {
    return (
      <section aria-labelledby="status-title" className="rounded-lg border-2 border-warning bg-surface p-5">
        <h2 id="status-title" className="flex items-center gap-2 text-xl"><Lock className="size-5" aria-hidden="true" />{t("blockedTitle", { month })}</h2>
        <p className="mt-2">{t("blockedBody")}</p>
      </section>
    );
  }
  return (
    <section aria-labelledby="status-title" className="rounded-lg border border-border bg-surface p-5">
      <h2 id="status-title" className="flex items-center gap-2 text-xl"><CheckCircle2 className="size-5 text-success" aria-hidden="true" />{t("upToDate")}</h2>
      {state.opens_at ? <p className="mt-2 text-muted-foreground">{t("nextOpens", { month, date: formatDate(state.opens_at, locale) })}</p> : null}
    </section>
  );
}
