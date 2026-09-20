import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrangementRequest, ChangeRequest, PhotoChange, ProfileForm } from "@/components/report/settings-forms";
import { SignOutButton } from "@/components/shell/sign-out";
import { requireMember } from "@/lib/auth/session";
import { signedAvatarUrls } from "@/lib/auth/avatars";
import { addMonths, monthOf } from "@/lib/domain/time";
import { publicEnv } from "@/lib/env";
import { formatMonth } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Arrangement } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("settings") };
}

export default async function Page() {
  const { member } = await requireMember("/app/settings");
  const t = await getTranslations("settings");
  const cat = await getTranslations("categories");
  const st = await getTranslations("status");
  const locale = await getLocale();
  const supabase = await createClient();
  const [{ data: arr }, urls] = await Promise.all([
    supabase.from("service_arrangements").select("*").order("requested_at", { ascending: false }),
    signedAvatarUrls([member.avatar_path]),
  ]);
  const arrangements = (arr ?? []) as Arrangement[];
  const tone = { pending: "warning", approved: "success", rejected: "danger", ended: "neutral" } as const;

  return (
    <div className="flex flex-col gap-8">
      <h1>{t("title")}</h1>
      <section aria-labelledby="s-profile" className="flex flex-col gap-4">
        <h2 id="s-profile">{t("profile")}</h2>
        <div className="flex items-center gap-4">
          <Avatar name={member.full_name} src={member.avatar_path ? urls[member.avatar_path] : null} size={72} alt={t("photoOf", { name: member.full_name })} />
          <div><p className="text-lg font-semibold">{member.full_name}</p><p className="text-muted-foreground">@{member.username}</p></div>
        </div>
        <PhotoChange memberId={member.id} name={member.full_name} />
        <ProfileForm phone={member.phone ?? ""} language={member.language} swEnabled={publicEnv.enableSw} />
      </section>
      <section aria-labelledby="s-arr" className="flex flex-col gap-4">
        <h2 id="s-arr">{t("arrangements")}</h2>
        {arrangements.length > 0 ? (
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {arrangements.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 p-4">
                <span>{cat(a.kind)}<span className="block text-sm text-muted-foreground">{formatMonth(a.start_month, locale)}{a.end_month ? ` – ${formatMonth(a.end_month, locale)}` : ""}</span></span>
                <Badge tone={tone[a.status]}>{a.status === "pending" ? t("awaiting") : a.status === "approved" ? st("approved") : a.status === "rejected" ? st("declined") : st("ended")}</Badge>
              </li>
            ))}
          </ul>
        ) : <p className="text-muted-foreground">{t("noArrangements")}</p>}
        <h3>{t("requestArrangement")}</h3>
        <ArrangementRequest nextMonth={addMonths(monthOf(new Date()), 1)} />
      </section>
      <section aria-labelledby="s-change" className="flex flex-col gap-4">
        <h2 id="s-change">{t("nameChange")}</h2>
        <p className="text-muted-foreground">{t("nameChangeHelp")}</p>
        <ChangeRequest />
      </section>
      <SignOutButton />
    </div>
  );
}
