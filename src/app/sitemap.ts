import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

/** Only the public pages and their language alternates. */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/privacy", "/terms"];
  return paths.map((p) => ({
    url: `${publicEnv.siteUrl}${p}`,
    changeFrequency: "monthly" as const,
    ...(publicEnv.enableSw ? { alternates: { languages: { en: `${publicEnv.siteUrl}${p}`, sw: `${publicEnv.siteUrl}/sw${p}` } } } : {}),
  }));
}
