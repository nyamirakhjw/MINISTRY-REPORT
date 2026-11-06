import { describe, expect, it } from "vitest";
import { dayPart, daysLeftInMonth, formatLongDate, nairobiNow, paceHoursPerDay } from "./nairobi";

describe("dayPart", () => {
  it("splits the day at 05:00, 12:00 and 17:00", () => {
    expect([4, 5, 11, 12, 16, 17, 23, 0].map(dayPart)).toEqual([
      "evening", "morning", "morning", "afternoon", "afternoon", "evening", "evening", "evening",
    ]);
  });
});

describe("nairobiNow", () => {
  it("is three hours ahead of UTC and rolls the date over", () => {
    expect(nairobiNow(new Date("2026-11-05T20:59:00Z"))).toEqual({ date: "2026-11-05", hour: 23 });
    expect(nairobiNow(new Date("2026-11-05T21:00:00Z"))).toEqual({ date: "2026-11-06", hour: 0 });
  });
});

describe("formatLongDate", () => {
  it("writes the weekday, day, month and year", () => {
    expect(formatLongDate("2026-11-05", "en")).toMatch(/^Thursday,? 5 November 2026$/); // the comma depends on the ICU version
    expect(formatLongDate("2026-11-05", "sw")).toContain("2026");
  });
});

describe("pace", () => {
  it("counts the days left, including today", () => {
    expect(daysLeftInMonth("2026-11-05")).toBe(26);
    expect(daysLeftInMonth("2026-02-28")).toBe(1);
  });
  it("rounds up to half an hour and hides silly figures", () => {
    expect(paceHoursPerDay(48, 26)).toBe(2);
    expect(paceHoursPerDay(30, 20)).toBe(1.5);
    expect(paceHoursPerDay(0, 10)).toBeNull();
    expect(paceHoursPerDay(100, 2)).toBeNull();
  });
});
