import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { resolveLocale } from "./config";

export default getRequestConfig(async () => {
  const h = await headers();
  const fromPath = h.get("x-locale");
  const fromCookie = (await cookies()).get("locale")?.value;
  const locale = resolveLocale(fromPath ?? fromCookie);
  return {
    locale,
    timeZone: "Africa/Nairobi",
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
