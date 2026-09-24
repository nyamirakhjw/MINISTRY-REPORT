import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ApproveReopenDialog, DeclineCorrectionDialog, EditDirectlyDialog } from "@/components/admin/correction-dialogs";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/session";
import { signedAvatarUrls } from "@/lib/auth/avatars";
import { formatDateTime, formatMonth } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/domain/categories";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("corrections") };
}

interface Row {
  id: string; what_is_wrong: string[]; reason: string; created_at: string;
  reports: { id: string; month: string; category: Category; participated: boolean | null; hours: number | null; studies: number | null; comment: string | null;
             members: { id: string; full_name: string; avatar_path: string | null } | null } | null;
}

export default async function Page() {
  await requireRole("elder", "/admin/corrections");
  const t = await getTranslations("admin");
  const cat = await getTranslations("categories");
  const hist = await getTranslations("history");
  const locale = await getLocale();
  const supabase = await createClient();
  const { data } = await supabase.from("report_corrections")
    .select("id, what_is_wrong, reason, created_at, reports!report_corrections_report_id_fkey(id, month, category, participated, hours, studies, comment, members!reports_member_id_fkey(id, full_name, avatar_path))")
    .eq("status", "pending").order("created_at");
  const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.reports?.members);
  const avatars = await signedAvatarUrls(rows.map((r) => r.reports?.members?.avatar_path));

  return (
    <div className="flex flex-col gap-4">
      <h1>{t("correctionsTitle")}</h1>
      {rows.length === 0 ? <p className="rounded-lg border border-border bg-surface p-5">{t("noCorrections")}</p> : (
        <ul className="flex flex-col gap-4">
          {rows.map((r) => {
            const m = r.reports!.members!;
            const rep = r.reports!;
            return (
              <li key={r.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={m.full_name} src={m.avatar_path ? avatars[m.avatar_path] : null} size={48} alt={t("photoOf", { name: m.full_name })} />
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold">{m.full_name} <span className="font-normal text-muted-foreground">· {formatMonth(rep.month, locale)}</span></p>
                    <p className="mt-1 flex flex-wrap gap-1">{r.what_is_wrong.map((k) => <Badge key={k} tone="gold">{hist(`kind_${k}` as "kind_hours")}</Badge>)}</p>
                    <p className="mt-2">{r.reason}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t("waited", { time: formatDateTime(r.created_at, locale) })}</p>
                    <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                      <div className="flex gap-1"><dt>{t("category")}:</dt><dd className="font-semibold text-foreground">{cat(rep.category)}</dd></div>
                      {rep.category === "publisher"
                        ? <div className="flex gap-1"><dt>{t("participated")}:</dt><dd className="font-semibold text-foreground">{rep.participated ? "Yes" : "No"}</dd></div>
                        : <div className="flex gap-1"><dt>{t("hours")}:</dt><dd className="font-semibold text-foreground">{rep.hours}</dd></div>}
                      <div className="flex gap-1"><dt>{t("studies")}:</dt><dd className="font-semibold text-foreground">{rep.studies}</dd></div>
                    </dl>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ApproveReopenDialog id={r.id} name={m.full_name} />
                  <EditDirectlyDialog correctionId={r.id} name={m.full_name} current={{ category: rep.category, participated: rep.participated, hours: rep.hours, studies: rep.studies, comment: rep.comment }} />
                  <DeclineCorrectionDialog id={r.id} name={m.full_name} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
