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
      window.history.pushState({}, "", path);
    } else {
      history.replaceState(null, "", path);
    }

    window.dispatchEvent(new CustomEvent("on-route", {}));
  }

  /**
   * Forces navigation to a specified path via full page reload.
   */
  public forceGoTo(path: string, params?: Record<string, string>) {
    window.location.href = window.location.origin + this._getUrl(path, params);
  }

  private _getUrl(hash: string, params?: Record<string, string>): string {
    if (params) {
      const queryString = Object.keys(params)
        .map((key) => `${key}=${encodeURIComponent(params[key])}`)
        .join("&");
      hash = `/${hash}/?${queryString}`;
    }
    return hash;
  }
}
