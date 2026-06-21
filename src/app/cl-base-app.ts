import { css, html, RenderTemplate } from "cluster-templates";
import { ClBase, ClComponent } from "cluster-components";
import { Inject } from "cluster-inject";
import { URLInfoService } from "cluster-extensions/services";

import { PageFactory, RouteData, RouteParams, Routes } from "./routes";
import { ClBody } from "./cl-body";
import { ClBaseLayout } from "./cl-base-layout";
import { ClBasePage } from "./cl-base-page";
import {
  buildRegistryRoutes,
  registerAlias,
  setCurrentAlias,
} from "./page-registry";

/**
 * SPA root shell. Manages the full navigation lifecycle:
 * URL listening → layout switching → guard/props resolution → page rendering → scroll restoration.
 *
 * Subclass this, override `routes` for manual entries, and import page modules so `@ClPage`
 * decorators auto-register before the first navigation.
 */
@ClComponent("cl-base-app", {
  css: () => css`
    :host {
      overflow: hidden;
      height: 100vh;
      display: block;
      width: 100vw;
    }
  `,
})
export class ClBaseApp extends ClBase {
  /** Manual route map. Merged with the `@ClPage` registry on first navigation; manual entries win on conflict. */
  protected routes?: Routes;

  @Inject(URLInfoService)
  protected urlInfo!: URLInfoService;

  /** Dynamically set to render the active layout element. Do not set this directly. */
  public templateHtml?: () => RenderTemplate;

  private _layout?: typeof ClBaseLayout = undefined;
  private _navController?: AbortController;
  // Bridges the layout-change render cycle to the subsequent page-load cycle.
  private _pendingPageLoad = false;
  // Built once on first navigation by merging the @ClPage registry with this.routes.
  private _cachedRoutes?: Routes;

  private _onRoute = () => {
    void this._loadPageAsync();
  };
  private _onPopState = () => {
    void this._loadPageAsync();
  };

  protected override html(): RenderTemplate {
    if (this.templateHtml === undefined || this.templateHtml === null) {
      return html``;
    }
    return this.templateHtml();
  }

  protected override afterRender(): void {
    super.afterRender();
    if (this.firstRender) {
      history.scrollRestoration = "manual";
      window.addEventListener("cl-route", this._onRoute);
      window.addEventListener("popstate", this._onPopState);
      void this._loadPageAsync();
    } else if (this._pendingPageLoad) {
      this._pendingPageLoad = false;
      void this._loadPageAsync();
    }
  }

  /**
   * Called when `_loadPageAsync()` catches a thrown error (from `onBefore`, `props`, or a `PageFactory`).
   * Override to render a custom error UI. Default: renders `<h1>Navigation error</h1>` in the failing outlet.
   * @param _error - The caught error.
   * @param outlet - The outlet name that was the target of the failing navigation. Defaults to `"default"`.
   */
  protected onRouteError(_error: unknown, outlet: string = "default"): void {
    const body = ClBody.named(outlet);
    if (body !== undefined) {
      body.templateHtml = () => html`<h1>Navigation error</h1>`;
      body.render();
    }
  }

  protected override onDestroy(): void {
    window.removeEventListener("cl-route", this._onRoute);
    window.removeEventListener("popstate", this._onPopState);
    this._navController?.abort();
    super.onDestroy();
  }

  /**
   * Lazily builds the merged route map: `@ClPage` registry entries first, then `this.routes` (manual wins).
   * Result is cached — routes are static and must not be mutated after the first navigation.
   */
  private _getRoutes(): Routes {
    if (this._cachedRoutes === undefined) {
      this._cachedRoutes = { ...buildRegistryRoutes(), ...this.routes };
      // Register aliases from manual this.routes (not covered by @ClPage registration).
      for (const [url, route] of Object.entries(this._cachedRoutes)) {
        if (route?.alias !== undefined) registerAlias(route.alias, url);
      }
    }
    return this._cachedRoutes;
  }

  private async _loadPageAsync(): Promise<void> {
    this._navController?.abort();
    const ctrl = new AbortController();
    this._navController = ctrl;

    // Capture before any await — history.state reflects the navigation target.
    // forward nav: RouterService sets scrollY=0; back/forward: saved value restored by browser.
    const targetScrollY: number =
      (window.history.state as { scrollY?: number })?.scrollY ?? 0;

    // outlet is updated once the route is resolved so onRouteError always
    // renders into the correct <cl-body>, even when the error is thrown early
    // (e.g. in matchRoute or route resolution) before the route is known.
    let outlet = "default";

    try {
      const routes = this._getRoutes();
      if (Object.keys(routes).length === 0) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const routeInfo = this.urlInfo.matchRoute(routes as any);
      let route: RouteData;

      if (routeInfo === null) {
        if (!("/404" in routes)) {
          const body = ClBody.named("default");
          if (body !== undefined) {
            setCurrentAlias(undefined);
            body.templateHtml = () => html`<h1>404 Not Found</h1>`;
            body.render();
          }
          return;
        }
        route = routes["/404"]!;
      } else {
        route = routes[routeInfo.path]!;
      }

      outlet = route.outlet ?? "default";

      const layout = route.layout ?? ClBaseLayout;
      if (layout !== this._layout) {
        this._layout = layout;
        this.templateHtml = () =>
          ClBase.dynamic({
            name: layout.clName,
          });
        this._pendingPageLoad = true;
        this.render();
        return;
      }

      let params: RouteParams = {};
      let PageClass: typeof ClBasePage;

      if (route.props) {
        params = await route.props(routeInfo?.params ?? null);
        if (ctrl.signal.aborted) return;
      }

      if (route.onBefore !== undefined) {
        if (!(await route.onBefore(routeInfo?.params ?? null))) return;
        if (ctrl.signal.aborted) return;
      }

      if ("clName" in route.page) {
        PageClass = route.page as typeof ClBasePage;
      } else {
        const mod = await (route.page as PageFactory)();
        if (ctrl.signal.aborted) return;
        PageClass = mod.default;
      }

      const body = ClBody.named(outlet);
      if (body === undefined) return;

      setCurrentAlias(route.alias);
      body.templateHtml = () =>
        ClBase.dynamic({
          name: PageClass.clName,
          props: params,
        });
      body.render();
      requestAnimationFrame(() =>
        window.scrollTo({ top: targetScrollY, behavior: "instant" }),
      );
    } catch (error) {
      if (!ctrl.signal.aborted) this.onRouteError(error, outlet);
    }
  }
}
