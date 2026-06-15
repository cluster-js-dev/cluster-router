import { test, expect } from "@playwright/test";

import { setup, navigate, pageContent } from "./tools";

test.describe("404 and not-found handling", () => {
  test("unknown route shows not-found page", async ({ page }) => {
    await setup(page);
    await navigate(page, "/does-not-exist");
    expect(await pageContent(page)).toBe("Not Found Page");
  });

  test("explicit /404 route shows not-found page", async ({ page }) => {
    await setup(page);
    await navigate(page, "/404");
    expect(await pageContent(page)).toBe("Not Found Page");
  });

  test("deeply unknown route shows not-found page", async ({ page }) => {
    await setup(page);
    await navigate(page, "/a/b/c/d");
    expect(await pageContent(page)).toBe("Not Found Page");
  });

  test("navigating after 404 works correctly", async ({ page }) => {
    await setup(page);
    await navigate(page, "/unknown");
    expect(await pageContent(page)).toBe("Not Found Page");
    await navigate(page, "/about");
    expect(await pageContent(page)).toBe("About Page");
  });

  test("navigating from valid page to unknown shows not-found", async ({
    page,
  }) => {
    await setup(page);
    await navigate(page, "/about");
    expect(await pageContent(page)).toBe("About Page");
    await navigate(page, "/missing");
    expect(await pageContent(page)).toBe("Not Found Page");
  });
});
