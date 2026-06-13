import { ClBaseLayout } from "./cl-base-layout";
import { ClBasePage } from "./cl-base-page";

export type RouteData = {
  page: typeof ClBasePage;
  layout?: typeof ClBaseLayout;
  onBefore?: (params: Record<string, any> | null) => Promise<boolean>;
  props?: (params: Record<string, any> | null) => Promise<Record<string, any>>;
};

export interface Routes {
  [keyof: string]: RouteData;
  "/404": RouteData;
}
