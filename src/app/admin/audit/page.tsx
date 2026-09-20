import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuditTable, type AuditEntry } from "@/components/admin/audit-table";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("audit") };
}

export default async function Page() {
  await requireRole("elder", "/admin/audit");
  const t = await getTranslations("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("audit_log").select("id, at, actor_member_id, action, entity_type, reason, before, after").order("at", { ascending: false }).limit(300);
  const ids = [...new Set((data ?? []).map((r) => r.actor_member_id).filter(Boolean))] as string[];
  const { data: people } = ids.length ? await supabase.from("members").select("id, full_name").in("id", ids) : { data: [] };
  const names = new Map((people ?? []).map((p) => [p.id, p.full_name as string]));
  const entries: AuditEntry[] = (data ?? []).map((r) => ({ id: r.id, at: r.at, actor: r.actor_member_id ? (names.get(r.actor_member_id) ?? null) : null, action: r.action, entity_type: r.entity_type, reason: r.reason, before: r.before, after: r.after }));
  return (<div className="flex flex-col gap-4"><h1>{t("auditTitle")}</h1><p className="text-muted-foreground">{t("auditIntro")}</p><AuditTable entries={entries} /></div>);
}
