import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { HALL } from "@/components/hall/hall-photos";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import "@/components/hall/hall.css";

type Meeting = { label: string; day?: string; time?: string };

/** "Our Kingdom Hall": the garden photo carries the real meeting times and address on frosted glass; the interior follows. */
export async function HallShowcase({ meetings, address, mapUrl }: { meetings: Meeting[]; address: string[]; mapUrl?: string | null }) {
  const t = await getTranslations("landing");
  const hasFacts = meetings.length > 0 || address.length > 0;
  return (
    <section aria-labelledby="hall-title" className="hs lp-divider-top">
      <div className="lp-wrap lp-section">
        <h2 id="hall-title" className="lp-h2 lp-reveal mb-5">{t("hallTitle")}</h2>

        <figure className="hs-fig hs-main lp-reveal">
          <div className="hs-frame">
            <Image src={HALL.garden} alt={t("photoGardenAlt")} fill sizes="(min-width: 1024px) 1008px, 100vw" placeholder="blur" quality={75} className="hs-img" />
          </div>
          {hasFacts ? (
            <figcaption className="hs-panel glass">
              {meetings.length > 0 && (
                <>
                  <h3 className="hs-h">{t("meetings")}</h3>
                  <dl className="mt-2 space-y-1.5">
                    {meetings.map((m) => (
                      <div key={m.label} className="flex gap-3"><dt className="w-24 shrink-0 font-semibold">{m.label}</dt><dd>{m.day}, {m.time}</dd></div>
                    ))}
                  </dl>
                </>
              )}
              {address.length > 0 && (
                <div className={meetings.length > 0 ? "hs-sep" : undefined}>
                  <h3 className="hs-h">{t("hall")}</h3>
                  <address className="mt-2 not-italic">{address.map((a) => <div key={a}>{a}</div>)}</address>
                  {mapUrl ? (
                    <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "link" }), "mt-1 inline-flex min-h-11 items-center px-0")}>{t("map")}</a>
                  ) : null}
                </div>
              )}
            </figcaption>
          ) : null}
        </figure>

        <figure className="hs-fig hs-second lp-reveal">
          <div className="hs-frame">
            <Image src={HALL.inside} alt={t("photoInsideAlt")} fill sizes="(min-width: 1024px) 1008px, 100vw" placeholder="blur" quality={75} className="hs-img" />
          </div>
          <figcaption className="hs-cap">{t("photoInsideCaption")}</figcaption>
        </figure>
      </div>
    </section>
  );
}
