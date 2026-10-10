"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { approveDeletionAction } from "@/lib/actions/deletion";

export function ApproveDeletionButton({ id, name }: { id: string; name: string }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function confirm() {
    setBusy(true);
    const res = await approveDeletionAction(id);
    setBusy(false);
    if (res.ok) { toast.success(t("deletionApproved")); setOpen(false); router.refresh(); }
    else toast.error(t(`error_${res.code}` as "error_unknown"));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="danger">{t("approveDeletion")}</Button></DialogTrigger>
      <DialogContent title={t("approveDeletionTitle")} description={t("approveDeletionDescription", { name })} closeLabel={t("close")}>
        <p className="mb-4 text-sm text-muted-foreground">{t("approveDeletionWarning")}</p>
        <Button variant="danger" onClick={confirm} disabled={busy}>{busy ? t("processing") : t("approveDeletion")}</Button>
      </DialogContent>
    </Dialog>
  );
}
