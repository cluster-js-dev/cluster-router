import { Inject } from "cluster-inject";
import { ClBase } from "cluster-components";
import { URLInfoService } from "cluster-extensions/services";

export class ClBasePage extends ClBase {
  @Inject(URLInfoService)
  protected urlInfo!: URLInfoService;
}
