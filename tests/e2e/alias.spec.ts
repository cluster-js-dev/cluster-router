import { test, expect } from "./fixtures";

import { setup, navigate, pageContent, currentPath, routeAlias } from "./tools";

test.describe("Route aliases", () => {
  test("goTo(alias) navigates to the correct page (@ClPage alias)", async ({
    page,
  }) => {
    await setup(page);
    await navigate(page, "about");
    expect(await pageContent(page)).toBe("About Page");
  });

  test("goTo(alias) sets the URL to the actual route path", async ({
    page,
  }) => {
    await setup(page);
    await navigate(page, "about");
    expect(await currentPath(page)).toBe("/about");
  });

  test("goTo(alias) works for root path alias", async ({ page }) => {
    await setup(page);
    await navigate(page, "/about");
    await navigate(page, "home");
    expect(await pageContent(page)).toBe("Home Page");
    expect(await currentPath(page)).toBe("/");
  });

  test("goTo(alias) works for manual this.routes alias", async ({ page }) => {
    await setup(page);
    await navigate(page, "not-found");
    expect(await pageContent(page)).toBe("Not Found Page");
  });

  test("goTo(path) still works when alias exists for same route", async ({
    page,
  }) => {
    await setup(page);
    await navigate(page, "/about");
    expect(await pageContent(page)).toBe("About Page");
  });

  test("currentAlias is set after navigating to aliased route", async ({
    page,
  }) => {
    await setup(page);
    await navigate(page, "/about");
    expect(await routeAlias(page)).toBe("about");
  });

  test("currentAlias is undefined for routes without alias", async ({
    page,
  }) => {
    await setup(page);
    await navigate(page, "/with-props");
    expect(await routeAlias(page)).toBeUndefined();
  });

  test("currentAlias updates on each navigation", async ({ page }) => {
    await setup(page);
    await navigate(page, "/about");
    expect(await routeAlias(page)).toBe("about");
    await navigate(page, "/with-props");
    expect(await routeAlias(page)).toBeUndefined();
    await navigate(page, "home");
    expect(await routeAlias(page)).toBe("home");
  });

  test("currentAlias is accessible in the page body via aliasDisplay getter", async ({
    page,
  }) => {
    await setup(page);
    await navigate(page, "/alias-page");
    expect(await pageContent(page)).toBe("Alias Page");
    const aliasEl = await page.evaluate(() => {
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
      return deepQuery(document, "#route-alias")?.textContent ?? null;
    });
    expect(aliasEl).toBe("alias-test");
  });

  test("goTo(alias) with keepHistory=false replaces current history entry", async ({
    page,
  }) => {
    await setup(page);
    // history: [/, /about, /alias-page]
    await navigate(page, "/about", true);
    await navigate(page, "/alias-page", true);
    // replace /alias-page with / via alias → history: [/, /about, /]
    await navigate(page, "home", false);
    expect(await currentPath(page)).toBe("/");
    // goBack skips the replaced entry and lands on /about
    await page.goBack();
    await page.waitForTimeout(300);
    expect(await currentPath(page)).toBe("/about");
  });
});
