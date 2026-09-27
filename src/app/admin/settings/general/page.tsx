import { getCongregationSettings } from "@/lib/settings/actions";
import { GeneralSettingsForm } from "@/components/settings/general-settings-form";

export default async function GeneralSettingsPage() {
  const { data: settings, error } = await getCongregationSettings();

  if (error || !settings) {
    return (
      <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
        {error ?? "Couldn't load settings."}
      </p>
    );
  }

  return <GeneralSettingsForm settings={settings} />;
}
