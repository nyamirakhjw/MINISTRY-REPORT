"use client";
import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { formatDateTime, formatMonth } from "@/lib/format";
import { DeleteMemberDialog, EditMemberDialog, RecoveryLinkButton, ServantRoleDialog, StatusDialog, type MemberLite } from "./member-dialogs";

export interface MemberRow extends MemberLite {
  username: string | null; phone: string | null; group_name: string | null; first_report_month: string | null;
  inactive_from_month: string | null; avatar_path: string | null; last_sign_in_at: string | null; arrangement: string | null;
}

type GroupBy = "none" | "group" | "category" | "status" | "role";
const categoryOf = (r: MemberRow) => r.arrangement ?? "publisher";

/** Search plus five independent filters (name, group, category, status, role), and a separate "group by"
 * control that reorganizes the same filtered rows under section headers instead of narrowing them further —
 * filtering and grouping are different questions, so they get different controls rather than one combined
 * dropdown. Client-side: at the congregation's scale (~50 members, A-1) this is instant and needs no
 * round trip, unlike the Reports table's month-scoped data this deliberately mirrors the style of. */
export function MembersListClient({ rows, groups, avatars, selfId, curMonth }: {
  rows: MemberRow[]; groups: { id: string; name: string }[]; avatars: Record<string, string>; selfId: string; curMonth: string;
}) {
  const t = useTranslations("admin");
  const cat = useTranslations("categories");
  const roles = useTranslations("roles");
  const c = useTranslations("common");
  const locale = useLocale();

  const [q, setQ] = React.useState("");
  const [group, setGroup] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [role, setRole] = React.useState("");
  const [groupBy, setGroupBy] = React.useState<GroupBy>("none");

  const filtered = React.useMemo(() => rows.filter((r) =>
    (!q || r.full_name.toLowerCase().includes(q.toLowerCase())) &&
    (!group || r.group_name === group) &&
    (!category || categoryOf(r) === category) &&
    (!status || r.status === status) &&
    (!role || r.role === role),
  ), [rows, q, group, category, status, role]);

  const sections = React.useMemo(() => {
    if (groupBy === "none") return [{ key: "all", label: "", list: filtered }];
    const keyFor =
      groupBy === "group" ? (r: MemberRow) => r.group_name ?? "–" :
      groupBy === "category" ? (r: MemberRow) => cat(categoryOf(r) as "publisher") :
      groupBy === "status" ? (r: MemberRow) => (r.status === "active" ? t("active") : t("inactive")) :
      (r: MemberRow) => roles(r.role as "elder");
    const map = new Map<string, MemberRow[]>();
    for (const r of filtered) { const k = keyFor(r); if (!map.has(k)) map.set(k, []); map.get(k)!.push(r); }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([key, list]) => ({ key, label: key, list }));
  }, [filtered, groupBy, cat, t, roles]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div><label htmlFor="mf-q" className="font-semibold">{c("search")}</label><Input id="mf-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchName")} /></div>
        <div><label htmlFor="mf-g" className="font-semibold">{t("group")}</label>
          <Select id="mf-g" value={group} onChange={(e) => setGroup(e.target.value)}><option value="">{c("all")}</option>{groups.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}</Select>
        </div>
        <div><label htmlFor="mf-c" className="font-semibold">{t("category")}</label>
          <Select id="mf-c" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">{c("all")}</option>{(["publisher", "regular_pioneer", "auxiliary_pioneer", "special_pioneer"] as const).map((k) => <option key={k} value={k}>{cat(k)}</option>)}</Select>
        </div>
        <div><label htmlFor="mf-s" className="font-semibold">{t("status")}</label>
          <Select id="mf-s" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">{c("all")}</option><option value="active">{t("active")}</option><option value="inactive">{t("inactive")}</option></Select>
        </div>
        <div><label htmlFor="mf-r" className="font-semibold">{t("role")}</label>
          <Select id="mf-r" value={role} onChange={(e) => setRole(e.target.value)}><option value="">{c("all")}</option><option value="publisher">{roles("publisher")}</option><option value="ministerial_servant">{roles("ministerial_servant")}</option><option value="elder">{roles("elder")}</option></Select>
        </div>
        <div><label htmlFor="mf-gb" className="font-semibold">{t("groupBy")}</label>
          <Select id="mf-gb" value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)}>
            <option value="none">{t("groupByNone")}</option>
            <option value="group">{t("group")}</option>
            <option value="category">{t("category")}</option>
            <option value="status">{t("status")}</option>
            <option value="role">{t("role")}</option>
          </Select>
        </div>
      </div>
      <p className="text-muted-foreground">{t("membersCount", { count: filtered.length })}</p>
      {sections.map((sec) => (
        <div key={sec.key} className="flex flex-col gap-3">
          {groupBy !== "none" && <h2 className="font-semibold">{sec.label} · {sec.list.length}</h2>}
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {sec.list.length === 0 && <li className="p-4 text-muted-foreground">{t("noMembersMatch")}</li>}
            {sec.list.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={r.full_name} src={r.avatar_path ? avatars[r.avatar_path] : null} size={48} alt={t("photoOf", { name: r.full_name })} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-lg font-semibold">{r.full_name}
                      {r.role !== "publisher" && <Badge tone="gold">{roles(r.role as "elder")}</Badge>}
                      {r.status === "inactive" && <Badge tone="warning">{t("inactive")}</Badge>}
                      {r.is_managed && <Badge>{t("managed")}</Badge>}
                    </p>
                    <p className="text-muted-foreground">{r.group_name ?? "–"}{r.arrangement ? ` · ${cat(r.arrangement as "regular_pioneer")}` : ""}{r.username ? ` · @${r.username}` : ""}</p>
                    <p className="text-sm text-muted-foreground">{t("firstMonthLine", { month: r.first_report_month ? formatMonth(r.first_report_month, locale) : "–" })}{r.last_sign_in_at ? ` · ${t("lastSignIn", { time: formatDateTime(r.last_sign_in_at, locale) })}` : ""}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <EditMemberDialog m={r} groups={groups} />
                  {r.role !== "elder" && !r.is_managed && r.status === "active" && <ServantRoleDialog m={r} />}
                  {r.id !== selfId && <StatusDialog m={r} defaultMonth={curMonth} />}
                  {r.status === "active" && <RecoveryLinkButton m={r} />}
                  {r.id !== selfId && r.status !== "anonymized" && <DeleteMemberDialog m={r} />}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
