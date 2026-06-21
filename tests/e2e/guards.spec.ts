import { test, expect } from "./fixtures";

import { setup, navigate, pageContent, queryShadowText } from "./tools";

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
    const errorText = await queryShadowText(page, "h1");
    expect(errorText).toBe("Navigation error");
  });
});
