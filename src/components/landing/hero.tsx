import * as React from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BrandWave, Emblem } from "@/components/brand/emblem";
import { buttonVariants } from "@/components/ui/button";

const delay = (n: number) => ({ "--i": n }) as React.CSSProperties;

/**
 * Hero (PRD v1.1 §4, LM-01 and LM-02). The gold door of light opens once behind the logo mark; the text staggers in.
 * All motion is CSS, so nothing here waits for JavaScript. The headline is the only element with no fade, so it paints at once.
 */
export async function Hero({ tagline }: { tagline: string }) {
  const t = await getTranslations("landing");
  return (
    <section className="lp-hero" aria-labelledby="hero-title">
      <div className="lp-wrap lp-hero-grid">
        <div>
          <h1 id="hero-title" className="lp-h1">{t("headline")}</h1>
          <p className="lp-lead lp-enter" style={delay(0)}>{t("lead")}</p>
          <div className="lp-cta lp-enter" style={delay(1)}>
            <Link href="/signin" className={buttonVariants({ variant: "primary" })}>{t("signIn")}</Link>
            <Link href="/request-access" className={buttonVariants({ variant: "secondary" })}>{t("requestAccess")}</Link>
          </div>
          <p className="lp-tagline lp-enter" style={delay(2)}>{tagline}</p>
        </div>
        <div className="lp-stage">
          <span className="lp-door" aria-hidden="true" />
          <span className="lp-threshold" aria-hidden="true" />
          <span className="lp-plate">
            <Emblem size="large" priority title={t("markAlt")} className="lp-mark" />
          </span>
        </div>
      </div>
      <BrandWave animated />
    </section>
  );
}
