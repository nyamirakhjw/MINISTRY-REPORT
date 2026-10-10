"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Field } from "@/components/forms/field";
import { createCongregationAction, platformMembersAction, setRoleAction } from "@/lib/actions/admin";

export function PlatformPanel({ congregations }: { congregations: { id: string; slug: string; name: string }[] }) {
  const t = useTranslations("platform");
  const te = useTranslations("errors");
  const roles = useTranslations("roles");
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [slug, setSlug] = React.useState("");
  const [name, setName] = React.useState("");
  const [tagline, setTagline] = React.useState("");
  const [groups, setGroups] = React.useState("");
  const [cong, setCong] = React.useState(congregations[0]?.id ?? "");
  const [members, setMembers] = React.useState<{ id: string; full_name: string; username: string; role: string }[]>([]);

  const fail = (code?: string) => toast.error(code && te.has(code) ? te(code) : te("unknown"));
  const load = React.useCallback((id: string) => { platformMembersAction(id).then((r) => setMembers(r.ok ? (r.data ?? []) : [])); }, []);
  React.useEffect(() => { if (cong) load(cong); }, [cong, load]);

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="new-cong" className="flex flex-col gap-4">
        <h2 id="new-cong">{t("createTitle")}</h2>
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await createCongregationAction({ slug, name, tagline: tagline || undefined, groups }); if (r.ok) { toast.success(t("created")); setSlug(""); setName(""); setTagline(""); setGroups(""); router.refresh(); } else fail(r.fields ? Object.values(r.fields)[0] : r.code); }); }}>
          <Field id="pc-slug" label={t("slug")} hint={t("slugHint")}><Input id="pc-slug" value={slug} onChange={(e) => setSlug(e.target.value)} autoCapitalize="none" /></Field>
          <Field id="pc-name" label={t("name")}><Input id="pc-name" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field id="pc-tag" label={t("tagline")} optional optionalLabel={t("optional")}><Input id="pc-tag" value={tagline} onChange={(e) => setTagline(e.target.value)} /></Field>
          <Field id="pc-groups" label={t("groups")} hint={t("groupsHint")}><Input id="pc-groups" value={groups} onChange={(e) => setGroups(e.target.value)} /></Field>
          <div><Button type="submit" disabled={pending || slug.length < 2 || name.trim().length < 2}>{pending ? t("creating") : t("create")}</Button></div>
        </form>
      </section>
      <section aria-labelledby="elders" className="flex flex-col gap-4">
        <h2 id="elders">{t("eldersTitle")}</h2>
        <p className="text-muted-foreground">{t("eldersHelp")}</p>
        <Field id="pc-cong" label={t("congregation")}><Select id="pc-cong" value={cong} onChange={(e) => setCong(e.target.value)}>{congregations.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 p-4">
              <span><span className="font-semibold">{m.full_name}</span><span className="block text-sm text-muted-foreground">@{m.username} · {roles(m.role as "elder")}</span></span>
              <Button size="sm" variant={m.role === "elder" ? "danger" : "secondary"} disabled={pending}
                onClick={() => start(async () => { const r = await setRoleAction({ member_id: m.id, role: m.role === "elder" ? "publisher" : "elder" }); if (r.ok) { toast.success(t("roleSaved")); load(cong); } else fail(r.code); })}>
                {m.role === "elder" ? t("removeElder") : t("makeElder")}
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
