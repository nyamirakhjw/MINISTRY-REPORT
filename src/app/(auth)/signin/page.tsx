import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getContext } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signIn");
  return pageMetadata({ path: "/signin", locale: "en", title: t("title"), description: t("description"), index: false });
}
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getContext()) redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/app");
  const t = await getTranslations("signIn");
  return <AuthShell title={t("title")} lead={t("lead")}><SignInForm next={next} /></AuthShell>;
}
