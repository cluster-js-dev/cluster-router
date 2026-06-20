import { test as base, expect } from "@playwright/test";

export { expect };

export const test = base.extend<object, object>({
  page: async ({ page }, use) => {
    await use(page);
  },
});
