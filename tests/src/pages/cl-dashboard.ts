import { html } from "cluster-templates";

import { ClPage } from "../../../src/decorators";
import { ClBasePage } from "../../../src/app";
import { ClAdminLayout } from "../layouts/cl-admin-layout";

@ClPage("cl-dashboard-page", {
  html: () => html`<div id="page-content">Dashboard Page</div>`,
  page: [{ url: "/dashboard", layout: ClAdminLayout }],
})
export class ClDashboardPage extends ClBasePage {}
