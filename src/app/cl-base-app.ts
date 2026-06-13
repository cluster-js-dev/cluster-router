import { css, html, RenderTemplate } from "cluster-templates";
import { ClBase, ClComponent } from "cluster-components";
import { Inject } from "cluster-inject";
import { URLInfoService } from "cluster-extensions/services";

import { RouteData, Routes } from "./routes";
import { ClBody } from "./cl-body";
import { ClBaseLayout } from "./cl-base-layout";

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

  private _layout?: typeof ClBaseLayout = ClBaseLayout;

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
    }
    void this._loadPageAsync();
  }

  protected override dispose(): void {
    window.removeEventListener("on-route", this._onRoute);
    window.removeEventListener("popstate", this._onPopState);
  }

  private async _loadPageAsync(): Promise<void> {
    if (this.routes === undefined) {
      return;
    }

    const routeInfo = this.urlInfo.matchRoute(this.routes);
    let route: RouteData;

    if (routeInfo === null) {
      if (!("/404" in this.routes)) {
        ClBody.instance.templateHtml = () => html`<h1>404 Not Found</h1>`;
        ClBody.instance.render();
        return;
      }
      route = this.routes["/404"]!;
    } else {
      route = this.routes[routeInfo.path]!;
    }

    const layout = route.layout;
    if (layout !== this._layout) {
      this._layout = layout;
      this.templateHtml = () =>
        ClBase.dynamic({
          name: layout?.clName || "cl-base-layout",
        });
      this.render();
      return;
    }

    let params: Record<string, any> = {};
    if (route.props) {
      params = await route.props(routeInfo?.params ?? null);
    }

    if (route.onBefore !== undefined) {
      if (await route.onBefore(routeInfo?.params ?? null)) {
        ClBody.instance.templateHtml = () =>
          ClBase.dynamic({
            name: route.page.clName,
            props: params,
          });
        ClBody.instance.render();
      }
    } else {
      ClBody.instance.templateHtml = () =>
        ClBase.dynamic({
          name: route.page.clName,
          props: params,
        });
      ClBody.instance.render();
    }
  }
}
