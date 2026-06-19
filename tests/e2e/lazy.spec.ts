import { test, expect } from "./fixtures";

import { setup, navigate, pageContent, currentPath } from "./tools";

test.describe("Lazy loading (PageFactory)", () => {
  test("lazy route loads the page via PageFactory", async ({ page }) => {
    await setup(page);
    await navigate(page, "/lazy");
    expect(await pageContent(page)).toBe("About Page");
  });

  test("lazy route updates the URL correctly", async ({ page }) => {
    await setup(page);
    await navigate(page, "/lazy");
    expect(await currentPath(page)).toBe("/lazy");
  });

  test("navigation after lazy page works correctly", async ({ page }) => {
    await setup(page);
    await navigate(page, "/lazy");
    expect(await pageContent(page)).toBe("About Page");
    await navigate(page, "/");
    expect(await pageContent(page)).toBe("Home Page");
  });
});
