import { getLocale, getTranslations } from "next-intl/server";
import { DailyBannerView } from "@/components/home/daily-banner-view";
import { dayPart, formatLongDate, nairobiNow } from "@/lib/nairobi";

// A made-up member and a short sample scripture. The section says "Sample", so nothing here can be mistaken for real data.
const SAMPLE_NAME = "Grace Wanjiku Otieno";
const SAMPLE_VERSE = { text: "Be strong and take action.", ref: "Ezra 10:4" };

/** The new Home banner, shown on the public page as a labelled sample (same component as the signed-in Home). */
export async function HomePreview() {
  const [t, h, locale] = await Promise.all([getTranslations("landing"), getTranslations("home"), getLocale()]);
  const now = nairobiNow();
  return (
    <section aria-labelledby="home-title" className="lp-section">
      <div className="lp-wrap">
        <div className="lp-reveal">
          <h2 id="home-title" className="lp-h2">{t("homeTitle")}</h2>
          <p className="lp-muted mt-3 max-w-xl text-lg">{t("homeLead")}</p>
          <p className="lp-pill mt-4">{t("sampleLabel")}</p>
        </div>
        <div className="mt-6 lp-reveal">
          <DailyBannerView
            name={SAMPLE_NAME}
            initialPart={dayPart(now.hour)}
            dateISO={now.date}
            dateLabel={formatLongDate(now.date, locale)}
            verse={SAMPLE_VERSE}
            headingId="home-sample-greeting"
            headingAs="p"
            text={{
              greetings: { morning: h("greetMorning"), afternoon: h("greetAfternoon"), evening: h("greetEvening") },
              photoAlt: h("photoAlt", { name: SAMPLE_NAME }),
              dailyTextTitle: h("dailyTextTitle"),
            }}
          />
        </div>
      </div>
    </section>
  );
}
