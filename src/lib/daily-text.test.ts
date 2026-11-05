import { describe, expect, it } from "vitest";
import { dailyTextFor, dayPart, nairobiNow, verseSize } from "./daily-text";

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

describe("dailyTextFor", () => {
  it("has an entry for every day of 2026", () => {
    for (let d = new Date(Date.UTC(2026, 0, 1)); d.getUTCFullYear() === 2026; d.setUTCDate(d.getUTCDate() + 1)) {
      const entry = dailyTextFor(d.toISOString().slice(0, 10));
      expect(entry, d.toISOString().slice(0, 10)).not.toBeNull();
      expect(entry!.text.length).toBeGreaterThan(7);
      expect(entry!.ref).toMatch(/\d/);
    }
  });
  it("returns null for a year that is not loaded", () => {
    expect(dailyTextFor("2031-01-01")).toBeNull();
  });
});

describe("verseSize", () => {
  it("shrinks with length", () => {
    expect([20, 100, 200].map(verseSize)).toEqual(["lg", "md", "sm"]);
  });
});
