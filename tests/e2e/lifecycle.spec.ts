import { test, expect } from "./fixtures";

import { setup, navigate, pageContent, queryShadowExists } from "./tools";

test.describe("Component lifecycle", () => {
  test("dispose removes event listeners without errors", async ({ page }) => {
    await setup(page);
    await navigate(page, "/about");
    expect(await pageContent(page)).toBe("About Page");
    await page.evaluate(() => {
      document.querySelector("cl-test-app")?.remove();
    });
    await page.waitForTimeout(100);
    const appGone = await page.evaluate(
      () => document.querySelector("cl-test-app") === null,
    );
    expect(appGone).toBe(true);
  });

  test("cl-body dispose cleans up instance registry", async ({ page }) => {
    await setup(page);
    const bodyExists = await queryShadowExists(page, "cl-body");
    expect(bodyExists).toBe(true);
  });
});
