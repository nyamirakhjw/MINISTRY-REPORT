import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Clock, XCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { PendingPhoto, ResubmitButton } from "@/components/auth/pending-actions";
import { Live } from "@/components/shell/live";
import { SignOutButton } from "@/components/shell/sign-out";
import { requireUser } from "@/lib/auth/session";
import { PRIVATE_ROBOTS } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pending");
  return { title: t("title"), robots: PRIVATE_ROBOTS };
}

/** Pending people can reach only this screen (AUTH-08). It advances by itself when an approver decides. */
export default async function Page() {
  const ctx = await requireUser("/pending");
  const m = ctx.member;
  if (!m) redirect("/signin");
  if (m.status === "active") redirect("/app");
  const t = await getTranslations("pending");
  const live = <Live channel={`member:${m.id}`} tables={[{ table: "members", filter: `id=eq.${m.id}` }]} />;

  if (m.status === "rejected") {
    return (
      <AuthShell title={t("rejectedTitle")}>
        {live}
        <div className="rounded-lg border border-border bg-surface p-5">
          <XCircle className="size-8 text-danger" aria-hidden="true" />
          <p className="mt-3">{t("rejectedBody")}</p>
          {m.rejection_note ? <p className="mt-2"><strong>{t("reason")}</strong> {m.rejection_note}</p> : null}
          <div className="mt-4 flex flex-wrap gap-3"><ResubmitButton /><SignOutButton variant="ghost" /></div>
        </div>
      </AuthShell>
    );
  }

  if (!m.avatar_path) {
    return (
      <AuthShell title={t("photoTitle")} lead={t("photoLead")}>
        {live}
        {m.photo_note ? <p role="status" className="mb-4 rounded-md border-2 border-warning p-3"><strong>{t("photoNote")}</strong> {m.photo_note}</p> : null}
        <PendingPhoto memberId={m.id} name={m.full_name} />
        <div className="mt-6"><SignOutButton variant="ghost" /></div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("title")}>
      {live}
      <div role="status" className="rounded-lg border border-border bg-surface p-5">
        <Clock className="size-8 text-primary" aria-hidden="true" />
        <p className="mt-3 text-lg">{t("waitingBody")}</p>
        <p className="mt-2 text-muted-foreground">{t("waitingNext")}</p>
        <div className="mt-4"><SignOutButton variant="secondary" /></div>
      </div>
    </AuthShell>
  );
}
