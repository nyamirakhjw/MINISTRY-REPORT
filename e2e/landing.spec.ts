import { expect, test, type ConsoleMessage } from "@playwright/test";

// Landing redesign (PRD v1.1 §11.2). Runs against a built app, like public.spec.ts.

test.describe("landing page", () => {
  test("shows the hero, the ribbon demo, the steps and the privacy facts, with no console problems", async ({ page }) => {
    const problems: string[] = [];
    page.on("console", (m: ConsoleMessage) => { if (["error", "warning"].includes(m.type())) problems.push(`${m.type()}: ${m.text()}`); });
    page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Request access" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "How it works" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Private by design" })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test("ribbon demo: adds time, stops at the goal, announces it, and can start again (keyboard only)", async ({ page }) => {
    await page.goto("/");
    const bar = page.getByRole("progressbar", { name: "Try the hours ribbon" });
    await expect(bar).toHaveAttribute("aria-valuetext", "38 of 50 hours, 76 percent");
    const add = page.getByRole("button", { name: "Add 2 hours" });
    await add.focus();
    for (let i = 0; i < 6; i++) await page.keyboard.press("Enter");
    await expect(bar).toHaveAttribute("aria-valuetext", "50 of 50 hours, 100 percent");
    await expect(add).toBeDisabled();
    await expect(page.getByText("Goal reached").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Start again" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(bar).toHaveAttribute("aria-valuetext", "38 of 50 hours, 76 percent");
  });

  test("reduced motion: everything is visible at once and the demo still updates", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    const animating = await page.evaluate(() =>
      document.getAnimations().filter((a) => a.effect && (a.effect as KeyframeEffect).getKeyframes().some((k) => "transform" in k || "clipPath" in k)).length);
    expect(animating).toBe(0);
    await expect(page.getByRole("heading", { name: "How it works" })).toBeVisible();
    await page.getByRole("button", { name: "Add 2 hours" }).click();
    await expect(page.getByRole("progressbar", { name: "Try the hours ribbon" })).toHaveAttribute("aria-valuenow", "80");
    await context.close();
  });

  test("works without JavaScript: all content is readable", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Private by design" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "How it works" })).toBeVisible();
    await context.close();
  });

  test("the public-page shortcut in the proxy never exposes a private area", async ({ request }) => {
    for (const path of ["/app", "/admin", "/platform", "/pending", "/mfa/verify"]) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect([301, 302, 303, 307, 308], `${path} should redirect when signed out`).toContain(res.status());
      expect(res.headers()["location"] ?? "").toContain("/signin");
    }
  });

  test("the landing page does not scroll sideways at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/");
    const [scroll, client] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    expect(scroll).toBeLessThanOrEqual(client);
  });
});
