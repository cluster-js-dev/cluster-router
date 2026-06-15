import { Injectable } from "cluster-inject";

@Injectable("singleton")
export class RouterService {
  /**
   * Navigates to a specified path.
   */
  public goTo(path: string): void;

  /**
   * Navigates to a specified path and includes query parameters.
   */
  public goTo(path: string, params: Record<string, string>): void;

  /**
   * Navigates to a specified path and includes the option to keep the history.
   */
  public goTo(path: string, keepHistory: boolean): void;

  /**
   * Navigates to a specified path, includes query parameters, and allows for history management.
   */
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

    window.dispatchEvent(new CustomEvent("on-route", {}));
  }

  /**
   * Forces navigation to a specified path via full page reload.
   */
  public forceGoTo(path: string, params?: Record<string, string>): void {
    window.location.href = this._getUrl(path, params);
  }

  private _getUrl(path: string, params?: Record<string, string>): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    if (params) {
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
