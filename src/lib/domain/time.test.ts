import { describe, expect, it } from "vitest";
import { addMonths, monthOf, serviceYearMonths, serviceYearOf } from "./time";
import { displayEnd, reportWindow, windowState } from "./window";

const iso = (d: Date) => d.toISOString();

describe("service year", () => {
  it("runs September to August", () => {
    expect(serviceYearOf("2026-09-01")).toBe("2026-2027");
    expect(serviceYearOf("2027-08-01")).toBe("2026-2027");
    expect(serviceYearOf("2026-08-01")).toBe("2025-2026");
  });
  it("lists twelve months", () => {
    const m = serviceYearMonths("2026-2027");
    expect(m).toHaveLength(12);
    expect(m[0]).toBe("2026-09-01");
    expect(m[11]).toBe("2027-08-01");
  });
  it("adds months across year ends", () => {
    expect(addMonths("2026-12-01", 1)).toBe("2027-01-01");
    expect(addMonths("2026-01-01", -1)).toBe("2025-12-01");
  });
});

describe("Nairobi month", () => {
  it("uses Nairobi time, not UTC, around midnight", () => {
    expect(monthOf(new Date("2026-08-31T20:59:59Z"))).toBe("2026-08-01");
    expect(monthOf(new Date("2026-08-31T21:00:00Z"))).toBe("2026-09-01");
  });
});

describe("report window (PRD §6.2 worked example)", () => {
  it("August 2026 opens 31 Aug, on time until 10 Sep, late until 30 Sep", () => {
    const w = reportWindow("2026-08-01");
    expect(iso(w.opens)).toBe("2026-08-30T21:00:00.000Z");
    expect(iso(w.onTimeUntil)).toBe("2026-09-10T21:00:00.000Z");
    expect(iso(w.lateUntil)).toBe("2026-09-30T21:00:00.000Z");
  });
  it("September 2026 opens 30 Sep, on time until 10 Oct, late until 31 Oct", () => {
    const w = reportWindow("2026-09-01");
    expect(iso(w.opens)).toBe("2026-09-29T21:00:00.000Z");
    expect(iso(w.onTimeUntil)).toBe("2026-10-10T21:00:00.000Z");
    expect(iso(w.lateUntil)).toBe("2026-10-31T21:00:00.000Z");
  });
  it("October 2026 opens 31 Oct, on time until 10 Nov, late until 30 Nov", () => {
    const w = reportWindow("2026-10-01");
    expect(iso(w.opens)).toBe("2026-10-30T21:00:00.000Z");
    expect(iso(w.onTimeUntil)).toBe("2026-11-10T21:00:00.000Z");
    expect(iso(w.lateUntil)).toBe("2026-11-30T21:00:00.000Z");
  });
  it("handles leap-year February and the December-January boundary", () => {
    expect(iso(reportWindow("2028-02-01").opens)).toBe("2028-02-28T21:00:00.000Z");
    expect(iso(reportWindow("2026-12-01").lateUntil)).toBe("2027-01-31T21:00:00.000Z");
  });
  it("classifies boundary moments exactly", () => {
    const w = reportWindow("2026-08-01");
    expect(windowState(new Date("2026-08-30T20:59:59Z"), w)).toBe("not_open");
    expect(windowState(new Date("2026-08-30T21:00:00Z"), w)).toBe("on_time");
    expect(windowState(new Date("2026-09-10T20:59:59Z"), w)).toBe("on_time"); // 23:59:59 on the 10th
    expect(windowState(new Date("2026-09-10T21:00:00Z"), w)).toBe("late"); // 00:00:00 on the 11th
    expect(windowState(new Date("2026-09-30T20:59:59Z"), w)).toBe("late");
    expect(windowState(new Date("2026-09-30T21:00:00Z"), w)).toBe("closed");
  });
  it("shows 23:59 as the end", () => {
    expect(iso(displayEnd(reportWindow("2026-08-01").onTimeUntil))).toBe("2026-09-10T20:59:00.000Z");
  });
  it("respects changed settings", () => {
    const w = reportWindow("2026-08-01", { onTimeDay: 5, lateWindowMonths: 2 });
    expect(iso(w.onTimeUntil)).toBe("2026-09-05T21:00:00.000Z");
    expect(iso(w.lateUntil)).toBe("2026-10-31T21:00:00.000Z");
  });
});
