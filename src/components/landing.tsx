import { getLocale, getTranslations } from "next-intl/server";
import { HeroFace } from "@/components/landing/hero-face";
import { HallShowcase } from "@/components/landing/hall-showcase";
import { HomePreview } from "@/components/landing/home-preview";
import { PrivateByDesign } from "@/components/landing/private-by-design";
import { RevealObserver } from "@/components/landing/reveal-observer";
import { RibbonDemo } from "@/components/landing/ribbon-demo";
import { Steps } from "@/components/landing/steps";
import "@/components/landing/landing.css";
import { InstallCard } from "@/components/shell/install-card";
import { PublicFooter, PublicHeader } from "@/components/shell/public-chrome";
import { getPublicCongregation } from "@/lib/congregation";
import { publicEnv } from "@/lib/env";

/**
 * Landing (PRD v1.1 §4, "The Open Door"): short, real content only. No stock photos, invented statistics or carousels.
 * A server component: only the ribbon demo, the reveal fallback, the theme toggle and the install card ship JavaScript.
 */
export async function Landing() {
  const t = await getTranslations("landing");
  const locale = await getLocale();
  const cong = await getPublicCongregation();
  const prefix = locale === "sw" ? "/sw" : "";
  const l = cong?.landing ?? {};
  const address = l.address_lines?.filter(Boolean) ?? [];
  const meetings = [
    { label: t("midweek"), m: l.midweek },
    { label: t("weekend"), m: l.weekend },
  ].filter((x) => x.m?.day && x.m?.time);
  const name = cong?.name ?? t("fallbackName");

  const jsonLd = [
    { "@context": "https://schema.org", "@type": "Organization", name, url: publicEnv.siteUrl },
    { "@context": "https://schema.org", "@type": "WebSite", name: t("siteName"), url: publicEnv.siteUrl, inLanguage: locale },
    ...(address.length > 0 ? [{
      "@context": "https://schema.org", "@type": "PlaceOfWorship", name,
      address: { "@type": "PostalAddress", streetAddress: address.join(", "), addressCountry: "KE" },
      image: `${publicEnv.siteUrl}/hall/share.jpg`,
      ...(meetings.length ? { description: meetings.map((x) => `${x.label}: ${x.m?.day} ${x.m?.time}`).join("; ") } : {}),
    }] : []),
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader path="/" scrollEdge />
      <main id="main" className="flex-1">
        <HeroFace tagline={cong?.tagline ?? t("tagline")} />

        <div className="hf-after">

        <HomePreview />

        <section aria-labelledby="demo-title" className="lp-band lp-section">
          <div className="lp-wrap lp-band-grid">
            <div className="lp-reveal">
              <h2 id="demo-title" className="lp-h2">{t("demoTitle")}</h2>
              <p className="lp-muted mt-3 max-w-md text-lg">{t("demoLead")}</p>
              <p className="lp-pill mt-5">{t("demoSample")}</p>
            </div>
            <div className="lp-reveal"><RibbonDemo /></div>
          </div>
        </section>

        <Steps />
        <PrivateByDesign />

        <HallShowcase
          meetings={meetings.map((x) => ({ label: x.label, day: x.m?.day, time: x.m?.time }))}
          address={address}
          mapUrl={l.map_url}
        />

        <section className="lp-wrap py-8 lp-reveal"><InstallCard /></section>
        </div>
      </main>
      <PublicFooter prefix={prefix} />
      <RevealObserver />
      {jsonLd.map((d, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, "\\u003c") }} />)}
    </div>
  );
}
