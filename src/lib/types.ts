import type { Category } from "@/lib/domain/categories";

export type Role = "publisher" | "ministerial_servant" | "elder";
export type MemberStatus = "pending" | "active" | "inactive" | "rejected" | "anonymized";
export type Lang = "en" | "sw";

export interface Member {
  id: string;
  user_id: string | null;
  congregation_id: string;
  group_id: string | null;
  full_name: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  role: Role;
  status: MemberStatus;
  language: Lang;
  avatar_path: string | null;
  photo_note: string | null;
  rejection_note: string | null;
  first_report_month: string | null;
  created_at: string;
}

export interface ReportRow {
  id: string;
  month: string;
  status: "submitted" | "reopened" | "not_reported";
  category: Category | null;
  participated: boolean | null;
  hours: number | null;
  studies: number | null;
  comment: string | null;
  is_late: boolean;
  submitted_via: "self" | "elder";
  server_received_at: string;
}

export interface ReportState {
  state: "not_active" | "up_to_date" | "open" | "blocked" | "reopened";
  month?: string;
  opens_at?: string;
  on_time_until?: string;
  late_until?: string;
  is_late?: boolean;
  options?: Category[];
  // Present only when state = "reopened" (COR-03): the report to fix and resubmit.
  report_id?: string;
  category?: Category;
  participated?: boolean | null;
  hours?: number | null;
  studies?: number | null;
  comment?: string | null;
}

export interface Arrangement {
  id: string;
  member_id: string;
  kind: Exclude<Category, "publisher">;
  start_month: string;
  end_month: string | null;
  aux_goal_hours: number | null;
  status: "pending" | "approved" | "rejected" | "ended";
  decision_note: string | null;
}

export interface NotificationRow {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
}
