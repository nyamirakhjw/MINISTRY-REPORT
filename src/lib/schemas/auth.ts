import { z } from "zod";
import { MIN_PASSWORD_LENGTH, passwordProblem } from "@/lib/domain/password";
import { usernameProblem, normalizeUsername } from "@/lib/domain/username";

export const signInSchema = z.object({
  identifier: z.string().trim().min(1, "required").max(254),
  password: z.string().min(1, "required").max(200),
  next: z.string().optional(),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const requestAccessSchema = z.object({
  full_name: z.string().trim().min(2, "name_short").max(120),
  username: z.string().transform(normalizeUsername).superRefine((v, ctx) => {
    const p = usernameProblem(v);
    if (p) ctx.addIssue({ code: "custom", message: p === "reserved" ? "username_reserved" : "username_invalid" });
  }),
  email: z.string().trim().toLowerCase().email("email_invalid").max(254),
  phone: z.string().trim().regex(/^\+?[0-9]{9,15}$/, "phone_invalid"),
  group_id: z.string().uuid("required"),
  arrangement: z.enum(["publisher", "regular_pioneer", "auxiliary_pioneer", "special_pioneer"]),
  aux_goal: z.enum(["15", "30"]).optional(),
  language: z.enum(["en", "sw"]),
  password: z.string().max(200).superRefine((v, ctx) => {
    const p = passwordProblem(v);
    if (p) ctx.addIssue({ code: "custom", message: p === "too_short" ? "password_short" : "password_common" });
  }),
  consent: z.literal(true, { error: "consent_required" }),
});
export type RequestAccessInput = z.infer<typeof requestAccessSchema>;

export const resetRequestSchema = z.object({ email: z.string().trim().toLowerCase().email("email_invalid") });
export const newPasswordSchema = z.object({
  password: z.string().max(200).superRefine((v, ctx) => {
    const p = passwordProblem(v);
    if (p) ctx.addIssue({ code: "custom", message: p === "too_short" ? "password_short" : "password_common" });
  }),
  confirm: z.string(),
}).refine((v) => v.password === v.confirm, { path: ["confirm"], message: "password_mismatch" });

export const totpCodeSchema = z.object({ code: z.string().trim().regex(/^[0-9]{6}$/, "code_invalid") });
export { MIN_PASSWORD_LENGTH };
