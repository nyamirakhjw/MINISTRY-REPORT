import { LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";

export async function SignOutButton({ variant = "secondary", className }: { variant?: "secondary" | "ghost"; className?: string }) {
  const t = await getTranslations("common");
  return (
    <form action={signOutAction}>
      <Button type="submit" variant={variant} className={className}><LogOut aria-hidden="true" />{t("signOut")}</Button>
    </form>
  );
}
