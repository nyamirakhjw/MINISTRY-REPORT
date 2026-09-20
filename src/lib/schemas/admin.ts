import { z } from "zod";

const uuid = z.string().uuid();
const month = z.string().regex(/^\d{4}-\d{2}-01$/);
const reason = z.string().trim().min(3, "reason_required").max(300);

export const approveSchema = z.object({
  member_id: uuid, full_name: z.string().trim().min(2, "name_required").max(120), group_id: uuid, first_report_month: month.optional(),
});
export const reasonSchema = z.object({ member_id: uuid, reason });
export const decideSchema = z.object({ id: uuid, approve: z.boolean(), note: z.string().trim().max(300).optional() });
export const onBehalfSchema = z.object({
  member_id: uuid, month, category: z.enum(["publisher", "auxiliary_pioneer", "regular_pioneer", "special_pioneer"]),
  participated: z.boolean().nullable(), hours: z.number().int().min(0).max(744).nullable(), studies: z.number().int().min(0).max(99),
  comment: z.string().max(600), received_at: z.string().optional(), reason, request_id: uuid,
});
export const closeMonthSchema = z.object({ member_id: uuid, month, reason });
export const roleSchema = z.object({ member_id: uuid, role: z.enum(["publisher", "ministerial_servant", "elder"]) });
export const memberUpdateSchema = z.object({ member_id: uuid, group_id: uuid, full_name: z.string().trim().min(2).max(120) });
export const statusSchema = z.object({ member_id: uuid, status: z.enum(["active", "inactive"]), effective_month: month.optional() });
export const managedSchema = z.object({
  full_name: z.string().trim().min(2, "name_required").max(120), group_id: uuid,
  phone: z.string().trim().regex(/^(\+?[0-9]{9,15})?$/, "phone_invalid").optional(),
});
export const endArrangementSchema = z.object({ id: uuid, end_month: month });
export const congregationSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,40}$/, "slug_invalid"),
  name: z.string().trim().min(2).max(120), tagline: z.string().trim().max(120).optional(),
  groups: z.string().trim().max(500),
});

export const uuidOnly = uuid;
