import { ClBase, ClComponent } from "cluster-components";
import { html, RenderTemplate } from "cluster-templates";

@ClComponent("cl-body")
export class ClBody extends ClBase {
  private static _instance: ClBody;

  public static get instance() {
    return ClBody._instance;
  }

  public templateHtml?: () => RenderTemplate;

  protected override beforeRender(): void {
    ClBody._instance = this;
  }

  protected override html(): RenderTemplate {
    if (this.templateHtml === undefined || this.templateHtml === null) {
      return html``;
    }
    return this.templateHtml();
  }
}
