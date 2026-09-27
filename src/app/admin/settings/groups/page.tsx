import { listGroups } from "@/lib/settings/actions";
import { GroupsManager } from "@/components/settings/groups-manager";

export default async function GroupsSettingsPage() {
  const { data: groups, error } = await listGroups();

  if (error || !groups) {
    return (
      <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
        {error ?? "Couldn't load groups."}
      </p>
    );
  }

  return <GroupsManager initialGroups={groups} />;
}
