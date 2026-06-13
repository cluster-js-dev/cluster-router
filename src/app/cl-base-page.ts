import { Inject } from "cluster-inject";
import { ClComponent, ClBase } from "cluster-components";
import { URLInfoService } from "cluster-extensions/services";

@ClComponent("cl-base-page")
export class ClBasePage extends ClBase {
  @Inject(URLInfoService)
  protected urlInfo!: URLInfoService;
}
