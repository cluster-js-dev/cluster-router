import { test, expect } from "./fixtures";

import { setup, navigate, navigateWithParams, currentPath } from "./tools";

test.describe("Query parameters", () => {
  test("navigation with a single param encodes query string", async ({
    page,
  }) => {
    await setup(page);
    await navigateWithParams(page, "/about", { tab: "info" });
    expect(await currentPath(page)).toBe("/about?tab=info");
  });

  test("navigation with multiple params builds correct query string", async ({
    page,
  }) => {
    await setup(page);
    await navigateWithParams(page, "/about", { tab: "info", lang: "en" });
    const url = await currentPath(page);
    expect(url).toContain("tab=info");
    expect(url).toContain("lang=en");
    expect(url).toContain("/about?");
  });

  test("special characters in param values are URL-encoded", async ({
    page,
  }) => {
    await setup(page);
    await navigateWithParams(page, "/about", { q: "hello world" });
    expect(await currentPath(page)).toBe("/about?q=hello%20world");
  });

  test("special characters in param keys are URL-encoded", async ({ page }) => {
    await setup(page);
    await navigateWithParams(page, "/about", { "my key": "val" });
    expect(await currentPath(page)).toContain("my%20key=val");
  });

  test("navigation without params has no query string", async ({ page }) => {
    await setup(page);
    await navigate(page, "/about");
    expect(await currentPath(page)).toBe("/about");
  });

  test("page still renders correctly after navigation with params", async ({
    page,
  }) => {
    await setup(page);
    await navigateWithParams(page, "/about", { tab: "info" });
    const content = await page.evaluate(() => {
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
      return deepQuery(document, "#page-content")?.textContent ?? null;
    });
    expect(content).toBe("About Page");
  });
});
