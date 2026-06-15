import { test as base, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

export { expect };

export const test = base.extend<object, object>({
  page: async ({ page }, use) => {
    await use(page);
    const coverage = await page
      .evaluate(() => (window as { __coverage__?: unknown }).__coverage__)
      .catch(() => null);
    if (coverage) {
      const dir = path.resolve(process.cwd(), ".nyc_output");
      fs.mkdirSync(dir, { recursive: true });
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      fs.writeFileSync(
        path.join(dir, `coverage-${id}.json`),
        JSON.stringify(coverage),
      );
    }
  },
});
