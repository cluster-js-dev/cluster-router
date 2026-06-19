import { html } from "cluster-templates";

import { ClPage } from "../../../src/decorators";
import { ClBasePage } from "../../../src/app";

@ClPage("cl-not-found-page", {
  html: () => html`<div id="page-content">Not Found Page</div>`,
})
export class ClNotFoundPage extends ClBasePage {}
