import { describe, expect, it } from "vitest";
import { countWords, commentError } from "./words";
import { isCommonPassword, passwordProblem, passwordStrength } from "./password";
import { normalizeUsername, usernameProblem } from "./username";
import { normalizeDbError } from "./categories";
import { summarizeMonth, type MonthRow } from "./summarize";

describe("comment words", () => {
  it("counts words split by spaces and line breaks", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("  one two\nthree  ")).toBe(3);
  });
  it("accepts the 50th word and blocks the 51st", () => {
    expect(commentError(Array(50).fill("a").join(" "))).toBeNull();
    expect(commentError(Array(51).fill("a").join(" "))).toBe("too_many_words");
  });
});

describe("passwords", () => {
  it("needs 10 characters and has no composition rules", () => {
    expect(passwordProblem("short")).toBe("too_short");
    expect(passwordProblem("correcthorsebattery")).toBeNull();
  });
  it("rejects very common passwords, including congregation-specific guesses", () => {
    expect(isCommonPassword("1234567890")).toBe(true);
    expect(isCommonPassword("Jehovah123")).toBe(true);
    expect(passwordProblem("qwertyuiop")).toBe("too_common");
  });
  it("scores strength", () => {
    expect(passwordStrength("short")).toBe(0);
    expect(passwordStrength("longenoughpassphrase!")).toBeGreaterThanOrEqual(2);
  });
});

describe("usernames", () => {
  it("normalizes case and validates", () => {
    expect(normalizeUsername("  Grace.W ")).toBe("grace.w");
    expect(usernameProblem("ab")).toBe("invalid");
    expect(usernameProblem("Has Space")).toBe("invalid");
    expect(usernameProblem("Admin")).toBe("reserved");
    expect(usernameProblem("grace_w-1")).toBeNull();
  });
});

describe("database error mapping", () => {
  it("passes known codes and hides everything else", () => {
    expect(normalizeDbError("window_closed")).toBe("window_closed");
    expect(normalizeDbError('permission denied for table "x"')).toBe("unknown");
    expect(normalizeDbError(undefined)).toBe("unknown");
  });
});

describe("month summary", () => {
  const rows: MonthRow[] = [
    { member_id: "1", group_id: "g1", status: "submitted", category: "publisher", participated: true, hours: null, studies: 2, is_late: false },
    { member_id: "2", group_id: "g1", status: "submitted", category: "regular_pioneer", participated: true, hours: 50, studies: 3, is_late: true },
    { member_id: "3", group_id: "g2", status: "submitted", category: "publisher", participated: false, hours: null, studies: 0, is_late: false },
    { member_id: "4", group_id: "g2", status: "not_reported", category: null, participated: null, hours: null, studies: null, is_late: false },
    { member_id: "5", group_id: "g2", status: "missing", category: null, participated: null, hours: null, studies: null, is_late: false },
  ];
  it("counts only submitted reports and treats closed months as did not report", () => {
    const s = summarizeMonth(rows);
    expect(s).toMatchObject({ obligated: 5, reported: 3, notYet: 1, closed: 1, late: 1, totalHours: 50, totalStudies: 5, participants: 2, reportingPercent: 60 });
    expect(s.byCategory.regular_pioneer).toEqual({ reporting: 1, hours: 50, studies: 3 });
    expect(s.byCategory.publisher.reporting).toBe(2);
  });
  it("handles an empty month", () => {
    expect(summarizeMonth([]).reportingPercent).toBe(0);
  });
});
