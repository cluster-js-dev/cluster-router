import { html } from "cluster-templates";

import { ClPage } from "../../../src/decorators";
import { ClBasePage } from "../../../src/app";

@ClPage("cl-multi-url-page", {
  html: () => html`<div id="page-content">Contact Page</div>`,
  page: [{ url: "/contact" }, { url: "/reach" }],
})
export class ClMultiUrlPage extends ClBasePage {}
