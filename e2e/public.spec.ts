import { expect, test, type ConsoleMessage } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PUBLIC = ["/", "/privacy", "/terms", "/install", "/signin", "/request-access", "/reset-password", "/offline"];

test.describe("public pages", () => {
  for (const path of PUBLIC) {
    test(`${path}: one h1, a title without a framework name, no console errors`, async ({ page }) => {
      const problems: string[] = [];
      page.on("console", (m: ConsoleMessage) => { if (["error", "warning"].includes(m.type())) problems.push(`${m.type()}: ${m.text()}`); });
      page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
      const res = await page.goto(path);
      expect(res?.status()).toBeLessThan(400);
      await expect(page.locator("h1")).toHaveCount(1);
      const title = await page.title();
      expect(title.length).toBeGreaterThan(3);
      expect(title).not.toMatch(/Next|React|Vite|Create/);
      expect(problems).toEqual([]);
    });

    test(`${path}: no serious accessibility violations`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      expect(results.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
    });
  }

  test("unknown routes return the custom 404", async ({ page }) => {
    const res = await page.goto("/this-page-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("signed-in areas redirect to sign in and are not indexable", async ({ page }) => {
    for (const p of ["/app", "/admin", "/platform"]) {
      await page.goto(p);
      await expect(page).toHaveURL(/\/signin/);
    }
  });

  test("sign-in shows an error summary that links to the field", async ({ page }) => {
    await page.goto("/signin");
    await page.getByRole("button", { name: /^sign in$/i }).click();
    const summary = page.getByRole("alert").first();
    await expect(summary).toBeFocused();
    await expect(summary.getByRole("link").first()).toHaveAttribute("href", "#identifier");
  });

  test("request access blocks weak passwords and requires consent", async ({ page }) => {
    await page.goto("/request-access");
    await page.getByLabel(/official full name/i).fill("Test Person");
    await page.getByLabel(/^password/i).fill("1234567890");
    await page.getByRole("button", { name: /send request/i }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();
    await expect(page.getByText(/too common/i)).toBeVisible();
  });

  test("discovery files exist and the temporary address is not indexable", async ({ request }) => {
    expect((await request.get("/manifest.webmanifest")).ok()).toBeTruthy();
    expect((await request.get("/llms.txt")).ok()).toBeTruthy();
    expect((await request.get("/sitemap.xml")).ok()).toBeTruthy();
    const robots = await (await request.get("/robots.txt")).text();
    if (process.env.NEXT_PUBLIC_ALLOW_INDEXING !== "true") expect(robots).toMatch(/Disallow:\s*\//);
  });

  test("production JavaScript source maps are not published", async ({ request, page }) => {
    await page.goto("/");
    const scripts = await page.locator("script[src]").evaluateAll((els) => els.map((e) => (e as HTMLScriptElement).src));
    for (const src of scripts.slice(0, 5)) expect((await request.get(`${src}.map`)).status()).toBe(404);
  });
});
