import { test, expect } from "@playwright/test";

import { setup, navigate, pageContent } from "./tools";

test.describe("Self-registering routes via @ClPage", () => {
  test("page with single @ClPage url is automatically routable", async ({
    page,
  }) => {
    await setup(page);
    await navigate(page, "/about");
    expect(await pageContent(page)).toBe("About Page");
  });

  test("page with multiple urls in page[] is reachable from each", async ({
    page,
  }) => {
    await setup(page);
    await navigate(page, "/contact");
    expect(await pageContent(page)).toBe("Contact Page");
    await navigate(page, "/reach");
    expect(await pageContent(page)).toBe("Contact Page");
  });

  test("all @ClPage routes and manual routes are available", async ({
    page,
  }) => {
    await setup(page);

    await navigate(page, "/");
    expect(await pageContent(page)).toBe("Home Page");

    await navigate(page, "/about");
    expect(await pageContent(page)).toBe("About Page");

    await navigate(page, "/dashboard");
    expect(await pageContent(page)).toBe("Dashboard Page");

    await navigate(page, "/404");
    expect(await pageContent(page)).toBe("Not Found Page");
  });

  test("manual routes in this.routes override registry for same url", async ({
    page,
  }) => {
    await setup(page);
    // /404 is in both registry (if declared) and this.routes — manual wins
    await navigate(page, "/404");
    expect(await pageContent(page)).toBe("Not Found Page");
  });

  test("page[] with layout uses the declared layout", async ({ page }) => {
    await setup(page);
    await navigate(page, "/dashboard");
    const id = await page.evaluate(() => {
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
      return deepQuery(document, "#layout-id")?.textContent ?? null;
    });
    expect(id).toBe("admin");
  });
});
