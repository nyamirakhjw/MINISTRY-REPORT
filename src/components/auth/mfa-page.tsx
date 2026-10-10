import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";

export async function MfaPage({ titleKey, leadKey, children }: { titleKey: "enrollTitle" | "verifyTitle" | "recoveryTitle"; leadKey: "enrollLead" | "verifyLead" | "recoveryLead"; children: React.ReactNode }) {
  const t = await getTranslations("mfa");
  return <AuthShell title={t(titleKey)} lead={t(leadKey)}>{children}</AuthShell>;
}
