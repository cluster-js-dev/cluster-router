import { Page } from "@playwright/test";

export async function setup(page: Page): Promise<void> {
  await page.goto("http://localhost:8080/");
  await page.waitForTimeout(400);
}

export async function navigate(
  page: Page,
  path: string,
  keepHistory = true,
): Promise<void> {
  await page.evaluate(
    ({ p, k }: { p: string; k: boolean }) => {
      window.testApp.navigate(p, k);
    },
    { p: path, k: keepHistory },
  );
  await page.waitForTimeout(250);
}

export async function navigateWithParams(
  page: Page,
  path: string,
  params: Record<string, string>,
): Promise<void> {
  await page.evaluate(
    ({ p, params }: { p: string; params: Record<string, string> }) => {
      window.testApp.navigateWithParams(p, params);
    },
    { p: path, params },
  );
  await page.waitForTimeout(250);
}

export async function pageContent(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    function deepQuery(
      root: Document | ShadowRoot,
      sel: string,
    ): Element | null {
      const direct = root.querySelector(sel);
      if (direct) return direct;
      for (const el of root.querySelectorAll("*")) {
        if (el.shadowRoot) {
          const found = deepQuery(el.shadowRoot, sel);
          if (found) return found;
        }
      }
      return null;
    }
    return deepQuery(document, "#page-content")?.textContent ?? null;
  });
}

export async function layoutId(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    function deepQuery(
      root: Document | ShadowRoot,
      sel: string,
    ): Element | null {
      const direct = root.querySelector(sel);
      if (direct) return direct;
      for (const el of root.querySelectorAll("*")) {
        if (el.shadowRoot) {
          const found = deepQuery(el.shadowRoot, sel);
          if (found) return found;
        }
      }
      return null;
    }
    return deepQuery(document, "#layout-id")?.textContent ?? null;
  });
}

export async function currentPath(page: Page): Promise<string> {
  return page.evaluate(() => window.location.pathname + window.location.search);
}

export async function routeAlias(page: Page): Promise<string | undefined> {
  return page.evaluate(() => window.testApp.getAlias());
}
