// AUTH-02: 3-24 characters; lowercase letters, digits, . _ - ; unique regardless of case; reserved words blocked.
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,24}$/;
export const RESERVED_USERNAMES = [
  "admin", "administrator", "elder", "elders", "support", "root", "system", "ministry", "ministryreport",
  "platform", "owner", "help", "security", "privacy", "moderator", "servant", "nyamira", "jw", "jehovah",
];

export function normalizeUsername(v: string): string {
  return v.trim().toLowerCase();
}

export function usernameProblem(v: string): "invalid" | "reserved" | null {
  const u = normalizeUsername(v);
  if (!USERNAME_PATTERN.test(u)) return "invalid";
  if (RESERVED_USERNAMES.includes(u)) return "reserved";
  return null;
}
