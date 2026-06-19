import { html } from "cluster-templates";

import { ClPage } from "../../../src/decorators";
import { ClBasePage } from "../../../src/app";

@ClPage("cl-alias-page", {
  html: (cl: ClAliasPage) => html`
    <div id="page-content">Alias Page</div>
    <div id="route-alias">${cl.aliasDisplay}</div>
  `,
  page: [{ url: "/alias-page", alias: "alias-test" }],
})
export class ClAliasPage extends ClBasePage {
  // Exposes currentAlias publicly so the template can render it.
  // currentAlias is set by ClBaseApp before body.render(), so it is already correct on first render.
  public get aliasDisplay(): string {
    return this.currentAlias ?? "none";
  }
}
