import { test, expect } from "./fixtures";

import { setup, navigate, pageContent, queryShadowText } from "./tools";

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
    await navigate(page, "/404");
    expect(await pageContent(page)).toBe("Not Found Page");
  });

  test("page[] with layout uses the declared layout", async ({ page }) => {
    await setup(page);
    await navigate(page, "/dashboard");
    const id = await queryShadowText(page, "#layout-id");
    expect(id).toBe("admin");
  });
});
