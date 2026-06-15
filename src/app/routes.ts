import { ClBaseLayout } from "./cl-base-layout";
import { ClBasePage } from "./cl-base-page";

export type PageFactory = () => Promise<{ default: typeof ClBasePage }>;

export type RouteParams = Record<string, any>;

export type RouteData<P extends RouteParams = RouteParams> = {
  page: typeof ClBasePage | PageFactory;
  layout?: typeof ClBaseLayout;
  /** Name of the <cl-body> outlet to render into. Defaults to "default". */
  outlet?: string;
  onBefore?: (params: P | null) => Promise<boolean>;
  props?: (params: P | null) => Promise<Record<string, any>>;
};

export interface Routes {
  [key: string]: RouteData<any> | undefined;
  "/404"?: RouteData<any>;
}
