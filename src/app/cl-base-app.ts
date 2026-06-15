import { css, html, RenderTemplate } from "cluster-templates";
import { ClBase, ClComponent } from "cluster-components";
import { Inject } from "cluster-inject";
import { URLInfoService } from "cluster-extensions/services";

import { PageFactory, RouteData, Routes } from "./routes";
import { ClBody } from "./cl-body";
import { ClBaseLayout } from "./cl-base-layout";
import { ClBasePage } from "./cl-base-page";

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
  protected routes?: Routes;

  @Inject(URLInfoService)
  protected urlInfo!: URLInfoService;

  public templateHtml?: () => RenderTemplate;

  private _layout?: typeof ClBaseLayout = undefined;
  private _navController?: AbortController;
  private _pendingPageLoad = false;

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
      window.addEventListener("on-route", this._onRoute);
      window.addEventListener("popstate", this._onPopState);
      void this._loadPageAsync();
    } else if (this._pendingPageLoad) {
      this._pendingPageLoad = false;
      void this._loadPageAsync();
    }
  }

  protected onRouteError(_error: unknown): void {
    const body = ClBody.instance;
    if (body !== undefined) {
      body.templateHtml = () => html`<h1>Navigation error</h1>`;
      body.render();
    }
  }

  protected override dispose(): void {
    window.removeEventListener("on-route", this._onRoute);
    window.removeEventListener("popstate", this._onPopState);
    this._navController?.abort();
  }

  private async _loadPageAsync(): Promise<void> {
    this._navController?.abort();
    const ctrl = new AbortController();
    this._navController = ctrl;

    if (this.routes === undefined) {
      return;
    }

    const routeInfo = this.urlInfo.matchRoute(this.routes);
    let route: RouteData;

    if (routeInfo === null) {
      if (!("/404" in this.routes)) {
        const body = ClBody.instance;
        if (body !== undefined) {
          body.templateHtml = () => html`<h1>404 Not Found</h1>`;
          body.render();
        }
        return;
      }
      route = this.routes["/404"]!;
    } else {
      route = this.routes[routeInfo.path]!;
    }

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

    let params: Record<string, any> = {};
    let PageClass: typeof ClBasePage;
    try {
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
    } catch (error) {
      if (!ctrl.signal.aborted) this.onRouteError(error);
      return;
    }

    const body = ClBody.instance;
    if (body === undefined) return;

    body.templateHtml = () =>
      ClBase.dynamic({
        name: PageClass.clName,
        props: params,
      });
    body.render();
  }
}
