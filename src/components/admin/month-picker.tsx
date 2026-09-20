import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { formatMonth } from "@/lib/format";
import { recentMonths } from "@/lib/admin-data";

/** A plain GET form: works without JavaScript and keeps the month in the address. */
export async function MonthPicker({ month }: { month: string }) {
  const t = await getTranslations("admin");
  const locale = await getLocale();
  const months = recentMonths();
  if (!months.includes(month)) months.unshift(month);
  return (
    <form method="get" className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5"><label htmlFor="month" className="font-semibold">{t("month")}</label>
        <Select id="month" name="month" defaultValue={month} className="w-56">{months.map((m) => <option key={m} value={m}>{formatMonth(m, locale)}</option>)}</Select></div>
      <Button type="submit" variant="secondary">{t("showMonth")}</Button>
    </form>
  );
}
