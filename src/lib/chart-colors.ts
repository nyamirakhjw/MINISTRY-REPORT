// Recharts needs literal colour values (it can't read CSS custom properties), so the brand palette (§10.3) is
// mirrored here once. Every chart also ships a "view as table" toggle (§10.8) — colour is never the only signal.
export const CHART_COLORS = {
  navy: "#0B2E6B", blue: "#1E5BB8", gold: "#F2C14E", success: "#0F6B3A", danger: "#B42318", warning: "#8A5300", muted: "#94A3B8",
} as const;

export const CATEGORY_COLORS: Record<string, string> = {
  publisher: CHART_COLORS.muted, auxiliary_pioneer: CHART_COLORS.blue, regular_pioneer: CHART_COLORS.navy, special_pioneer: CHART_COLORS.gold,
};
