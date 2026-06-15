import { ClBase, ClComponent, Prop } from "cluster-components";
import { html, RenderTemplate } from "cluster-templates";

@ClComponent("cl-body")
export class ClBody extends ClBase {
  private static _instances = new Map<string, ClBody>();

  /** Returns the default outlet (name="default"). Kept for backward compatibility. */
  public static get instance(): ClBody | undefined {
    return ClBody._instances.get("default");
  }

  /** Returns the outlet registered under the given name. */
  public static named(name: string): ClBody | undefined {
    return ClBody._instances.get(name);
  }

  @Prop.string({ useAttr: true }) public name: string = "default";

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
