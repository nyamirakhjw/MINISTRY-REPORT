import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PlatformPanel } from "@/components/admin/platform-panel";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { PRIVATE_ROBOTS } from "@/lib/metadata";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("platform");
  return { title: t("title"), robots: PRIVATE_ROBOTS };
}

interface Overview { id: string; slug: string; name: string; active_members: number; pending_members: number; elders: number }

export default async function Page() {
  await requirePlatformAdmin();
  const t = await getTranslations("platform");
  const supabase = await createClient();
  const { data } = await supabase.rpc("platform_overview");
  const list = (data ?? []) as Overview[];
  return (
    <main id="main" className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1>{t("title")}</h1><Link href="/app" className="inline-flex min-h-11 items-center underline underline-offset-4">{t("backToApp")}</Link></div>
      <section aria-labelledby="cong-list"><h2 id="cong-list" className="mb-3">{t("congregations")}</h2>
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {list.map((c) => (<li key={c.id} className="p-4"><p className="text-lg font-semibold">{c.name}</p><p className="text-muted-foreground tabular">/{c.slug} · {t("counts", { active: c.active_members, pending: c.pending_members, elders: c.elders })}</p></li>))}
        </ul>
      </section>
      <PlatformPanel congregations={list.map((c) => ({ id: c.id, slug: c.slug, name: c.name }))} />
    </main>
  );
}
