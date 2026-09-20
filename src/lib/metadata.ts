import type { Metadata } from "next";
import { publicEnv } from "@/lib/env";

/** Canonical from SITE_URL and the route; hreflang alternates only when Kiswahili is enabled (PRD §20.2). */
export function pageMetadata(opts: { path: string; locale: "en" | "sw"; title: string; description: string; index?: boolean }): Metadata {
  const en = opts.path === "/" ? "/" : opts.path;
  const sw = opts.path === "/" ? "/sw" : `/sw${opts.path}`;
  const self = opts.locale === "sw" ? sw : en;
  return {
    title: opts.title,
    description: opts.description,
    alternates: {
      canonical: `${publicEnv.siteUrl}${self === "/" ? "" : self}`,
      ...(publicEnv.enableSw ? { languages: { en: `${publicEnv.siteUrl}${en === "/" ? "" : en}`, sw: `${publicEnv.siteUrl}${sw}`, "x-default": `${publicEnv.siteUrl}${en === "/" ? "" : en}` } } : {}),
    },
    openGraph: { title: opts.title, description: opts.description, locale: opts.locale === "sw" ? "sw_KE" : "en_KE", url: `${publicEnv.siteUrl}${self === "/" ? "" : self}` },
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description },
    ...(opts.index === false ? { robots: { index: false, follow: false } } : {}),
  };
}

export const PRIVATE_ROBOTS: Metadata["robots"] = { index: false, follow: false };
