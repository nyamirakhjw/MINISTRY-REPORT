import Image from "next/image";
import { CalendarDays } from "lucide-react";
import { HALL } from "@/components/hall/hall-photos";
import { Avatar } from "@/components/ui/avatar";
import { verseSize } from "@/lib/daily-text";
import type { DayPart } from "@/lib/nairobi";
import { TimeGreeting } from "./time-greeting";
import "./daily-banner.css";

export type BannerText = {
  greetings: Record<DayPart, string>;
  photoAlt: string;
  dailyTextTitle: string;
};

/**
 * The navy and gold banner itself: date, scripture, the Bible the gold arrow points to, and the frosted glass greeting.
 * Presentational only, so the signed-in Home and the landing page's labelled sample draw exactly the same card.
 */
export function DailyBannerView({
  name, avatarUrl, initialPart, dateISO, dateLabel, verse, text, headingId = "db-greeting", headingAs = "h1",
}: {
  name: string;
  avatarUrl?: string;
  initialPart: DayPart;
  dateISO: string;
  dateLabel: string;
  verse: { text: string; ref: string } | null;
  text: BannerText;
  headingId?: string;
  headingAs?: "h1" | "p";
}) {
  return (
    <section className="db" aria-labelledby={headingId}>
      <div className="db-card" data-has-verse={verse ? "" : undefined}>
        <span className="db-deco db-ring-a" aria-hidden="true" />
        <span className="db-deco db-ring-b" aria-hidden="true" />
        <span className="db-deco db-stripe" aria-hidden="true" />
        <span className="db-deco db-orb-a" aria-hidden="true" />
        <span className="db-deco db-orb-b" aria-hidden="true" />

        <div className="db-glass">
          <TimeGreeting name={name} initial={initialPart} labels={text.greetings} id={headingId} as={headingAs} />
          <span className="db-avatar">
            <Avatar name={name} src={avatarUrl} size={56} alt={text.photoAlt} />
          </span>
        </div>

        <time className="db-date" dateTime={dateISO}>
          <CalendarDays className="db-date-icon" aria-hidden="true" />
          {dateLabel}
        </time>

        {verse && (
          <figure className="db-verse" data-size={verseSize(verse.text.length)}>
            <blockquote><p className="db-text">{verse.text}</p></blockquote>
            <figcaption className="db-ref">
              <span className="sr-only">{text.dailyTextTitle}: </span>
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
