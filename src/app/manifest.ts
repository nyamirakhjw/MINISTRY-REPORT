import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ministry Report",
    short_name: "Ministry",
    description: "Monthly ministry report for the Nyamira congregation.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    // "portrait" alone is the natural orientation and covers BOTH portrait-primary and portrait-secondary
    // (upside-down), so some devices were free to flip 180° on their own even with device rotation locked.
    // Pinning to portrait-primary stops that.
    orientation: "portrait-primary",
    background_color: "#F7F9FC",
    theme_color: "#0B2E6B",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
