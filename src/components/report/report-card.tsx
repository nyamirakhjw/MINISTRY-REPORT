"use client";
import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMonth } from "@/lib/format";
import { drawReportCard, type CardKind } from "@/lib/report-card";
import type { Category } from "@/lib/domain/categories";

export interface ReportCardData {
  month: string;              // "2026-08-01"
  category: Category;
  participated: boolean | null;
  hours: number | null;
  studies: number;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  tagline: string;
}

/**
 * The report card (PRD CARD-01 to CARD-06) and its creation moment (PRD v1.1 AM-11). Drawn on this device from the
 * report's own numbers, never stored on the server, never shared by link. While it draws, a quiet ring shows; when it
 * is ready the card settles in with a short spring. Reduced motion: it simply appears.
 */
export function ReportCard({ data }: { data: ReportCardData }) {
  const t = useTranslations("card");
  const cat = useTranslations("categories");
  const landing = useTranslations("landing");
  const locale = useLocale();
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = React.useState<"drawing" | "ready" | "failed">("drawing");
  const [attempt, setAttempt] = React.useState(0);
  const [canShare, setCanShare] = React.useState(false);

  const kind: CardKind = data.category === "publisher" ? (data.participated ? "yes" : "no") : "pioneer";
  const month = formatMonth(data.month, locale);
  const summary = kind === "no" ? t("summaryNo") : kind === "yes" ? t("summaryYes", { studies: data.studies }) : t("summaryPioneer", { hours: data.hours ?? 0, studies: data.studies });
  const labels = React.useMemo(() => ({
    title: t("title"), forMonth: t("forMonth", { month }), category: cat(data.category), hours: t("hours"), studies: t("studies"),
    participated: t("participated"), yes: t("yes"), didNot: t("didNot"), tagline: data.tagline || landing("tagline"), app: t("app"),
  }), [t, cat, landing, month, data.category, data.tagline]);

  React.useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let cancelled = false;
    // Drawing starts from the effect, so the ring is shown first and the state updates only when the work settles.
    drawReportCard(el, { labels, name: data.name, kind, hours: data.hours, studies: data.studies, photoUrl: data.avatarUrl, markUrl: "/brand/mark-394.webp", locale })
      .then(() => { if (!cancelled) setStatus("ready"); })
      .catch(() => { if (!cancelled) setStatus("failed"); });
    return () => { cancelled = true; };
  }, [labels, data.name, data.hours, data.studies, data.avatarUrl, kind, locale, attempt]);

  React.useEffect(() => {
    const probe = new File([""], "probe.png", { type: "image/png" });
    setCanShare(typeof navigator !== "undefined" && typeof navigator.canShare === "function" && navigator.canShare({ files: [probe] }));
  }, []);

  const fileName = `ministry-report-${data.month.slice(0, 7)}-${data.username ?? "member"}.png`;
  const toBlob = () => new Promise<Blob | null>((resolve) => canvas.current ? canvas.current.toBlob(resolve, "image/png") : resolve(null));

  async function download() {
    const blob = await toBlob();
    if (!blob) { setStatus("failed"); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
  async function share() {
    const blob = await toBlob();
    if (!blob) { setStatus("failed"); return; }
    try { await navigator.share({ files: [new File([blob], fileName, { type: "image/png" })], title: t("title") }); }
    catch { /* the person closed the share sheet: nothing to do */ }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full max-w-sm">
        <canvas ref={canvas} width={1080} height={1080} role="img" aria-label={t("alt", { name: data.name, month, summary })}
          className={`aspect-square w-full rounded-lg border border-border bg-tint ${status === "ready" ? "m-pop" : "opacity-0"}`} />
        {status === "drawing" ? (
          <div role="status" className="absolute inset-0 grid place-items-center">
            <svg className="size-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" focusable="false">
              <circle cx="12" cy="12" r="9" opacity="0.2" /><path className="m-ring" d="M12 3a9 9 0 0 1 9 9" />
            </svg>
            <span className="sr-only">{t("drawing")}</span>
          </div>
        ) : null}
        {status === "failed" ? <p role="alert" className="absolute inset-0 grid place-items-center p-4 text-center font-semibold">{t("failed")}</p> : null}
      </div>
      <div className="flex flex-wrap gap-3">
        {status === "failed"
          ? <Button onClick={() => { setStatus("drawing"); setAttempt((n) => n + 1); }}>{t("retry")}</Button>
          : <Button onClick={download} disabled={status !== "ready"}><Download aria-hidden="true" />{t("download")}</Button>}
        {canShare && status === "ready" ? <Button variant="secondary" onClick={share}><Share2 aria-hidden="true" />{t("share")}</Button> : null}
      </div>
    </div>
  );
}
