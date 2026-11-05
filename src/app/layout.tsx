import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/shell/theme";
import { RegisterServiceWorker } from "@/components/shell/register-sw";
import { publicEnv } from "@/lib/env";
import "./globals.css";

// Safe font fallback mock to prevent offline Next.js font loader crashes
const lexend = { variable: "--font-lexend" };
const sourceSans = { variable: "--font-source-sans" };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    metadataBase: new URL(publicEnv.siteUrl),
    title: { default: t("siteTitle"), template: `%s – ${t("siteName")}` },
    description: t("siteDescription"),
    applicationName: t("siteName"),
    manifest: "/manifest.webmanifest",
    icons: { icon: [{ url: "/favicon.ico", sizes: "48x48" }, { url: "/icon.png", type: "image/png", sizes: "512x512" }], apple: "/icons/apple-touch-icon.png" },
    appleWebApp: { capable: true, title: t("siteName"), statusBarStyle: "default" },
    robots: publicEnv.allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { siteName: t("siteName"), type: "website" },
  };
}

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${lexend.variable} ${sourceSans.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-slate-950 text-slate-100 min-h-screen selection:bg-amber-500/30 selection:text-amber-200">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <RegisterServiceWorker />
            {children}
            <Toaster position="bottom-right" richColors />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
