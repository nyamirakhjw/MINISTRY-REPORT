import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ReportForm } from "@/components/report/report-form";
import { ResubmitForm } from "@/components/report/resubmit-form";
import { ReportStatusCard } from "@/components/report/status-card";
import { requireMember } from "@/lib/auth/session";
import { formatEnd, formatMonth } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { ReportState } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("report") };
}

/** Shows only the month that may be reported now (REP-01) — or, if one exists, the reopened report that needs
 * fixing first (COR-03). The two never conflict: a reopened month already has a report row, so it doesn't block
 * the order rule for whatever the next open month is. */
export default async function Page() {
  await requireMember("/app/report");
  const t = await getTranslations("report");
  const locale = await getLocale();
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_report_state");
  const state = (data ?? { state: "not_active" }) as ReportState;

  if (state.state === "reopened" && state.report_id && state.category && state.month) {
    return (
      <div className="flex flex-col gap-4">
        <h1>{t("reportFor", { month: formatMonth(state.month, locale) })}</h1>
        <ResubmitForm reportId={state.report_id} category={state.category} participated={state.participated ?? null} hours={state.hours ?? null} studies={state.studies ?? null} comment={state.comment ?? null} />
      </div>
    );
  }

  if (state.state !== "open" || !state.month || !state.options) {
    return <div className="flex flex-col gap-4"><h1>{t("pageTitle")}</h1><ReportStatusCard state={state} action={false} /></div>;
  }
  const note = state.is_late ? t("bannerLate", { end: formatEnd(state.late_until ?? "", locale) }) : t("bannerOnTime", { end: formatEnd(state.on_time_until ?? "", locale) });
  const { data: logSeconds } = await supabase.rpc("my_log_seconds", { p_month: state.month });
  return (
    <div className="flex flex-col gap-4">
      <h1>{t("reportFor", { month: formatMonth(state.month, locale) })}</h1>
      <ReportForm key={state.month} month={state.month} options={state.options} windowNote={note} logSeconds={Number(logSeconds ?? 0)} />
    </div>
  );
}
