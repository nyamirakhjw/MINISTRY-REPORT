import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { Letterhead, PageFooter, SignOff, brand, styles as base } from "./letterhead";
import type { CongregationReportData } from "../data";
import type { Category } from "@/lib/domain/categories";

// EXP-01: A4 portrait, §12.2. Table 2 (by group), table 3 (detail) and table 5 (remarks) all follow the same
// repeating-header, zebra-tint pattern; comments only render when `includeComments` is true (off by default,
// §7.11) and the not-reported list only when `includeNotReported` is true (on by default).
const styles = StyleSheet.create({
  h2: { fontSize: 11, fontWeight: 700, color: brand.navy, marginTop: 16, marginBottom: 6 },
  table: { borderWidth: 1, borderColor: brand.border, borderRadius: 2 },
  tr: { flexDirection: "row" },
  trZebra: { backgroundColor: "#F7F9FC" },
  th: { flex: 1, backgroundColor: brand.navy, color: "#FFFFFF", fontSize: 9, fontWeight: 700, padding: 4 },
  td: { flex: 1, fontSize: 9, padding: 4, borderTopWidth: 1, borderTopColor: brand.border },
  tdWide: { flex: 2 },
});

const CATEGORY_LABEL: Record<Category, string> = { publisher: "Publishers", auxiliary_pioneer: "Auxiliary pioneers", regular_pioneer: "Regular pioneers", special_pioneer: "Special pioneers" };

function Row({ cells, zebra, widths }: { cells: (string | number)[]; zebra?: boolean; widths?: number[] }) {
  return (
    <View style={[styles.tr, zebra ? styles.trZebra : undefined]}>
      {cells.map((c, i) => <Text key={i} style={[styles.td, widths?.[i] === 2 ? styles.tdWide : undefined]}>{String(c)}</Text>)}
    </View>
  );
}
function Head({ cells, widths }: { cells: string[]; widths?: number[] }) {
  return <View style={styles.tr}>{cells.map((c, i) => <Text key={i} style={[styles.th, widths?.[i] === 2 ? styles.tdWide : undefined]}>{c}</Text>)}</View>;
}

export function CongregationReportPdf({ data, lang, includeComments, includeNotReported, generatedAt }: {
  data: CongregationReportData; lang: "en" | "sw"; includeComments: boolean; includeNotReported: boolean; generatedAt: string;
}) {
  const { month, rows, summary, groups, letterhead, preparedBy } = data;
  const monthLabel = new Date(`${month}T00:00:00Z`).toLocaleDateString(lang === "sw" ? "sw" : "en", { month: "long", year: "numeric", timeZone: "UTC" });
  const cats: Category[] = ["publisher", "auxiliary_pioneer", "regular_pioneer", "special_pioneer"];
  const notReported = rows.filter((r) => r.status === "missing");
  const detail = rows.filter((r) => r.status !== "missing" && r.status !== "not_reported");

  return (
    <Document title={`Congregation Ministry Report — ${monthLabel}`} author={preparedBy}>
      <Page size="A4" style={base.page} wrap>
        <Letterhead letterhead={letterhead} />
        <View style={base.titleBlock}>
          <Text style={base.title}>{lang === "sw" ? "Ripoti ya Huduma ya Kutaniko" : "Congregation Ministry Report"}</Text>
          <Text style={base.subtitle}>{monthLabel} · Generated {generatedAt} · Prepared by {preparedBy}</Text>
        </View>

        <Text style={styles.h2}>1. {lang === "sw" ? "Muhtasari" : "Summary"}</Text>
        <View style={styles.table}>
          <Head cells={["Category", "Reporting", "Hours", "Studies"]} />
          {cats.map((c, i) => <Row key={c} zebra={i % 2 === 1} cells={[CATEGORY_LABEL[c], summary.byCategory[c].reporting, c === "publisher" ? "–" : summary.byCategory[c].hours, summary.byCategory[c].studies]} />)}
          <Row cells={["Congregation total", summary.reported, summary.totalHours, summary.totalStudies]} />
        </View>

        <Text style={styles.h2}>2. {lang === "sw" ? "Kwa Kikundi" : "By group"}</Text>
        <View style={styles.table}>
          <Head cells={["Group", "Reporting", "Hours", "Studies"]} />
          {groups.map((g, i) => <Row key={g.group_id ?? "none"} zebra={i % 2 === 1} cells={[g.group_name, `${g.reported} / ${g.obligated}`, g.hours, g.studies]} />)}
        </View>

        <Text style={styles.h2} break>3. {lang === "sw" ? "Maelezo" : "Detail"}</Text>
        <View style={styles.table} wrap>
          <Head cells={["Name", "Group", "Category", "Participated / Hours", "Studies", "Status"]} />
          {detail.map((r, i) => (
            <Row key={r.member_id} zebra={i % 2 === 1}
              cells={[r.full_name, r.group_name ?? "—", r.category ? CATEGORY_LABEL[r.category] : "—",
                      r.category === "publisher" ? (r.participated ? "Yes" : "No") : String(r.hours ?? 0),
                      String(r.studies ?? 0), r.is_late ? "Late" : "On time"]} />
          ))}
        </View>

        {includeNotReported && (
          <>
            <Text style={styles.h2}>4. {lang === "sw" ? "Hawajaripoti" : "Did not report"}</Text>
            {notReported.length === 0 ? <Text style={{ fontSize: 9 }}>{lang === "sw" ? "Kila mtu ameripoti." : "Everyone has reported."}</Text> : (
              <View style={styles.table}>
                <Head cells={["Name", "Group"]} widths={[2, 1]} />
                {notReported.map((r, i) => <Row key={r.member_id} zebra={i % 2 === 1} cells={[r.full_name, r.group_name ?? "—"]} widths={[2, 1]} />)}
              </View>
            )}
          </>
        )}

        {includeComments && (
          <>
            <Text style={styles.h2}>5. {lang === "sw" ? "Maoni" : "Remarks"}</Text>
            {detail.filter((r) => r.comment).length === 0 ? <Text style={{ fontSize: 9 }}>—</Text> : (
              <View style={styles.table}>
                <Head cells={["Name", "Comment"]} widths={[1, 2]} />
                {detail.filter((r) => r.comment).map((r, i) => <Row key={r.member_id} zebra={i % 2 === 1} cells={[r.full_name, r.comment ?? ""]} widths={[1, 2]} />)}
              </View>
            )}
          </>
        )}

        <SignOff signatoryTitle={letterhead.signatoryTitle} />
        <PageFooter preparedBy={preparedBy} generatedAt={generatedAt} pageLabel="Page" />
      </Page>
    </Document>
  );
}
