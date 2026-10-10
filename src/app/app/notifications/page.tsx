import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NotificationList } from "@/components/shell/notification-list";
import { requireMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { NotificationRow } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notifications");
  return { title: t("title") };
}

export default async function Page() {
  await requireMember("/app/notifications");
  const t = await getTranslations("notifications");
  const supabase = await createClient();
  const { data } = await supabase.from("notifications").select("id, kind, payload, created_at, read_at").order("created_at", { ascending: false }).limit(50);
  const items = (data ?? []) as NotificationRow[];
  return (
    <div className="flex flex-col gap-4">
      <h1>{t("title")}</h1>
      {items.length === 0 ? <p className="rounded-lg border border-border bg-surface p-5">{t("empty")}</p> : <NotificationList items={items} />}
    </div>
  );
}
