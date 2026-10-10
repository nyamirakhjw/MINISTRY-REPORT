// NEXT_PUBLIC_* values must be referenced statically so they are inlined into the browser bundle.
export const publicEnv = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  allowIndexing: process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true",
  enableSw: process.env.NEXT_PUBLIC_ENABLE_SW === "true",
  defaultCongregation: process.env.NEXT_PUBLIC_DEFAULT_CONGREGATION ?? "nyamira",
};

export const PRIVACY_VERSION = "2026-09-19";
export const TERMS_VERSION = "2026-09-19";
