import { html } from "cluster-templates";

import { ClPage } from "../../../src/decorators";
import { ClBasePage } from "../../../src/app";

@ClPage("cl-about-page", {
  html: () => html`<div id="page-content">About Page</div>`,
  page: [{ url: "/about" }],
})
export class ClAboutPage extends ClBasePage {}
