import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ApproveDeletionButton } from "@/components/admin/deletion-dialogs";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";

interface Row { id: string; requested_at: string; effective_at: string; status: string; member: { id: string; full_name: string } | null }

/** DEL-02: Elder final approval, only once the 30-day grace period has actually elapsed (approve_deletion
 * enforces this again in the database). DEL-01's self-service request/cancel lives in /app/settings/data. */
export default async function Page() {
  await requireRole("elder", "/admin/deletions");
  const t = await getTranslations("admin");
  const locale = await getLocale();
  const supabase = await createClient();
  const { data } = await supabase.from("deletion_requests")
    .select("id, requested_at, effective_at, status, member:members!deletion_requests_member_id_fkey(id, full_name)")
    .eq("status", "pending").order("effective_at");
  const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.member);
  const now = Date.now();

  return (
    <div className="flex flex-col gap-4">
      <h1>{t("deletionsTitle")}</h1>
      {rows.length === 0 ? <p className="rounded-lg border border-border bg-surface p-5">{t("noDeletions")}</p> : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => {
            const ready = new Date(r.effective_at).getTime() <= now;
            return (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4">
                <div>
                  <p className="font-semibold">{r.member!.full_name}</p>
                  <p className="text-sm text-muted-foreground">{t("requested")}: {formatDateTime(r.requested_at, locale)}</p>
                  <p className="text-sm text-muted-foreground">{t("graceEnds")}: {formatDateTime(r.effective_at, locale)}</p>
                </div>
                {ready ? <ApproveDeletionButton id={r.id} name={r.member!.full_name} /> : <Badge tone="warning">{t("inGracePeriod")}</Badge>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
