"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { ActionResult } from "@/lib/actions/rpc";

/** One pattern for every Elder action: labelled fields, a specific error, a toast that repeats the button's verb, then refresh. */
export function FormDialog({ trigger, triggerVariant = "secondary", triggerSize = "sm", title, description, submitLabel, successLabel, onSubmit, valid = true, danger, children }: {
  trigger: React.ReactNode; triggerVariant?: ButtonProps["variant"]; triggerSize?: ButtonProps["size"]; title: string; description?: string;
  submitLabel: string; successLabel: string; onSubmit: () => Promise<ActionResult<unknown>>; valid?: boolean; danger?: boolean; children: React.ReactNode;
}) {
  const c = useTranslations("common");
  const te = useTranslations("errors");
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await onSubmit();
      if (r.ok) { toast.success(successLabel); setOpen(false); router.refresh(); return; }
      const code = r.fields ? Object.values(r.fields)[0] : r.code;
      setError(code && te.has(code) ? te(code) : te("unknown"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setError(null); }}>
      <DialogTrigger asChild><Button variant={triggerVariant} size={triggerSize}>{trigger}</Button></DialogTrigger>
      <DialogContent title={title} description={description} closeLabel={c("close")}>
        <form onSubmit={submit} className="flex flex-col gap-4">
          {children}
          {error ? <p role="alert" className="font-semibold text-danger">{error}</p> : null}
          <div className="flex flex-wrap justify-end gap-3">
            <DialogClose asChild><Button variant="ghost">{c("cancel")}</Button></DialogClose>
            <Button type="submit" variant={danger ? "danger" : "primary"} disabled={pending || !valid}>{pending ? c("saving") : submitLabel}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
