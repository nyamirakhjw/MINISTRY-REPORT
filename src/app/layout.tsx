import type { Metadata, Viewport } from "next";
import { Lexend, Source_Sans_3 } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/shell/theme";
import { RegisterServiceWorker } from "@/components/shell/register-sw";
import { publicEnv } from "@/lib/env";
import "./globals.css";

// Self-hosted at build time by next/font: no runtime request to a font server.
const lexend = Lexend({ subsets: ["latin"], weight: ["600"], variable: "--font-lexend", display: "swap" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-source-sans", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    metadataBase: new URL(publicEnv.siteUrl),
    title: { default: t("siteTitle"), template: `%s – ${t("siteName")}` },
    description: t("siteDescription"),
    applicationName: t("siteName"),
    manifest: "/manifest.webmanifest",
    icons: { icon: [{ url: "/favicon.ico", sizes: "48x48" }, { url: "/icon.svg", type: "image/svg+xml" }], apple: "/icons/apple-touch-icon.png" },
    appleWebApp: { capable: true, title: t("siteName"), statusBarStyle: "default" },
    robots: publicEnv.allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { siteName: t("siteName"), type: "website" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#F7F9FC" }, { media: "(prefers-color-scheme: dark)", color: "#0B1220" }],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const t = await getTranslations("common");
  return (
    <html lang={locale} suppressHydrationWarning className={`${lexend.variable} ${sourceSans.variable}`}>
      <body className="min-h-dvh antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground">{t("skipToContent")}</a>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            {children}
            <Toaster position="top-center" closeButton />
            <RegisterServiceWorker />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
