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

  protected override beforeRender(): void {
    ClBody._instances.set(this.name, this);
  }

  protected override dispose(): void {
    if (ClBody._instances.get(this.name) === this) {
      ClBody._instances.delete(this.name);
    }
    super.dispose();
  }

  protected override html(): RenderTemplate {
    if (this.templateHtml === undefined || this.templateHtml === null) {
      return html``;
    }
    return this.templateHtml();
  }
}
