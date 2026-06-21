import { Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Shadow DOM query helpers
// deepQuery is defined inside each page.evaluate() because evaluate() serialises
// the callback and sends it to the browser — it cannot reference Node imports.
// These two helpers centralise the definition so no spec file needs its own copy.
// ---------------------------------------------------------------------------

/** Returns the text content of the first shadow-DOM match, or null if not found. */
export async function queryShadowText(
  page: Page,
  sel: string,
): Promise<string | null> {
  return page.evaluate((s: string) => {
    function dq(root: Document | ShadowRoot, sel: string): Element | null {
      const el = root.querySelector(sel);
      if (el) return el;
      for (const child of root.querySelectorAll("*")) {
        if (child.shadowRoot) {
          const found = dq(child.shadowRoot, sel);
          if (found) return found;
        }
      }
      return null;
    }
    return dq(document, s)?.textContent ?? null;
  }, sel);
}

/** Returns true if at least one shadow-DOM element matches the selector. */
export async function queryShadowExists(
  page: Page,
  sel: string,
): Promise<boolean> {
  return page.evaluate((s: string) => {
    function dq(root: Document | ShadowRoot, sel: string): Element | null {
      const el = root.querySelector(sel);
      if (el) return el;
      for (const child of root.querySelectorAll("*")) {
        if (child.shadowRoot) {
          const found = dq(child.shadowRoot, sel);
          if (found) return found;
        }
      }
      return null;
    }
    return dq(document, s) !== null;
  }, sel);
}

// ---------------------------------------------------------------------------
// Test lifecycle helpers
// ---------------------------------------------------------------------------

export async function setup(page: Page): Promise<void> {
  await page.goto("/");
  // Poll until ClTestApp.afterRender() has run and set window.testApp.
  await page.waitForFunction(
    () => typeof (window as { testApp?: unknown }).testApp !== "undefined",
  );
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
  // Three rAF ticks cover: single-render (1), layout-switch double-render (2),
  // plus one buffer frame for shadow DOM propagation.
  await page.waitForFunction(
    () =>
      new Promise<boolean>((r) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => r(true))),
        ),
      ),
  );
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
  await page.waitForFunction(
    () =>
      new Promise<boolean>((r) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => r(true))),
        ),
      ),
  );
}

export async function pageContent(page: Page): Promise<string | null> {
  return queryShadowText(page, "#page-content");
}

export async function layoutId(page: Page): Promise<string | null> {
  return queryShadowText(page, "#layout-id");
}

export async function currentPath(page: Page): Promise<string> {
  return page.evaluate(() => window.location.pathname + window.location.search);
}

export async function routeAlias(page: Page): Promise<string | undefined> {
  return page.evaluate(() => window.testApp.getAlias());
}
