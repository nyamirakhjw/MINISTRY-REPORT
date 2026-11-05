import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HALL } from "@/components/hall/hall-photos";
import { buttonVariants } from "@/components/ui/button";
import "@/components/hall/hall.css";

/**
 * Landing face: the hall photo (the brick hall seen over its hedge) fills the first screen, with the headline and the two actions on a frosted
 * glass panel. As the person scrolls, the sharp photo fades through a soft copy into the page background while the
 * rest of the page slides up over it. Without scroll-linked animation support the photo simply stays and gets covered.
 */
export async function HeroFace({ tagline }: { tagline: string }) {
  const t = await getTranslations("landing");
  return (
    <section className="hf" aria-labelledby="hero-title">
      <div className="hf-stage">
        <div className="hf-layer hf-photo">
          <Image src={HALL.garden} alt={t("photoGardenAlt")} fill priority fetchPriority="high" sizes="(min-width: 1448px) 1448px, 100vw" placeholder="blur" quality={90} className="hf-img" />
        </div>
        <div className="hf-layer hf-soft" aria-hidden="true">
          <Image src={HALL.gardenSoft} alt="" fill unoptimized sizes="100vw" className="hf-img" />
        </div>
        <div className="hf-layer hf-veil" aria-hidden="true" />
        <div className="hf-panel glass">
          <h1 id="hero-title" className="lp-h1">{t("headline")}</h1>
          <p className="lp-lead mt-3">{t("lead")}</p>
          <div className="lp-cta">
            <Link href="/signin" className={buttonVariants({ variant: "primary" })}>{t("signIn")}</Link>
            <Link href="/request-access" className={buttonVariants({ variant: "secondary" })}>{t("requestAccess")}</Link>
          </div>
          <p className="lp-tagline">{tagline}</p>
        </div>
      </div>
    </section>
  );
}
