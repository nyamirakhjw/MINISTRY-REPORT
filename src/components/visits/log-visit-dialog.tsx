"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logVisitSchema, type LogVisitInput } from "@/lib/schemas/visits";
import type { LogVisitInput as StoreLogInput } from "@/lib/offline/visits-store";

/** RV-03: every time the publisher logs a visit, the return visit's last/next visit date updates. */
export function LogVisitDialog({ returnVisitId, onLog, trigger }: { returnVisitId: string; onLog: (input: StoreLogInput) => Promise<void>; trigger?: React.ReactNode }) {
  const t = useTranslations("visits");
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const now = new Date().toISOString().slice(0, 16);
  const { register, handleSubmit, reset } = useForm<LogVisitInput>({
    resolver: zodResolver(logVisitSchema),
    defaultValues: { id: crypto.randomUUID(), return_visit_id: returnVisitId, visited_at: now },
  });

  async function onSubmit(v: LogVisitInput) {
    setSaving(true);
    try {
      await onLog({
        returnVisitId, visitedAt: new Date(v.visited_at).toISOString(), notes: v.notes || null,
        outcome: v.outcome || null, nextVisitAt: v.next_visit_at ? new Date(v.next_visit_at).toISOString() : null,
      });
      toast.success(t("visitLogged"));
      setOpen(false);
      reset({ id: crypto.randomUUID(), return_visit_id: returnVisitId, visited_at: now });
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button variant="secondary"><CheckCircle2 className="size-5" aria-hidden="true" />{t("markVisited")}</Button>}</DialogTrigger>
      <DialogContent title={t("logVisitTitle")} closeLabel={t("close")}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div><Label htmlFor="visited_at">{t("visitedAt")}</Label><Input id="visited_at" type="datetime-local" {...register("visited_at")} /></div>
          <div><Label htmlFor="outcome">{t("outcome")}</Label><Input id="outcome" {...register("outcome")} /></div>
          <div><Label htmlFor="notes">{t("notes")}</Label><Textarea id="notes" {...register("notes")} /></div>
          <div><Label htmlFor="next_visit_at">{t("nextVisit")}</Label><Input id="next_visit_at" type="datetime-local" {...register("next_visit_at")} /></div>
          <Button type="submit" disabled={saving}>{saving ? t("saving") : t("save")}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
