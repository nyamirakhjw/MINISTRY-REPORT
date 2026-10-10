import { View, Text, StyleSheet } from "@react-pdf/renderer";
import type { Letterhead } from "../data";

// Brand tokens (§10.3), mirrored as literal values — react-pdf can't read CSS custom properties any more than
// Recharts can. Fonts: registering the brand pair (Lexend / Source Sans 3) needs their .ttf files bundled under
// /public/fonts and a `Font.register(...)` call in the document root (see congregation-report.tsx) — this file
// only sets weights/sizes so it keeps working with the Helvetica fallback if those files aren't added yet.
export const brand = { navy: "#0B2E6B", gold: "#F2C14E", ink: "#0F172A", muted: "#475569", border: "#D5DDEA" };

export const styles = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 48, paddingHorizontal: 36, fontSize: 10, color: brand.ink },
  letterheadRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: 2, borderBottomColor: brand.gold, paddingBottom: 10, marginBottom: 14 },
  congregationName: { fontSize: 16, fontWeight: 700, color: brand.navy },
  tagline: { fontSize: 9, color: brand.muted, marginTop: 2 },
  addressLine: { fontSize: 9, color: brand.muted, textAlign: "right" },
  titleBlock: { marginBottom: 12 },
  title: { fontSize: 14, fontWeight: 700, color: brand.navy },
  subtitle: { fontSize: 9, color: brand.muted, marginTop: 2 },
  footer: { position: "absolute", bottom: 20, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: brand.muted, borderTopWidth: 1, borderTopColor: brand.border, paddingTop: 6 },
  signOff: { marginTop: 24, flexDirection: "row", justifyContent: "space-between" },
  signBox: { width: 220, borderTopWidth: 1, borderTopColor: brand.ink, paddingTop: 4, fontSize: 9 },
});

export function Letterhead({ letterhead }: { letterhead: Letterhead }) {
  return (
    <View style={styles.letterheadRow}>
      <View>
        <Text style={styles.congregationName}>{letterhead.congregationName}</Text>
        {letterhead.tagline ? <Text style={styles.tagline}>{letterhead.tagline}</Text> : null}
      </View>
      <View>{letterhead.lines.map((l, i) => <Text key={i} style={styles.addressLine}>{l}</Text>)}</View>
    </View>
  );
}

export function PageFooter({ preparedBy, generatedAt, pageLabel }: { preparedBy: string; generatedAt: string; pageLabel: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>Confidential: congregation record · Prepared by {preparedBy} · Generated {generatedAt}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageLabel} ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

export function SignOff({ signatoryTitle }: { signatoryTitle: string }) {
  return (
    <View style={styles.signOff}>
      <View style={styles.signBox}><Text>Prepared by ({signatoryTitle})</Text></View>
      <View style={styles.signBox}><Text>Date</Text></View>
    </View>
  );
}
