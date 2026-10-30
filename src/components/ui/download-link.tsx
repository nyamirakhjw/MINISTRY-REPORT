"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Reads a file name out of a Content-Disposition header (UTF-8 form first, then the plain one). */
function fileNameFrom(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8?.[1]) { try { return decodeURIComponent(utf8[1]); } catch { /* fall through */ } }
  return /filename="?([^";]+)"?/i.exec(header)?.[1] ?? fallback;
}

/**
 * A download button with honest progress (PRD v1.1 EM-08): a small ring while the file is made, a check when it is saved,
 * and a readable message if the server could not make it. Falls back to a normal navigation if the session has expired.
 */
export function DownloadLink({ href, children, icon, size = "sm" }: { href: string; children: React.ReactNode; icon: React.ReactNode; size?: "sm" | "md" }) {
  const t = useTranslations("common");
  const [state, setState] = React.useState<"idle" | "busy" | "done">("idle");

  async function run() {
    setState("busy");
    try {
      const res = await fetch(href, { credentials: "same-origin" });
      if (res.redirected || !res.ok) {
        if (res.redirected) { window.location.href = href; return; }
        const detail = await res.json().then((j: { detail?: string }) => j.detail, () => undefined);
        toast.error(detail ? `${t("downloadFailed")} (${detail})` : t("downloadFailed"));
        setState("idle");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = fileNameFrom(res.headers.get("content-disposition"), "ministry-report");
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setState("done");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      toast.error(t("downloadFailed"));
      setState("idle");
    }
  }

  return (
    <Button variant="secondary" size={size} onClick={run} disabled={state === "busy"} aria-busy={state === "busy"}>
      {state === "busy" ? (
        <svg className="size-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="9" opacity="0.25" /><path className="m-ring" d="M12 3a9 9 0 0 1 9 9" />
        </svg>
      ) : state === "done" ? <Check className="m-pop size-4 text-success" aria-hidden="true" /> : icon}
      {children}
    </Button>
  );
}
