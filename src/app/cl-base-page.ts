import { Inject } from "cluster-inject";
import { ClBase } from "cluster-components";
import { URLInfoService } from "cluster-extensions/services";

import { getCurrentAlias } from "./page-registry";

/**
 * Base class for all routable page components.
 * Pre-injects `URLInfoService` so subclasses can read the current URL without an extra `@Inject`.
 * Decorate subclasses with `@ClPage` instead of `@ClComponent`.
 */
export class ClBasePage extends ClBase {
  /** Injected. Use to read the current URL, query params, or matched route params within the page. */
  @Inject(URLInfoService)
  protected urlInfo!: URLInfoService;

  /**
   * The alias of the currently active route, or `undefined` if the route has no alias.
   * Set by `ClBaseApp` right before each page render. Use for in-component route validations.
   */
  protected get currentAlias(): string | undefined {
    return getCurrentAlias();
  }
}
