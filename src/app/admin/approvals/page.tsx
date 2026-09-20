import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ApproveDialog, DecideDialog, ReasonDialog } from "@/components/admin/approval-dialogs";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/session";
import { signedAvatarUrls } from "@/lib/auth/avatars";
import { getGroups } from "@/lib/admin-data";
import { monthOf } from "@/lib/domain/time";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("approvals") };
}

interface Pending { id: string; full_name: string; username: string; email: string; phone: string; group_id: string | null; group_name: string | null; avatar_path: string | null; created_at: string; requested_kind: string | null; requested_aux_goal: number | null }
interface Change { id: string; kind: string; new_value: string; created_at: string; members: { full_name: string; username: string | null } | null }

export default async function Page() {
  const { member } = await requireRole("ministerial_servant", "/admin/approvals");
  const t = await getTranslations("admin");
  const cat = await getTranslations("categories");
  const locale = await getLocale();
  const supabase = await createClient();
  const elder = member.role === "elder";
  const [{ data }, groups, changes] = await Promise.all([
    supabase.rpc("admin_pending_requests"),
    getGroups(),
    elder ? supabase.from("profile_change_requests").select("id, kind, new_value, created_at, members!profile_change_requests_member_id_fkey(full_name, username)").eq("status", "pending").order("created_at") : Promise.resolve({ data: [] }),
  ]);
  const pending = (data ?? []) as Pending[];
  const avatars = await signedAvatarUrls(pending.map((p) => p.avatar_path));
  const change = (changes.data ?? []) as unknown as Change[];
  return (
    <div className="flex flex-col gap-8">
      <h1>{t("approvalsTitle")}</h1>
      <section aria-labelledby="req">
        <h2 id="req" className="mb-3">{t("accessRequests")}</h2>
        {pending.length === 0 ? <p className="rounded-lg border border-border bg-surface p-5">{t("noRequests")}</p> : (
          <ul className="flex flex-col gap-4">
            {pending.map((p) => (
              <li key={p.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-start gap-4">
                  <Avatar name={p.full_name} src={p.avatar_path ? avatars[p.avatar_path] : null} size={88} alt={t("photoOf", { name: p.full_name })} />
                  <div className="min-w-0">
                    <h3 className="text-xl">{p.full_name}</h3>
                    <p className="text-muted-foreground">@{p.username} · {p.group_name}</p>
                    <p className="break-all">{p.email}</p><p className="tabular">{p.phone}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{t("waited", { time: formatDateTime(p.created_at, locale) })}
                      {p.requested_kind && <Badge tone="gold">{t("requestedArrangement", { kind: cat(p.requested_kind as "regular_pioneer") })}</Badge>}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ApproveDialog id={p.id} fullName={p.full_name} groupId={p.group_id} groups={groups} defaultMonth={monthOf(new Date(p.created_at))} />
                  <ReasonDialog id={p.id} name={p.full_name} mode="photo" />
                  <ReasonDialog id={p.id} name={p.full_name} mode="reject" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      {elder && (
        <section aria-labelledby="chg">
          <h2 id="chg" className="mb-3">{t("changeRequests")}</h2>
          {change.length === 0 ? <p className="rounded-lg border border-border bg-surface p-5">{t("noChanges")}</p> : (
            <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
              {change.map((c) => (
                <li key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p>{t(c.kind === "username" ? "changeUsername" : "changeName", { name: c.members?.full_name ?? "", value: c.new_value })}</p>
                  <DecideDialog id={c.id} name={c.members?.full_name ?? ""} kind="change" />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
