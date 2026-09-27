"use client";

import { useState, useTransition } from "react";
import { Pencil, Check, X, RotateCcw, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsSection, type SectionStatus } from "./settings-section";
import { addGroup, renameGroup, setGroupRetired } from "@/lib/settings/actions";
import { groupNameSchema } from "@/lib/settings/schema";
import type { Group } from "@/lib/settings/types";

function GroupRow({
  group,
  onChanged,
}: {
  group: Group;
  onChanged: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.name);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function saveRename() {
    const parsed = groupNameSchema.safeParse({ name });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a group name.");
      return;
    }
    startTransition(async () => {
      const result = await renameGroup(group.id, { name: parsed.data.name });
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
      setError(null);
      onChanged(`Renamed to ${parsed.data.name}.`);
    });
  }

  function toggleRetired() {
    startTransition(async () => {
      const result = await setGroupRetired(group.id, !group.retired);
      if (result.error) {
        onChanged(result.error);
        return;
      }
      onChanged(group.retired ? `${group.name} reactivated.` : `${group.name} retired.`);
    });
  }

  return (
    <li className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0">
      {editing ? (
        <div className="flex flex-1 items-center gap-2">
          <Input
            className="h-11"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label={`Rename ${group.name}`}
            autoFocus
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-11 w-11"
            onClick={saveRename}
            disabled={isPending}
            aria-label="Save name"
          >
            <Check className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-11 w-11"
            onClick={() => {
              setEditing(false);
              setName(group.name);
              setError(null);
            }}
            aria-label="Cancel rename"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </Button>
        </div>
      ) : (
        <span className={group.retired ? "text-muted-foreground line-through" : "text-foreground"}>
          {group.name}
          {group.retired ? <span className="ml-2 text-xs font-medium text-muted-foreground">Retired</span> : null}
        </span>
      )}

      {!editing ? (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-11 w-11"
            onClick={() => setEditing(true)}
            aria-label={`Rename ${group.name}`}
          >
            <Pencil className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-11 w-11"
            onClick={toggleRetired}
            disabled={isPending}
            aria-label={group.retired ? `Reactivate ${group.name}` : `Retire ${group.name}`}
          >
            {group.retired ? (
              <RotateCcw className="h-[18px] w-[18px]" strokeWidth={1.75} />
            ) : (
              <Archive className="h-[18px] w-[18px]" strokeWidth={1.75} />
            )}
          </Button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </li>
  );
}

export function GroupsManager({ initialGroups }: { initialGroups: Group[] }) {
  const [groups, setGroups] = useState(initialGroups);
  const [newName, setNewName] = useState("");
  const [status, setStatus] = useState<SectionStatus>({ type: "idle" });
  const [isPending, startTransition] = useTransition();

  function handleChanged(message: string) {
    setStatus({ type: "success", message });
    // The list itself is revalidated by the server action; a full reload
    // of this page will reflect it. For an immediate in-place update
    // without waiting on revalidation, refetch via router.refresh() in
    // the page that renders this component, if your repo already uses
    // that pattern elsewhere.
  }

  function handleAdd() {
    const parsed = groupNameSchema.safeParse({ name: newName });
    if (!parsed.success) {
      setStatus({ type: "error", message: parsed.error.issues[0]?.message ?? "Enter a group name." });
      return;
    }
    startTransition(async () => {
      const result = await addGroup({ name: parsed.data.name });
      if (result.error || !result.data) {
        setStatus({ type: "error", message: result.error ?? "Couldn't add that group." });
        return;
      }
      setGroups((prev) => [...prev, result.data as Group]);
      setNewName("");
      setStatus({ type: "success", message: `${parsed.data.name} added.` });
    });
  }

  return (
    <SettingsSection
      title="Groups"
      description="Service groups are a filter, not a ranking (D-44). Retiring a group keeps its history; it never deletes anything."
      status={status}
    >
      <ul className="divide-y-0">
        {groups.length === 0 ? (
          <li className="py-3 text-sm text-muted-foreground">No groups yet. Add the first one below.</li>
        ) : (
          groups.map((group) => <GroupRow key={group.id} group={group} onChanged={handleChanged} />)
        )}
      </ul>

      <div className="flex items-end gap-3 border-t border-border pt-6">
        <div className="flex-1 space-y-2">
          <Label htmlFor="newGroupName">Add a group</Label>
          <Input
            id="newGroupName"
            className="h-12"
            placeholder="e.g. Nyamira Town"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <Button type="button" className="h-12 px-6" onClick={handleAdd} disabled={isPending}>
          Add group
        </Button>
      </div>
    </SettingsSection>
  );
}
