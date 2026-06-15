import { ClComponent } from "cluster-components";
import { Inject } from "cluster-inject";

import { ClBaseApp, ClBasePage } from "../../src/app";
import { RouterService } from "../../src/services";

import "./layouts/cl-admin-layout";
import "./pages/cl-home";
import "./pages/cl-about";
import "./pages/cl-dashboard";
import "./pages/cl-multi-url";
import { ClNotFoundPage } from "./pages/cl-not-found";

@ClComponent("cl-test-app")
export class ClTestApp extends ClBaseApp {
  @Inject(RouterService) private _router!: RouterService;

  protected override routes = {
    "/404": { page: ClNotFoundPage as typeof ClBasePage },
  };

  protected override afterRender(): void {
    super.afterRender();
    window.testApp = this;
  }

  public navigate(path: string, keepHistory: boolean = true): void {
    this._router.goTo(path, keepHistory);
  }

  public navigateWithParams(
    path: string,
    params: Record<string, string>,
    keepHistory: boolean = true,
  ): void {
    this._router.goTo(path, params, keepHistory);
  }

  public currentPath(): string {
    return window.location.pathname + window.location.search;
  }
}

declare global {
  interface Window {
    testApp: ClTestApp;
  }
}
