"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { requestDeletionAction, cancelDeletionAction } from "@/lib/actions/deletion";

interface DeletionRow { id: string; status: string; requested_at: string; effective_at: string }

/** DEL-01: request deletion (30-day grace, cancellable). Final approval is an Elder action (§7.13, /admin/deletions). */
export function DataControlsClient({ deletion }: { memberName: string; deletion: DeletionRow | null }) {
  const t = useTranslations("settings");
  const router = useRouter();
  const locale = useLocale();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function request() {
    setBusy(true);
    const res = await requestDeletionAction();
    setBusy(false);
    if (res.ok) { toast.success(t("deletionRequested")); setOpen(false); router.refresh(); }
    else toast.error(t("deletionFailed"));
  }
  async function cancel() {
    setBusy(true);
    const res = await cancelDeletionAction();
    setBusy(false);
    if (res.ok) { toast.success(t("deletionCancelled")); router.refresh(); }
    else toast.error(t("deletionFailed"));
  }

  return (
    <section className="rounded-lg border border-danger p-5">
      <h2 className="text-lg font-semibold">{t("deleteAccount")}</h2>
      {deletion ? (
        <div className="mt-2 flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            {t("deletionPending", { date: formatDateTime(deletion.effective_at, locale) })}
          </p>
          {deletion.status === "pending" && <Button variant="secondary" onClick={cancel} disabled={busy}>{busy ? t("processing") : t("cancelDeletion")}</Button>}
        </div>
      ) : (
        <>
          <p className="mt-1 text-muted-foreground">{t("deleteAccountHint")}</p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="danger" className="mt-3">{t("requestDeletion")}</Button></DialogTrigger>
            <DialogContent title={t("requestDeletionTitle")} description={t("requestDeletionDescription")} closeLabel={t("close")}>
              <p className="mb-4 text-sm text-muted-foreground">{t("requestDeletionWarning")}</p>
              <Button variant="danger" onClick={request} disabled={busy}>{busy ? t("processing") : t("requestDeletion")}</Button>
            </DialogContent>
          </Dialog>
        </>
      )}
    </section>
  );
}
