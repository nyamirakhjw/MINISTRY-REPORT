import { getLocale, getTranslations } from "next-intl/server";
import { dailyTextFor } from "@/lib/daily-text";
import { dayPart, formatLongDate, nairobiNow } from "@/lib/nairobi";
import { DailyBannerView } from "./daily-banner-view";

/**
 * Signed-in Home banner. The scripture comes from the daily-text data for the current Nairobi date; with no entry
 * the card shows the date and greeting only.
 */
export async function DailyBanner({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const [t, locale] = await Promise.all([getTranslations("home"), getLocale()]);
  const now = nairobiNow();
  return (
    <DailyBannerView
      name={name}
      avatarUrl={avatarUrl}
      initialPart={dayPart(now.hour)}
      dateISO={now.date}
      dateLabel={formatLongDate(now.date, locale)}
      verse={dailyTextFor(now.date)}
      text={{
        greetings: { morning: t("greetMorning"), afternoon: t("greetAfternoon"), evening: t("greetEvening") },
        photoAlt: t("photoAlt", { name }),
        dailyTextTitle: t("dailyTextTitle"),
      }}
    />
  );
}
