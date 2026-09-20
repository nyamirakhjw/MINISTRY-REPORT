"use client";
import { MessageCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatMonth } from "@/lib/format";

/** WhatsApp click-to-chat: the Elder taps once per person and presses Send in WhatsApp (D-28). No report numbers in the text. */
export function WhatsAppLink({ phone, firstName, month, dueIso, siteUrl }: { phone: string | null; firstName: string; month: string; dueIso: string; siteUrl: string }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  if (!phone) return <span className="text-sm text-muted-foreground">{t("noPhone")}</span>;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `254${digits.slice(1)}`;
  const text = t("whatsappMessage", { name: firstName, month: formatMonth(month, locale), date: formatDate(dueIso, locale), link: `${siteUrl}/app/report` });
  return (
    <a href={`https://wa.me/${digits}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary", size: "sm" })}>
      <MessageCircle aria-hidden="true" />{t("whatsapp")}
    </a>
  );
}
