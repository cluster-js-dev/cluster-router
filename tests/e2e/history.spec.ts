import { test, expect } from "./fixtures";

import { setup, navigate, pageContent, currentPath } from "./tools";

test.describe("History management", () => {
  test("URL updates correctly on navigation", async ({ page }) => {
    await setup(page);
    await navigate(page, "/about");
    expect(await currentPath(page)).toBe("/about");
  });

  test("multiple navigations update URL correctly", async ({ page }) => {
    await setup(page);
    await navigate(page, "/about");
    await navigate(page, "/contact");
    await navigate(page, "/dashboard");
    expect(await currentPath(page)).toBe("/dashboard");
  });

  test("initial URL is /", async ({ page }) => {
    await setup(page);
    expect(await currentPath(page)).toBe("/");
  });

  test("keepHistory=true allows browser back navigation", async ({ page }) => {
    await setup(page);
    await navigate(page, "/about", true);
    expect(await pageContent(page)).toBe("About Page");
    await page.goBack();
    await page.waitForTimeout(300);
    expect(await pageContent(page)).toBe("Home Page");
  });

  test("keepHistory=false replaces current history entry", async ({ page }) => {
    await setup(page);
    await navigate(page, "/about", true);
    await navigate(page, "/contact", false);
    expect(await currentPath(page)).toBe("/contact");
    await page.goBack();
    await page.waitForTimeout(300);
    expect(await currentPath(page)).toBe("/");
  });

  test("popstate triggers re-navigation on back button", async ({ page }) => {
    await setup(page);
    await navigate(page, "/about", true);
    await navigate(page, "/contact", true);
    await page.goBack();
    await page.waitForTimeout(300);
    expect(await pageContent(page)).toBe("About Page");
  });
});
