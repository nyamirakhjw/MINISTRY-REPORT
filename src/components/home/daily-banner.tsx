'use client';
import { useState, useEffect } from 'react';
import { getLocale, getTranslations } from "next-intl/server";
import { Avatar } from "@/components/ui/avatar";
import { dailyTextFor, dayPart, nairobiNow, verseSize } from "@/lib/daily-text";
import { TimeGreeting } from "./time-greeting";
import { TodayDate } from "./today-date";
import "./daily-banner.css";

/**
 * Signed-in Home banner: today's date and scripture on a navy and gold card, a gold arrow pointing from the scripture
 * to the Bible, and the member's greeting and round photo on a frosted glass panel that rests over the Bible's lower edge. The scripture comes from the daily-text data for the current Nairobi date; if a day has no
 * entry the card simply shows the greeting.
 */
export async function DailyBanner({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const t = useTranslations("home");
  const locale = await getLocale();
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

        <TodayDate initial={now.date} locale={locale} label={t("todayDate")} />

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
            </figcaption>
          </figure>
        )}

        {/* Decorative: the arrow leaves the scripture reference and lands on the Bible. The Bible has its own alt text. */}
        {verse && (
          <div className="db-stage">
            <svg className="db-arrow" viewBox="0 0 150 80" aria-hidden="true" focusable="false">
              <path pathLength="1" d="M6 8 C 58 2, 70 46, 40 40 C 22 36, 30 14, 52 24 C 80 38, 100 52, 122 56" />
              <path className="db-arrow-head" pathLength="1" d="M107 45 L124 57 L105 66" />
            </svg>
            {/* eslint-disable-next-line @next/next/no-img-element -- a fixed local cut-out (public/brand), already optimised WebP */}
            <img className="db-bible" src="/brand/bible.webp" width={352} height={520} alt={t("bibleAlt")} decoding="async" />
          </div>
        )}
      </div>
    </section>
  );
}

