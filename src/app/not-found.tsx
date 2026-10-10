import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-4">
      <h1>{t("title")}</h1>
      <p className="text-lg text-muted-foreground">{t("body")}</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/" className={buttonVariants()}>{t("home")}</Link>
        <Link href="/signin" className={buttonVariants({ variant: "secondary" })}>{t("signIn")}</Link>
      </div>
    </main>
  );
}
