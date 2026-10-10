import { describe, expect, it } from "vitest";
import { carryoverMonth, floorHours, formatHMS, leftoverSeconds, ribbonState } from "./log";

describe("log formatting", () => {
  it("formats H:MM and floors to whole hours", () => {
    expect(formatHMS(3695)).toBe("1:01");
    expect(formatHMS(59)).toBe("0:00");
    expect(floorHours(3695)).toBe(1);
    expect(leftoverSeconds(3695)).toBe(95);
  });
});

describe("ribbon state", () => {
  it("never divides by zero when there is no goal", () => {
    expect(ribbonState(3600, null)).toMatchObject({ percent: 0, goalReached: false });
    expect(ribbonState(3600, 0)).toMatchObject({ percent: 0, goalReached: false });
  });
  it("clamps at 100% and flags the goal as reached", () => {
    const r = ribbonState(60 * 3600, 50);
    expect(r.percent).toBe(100);
    expect(r.goalReached).toBe(true);
  });
  it("computes a proportional percent below goal", () => {
    expect(ribbonState(38 * 3600, 50).percent).toBe(76);
  });
});

describe("carry-over note", () => {
  it("reads back the target month, and rejects anything else", () => {
    expect(carryoverMonth("carryover:2026-08")).toBe("2026-08-01");
    expect(carryoverMonth("a private note")).toBeNull();
    expect(carryoverMonth(null)).toBeNull();
  });
});
