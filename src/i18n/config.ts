import { publicEnv } from "@/lib/env";

export const locales = ["en", "sw"] as const;
export type AppLocale = (typeof locales)[number];

/** Kiswahili stays hidden until every string is approved (gate G-6). */
export function resolveLocale(candidate: string | undefined | null): AppLocale {
  return candidate === "sw" && publicEnv.enableSw ? "sw" : "en";
}
