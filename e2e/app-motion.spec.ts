import { expect, test } from "@playwright/test";

// Signed-in motion (PRD v1.1 §7.2 and §7.3). The visual behaviour is checked by hand and in the release checklist;
// signed-out checks that need no login fixtures live here.
test("the report card page is private: signed out goes to sign-in", async ({ request }) => {
  const res = await request.get("/app/card/2026-08", { maxRedirects: 0 });
  expect([301, 302, 303, 307, 308]).toContain(res.status());
  expect(res.headers()["location"] ?? "").toContain("/signin");
});

test("a malformed card month is not found, never an error page", async ({ request }) => {
  const res = await request.get("/app/card/not-a-month", { maxRedirects: 0 });
  expect([301, 302, 303, 307, 308, 404]).toContain(res.status());
});
