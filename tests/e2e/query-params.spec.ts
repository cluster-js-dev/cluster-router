import { test, expect } from "./fixtures";

import {
  setup,
  navigate,
  navigateWithParams,
  currentPath,
  queryShadowText,
} from "./tools";

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
    const content = await queryShadowText(page, "#page-content");
    expect(content).toBe("About Page");
  });
});
