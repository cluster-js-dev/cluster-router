import { ClComponent } from "cluster-components";
import { html } from "cluster-templates";

import { ClBaseLayout } from "../../../src/app";

@ClComponent("cl-admin-layout", {
  html: () => html`
    <div id="layout-id">admin</div>
    <cl-body></cl-body>
  `,
})
export class ClAdminLayout extends ClBaseLayout {}
