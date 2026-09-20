import { z } from "zod";
import { COMMENT_WORD_LIMIT, countWords } from "@/lib/domain/words";

export const reportSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}-01$/),
  category: z.enum(["publisher", "auxiliary_pioneer", "regular_pioneer", "special_pioneer"]),
  participated: z.boolean().nullable(),
  hours: z.number().int().min(0).max(744).nullable(),
  studies: z.number().int().min(0).max(99),
  comment: z.string().max(600).refine((v) => countWords(v) <= COMMENT_WORD_LIMIT, "comment_too_long"),
  request_id: z.string().uuid(),
});
export type ReportInput = z.infer<typeof reportSchema>;
