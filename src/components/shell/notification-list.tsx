"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { markNotificationsReadAction } from "@/lib/actions/profile";
import { formatDateTime, formatMonth } from "@/lib/format";
import type { NotificationRow } from "@/lib/types";

export function NotificationList({ items }: { items: NotificationRow[] }) {
  const t = useTranslations("notifications");
  const cat = useTranslations("categories");
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const unread = items.filter((i) => !i.read_at).map((i) => i.id);

  function text(n: NotificationRow): string {
    const p = n.payload;
    const key = `kind_${n.kind}`;
    if (!t.has(key)) return t("kind_generic");
    return t(key, {
      note: String(p.note ?? ""), by: String(p.by ?? ""), month: typeof p.month === "string" ? formatMonth(p.month, locale) : "",
      kind: typeof p.kind === "string" && p.kind !== "" && cat.has(p.kind) ? cat(p.kind) : "", result: p.approved === true ? t("approved") : t("declined"),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {unread.length > 0 && <div><Button variant="secondary" disabled={pending} onClick={() => start(async () => { await markNotificationsReadAction(unread); router.refresh(); })}>{t("markAllRead")}</Button></div>}
      <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
        {items.map((n) => (
          <li key={n.id} className="flex flex-col gap-1 p-4">
            <p className={n.read_at ? "" : "font-semibold"}>{!n.read_at ? <span className="mr-2 inline-block rounded-sm bg-accent px-1.5 text-sm text-[#0B2E6B]">{t("new")}</span> : null}{text(n)}</p>
            <p className="text-sm text-muted-foreground">{formatDateTime(n.created_at, locale)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
