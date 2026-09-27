import { z } from "zod";

const MEETING_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const timeField = (hint: string) => z.string().regex(TIME_RE, hint);

// SET-03 — Goal defaults
export const goalDefaultsSchema = z
  .object({
    regularGoalHours: z.coerce.number().int().min(1).max(744),
    specialGoalHours: z.coerce.number().int().min(1).max(744),
    auxiliaryLowerOption: z.coerce.number().int().min(1).max(744),
    auxiliaryHigherOption: z.coerce.number().int().min(1).max(744),
  })
  .refine((v) => v.auxiliaryLowerOption < v.auxiliaryHigherOption, {
    message: "The lower option must be less than the higher option.",
    path: ["auxiliaryHigherOption"],
  });
export type GoalDefaultsValues = z.infer<typeof goalDefaultsSchema>;

// SET-04 + SET-06 — Window rules and carry-over
export const windowRulesSchema = z.object({
  onTimeDay: z.coerce.number().int().min(1).max(27),
  lateWindowMonths: z.coerce.number().int().min(0).max(12),
  carryOverDefault: z.boolean(),
});
export type WindowRulesValues = z.infer<typeof windowRulesSchema>;

// SET-05 — Reminder schedule
export const reminderScheduleSchema = z.object({
  scheduleDays: z
    .string()
    .min(1, "List at least one day, separated by commas.")
    .transform((s) =>
      s
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean)
        .map(Number),
    )
    .pipe(
      z
        .array(z.number().int().min(1).max(31))
        .min(1, "List at least one day of the month."),
    ),
  finalCallHour: z.coerce.number().int().min(0).max(23),
  weeklyAfterLateWindow: z.boolean(),
  quietHoursStart: timeField("Use 24-hour time, e.g. 21:00"),
  quietHoursEnd: timeField("Use 24-hour time, e.g. 06:00"),
});
export type ReminderScheduleValues = z.infer<typeof reminderScheduleSchema>;
export type ReminderScheduleFormInput = z.input<typeof reminderScheduleSchema>;

// SET-01 (landing)
export const landingSettingsSchema = z.object({
  midweekDay: z.enum(MEETING_DAYS),
  midweekTime: timeField("Use 24-hour time, e.g. 19:00"),
  weekendDay: z.enum(MEETING_DAYS),
  weekendTime: timeField("Use 24-hour time, e.g. 09:30"),
  address: z.string().min(1, "Add the Kingdom Hall address.").max(300),
  mapLink: z
    .string()
    .url("Enter a full link starting with https://")
    .optional()
    .or(z.literal("")),
  contactLine: z.string().max(160).optional().or(z.literal("")),
});
export type LandingSettingsValues = z.infer<typeof landingSettingsSchema>;

// SET-01 (letterhead)
export const letterheadSettingsSchema = z.object({
  letterheadLines: z
    .string()
    .max(600)
    .transform((s) =>
      s
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().max(140)).max(6, "Six lines or fewer.")),
  signatoryTitle: z.string().min(1, "Add a signatory title.").max(80),
});
export type LetterheadSettingsValues = z.infer<typeof letterheadSettingsSchema>;
export type LetterheadFormInput = z.input<typeof letterheadSettingsSchema>;

// SET-02 — Groups
export const groupNameSchema = z.object({
  name: z.string().min(2, "At least 2 characters.").max(60),
});
export type GroupNameValues = z.infer<typeof groupNameSchema>;

export const MEETING_DAY_OPTIONS = MEETING_DAYS;
