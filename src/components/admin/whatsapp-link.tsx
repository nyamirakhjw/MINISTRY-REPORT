"use client";
import { MessageCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatMonth } from "@/lib/format";
import { whatsappHref } from "@/lib/whatsapp";

/** WhatsApp click-to-chat: the Elder taps once per person and presses Send in WhatsApp (D-28). No report numbers in the text. */
export function WhatsAppLink({ phone, firstName, month, dueIso, siteUrl }: { phone: string | null; firstName: string; month: string; dueIso: string; siteUrl: string }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  if (!phone) return <span className="text-sm text-muted-foreground">{t("noPhone")}</span>;
  const text = t("whatsappMessage", { name: firstName, month: formatMonth(month, locale), date: formatDate(dueIso, locale), link: `${siteUrl}/app/report` });
  const href = whatsappHref(phone, text);
  if (!href) return <span className="text-sm text-muted-foreground">{t("noPhone")}</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary", size: "sm" })}>
      <MessageCircle aria-hidden="true" />{t("whatsapp")}
    </a>
  );
}
