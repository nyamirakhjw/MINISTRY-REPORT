import { getLocale, getTranslations } from "next-intl/server";
import { MonthPickerForm } from "@/components/admin/month-picker-form";
import { formatMonth } from "@/lib/format";
import { recentMonths } from "@/lib/admin-data";

/** Server wrapper: works out the choices; the form itself navigates in place (see MonthPickerForm). */
export async function MonthPicker({ month }: { month: string }) {
  const t = await getTranslations("admin");
  const locale = await getLocale();
  const months = recentMonths();
  if (!months.includes(month)) months.unshift(month);
  return <MonthPickerForm month={month} options={months.map((m) => ({ value: m, label: formatMonth(m, locale) }))} labels={{ month: t("month"), show: t("showMonth") }} />;
}
