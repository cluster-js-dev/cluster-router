import { ClComponent } from "cluster-components";
import { Inject } from "cluster-inject";

import { ClBaseApp, ClBasePage, Routes, getCurrentAlias } from "../../src/app";
import { RouterService } from "../../src/services";

import "./layouts/cl-admin-layout";
import "./pages/cl-home";
import "./pages/cl-about";
import "./pages/cl-dashboard";
import "./pages/cl-multi-url";
import "./pages/cl-alias-page";
import { ClNotFoundPage } from "./pages/cl-not-found";
import { ClAboutPage } from "./pages/cl-about";

@ClComponent("cl-test-app")
export class ClTestApp extends ClBaseApp {
  @Inject(RouterService) private _router!: RouterService;

  protected override routes: Routes = {
    "/404": { page: ClNotFoundPage as typeof ClBasePage, alias: "not-found" },
    "/blocked": {
      page: ClAboutPage as typeof ClBasePage,
      onBefore: async (): Promise<boolean> => false,
    },
    "/guarded": {
      page: ClAboutPage as typeof ClBasePage,
      onBefore: async (): Promise<boolean> => true,
    },
    "/with-props": {
      page: ClAboutPage as typeof ClBasePage,
      props: async (): Promise<Record<string, unknown>> => ({ id: "test" }),
    },
    "/error-route": {
      page: ClAboutPage as typeof ClBasePage,
      onBefore: async (): Promise<boolean> => {
        throw new Error("guard error");
      },
    },
    "/lazy": {
      page: (): Promise<{ default: typeof ClBasePage }> =>
        import("./pages/cl-about").then((m) => ({
          default: m.ClAboutPage as typeof ClBasePage,
        })),
    },
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

  public getAlias(): string | undefined {
    return getCurrentAlias();
  }
}

declare global {
  interface Window {
    testApp: ClTestApp;
  }
}
