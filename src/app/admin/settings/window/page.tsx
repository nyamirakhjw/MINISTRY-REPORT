import { getCongregationSettings } from "@/lib/settings/actions";
import { WindowRulesForm } from "@/components/settings/window-rules-form";

export default async function WindowSettingsPage() {
  const { data: settings, error } = await getCongregationSettings();

  if (error || !settings) {
    return (
      <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
        {error ?? "Couldn't load settings."}
      </p>
    );
  }

  return <WindowRulesForm settings={settings} />;
}
