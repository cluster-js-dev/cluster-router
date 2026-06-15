import { html } from "cluster-templates";

import { ClPage } from "../../../src/decorators";
import { ClBasePage } from "../../../src/app";

@ClPage("cl-home-page", {
  html: () => html`<div id="page-content">Home Page</div>`,
  page: [{ url: "/" }],
})
export class ClHomePage extends ClBasePage {}
