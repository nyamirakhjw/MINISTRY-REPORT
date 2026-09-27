"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { visitSchema, type VisitInput } from "@/lib/schemas/visits";
import type { RvInput } from "@/lib/offline/visits-store";
import type { RvRow } from "@/lib/domain/visits";

/** Add or edit a return visit (RV-02). Only the first name is stored — the hint below says so plainly (R-11). */
export function VisitFormDialog({ existing, onSave, trigger }: { existing?: RvRow; onSave: (input: RvInput, id?: string) => Promise<void>; trigger?: React.ReactNode }) {
  const t = useTranslations("visits");
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<VisitInput>({
    resolver: zodResolver(visitSchema),
    defaultValues: existing ? {
      id: existing.id, first_name: existing.first_name, phone: existing.phone ?? "", area: existing.area ?? "",
      first_met_on: existing.first_met_on ?? "", topic: existing.topic ?? "", literature: existing.literature ?? "",
      interest_level: existing.interest_level, status: existing.status,
      next_visit_at: existing.next_visit_at ? existing.next_visit_at.slice(0, 16) : "", notes: existing.notes ?? "",
    } : { id: crypto.randomUUID(), status: "interested", first_name: "" },
  });

  async function onSubmit(v: VisitInput) {
    setSaving(true);
    try {
      await onSave({
        firstName: v.first_name.trim(), phone: v.phone || null, area: v.area || null,
        firstMetOn: v.first_met_on || null, topic: v.topic || null, literature: v.literature || null,
        interestLevel: v.interest_level ?? null, status: v.status,
        nextVisitAt: v.next_visit_at ? new Date(v.next_visit_at).toISOString() : null, notes: v.notes || null,
      }, existing?.id);
      toast.success(existing ? t("updated") : t("added"));
      setOpen(false);
      if (!existing) reset({ id: crypto.randomUUID(), status: "interested", first_name: "" });
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button><Plus className="size-5" aria-hidden="true" />{t("addVisit")}</Button>}
      </DialogTrigger>
      <DialogContent title={existing ? t("editTitle") : t("addTitle")} closeLabel={t("close")}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{t("privacyHint")}</p>
          <div><Label htmlFor="first_name">{t("firstName")}</Label><Input id="first_name" {...register("first_name")} aria-invalid={!!errors.first_name} />{errors.first_name && <p className="mt-1 text-sm text-danger">{t("nameRequired")}</p>}</div>
          <div><Label htmlFor="phone">{t("phone")}</Label><Input id="phone" type="tel" {...register("phone")} aria-invalid={!!errors.phone} /></div>
          <div><Label htmlFor="area">{t("area")}</Label><Input id="area" placeholder={t("areaPlaceholder")} {...register("area")} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="first_met_on">{t("firstMet")}</Label><Input id="first_met_on" type="date" {...register("first_met_on")} /></div>
            <div><Label htmlFor="interest_level">{t("interest")}</Label>
              <Select id="interest_level" {...register("interest_level", { setValueAs: (v) => (v === "" ? null : Number(v)) })}>
                <option value="">{t("notSet")}</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </div>
          </div>
          <div><Label htmlFor="topic">{t("topic")}</Label><Input id="topic" {...register("topic")} /></div>
          <div><Label htmlFor="literature">{t("literature")}</Label><Input id="literature" {...register("literature")} /></div>
          <div><Label htmlFor="status">{t("status")}</Label>
            <Select id="status" {...register("status")}>
              <option value="interested">{t("status_interested")}</option>
              <option value="study_started">{t("status_study_started")}</option>
              <option value="not_interested">{t("status_not_interested")}</option>
              <option value="moved">{t("status_moved")}</option>
            </Select>
          </div>
          <div><Label htmlFor="next_visit_at">{t("nextVisit")}</Label><Input id="next_visit_at" type="datetime-local" {...register("next_visit_at")} /></div>
          <div><Label htmlFor="notes">{t("notes")}</Label><Textarea id="notes" {...register("notes")} /></div>
          <Button type="submit" disabled={saving}>{saving ? t("saving") : t("save")}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
