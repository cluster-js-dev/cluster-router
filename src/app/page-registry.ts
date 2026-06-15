import { ClBaseLayout } from "./cl-base-layout";
import { ClBasePage } from "./cl-base-page";
import { RouteData, Routes } from "./routes";

export interface PageEntry {
  url: string;
  layout?: typeof ClBaseLayout;
  outlet?: string;
  transition?: string;
}

const _registry = new Map<string, RouteData>();

export function registerPageEntries(
  page: typeof ClBasePage,
  entries: PageEntry[],
): void {
  for (const entry of entries) {
    _registry.set(entry.url, {
      page,
      layout: entry.layout,
      outlet: entry.outlet,
      transition: entry.transition,
    });
  }
}

export function buildRegistryRoutes(): Routes {
  return Object.fromEntries(_registry) as Routes;
}
