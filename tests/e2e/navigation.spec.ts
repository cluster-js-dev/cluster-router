import { test, expect } from "@playwright/test";

import { setup, navigate, pageContent } from "./tools";

test.describe("Navigation", () => {
  test("loads home page at /", async ({ page }) => {
    await setup(page);
    expect(await pageContent(page)).toBe("Home Page");
  });

  test("navigates to /about", async ({ page }) => {
    await setup(page);
    await navigate(page, "/about");
    expect(await pageContent(page)).toBe("About Page");
  });

  test("navigates from /about back to /", async ({ page }) => {
    await setup(page);
    await navigate(page, "/about");
    await navigate(page, "/");
    expect(await pageContent(page)).toBe("Home Page");
  });

  test("navigates to /dashboard", async ({ page }) => {
    await setup(page);
    await navigate(page, "/dashboard");
    expect(await pageContent(page)).toBe("Dashboard Page");
  });

  test("navigates to /contact (multi-url page)", async ({ page }) => {
    await setup(page);
    await navigate(page, "/contact");
    expect(await pageContent(page)).toBe("Contact Page");
  });

  test("navigates to /reach (same component as /contact)", async ({ page }) => {
    await setup(page);
    await navigate(page, "/reach");
    expect(await pageContent(page)).toBe("Contact Page");
  });

  test("multiple sequential navigations work correctly", async ({ page }) => {
    await setup(page);
    await navigate(page, "/about");
    await navigate(page, "/dashboard");
    await navigate(page, "/contact");
    expect(await pageContent(page)).toBe("Contact Page");
  });

  test("navigating back to home after multiple pages works", async ({
    page,
  }) => {
    await setup(page);
    await navigate(page, "/about");
    await navigate(page, "/dashboard");
    await navigate(page, "/");
    expect(await pageContent(page)).toBe("Home Page");
  });
});
