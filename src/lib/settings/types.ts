// Mirrors the jsonb shape documented at the top of
// supabase/migrations/20261003000000_sprint1_congregation_settings.sql

export interface CongregationSettings {
  goals: {
    regular_pioneer: number;
    special_pioneer: number;
    auxiliary_options: [number, number];
  };
  // Kept flat (not nested under a "window" key) to match what public.report_window() actually reads
  // (supabase/migrations/20260920000400_report_rules.sql) and what the daily-log carry-over read uses
  // (20260921000100_daily_log.sql).
  on_time_day: number;
  late_window_months: number;
  carry_over_default: boolean;
  reminders: {
    schedule_days: number[];
    final_call_hour: number;
    weekly_after_late_window: boolean;
    quiet_hours_start: string; // "HH:MM"
    quiet_hours_end: string; // "HH:MM"
  };
  landing: {
    midweek_day: string;
    midweek_time: string; // "HH:MM"
    weekend_day: string;
    weekend_time: string; // "HH:MM"
    address: string;
    map_link: string | null;
    contact_line: string | null;
  };
  letterhead: {
    lines: string[];
    signatory_title: string;
  };
}

export interface Group {
  id: string;
  congregation_id: string;
  name: string;
  retired: boolean;
}

export type ActionResult<T = undefined> = { data?: T; error?: string };
