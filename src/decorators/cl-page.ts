import { RenderTemplate } from "cluster-templates";
import { ClComponent } from "cluster-components";

import { ClBasePage } from "../app";
import { PageEntry, registerPageEntries } from "../app/page-registry";

export type { PageEntry };

export interface ClPageConfig<T extends ClBasePage = ClBasePage> {
  html?: (cl: T) => RenderTemplate;
  css?: (() => RenderTemplate) | Array<() => RenderTemplate>;
  page?: PageEntry[];
}

export function ClPage<T extends ClBasePage>(
  name: string,
  config: ClPageConfig<T> | undefined = undefined,
): CallableFunction {
  const baseDecorator = ClComponent(name, {
    html: config?.html,
    css: config?.css,
  });
  return function (target: typeof ClBasePage, context: ClassDecoratorContext) {
    baseDecorator(target, context);
    if (config?.page !== undefined && config.page.length > 0) {
      registerPageEntries(target, config.page);
    }
  };
}
