import { z } from "zod";

const uuid = z.string().uuid();
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const visitSchema = z.object({
  id: uuid,
  first_name: z.string().trim().min(1, "name_required").max(40),
  phone: z.string().trim().regex(/^(\+?[0-9 ()-]{6,20})?$/, "phone_invalid").optional().or(z.literal("")),
  area: optionalText(140),
  first_met_on: z.string().optional().or(z.literal("")),
  topic: optionalText(200),
  literature: optionalText(200),
  interest_level: z.number().int().min(1).max(5).nullable().optional(),
  status: z.enum(["interested", "study_started", "not_interested", "moved"]),
  next_visit_at: z.string().optional().or(z.literal("")),
  notes: optionalText(2000),
});
export type VisitInput = z.infer<typeof visitSchema>;

export const logVisitSchema = z.object({
  id: uuid,
  return_visit_id: uuid,
  visited_at: z.string().min(1),
  notes: optionalText(2000),
  outcome: optionalText(200),
  next_visit_at: z.string().optional().or(z.literal("")),
});
export type LogVisitInput = z.infer<typeof logVisitSchema>;
