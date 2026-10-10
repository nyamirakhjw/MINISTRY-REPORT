"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import type { FieldErrors, FieldValues } from "react-hook-form";
import type { SummaryItem } from "@/components/forms/error-summary";

/** Turns validation codes into translated messages and moves focus to the summary after a failed submit. */
export function useFormErrors<T extends FieldValues>(errors: FieldErrors<T>, submitCount: number, extra?: SummaryItem | null) {
  const te = useTranslations("errors");
  const ref = React.useRef<HTMLDivElement>(null);
  const msg = (code: unknown) => (code ? te.has(String(code)) ? te(String(code)) : te("invalid") : undefined);
  const items: SummaryItem[] = Object.entries(errors).map(([id, e]) => ({ id, message: msg((e as { message?: unknown } | undefined)?.message) ?? te("invalid") }));
  if (extra) items.push(extra);
  const show = (submitCount > 0 && items.length > 0) || !!extra;
  const focus = React.useCallback(() => { setTimeout(() => ref.current?.focus(), 0); }, []);
  React.useEffect(() => { if (extra) focus(); }, [extra, focus]);
  return { ref, items: show ? items : [], msg, focus, te };
}
