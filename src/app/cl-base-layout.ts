import { ClComponent, ClBase } from "cluster-components";
import { html } from "cluster-templates";

@ClComponent("cl-base-layout", {
  html: () => html`<cl-body></cl-body>`,
})
export class ClBaseLayout extends ClBase {}
