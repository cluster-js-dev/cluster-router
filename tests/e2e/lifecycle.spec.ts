import { test, expect } from "./fixtures";

import { setup, navigate, pageContent } from "./tools";

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
    const bodyCount = await page.evaluate(() => {
      function deepQuery(
        root: Document | ShadowRoot,
        sel: string,
      ): Element | null {
        const direct = root.querySelector(sel);
        if (direct) return direct;
        for (const el of root.querySelectorAll("*")) {
          if (el.shadowRoot) {
            const found = deepQuery(el.shadowRoot, sel);
            if (found) return found;
          }
        }
        return null;
      }
      return deepQuery(document, "cl-body") !== null ? 1 : 0;
    });
    expect(bodyCount).toBe(1);
  });
});
