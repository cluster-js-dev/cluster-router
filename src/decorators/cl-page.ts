import { RenderTemplate } from "cluster-templates";
import { ClBase, ClComponent } from "cluster-components";

import { ClBasePage } from "../app";

export interface ClPageConfig<T extends ClBase = ClBase> {
  html?: (cl: T) => RenderTemplate;
  css?: (() => RenderTemplate) | Array<() => RenderTemplate>;
}

export function ClPage<T extends ClBase>(
  name: string,
  config: ClPageConfig<T> | undefined = undefined,
): CallableFunction {
  const baseDecorator = ClComponent(name, {
    html: config?.html,
    css: config?.css,
  });
  return function (target: typeof ClBasePage, _context: ClassDecoratorContext) {
    baseDecorator(target, _context);
  };
}
