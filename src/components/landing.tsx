import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { BrandWave } from "@/components/brand/emblem";
import { buttonVariants } from "@/components/ui/button";
import { InstallCard } from "@/components/shell/install-card";
import { PublicFooter, PublicHeader } from "@/components/shell/public-chrome";
import { getPublicCongregation } from "@/lib/congregation";
import { publicEnv } from "@/lib/env";
import { cn } from "@/lib/utils";

/** Landing (PRD §8.2): short, real content only. No stock photos, invented statistics or carousels. */
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
      ...(meetings.length ? { description: meetings.map((x) => `${x.label}: ${x.m?.day} ${x.m?.time}`).join("; ") } : {}),
    }] : []),
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader path="/" />
      <main id="main" className="flex-1">
        <section className="mx-auto max-w-5xl px-4 pb-8 pt-10 md:pt-16">
          <h1 className="max-w-2xl text-3xl md:text-5xl">{t("headline")}</h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">{t("lead")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signin" className={buttonVariants({ variant: "primary" })}>{t("signIn")}</Link>
            <Link href="/request-access" className={buttonVariants({ variant: "secondary" })}>{t("requestAccess")}</Link>
          </div>
          <p className="mt-8 font-heading text-lg text-accent-text">{cong?.tagline ?? t("tagline")}</p>
        </section>
        <BrandWave />
        {(meetings.length > 0 || address.length > 0) && (
          <section aria-labelledby="meetings-title" className="border-b border-border bg-surface">
            <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-2">
              {meetings.length > 0 && (
                <div>
                  <h2 id="meetings-title" className="text-xl">{t("meetings")}</h2>
                  <dl className="mt-3 space-y-2">
                    {meetings.map((x) => (
                      <div key={x.label} className="flex gap-3"><dt className="w-24 font-semibold">{x.label}</dt><dd>{x.m?.day}, {x.m?.time}</dd></div>
                    ))}
                  </dl>
                </div>
              )}
              {address.length > 0 && (
                <div>
                  <h2 className="text-xl">{t("hall")}</h2>
                  <address className="mt-3 not-italic">{address.map((a) => <div key={a}>{a}</div>)}</address>
                  {l.map_url ? <a href={l.map_url} rel="noopener noreferrer" target="_blank" className={cn(buttonVariants({ variant: "link" }), "mt-2 inline-flex min-h-11 items-center")}>{t("map")}</a> : null}
                </div>
              )}
            </div>
          </section>
        )}
        <section className="mx-auto max-w-5xl px-4 py-8"><InstallCard /></section>
      </main>
      <PublicFooter prefix={prefix} />
      {jsonLd.map((d, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, "\\u003c") }} />)}
    </div>
  );
}
