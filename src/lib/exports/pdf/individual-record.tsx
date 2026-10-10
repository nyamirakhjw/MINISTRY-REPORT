import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { Letterhead, PageFooter, brand, styles as base } from "./letterhead";
import type { Letterhead as LetterheadData } from "../data";

// EXP-03, §12.3: one A4 page per member per service year, a fully custom design — not a copy of any official
// form. The month strip gives the year at a glance; the table underneath carries detail and remarks.
const styles = StyleSheet.create({
  header: { flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 14 },
  name: { fontSize: 15, fontWeight: 700, color: brand.navy },
  sub: { fontSize: 9, color: brand.muted, marginTop: 2 },
  yearBadge: { position: "absolute", right: 0, top: 0, fontSize: 10, color: brand.navy, fontWeight: 700 },
  kpiRow: { flexDirection: "row", borderTopWidth: 1, borderBottomWidth: 1, borderColor: brand.border, paddingVertical: 8, marginBottom: 12 },
  kpi: { flex: 1, alignItems: "center" },
  kpiLabel: { fontSize: 8, color: brand.muted },
  kpiValue: { fontSize: 14, fontWeight: 700, color: brand.navy, marginTop: 2 },
  strip: { flexDirection: "row", marginBottom: 12 },
  cell: { flex: 1, alignItems: "center", borderWidth: 1, borderColor: brand.border, paddingVertical: 6 },
  cellMonth: { fontSize: 7, color: brand.muted },
  cellValue: { fontSize: 10, fontWeight: 700, marginTop: 2 },
  cellLate: { color: "#8A5300" },
  table: { borderWidth: 1, borderColor: brand.border },
  tr: { flexDirection: "row" },
  trZebra: { backgroundColor: "#F7F9FC" },
  th: { flex: 1, backgroundColor: brand.navy, color: "#FFFFFF", fontSize: 8, fontWeight: 700, padding: 4 },
  td: { flex: 1, fontSize: 8, padding: 4, borderTopWidth: 1, borderTopColor: brand.border },
  goalBarTrack: { height: 10, backgroundColor: "#E6EFFC", borderRadius: 5, marginTop: 4 },
  goalBarFill: { height: 10, backgroundColor: brand.navy, borderRadius: 5 },
});

export interface MemberYearRow { month: string; status: string; category: string | null; participated: boolean | null; hours: number | null; studies: number | null; is_late: boolean; goal_hours: number | null }

export function IndividualRecordPdf({ letterhead, memberName, group, arrangement, serviceYear, months, generatedAt }: {
  letterhead: LetterheadData; memberName: string; group: string; arrangement: string | null;
  serviceYear: string; months: MemberYearRow[]; generatedAt: string;
}) {
  const reportedCount = months.filter((m) => m.status !== "missing" && m.status !== "not_reported").length;
  const totalHours = months.reduce((s, m) => s + (m.hours ?? 0), 0);
  const totalStudies = months.reduce((s, m) => s + (m.studies ?? 0), 0);
  const totalGoal = months.reduce((s, m) => s + (m.goal_hours ?? 0), 0);
  const isPioneer = months.some((m) => m.category && m.category !== "publisher");
  const goalPct = totalGoal > 0 ? Math.min(100, Math.round((totalHours / totalGoal) * 100)) : 0;

  return (
    <Document title={`Service Year Record — ${memberName} — ${serviceYear}`}>
      <Page size="A4" style={base.page}>
        <Letterhead letterhead={letterhead} />
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{memberName}</Text>
            <Text style={styles.sub}>{group}{arrangement ? ` · ${arrangement}` : ""}</Text>
          </View>
          <Text style={styles.yearBadge}>Service year {serviceYear}</Text>
        </View>

        <View style={styles.kpiRow}>
          <View style={styles.kpi}><Text style={styles.kpiLabel}>Months reported</Text><Text style={styles.kpiValue}>{reportedCount} / {months.length}</Text></View>
          <View style={styles.kpi}><Text style={styles.kpiLabel}>Hours</Text><Text style={styles.kpiValue}>{isPioneer ? totalHours : "–"}</Text></View>
          <View style={styles.kpi}><Text style={styles.kpiLabel}>Studies</Text><Text style={styles.kpiValue}>{totalStudies}</Text></View>
          <View style={styles.kpi}><Text style={styles.kpiLabel}>Goal met</Text><Text style={styles.kpiValue}>{isPioneer && totalGoal > 0 ? `${totalHours} / ${totalGoal}` : "–"}</Text></View>
        </View>

        <View style={styles.strip}>
          {months.map((m) => (
            <View key={m.month} style={styles.cell}>
              <Text style={styles.cellMonth}>{new Date(`${m.month}T00:00:00Z`).toLocaleDateString("en", { month: "short", timeZone: "UTC" })}</Text>
              <Text style={[styles.cellValue, m.is_late ? styles.cellLate : undefined]}>
                {m.status === "missing" ? "—" : m.status === "not_reported" ? "×" : m.category === "publisher" ? (m.participated ? "✓" : "–") : String(m.hours ?? 0)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.table}>
          <View style={styles.tr}>
            {["Month", "Category", "Hours", "Studies", "Status", "Remarks"].map((h) => <Text key={h} style={styles.th}>{h}</Text>)}
          </View>
          {months.map((m, i) => (
            <View key={m.month} style={[styles.tr, i % 2 === 1 ? styles.trZebra : undefined]}>
              <Text style={styles.td}>{new Date(`${m.month}T00:00:00Z`).toLocaleDateString("en", { month: "short", year: "numeric", timeZone: "UTC" })}</Text>
              <Text style={styles.td}>{m.category ?? "—"}</Text>
              <Text style={styles.td}>{m.category === "publisher" ? "—" : (m.hours ?? "—")}</Text>
              <Text style={styles.td}>{m.studies ?? "—"}</Text>
              <Text style={styles.td}>{m.status === "missing" ? "Not yet" : m.status === "not_reported" ? "Did not report" : m.is_late ? "Late" : "On time"}</Text>
              <Text style={styles.td}> </Text>
            </View>
          ))}
        </View>

        {isPioneer && totalGoal > 0 && (
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 9, color: brand.muted }}>Service-year goal: {totalHours} / {totalGoal} hours</Text>
            <View style={styles.goalBarTrack}><View style={[styles.goalBarFill, { width: `${goalPct}%` }]} /></View>
          </View>
        )}

        <PageFooter preparedBy={letterhead.signatoryTitle} generatedAt={generatedAt} pageLabel="Page" />
      </Page>
    </Document>
  );
}
