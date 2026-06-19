import { Injectable } from "cluster-inject";

import { resolveAlias } from "../app/page-registry";

/**
 * Programmatic navigation service. Manages `history.pushState` / `replaceState`,
 * persists scroll position across back/forward navigation, and fires the `cl-route`
 * window event that triggers `ClBaseApp._loadPageAsync()`.
 *
 * Always navigate via this service — never dispatch `cl-route` directly.
 */
@Injectable("singleton")
export class RouterService {
  /** Navigates to `path` and pushes a new history entry. */
  public goTo(path: string): void;

  /** Navigates to `path` with query parameters appended and pushes a new history entry. */
  public goTo(path: string, params: Record<string, string>): void;

  /**
   * Navigates to `path`. When `keepHistory = false`, the current entry is replaced
   * (browser back skips the navigation). Default: `true`.
   */
  public goTo(path: string, keepHistory: boolean): void;

  /** Navigates to `path` with query parameters and explicit history control. */
  public goTo(
    path: string,
    params: Record<string, string>,
    keepHistory: boolean,
  ): void;

  public goTo(
    path: string,
    paramsOrKeepHistory?: Record<string, string> | boolean,
    keepHistory: boolean = true,
  ): void {
    let params: Record<string, string> | undefined;
    if (typeof paramsOrKeepHistory === "object") {
      params = paramsOrKeepHistory;
    } else if (typeof paramsOrKeepHistory === "boolean") {
      keepHistory = paramsOrKeepHistory;
    }

    path = this._getUrl(path, params);
    if (keepHistory) {
      // Persist current scroll so the browser can restore it on back navigation.
      window.history.replaceState(
        { ...(window.history.state ?? {}), scrollY: window.scrollY },
        "",
      );
      window.history.pushState({ scrollY: 0 }, "", path);
    } else {
      window.history.replaceState({ scrollY: 0 }, "", path);
    }

    window.dispatchEvent(new CustomEvent("cl-route", {}));
  }

  /**
   * Forces navigation to `path` via full page reload (`window.location.href`).
   * Use only when a hard reload is intentional (e.g. session change requiring fresh server state).
   */
  public forceGoTo(path: string, params?: Record<string, string>): void {
    window.location.href = this._getUrl(path, params);
  }

  private _getUrl(path: string, params?: Record<string, string>): string {
    // If the path doesn't start with "/" it may be an alias — resolve it first.
    const resolved = !path.startsWith("/") ? resolveAlias(path) : undefined;
    const normalizedPath =
      resolved ?? (path.startsWith("/") ? path : `/${path}`);
    if (params && Object.keys(params).length > 0) {
      const queryString = Object.keys(params)
        .map(
          (key) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`,
        )
        .join("&");
      return `${normalizedPath}?${queryString}`;
    }
    return normalizedPath;
  }
}
