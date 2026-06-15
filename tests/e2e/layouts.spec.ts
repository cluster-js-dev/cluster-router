import { test, expect } from "@playwright/test";

import { setup, navigate, layoutId } from "./tools";

test.describe("Layouts", () => {
  test("default layout has no layout-id marker", async ({ page }) => {
    await setup(page);
    expect(await layoutId(page)).toBeNull();
  });

  test("admin layout renders layout-id marker", async ({ page }) => {
    await setup(page);
    await navigate(page, "/dashboard");
    expect(await layoutId(page)).toBe("admin");
  });

  test("switching from default to admin layout changes the layout", async ({
    page,
  }) => {
    await setup(page);
    expect(await layoutId(page)).toBeNull();
    await navigate(page, "/dashboard");
    expect(await layoutId(page)).toBe("admin");
  });

  test("switching from admin layout back to default removes marker", async ({
    page,
  }) => {
    await setup(page);
    await navigate(page, "/dashboard");
    expect(await layoutId(page)).toBe("admin");
    await navigate(page, "/");
    expect(await layoutId(page)).toBeNull();
  });
});
