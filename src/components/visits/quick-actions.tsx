"use client";
import { Phone, MessageCircle, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RvRow } from "@/lib/domain/visits";

// RV-05: call, WhatsApp click-to-chat, open in maps search (by the area text). Generic, no householder name
// in any URL that could end up in a share-sheet preview (RV-08's spirit extended to these too).
export function QuickActions({ rv }: { rv: RvRow }) {
  const t = useTranslations("visits");
  const iconBtn = "inline-flex size-11 items-center justify-center rounded-md border border-input-border hover:bg-tint";
  return (
    <div className="flex gap-2">
      {rv.phone && <a href={`tel:${rv.phone.replace(/[^\d+]/g, "")}`} className={iconBtn} aria-label={t("call")}><Phone className="size-5" aria-hidden="true" /></a>}
      {rv.phone && <a href={`https://wa.me/${rv.phone.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer" className={iconBtn} aria-label={t("whatsapp")}><MessageCircle className="size-5" aria-hidden="true" /></a>}
      {rv.area && <a href={`https://www.google.com/maps/search/${encodeURIComponent(rv.area)}`} target="_blank" rel="noopener noreferrer" className={iconBtn} aria-label={t("openMap")}><MapPin className="size-5" aria-hidden="true" /></a>}
    </div>
  );
}
