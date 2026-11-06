import Image from "next/image";
import { CalendarDays } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { HALL } from "@/components/hall/hall-photos";
import { Avatar } from "@/components/ui/avatar";
import { dailyTextFor, verseSize } from "@/lib/daily-text";
import { dayPart, formatLongDate, nairobiNow } from "@/lib/nairobi";
import { TimeGreeting } from "./time-greeting";
import "./daily-banner.css";

/**
 * Signed-in Home banner: today's date and scripture on a navy and gold card, a New World Translation resting at the
 * corner that the gold arrow points to, and a frosted glass panel with the member's greeting and round photo.
 * The scripture comes from the daily-text data for the current Nairobi date; with no entry the card shows the
 * date and greeting only.
 */
export async function DailyBanner({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const [t, locale] = await Promise.all([getTranslations("home"), getLocale()]);
  const now = nairobiNow();
  const verse = dailyTextFor(now.date);

  return (
    <section className="db" aria-labelledby="db-greeting">
      <div className="db-card" data-has-verse={verse ? "" : undefined}>
        <span className="db-deco db-ring-a" aria-hidden="true" />
        <span className="db-deco db-ring-b" aria-hidden="true" />
        <span className="db-deco db-stripe" aria-hidden="true" />
        <span className="db-deco db-orb-a" aria-hidden="true" />
        <span className="db-deco db-orb-b" aria-hidden="true" />

        <div className="db-glass">
          <TimeGreeting
            name={name}
            initial={dayPart(now.hour)}
            labels={{ morning: t("greetMorning"), afternoon: t("greetAfternoon"), evening: t("greetEvening") }}
          />
          <span className="db-avatar">
            <Avatar name={name} src={avatarUrl} size={56} alt={t("photoAlt", { name })} />
          </span>
        </div>

        <time className="db-date" dateTime={now.date}>
          <CalendarDays className="db-date-icon" aria-hidden="true" />
          {formatLongDate(now.date, locale)}
        </time>

        {verse && (
          <figure className="db-verse" data-size={verseSize(verse.text.length)}>
            <blockquote><p className="db-text">{verse.text}</p></blockquote>
            <figcaption className="db-ref">
              <span className="sr-only">{t("dailyTextTitle")}: </span>
              <cite>{verse.ref}</cite>
              <svg className="db-arrow" viewBox="0 0 90 70" aria-hidden="true" focusable="false">
                <path pathLength="1" d="M8 6 C 6 30, 28 44, 40 34 C 50 26, 42 14, 33 22 C 24 31, 46 58, 74 58 M74 58 L64 51 M74 58 L65 66" />
              </svg>
            </figcaption>
          </figure>
        )}

        {verse && (
          <div className="db-stage" aria-hidden="true">
            <Image src={HALL.bible} alt="" priority sizes="(min-width: 768px) 256px, 144px" quality={90} className="db-bible" />
          </div>
        )}
      </div>
    </section>
  );
}
