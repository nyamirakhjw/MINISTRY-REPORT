// AUTH-03: at least 10 characters, no composition rules, a strength meter, and a common-password check.
export const MIN_PASSWORD_LENGTH = 10;

const COMMON = new Set([
  "1234567890", "0123456789", "12345678910", "1234567891", "password12", "password123", "password1234", "passw0rd123",
  "qwertyuiop", "qwerty1234", "qwerty12345", "1q2w3e4r5t", "1qaz2wsx3edc", "abcdefghij", "abcd123456", "iloveyou123",
  "welcome123", "welcome1234", "letmein123", "administrator", "changeme123", "trustno1234", "monkey12345", "dragon12345",
  "jehovah123", "jehovah1234", "jehovahgod", "jwnyamira", "nyamira123", "nyamira1234", "kingdomhall", "kingdomhall1",
  "ministry123", "ministryreport", "kenya12345", "nairobi123", "0000000000", "1111111111", "aaaaaaaaaa", "asdfghjkl1",
]);

export function isCommonPassword(pw: string): boolean {
  const p = pw.toLowerCase();
  if (COMMON.has(p)) return true;
  return /^(.)\1+$/.test(p) || /^(0123456789|1234567890|abcdefghij)/.test(p);
}

export type Strength = 0 | 1 | 2 | 3;

/** Simple, honest meter: length and variety, zero if too short or common. */
export function passwordStrength(pw: string): Strength {
  if (pw.length < MIN_PASSWORD_LENGTH || isCommonPassword(pw)) return 0;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  const score = (pw.length >= 14 ? 2 : pw.length >= 12 ? 1 : 0) + (kinds >= 3 ? 1 : 0);
  return Math.min(3, Math.max(1, score)) as Strength;
}

export type PasswordProblem = "too_short" | "too_common" | null;
export function passwordProblem(pw: string): PasswordProblem {
  if (pw.length < MIN_PASSWORD_LENGTH) return "too_short";
  if (isCommonPassword(pw)) return "too_common";
  return null;
}
