import { ClBaseLayout } from "./cl-base-layout";
import { ClBasePage } from "./cl-base-page";

export type PageFactory = () => Promise<{ default: typeof ClBasePage }>;

export type RouteData = {
  page: typeof ClBasePage | PageFactory;
  layout?: typeof ClBaseLayout;
  onBefore?: (params: Record<string, any> | null) => Promise<boolean>;
  props?: (params: Record<string, any> | null) => Promise<Record<string, any>>;
};

export interface Routes {
  [key: string]: RouteData | undefined;
  "/404"?: RouteData;
}
