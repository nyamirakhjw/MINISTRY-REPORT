import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  // Disallow-all while on the temporary *.vercel.app address (R-04); real rules after the custom domain (gate G-3).
  if (!publicEnv.allowIndexing) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: ["/", "/sw", "/privacy", "/terms"], disallow: ["/app", "/admin", "/platform", "/pending", "/mfa", "/auth"] },
    sitemap: `${publicEnv.siteUrl}/sitemap.xml`,
  };
}
