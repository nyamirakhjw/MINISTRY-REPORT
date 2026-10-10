import type { ReactNode } from "react";
import { SettingsNav } from "@/components/settings/settings-nav";

// This assumes /admin/* already sits behind Elder-only auth + a
// verified second factor at the route level (per AUTH-09, §16.2) in
// your existing admin layout. The RPC functions also re-check both,
// so nothing here relies on the UI gate alone.
export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="mb-8 space-y-1">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Congregation settings</h1>
        <p className="text-sm text-muted-foreground">
          Changes here affect the whole congregation and are recorded in the audit log.
        </p>
      </div>
      <div className="flex flex-col gap-8 md:flex-row">
        <SettingsNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
