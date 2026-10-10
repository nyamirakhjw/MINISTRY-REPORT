"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** EXP-04: the Elder chooses a passphrase at export time; the archive uses AES-256 and is never stored
 * server-side — it streams straight back as a download. §16.6 mandatory-monthly note is in the page copy. */
export function BackupDialog() {
  const t = useTranslations("exports");
  const [open, setOpen] = React.useState(false);
  const [passphrase, setPassphrase] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function download() {
    if (passphrase.length < 12) { toast.error(t("passphraseTooShort")); return; }
    if (passphrase !== confirm) { toast.error(t("passphraseMismatch")); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/exports/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passphrase }) });
      if (!res.ok) { toast.error(t("backupFailed")); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `ministry-report_backup_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success(t("backupReady"));
      setOpen(false); setPassphrase(""); setConfirm("");
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="secondary"><ShieldCheck className="size-5" aria-hidden="true" />{t("downloadBackup")}</Button></DialogTrigger>
      <DialogContent title={t("backupDialogTitle")} description={t("backupDialogDescription")} closeLabel={t("close")}>
        <div className="flex flex-col gap-4">
          <div><Label htmlFor="bk-pass">{t("passphrase")}</Label><Input id="bk-pass" type="password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} autoComplete="new-password" /></div>
          <div><Label htmlFor="bk-confirm">{t("passphraseConfirm")}</Label><Input id="bk-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" /></div>
          <p className="text-sm text-muted-foreground">{t("passphraseHint")}</p>
          <Button onClick={download} disabled={busy}>{busy ? t("preparing") : t("downloadBackup")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
