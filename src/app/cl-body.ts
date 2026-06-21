import { ClBase, ClComponent, Prop } from "cluster-components";
import { html, RenderTemplate } from "cluster-templates";

/**
 * Named outlet element. Rendered inside a layout; receives page content from `ClBaseApp`.
 * Register multiple outlets in one layout by setting different `name` attributes.
 */
@ClComponent("cl-body")
export class ClBody extends ClBase {
  private static _instances = new Map<string, ClBody>();

  /** Returns the default outlet (`name="default"`). Prefer `ClBody.named("default")`. */
  public static get instance(): ClBody | undefined {
    return ClBody._instances.get("default");
  }

  /** Returns the outlet registered under `name`, or `undefined` if not currently in the DOM. */
  public static named(name: string): ClBody | undefined {
    return ClBody._instances.get(name);
  }

  /** Outlet name. Reflected to/from the HTML `name` attribute. Default: `"default"`. */
  @Prop.string({ useAttr: true }) public name: string = "default";

  /** Set by `ClBaseApp._loadPageAsync()` before calling `render()`. */
  public templateHtml?: () => RenderTemplate;

  // Tracks the name under which this instance is currently registered so that
  // a runtime name change doesn't leave a stale entry in _instances.
  private _registeredName?: string;

  protected override beforeRender(): void {
    if (
      this._registeredName !== undefined &&
      this._registeredName !== this.name &&
      ClBody._instances.get(this._registeredName) === this
    ) {
      ClBody._instances.delete(this._registeredName);
    }
    this._registeredName = this.name;
    ClBody._instances.set(this.name, this);
  }

  protected override onDestroy(): void {
    const nameToRemove = this._registeredName ?? this.name;
    if (ClBody._instances.get(nameToRemove) === this) {
      ClBody._instances.delete(nameToRemove);
    }
    super.onDestroy();
  }

  protected override html(): RenderTemplate {
    if (this.templateHtml === undefined || this.templateHtml === null) {
      return html``;
    }
    return this.templateHtml();
  }
}
