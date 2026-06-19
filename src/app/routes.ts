import { ClBaseLayout } from "./cl-base-layout";
import { ClBasePage } from "./cl-base-page";

/** Zero-argument factory for lazy-loaded pages. Must resolve to `{ default: typeof ClBasePage }`. */
export type PageFactory = () => Promise<{ default: typeof ClBasePage }>;

/** Shape for URL parameters extracted by `URLInfoService.matchRoute()`. */
export type RouteParams = Record<string, any>;

/**
 * Configuration for a single route entry.
 *
 * Execution order inside `ClBaseApp._loadPageAsync()`:
 *   1. `props()` — data resolver, runs first
 *   2. `onBefore()` — access guard, runs after props
 *   3. Page class resolution (direct or via PageFactory)
 */
export type RouteData<P extends RouteParams = RouteParams> = {
  /** Page class to render, or a `PageFactory` for lazy loading. */
  page: typeof ClBasePage | PageFactory;
  /** Layout to use for this route. Defaults to `ClBaseLayout`. A layout change costs an extra render cycle. */
  layout?: typeof ClBaseLayout;
  /** Name of the `<cl-body>` outlet to render into. Defaults to `"default"`. */
  outlet?: string;
  /** Reserved for future transition animations. Not yet consumed by the router. */
  transition?: string;
  /**
   * Symbolic name for this route. Allows navigating via `router.goTo("alias")` instead of the full URL.
   * Also exposed as `this.currentAlias` inside `ClBasePage` for in-component validations.
   */
  alias?: string;
  /**
   * Navigation guard. Return `true` to allow, `false` to cancel silently, or throw to trigger `onRouteError`.
   * Receives URL params (typed by `URLInfoService.matchRoute()`). Runs AFTER `props`.
   */
  onBefore?: (params: P | null) => Promise<boolean>;
  /**
   * Data resolver. Return value is spread as props into the page via `ClBase.dynamic({ props })`.
   * Receives URL params. Runs BEFORE `onBefore`.
   */
  props?: (params: P | null) => Promise<Record<string, any>>;
};

/**
 * Route map passed to `ClBaseApp.routes` or built from the `@ClPage` registry.
 * Keys are URL patterns recognized by `URLInfoService.matchRoute()`.
 * The special key `"/404"` is rendered when no other pattern matches.
 */
export interface Routes {
  [key: string]: RouteData<any> | undefined;
  "/404"?: RouteData<any>;
}
