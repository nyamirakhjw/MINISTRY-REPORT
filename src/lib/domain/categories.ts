export const CATEGORIES = ["publisher", "auxiliary_pioneer", "regular_pioneer", "special_pioneer"] as const;
export type Category = (typeof CATEGORIES)[number];
export const PIONEER_CATEGORIES = ["auxiliary_pioneer", "regular_pioneer", "special_pioneer"] as const;

export function isPioneer(c: Category): boolean {
  return c !== "publisher";
}

export const REPORT_ERROR_CODES = [
  "not_active", "request_id_required", "bad_month", "before_first_month", "no_window", "month_closed", "already_submitted",
  "window_not_open", "window_closed", "earlier_month_pending", "arrangement_not_approved", "category_required",
  "studies_out_of_range", "comment_too_long", "participation_required", "hours_required", "hours_out_of_range",
  "received_in_future", "received_before_open", "reason_required", "forbidden", "mfa_required", "not_found",
  "cannot_approve_self", "not_pending", "photo_missing", "name_required", "invalid_group", "forbidden_platform_only",
  "username_unavailable", "bad_kind", "bad_status", "cannot_deactivate_self", "bad_path",
] as const;

/** Postgres errors from our functions carry a stable code in `message`. Anything else becomes "unknown". */
export function normalizeDbError(message: string | undefined): string {
  const m = (message ?? "").trim();
  return (REPORT_ERROR_CODES as readonly string[]).includes(m) ? m : "unknown";
}
