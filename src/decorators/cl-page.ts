import { RenderTemplate } from "cluster-templates";
import { ClComponent } from "cluster-components";

import { ClBasePage } from "../app";
import { PageEntry, registerPageEntries } from "../app/page-registry";

export type { PageEntry };

/** Configuration for the `@ClPage` decorator. Extends `@ClComponent` with optional route registration. */
export interface ClPageConfig<T extends ClBasePage = ClBasePage> {
  /** Template function (same as `@ClComponent`). */
  html?: (cl: T) => RenderTemplate;
  /** CSS template function(s) (same as `@ClComponent`). */
  css?: (() => RenderTemplate) | Array<() => RenderTemplate>;
  /**
   * If provided, auto-registers this class in the global route registry for each entry.
   * `onBefore` and `props` are not available here — use manual `ClBaseApp.routes` for those.
   */
  page?: PageEntry[];
}

/**
 * Decorator for page components. Composes `@ClComponent` with optional self-registration
 * in the global route registry. The decorated class must extend `ClBasePage`.
 *
 * @param name - Custom element name (e.g. `"cl-home-page"`).
 * @param config - Optional template, CSS, and route entries.
 */
export function ClPage<T extends ClBasePage>(
  name: string,
  config: ClPageConfig<T> | undefined = undefined,
): CallableFunction {
  const baseDecorator = ClComponent(name, {
    html: config?.html,
    css: config?.css,
  });
  return function (target: typeof ClBasePage, context: ClassDecoratorContext) {
    baseDecorator(target, context);
    if (config?.page !== undefined && config.page.length > 0) {
      registerPageEntries(target, config.page);
    }
  };
}
