import { ClBaseLayout } from "./cl-base-layout";
import { ClBasePage } from "./cl-base-page";
import { RouteData, Routes } from "./routes";

/**
 * One URL entry in the `@ClPage` `page[]` array.
 * Supports layout, outlet, transition, and alias but NOT `onBefore` or `props`.
 * Use manual `ClBaseApp.routes` for routes that need guards or data resolvers.
 */
export interface PageEntry {
  /** URL pattern to register (e.g. `"/about"`, `"/users/{id:number}"`). */
  url: string;
  /** Layout to use for this URL. Defaults to `ClBaseLayout`. */
  layout?: typeof ClBaseLayout;
  /** Target `<cl-body>` outlet name. Defaults to `"default"`. */
  outlet?: string;
  /** Reserved for future transition animations. */
  transition?: string;
  /**
   * Symbolic name for this route. Allows navigating via `router.goTo("alias")` and
   * reading the active alias via `this.currentAlias` inside the page component.
   */
  alias?: string;
}

// Module-level registry. Populated at class-decoration time; read once on first navigation.
const _registry = new Map<string, RouteData>();

// alias → URL pattern. Populated from @ClPage entries and manual routes via registerAlias().
const _aliasMap = new Map<string, string>();

// The alias of the currently rendered route. Set by ClBaseApp before each body.render().
let _currentAlias: string | undefined;

/**
 * Called by `@ClPage` for each entry in `config.page`.
 * Later calls with the same URL silently overwrite earlier ones (last import wins).
 */
export function registerPageEntries(
  page: typeof ClBasePage,
  entries: PageEntry[],
): void {
  for (const entry of entries) {
    _registry.set(entry.url, {
      page,
      layout: entry.layout,
      outlet: entry.outlet,
      transition: entry.transition,
      alias: entry.alias,
    });
    if (entry.alias !== undefined) {
      _aliasMap.set(entry.alias, entry.url);
    }
  }
}

/**
 * Registers an alias → URL mapping. Called by `ClBaseApp._getRoutes()` for manual routes
 * that declare an `alias` in `this.routes`. Also safe to call from `@ClPage` (already done
 * inside `registerPageEntries`).
 */
export function registerAlias(alias: string, url: string): void {
  _aliasMap.set(alias, url);
}

/**
 * Resolves an alias to its registered URL pattern.
 * Returns `undefined` if the alias is not registered.
 * Called by `RouterService._getUrl()` when the input does not start with `"/"`.
 */
export function resolveAlias(alias: string): string | undefined {
  return _aliasMap.get(alias);
}

/** Sets the alias of the currently active route. Called by `ClBaseApp._loadPageAsync()` before each render. */
export function setCurrentAlias(alias: string | undefined): void {
  _currentAlias = alias;
}

/**
 * Returns the alias of the currently rendered route, or `undefined` if the route has no alias.
 * Available via `this.currentAlias` inside any `ClBasePage` subclass.
 */
export function getCurrentAlias(): string | undefined {
  return _currentAlias;
}

/**
 * Returns a read-only plain-object snapshot of the registry.
 * Called once by `ClBaseApp._getRoutes()` and merged with `this.routes`.
 */
export function buildRegistryRoutes(): Readonly<Routes> {
  return Object.fromEntries(_registry) as Readonly<Routes>;
}

/**
 * Resets all module-level registry state to empty.
 * **For unit tests only** — never call this in production code.
 */
export function _resetForTests(): void {
  _registry.clear();
  _aliasMap.clear();
  _currentAlias = undefined;
}
