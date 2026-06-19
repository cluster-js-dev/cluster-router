import { test, expect } from "./fixtures";

import { setup, navigate, pageContent } from "./tools";

test.describe("Route guards and props", () => {
  test("onBefore returning false blocks navigation, page stays", async ({
    page,
  }) => {
    await setup(page);
    expect(await pageContent(page)).toBe("Home Page");
    await navigate(page, "/blocked");
    expect(await pageContent(page)).toBe("Home Page");
  });

  test("onBefore returning true allows navigation", async ({ page }) => {
    await setup(page);
    await navigate(page, "/guarded");
    expect(await pageContent(page)).toBe("About Page");
  });

  test("route with props renders the page correctly", async ({ page }) => {
    await setup(page);
    await navigate(page, "/with-props");
    expect(await pageContent(page)).toBe("About Page");
  });

  test("onBefore throwing triggers onRouteError with error content", async ({
    page,
  }) => {
    await setup(page);
    await navigate(page, "/about");
    await navigate(page, "/error-route");
    const errorText = await page.evaluate(() => {
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
      return deepQuery(document, "h1")?.textContent ?? null;
    });
    expect(errorText).toBe("Navigation error");
  });
});
