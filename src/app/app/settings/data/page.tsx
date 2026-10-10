import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { DataControlsClient } from "@/components/report/data-controls-client";
import { requireMember } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings");
  return { title: t("dataControls") };
}

interface Consent { document: string; version: string; accepted_at: string }
interface DeletionRow { id: string; status: string; requested_at: string; effective_at: string }

/** PRO-07: download my data, request/cancel deletion, see accepted consent versions. */
export default async function Page() {
  const { member } = await requireMember("/app/settings/data");
  const t = await getTranslations("settings");
  const locale = await getLocale();
  const supabase = await createClient();
  const [{ data: consents }, { data: deletion }] = await Promise.all([
    supabase.from("consents").select("document, version, accepted_at").order("accepted_at", { ascending: false }),
    supabase.from("deletion_requests").select("id, status, requested_at, effective_at").in("status", ["pending", "approved"]).maybeSingle(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1>{t("dataControls")}</h1>
      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">{t("downloadMyData")}</h2>
        <p className="mt-1 text-muted-foreground">{t("downloadMyDataHint")}</p>
        <a href="/api/data/mine" className="mt-3 inline-flex min-h-12 items-center rounded-md bg-primary px-5 font-semibold text-primary-foreground hover:opacity-90">{t("downloadJson")}</a>
      </section>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">{t("consentHistory")}</h2>
        <ul className="mt-3 flex flex-col gap-1 text-sm">
          {(consents ?? []).length === 0 ? <li className="text-muted-foreground">{t("noConsents")}</li> :
            (consents as Consent[]).map((c) => <li key={`${c.document}-${c.version}`}>{t(c.document as "privacy")} v{c.version} — {formatDateTime(c.accepted_at, locale)}</li>)}
        </ul>
      </section>

      <DataControlsClient memberName={member.full_name} deletion={deletion as DeletionRow | null} />
    </div>
  );
}
