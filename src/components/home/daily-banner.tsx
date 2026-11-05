import { getTranslations } from "next-intl/server";
import { Avatar } from "@/components/ui/avatar";
import { dailyTextFor, dayPart, nairobiNow, verseSize } from "@/lib/daily-text";
import { TimeGreeting } from "./time-greeting";
import "./daily-banner.css";

/**
 * Signed-in Home banner: today's scripture on a navy and gold card, with the member's greeting and round photo on a
 * frosted glass panel. The scripture comes from the daily-text data for the current Nairobi date; if a day has no
 * entry the card simply shows the greeting.
 */
export async function DailyBanner({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const t = await getTranslations("home");
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

        {verse && (
          <figure className="db-verse" data-size={verseSize(verse.text.length)}>
            <blockquote><p className="db-text">{verse.text}</p></blockquote>
            <figcaption className="db-ref">
              <span className="sr-only">{t("dailyTextTitle")}: </span>
              <cite>{verse.ref}</cite>
              <svg className="db-arrow" viewBox="0 0 74 60" aria-hidden="true" focusable="false">
                <path pathLength="1" d="M6 6 C 56 4, 66 30, 52 50 M52 50 L50 38 M52 50 L63 44" />
              </svg>
            </figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}
