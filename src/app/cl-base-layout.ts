import { ClComponent, ClBase } from "cluster-components";
import { html } from "cluster-templates";

/**
 * Default layout shell. Renders a single `<cl-body>` outlet.
 * All custom layouts must extend this class and include at least one `<cl-body>` in their template.
 * A layout change between navigations costs an extra render cycle (ClBaseApp re-renders itself first).
 */
@ClComponent("cl-base-layout", {
  html: () => html`<cl-body></cl-body>`,
})
export class ClBaseLayout extends ClBase {}
