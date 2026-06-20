# Análisis de Deuda Técnica y Mejoras — `cluster-router`

> **Fecha:** 2026-06-20
> **Versión analizada:** 0.1.53

---

## 📊 Resumen Ejecutivo

`cluster-router` es la capa de enrutamiento SPA para el ecosistema `cluster-components`. Provee un app shell (`ClBaseApp`), clases base para layouts y páginas (`ClBaseLayout`, `ClBasePage`), un sistema de outlets (`ClBody`), un registro de rutas con soporte para lazy-loading (`PageFactory`), guards (`onBefore`), data resolvers (`props`), aliases, y navegación programática (`RouterService`). El proyecto tiene buena cobertura de tests E2E (10 archivos de spec) y unit tests sólidos para los 2 archivos cubiertos, pero varios módulos críticos quedan sin cobertura y hay configuraciones inconsistentes con el resto del ecosistema.

---

## 🔴 Problemas Críticos

### 1. Coverage solo cubre 2 archivos de ~12

```ts
// vitest.config.ts
coverage: {
  provider: "v8",
  reporter: ["text", "html", "lcov"],
  include: ["src/app/page-registry.ts", "src/services/router.ts"],
  exclude: ["**/node_modules/**"],
  thresholds: {
    statements: 85,
    branches: 78,
    functions: 90,
    lines: 85,
  },
},
```

Los thresholds solo aplican a `page-registry.ts` y `router.ts`. Quedan **sin cobertura unitaria**:

| Archivo | Líneas | Rol |
|---------|--------|-----|
| `cl-base-app.ts` | ~230 | App shell — navegación completa, guards, layout switching, 404, scroll |
| `cl-base-layout.ts` | ~15 | Layout base (pequeño pero sin tests) |
| `cl-base-page.ts` | ~25 | Página base con `urlInfo` y `currentAlias` |
| `cl-body.ts` | ~50 | Sistema de outlets con registro estático |
| `routes.ts` | ~60 | Tipos y definiciones de rutas |
| `cl-page.ts` | ~60 | Decorador `@ClPage` que compone `@ClComponent` + registro |

Los E2E cubren estos indirectamente, pero sin métricas no hay visibilidad.

---

### 2. `src/services/router/` — Directorio vacío

```
src/services/router/
    (vacío)
```

Existe un directorio `router/` dentro de `services/` que está completamente vacío. Es código muerto que probablemente iba a contener una refactorización del `RouterService` que nunca se completó.

**Impacto:** Confunde la estructura del proyecto. Sugiere una refactorización abandonada.

---

### 3. `.nycrc.json` — Herramienta de coverage incorrecta

```json
{
  "report-dir": "coverage",
  "reporter": ["text", "html", "text-summary"],
  "extension": [".ts"],
  "include": ["src/**/*.ts"],
  "exclude": ["tests/**", "node_modules/**", "**/*.d.ts"],
  "sourceMap": true,
  "all": false
}
```

El proyecto usa `@vitest/coverage-v8` (V8-based), pero tiene un `.nycrc.json` que es para `nyc` (Istanbul). Además, los E2E tests en `fixtures.ts` escriben coverage a `.nyc_output/` (formato Istanbul), lo cual es incompatible con v8.

**Impacto:** Confusión de herramientas de coverage. Los datos de E2E coverage se recolectan pero nunca se procesan porque no hay `nyc` instalado.

---

## 🟠 Problemas de Arquitectura y Diseño

### 4. `cl-base-app.ts` — El archivo más crítico sin cobertura unitaria

`_loadPageAsync()` (~120 líneas) es el corazón del router. Contiene:

- AbortController para cancelar navegaciones previas
- Resolución de rutas + merge registry/manual
- Layout switching (con doble render)
- Ejecución de `props()` → `onBefore()` → `PageFactory`
- Manejo de 404 sin ruta definida
- Manejo de errores con `onRouteError`
- Renderizado en outlets
- Scroll restoration

Probar esto requiere un DOM completo (`happy-dom` está configurado), mocks de `URLInfoService`, y componentes stub. Es complejo pero factible.

---

### 5. `RouterService._getUrl()` — Lógica ambigua de resolución de alias

```ts
private _getUrl(path: string, params?: Record<string, string>): string {
  const resolved = !path.startsWith("/") ? resolveAlias(path) : undefined;
  const normalizedPath =
    resolved ?? (path.startsWith("/") ? path : `/${path}`);
  // ...
}
```

La secuencia es:
1. Si no empieza con `/`, intenta resolver como alias
2. Si el alias no se resuelve, y no empieza con `/`, le pone `/` al inicio
3. Si empieza con `/`, lo usa tal cual

Esto significa que `goTo("about")` con alias `"about" → "/about"` funciona, pero `goTo("/about")` también. Sin embargo, `goTo("nonexistent")` se convierte en `"/nonexistent"` silenciosamente. No hay distinción entre "alias no encontrado" y "path sin slash".

---

### 6. `ClBody._instances` — Potencial memory leak

```ts
private static _instances = new Map<string, ClBody>();

protected override beforeRender(): void {
  ClBody._instances.set(this.name, this);
}

protected override dispose(): void {
  if (ClBody._instances.get(this.name) === this) {
    ClBody._instances.delete(this.name);
  }
  super.dispose();
}
```

Si un `ClBody` se elimina del DOM sin que `dispose()` se llame (por ejemplo, si el elemento se remueve con `innerHTML = ""` del padre), la entrada queda en el Map estático para siempre. El garbage collector no puede liberar el elemento porque el Map mantiene una referencia.

---

### 7. `RouterService` — Overloads excesivos (mismo patrón que otros paquetes)

```ts
public goTo(path: string): void;
public goTo(path: string, params: Record<string, string>): void;
public goTo(path: string, keepHistory: boolean): void;
public goTo(path: string, params: Record<string, string>, keepHistory: boolean): void;
```

4 overloads para cubrir combinaciones de `params` y `keepHistory`. La implementación usa:

```ts
let params: Record<string, string> | undefined;
if (typeof paramsOrKeepHistory === "object") {
  params = paramsOrKeepHistory;
} else if (typeof paramsOrKeepHistory === "boolean") {
  keepHistory = paramsOrKeepHistory;
}
```

Esto es frágil: si alguien quisiera pasar `params` como `boolean` en el futuro (poco probable), habría ambigüedad. Una API con un objeto de opciones sería más clara: `goTo(path, { params, keepHistory })`.

---

### 8. `ClPage` decorator — Composición manual de `ClComponent`

```ts
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
```

Esto llama a `ClComponent` manualmente y envuelve el resultado. Es correcto pero:

- `shadowMode` no se puede configurar desde `ClPageConfig` (siempre usa el default de `ClComponent`)
- Si `ClComponent` cambia su firma, `ClPage` se rompe silenciosamente
- No hay validación de que `target` extienda `ClBasePage`

---

### 9. Campo `transition` reservado pero presente en la API

```ts
export interface PageEntry {
  transition?: string;  // "Reserved for future transition animations."
}
```

```ts
export type RouteData<P extends RouteParams = RouteParams> = {
  transition?: string;  // "Reserved for future transition animations. Not yet consumed by the router."
};
```

El campo está documentado como "no implementado" pero ya es parte de la API pública y se serializa en `cluster-manifest.json`. Si nunca se implementa, es lastre. Si se implementa, la API actual probablemente cambie.

---

## 🟡 Problemas de Configuración y Tooling

### 10. `vite.config.ts` — `treeshake: false` y `minify: false`

```ts
build: {
  rollupOptions: {
    treeshake: false,
    cache: false,
    // ...
  },
  minify: false,
},
```

A diferencia de `cluster-components` que usa `minify: true`, aquí está explícitamente desactivado. `treeshake: false` es particularmente llamativo — impide que Rollup elimine código muerto. ¿Es intencional para debugging o es un remanente?

---

### 11. `build-test` y `test` son idénticos

```json
"test": "vite build && playwright test --project=webkit",
"build-test": "vite build && playwright test --project=webkit",
```

Ambos scripts hacen exactamente lo mismo. En `cluster-components`, `build-test` compila tests y `test` solo ejecuta. Esta inconsistencia entre paquetes puede confundir.

---

### 12. E2E tests solo en WebKit

```ts
projects: [
  {
    name: "webkit",
    use: { ...devices["Desktop Safari"] },
  },
],
```

Igual que `cluster-extensions`. El router maneja `history.pushState`, `popstate`, `scrollRestoration`, y `CustomEvent` — APIs que tienen diferencias sutiles entre navegadores. Debería probarse en Chromium y Firefox también.

---

### 13. ESLint mínimo (idéntico a los otros paquetes)

```js
rules: {
  'no-console': 'warn',
},
```

Misma única regla. No hay `@typescript-eslint/no-explicit-any` a pesar del uso de `any` en `RouteParams` y `matchRoute`.

---

### 14. `vitest` environment `happy-dom` está configurado pero subutilizado

Los unit tests existen solo para `page-registry.ts` y `router.ts`, que son puramente lógicos (sin DOM). `happy-dom` está instalado y configurado pero no se aprovecha para testear `cl-base-app.ts`, `cl-body.ts`, etc. que sí requieren DOM.

---

## 🟢 Problemas Menores / Code Smells

### 15. Tipos `any` en `RouteParams` y `matchRoute`

```ts
export type RouteParams = Record<string, any>;

// En cl-base-app.ts:
const routeInfo = this.urlInfo.matchRoute(routes as any);
// ...
params = await route.props(routeInfo?.params ?? null);
```

`matchRoute` se llama con `routes as any` porque el genérico no coincide. Los params de ruta se tipan como `Record<string, any>`. Idealmente, los tipos de `matchRoute` deberían alinearse mejor con `Routes`.

---

### 16. `ClBaseApp.onRouteError` — Solo renderiza en el outlet "default"

```ts
protected onRouteError(_error: unknown): void {
  const body = ClBody.instance;  // solo "default"
  if (body !== undefined) {
    body.templateHtml = () => html`<h1>Navigation error</h1>`;
    body.render();
  }
}
```

Si el error ocurre en una ruta con `outlet: "sidebar"`, el mensaje de error se renderiza en el outlet `default` en lugar del outlet que falló.

---

### 17. `_pendingPageLoad` — Bandera de coordinación frágil

```ts
if (layout !== this._layout) {
  this._layout = layout;
  this.templateHtml = () => ClBase.dynamic({ name: layout.clName });
  this._pendingPageLoad = true;  // ← se activa aquí
  this.render();
  return;  // ← sale temprano
}
// ...
// En afterRender():
} else if (this._pendingPageLoad) {
  this._pendingPageLoad = false;
  void this._loadPageAsync();  // ← se consume aquí
}
```

El patrón "render → afterRender → re-llamar `_loadPageAsync()`" es un workaround porque un cambio de layout requiere dos renders. Esto es frágil: si `afterRender` no se llama (por desconexión durante el render), `_pendingPageLoad` queda en `true` y la próxima navegación podría tener comportamiento inesperado.

---

### 18. `ClTestApp` duplica lógica de navegación para tests

```ts
// tests/src/cl-test-app.ts
public navigate(path: string, keepHistory: boolean = true): void {
  this._router.goTo(path, keepHistory);
}
public navigateWithParams(path: string, params: Record<string, string>, ...): void {
  this._router.goTo(path, params, keepHistory);
}
public currentPath(): string {
  return window.location.pathname + window.location.search;
}
public getAlias(): string | undefined {
  return getCurrentAlias();
}
```

Estos métodos son thin wrappers que solo existen para exponer funcionalidad a `page.evaluate()` en los E2E tests. Podrían ser innecesarios si los tests usaran `RouterService` directamente desde el scope global.

---

### 19. `routes.ts` — `PageFactory` sin soporte para props/guards

```ts
export type PageFactory = () => Promise<{ default: typeof ClBasePage }>;
```

El factory solo resuelve la clase. Si una página lazy-loaded necesita props específicos, `RouteData.props` maneja eso (se ejecuta antes del factory). Esto está bien diseñado pero no documentado explícitamente.

---

## 📋 Cobertura de Tests

### Unit Tests (Vitest) — 2 archivos

| Archivo | Cobertura |
|---------|-----------|
| `tests/unit/page-registry.spec.ts` | `registerPageEntries`, `registerAlias`, `resolveAlias`, `setCurrentAlias`, `getCurrentAlias`, `buildRegistryRoutes` |
| `tests/unit/router-service.spec.ts` | `goTo` (keepHistory true/false, params, alias, event dispatch), `forceGoTo` |

### E2E Tests (Playwright) — 10 archivos

| Archivo | Cobertura |
|---------|-----------|
| `navigation.spec.ts` | Navegación básica entre páginas |
| `not-found.spec.ts` | Rutas desconocidas, 404 explícito, deep paths |
| `guards.spec.ts` | `onBefore` (true/false/throw), `props` |
| `history.spec.ts` | `keepHistory`, `replaceState`, `popstate`, back button |
| `layouts.spec.ts` | Layout switching (default ↔ admin) |
| `lifecycle.spec.ts` | `dispose`, limpieza de listeners, `cl-body` registry |
| `lazy.spec.ts` | `PageFactory`, lazy loading |
| `alias.spec.ts` | Navegación por alias, `currentAlias` |
| `query-params.spec.ts` | Query strings, URL encoding |
| `self-register.spec.ts` | `@ClPage` auto-registro |

**Total:** ~50+ tests E2E, todos en WebKit.

---

## 📋 Plan de Acción Recomendado

| Prioridad | Tarea | Esfuerzo |
|-----------|-------|----------|
| 🔴 | Eliminar directorio vacío `src/services/router/` | Bajo |
| 🔴 | Eliminar `.nycrc.json` o migrar E2E coverage a v8 | Medio |
| 🔴 | Expandir `coverage.include` para cubrir `cl-base-app.ts`, `cl-body.ts`, `cl-base-page.ts` | Alto |
| 🟠 | Añadir unit tests para `cl-base-app._loadPageAsync()` | Alto |
| 🟠 | Añadir unit tests para `ClBody` (registry, dispose, named outlets) | Medio |
| 🟠 | Refactorizar `RouterService.goTo()` a objeto de opciones | Medio |
| 🟡 | Alinear `build-test` y `test` con `cluster-components` | Bajo |
| 🟡 | Añadir Chromium y Firefox a E2E tests | Bajo |
| 🟡 | Activar `treeshake: true` y `minify: true` en Vite (o documentar por qué no) | Bajo |
| 🟡 | Reforzar ESLint con reglas TypeScript | Bajo |
| 🟢 | Documentar flujo de layout switching (doble render) | Bajo |
| 🟢 | Eliminar campo `transition` hasta que se implemente | Bajo |
| 🟢 | Mover `ClTestApp.navigate()` helpers a `window` global en tests | Bajo |

---

## 🏗️ Estructura del Proyecto

```
cluster-router/
├── src/
│   ├── index.ts                    # Re-exporta app + services + decorators
│   ├── app/
│   │   ├── index.ts                # Exports públicos del módulo app
│   │   ├── cl-base-app.ts          # ClBaseApp — app shell SPA (~230 líneas)
│   │   ├── cl-base-layout.ts       # ClBaseLayout — layout base (~15 líneas)
│   │   ├── cl-base-page.ts         # ClBasePage — página base con URLInfo (~25 líneas)
│   │   ├── cl-body.ts              # ClBody — sistema de outlets nombrados (~50 líneas)
│   │   ├── page-registry.ts        # Registro global de rutas + aliases (~100 líneas)
│   │   └── routes.ts               # Tipos: Routes, RouteData, PageFactory, RouteParams (~60 líneas)
│   ├── services/
│   │   ├── index.ts                # Exporta RouterService
│   │   ├── router.ts               # RouterService — navegación programática (~90 líneas)
│   │   └── router/                 # ❌ DIRECTORIO VACÍO
│   └── decorators/
│       ├── index.ts                # Exporta ClPage
│       └── cl-page.ts              # @ClPage — compone @ClComponent + registro (~60 líneas)
├── tests/
│   ├── unit/                       # Unit tests (Vitest, environment: happy-dom)
│   │   ├── page-registry.spec.ts   # ~120 líneas, buena cobertura
│   │   └── router-service.spec.ts  # ~170 líneas, buena cobertura
│   ├── e2e/                        # E2E tests (Playwright, solo WebKit)
│   │   ├── fixtures.ts             # Fixture con recolección de coverage (nyc)
│   │   ├── tools.ts                # Helpers: setup, navigate, pageContent, etc.
│   │   ├── navigation.spec.ts
│   │   ├── not-found.spec.ts
│   │   ├── guards.spec.ts
│   │   ├── history.spec.ts
│   │   ├── layouts.spec.ts
│   │   ├── lifecycle.spec.ts
│   │   ├── lazy.spec.ts
│   │   ├── alias.spec.ts
│   │   ├── query-params.spec.ts
│   │   └── self-register.spec.ts
│   └── src/                        # Componentes fixture para tests
│       ├── index.ts
│       ├── cl-test-app.ts          # ClTestApp con rutas de prueba
│       ├── layouts/
│       │   └── cl-admin-layout.ts
│       └── pages/
│           ├── cl-home.ts
│           ├── cl-about.ts
│           ├── cl-dashboard.ts
│           ├── cl-multi-url.ts
│           ├── cl-alias-page.ts
│           └── cl-not-found.ts
├── coverage/                       # Reportes HTML de coverage (generados)
├── .nyc_output/                    # ❌ Coverage de E2E en formato Istanbul (no usado)
├── package.json
├── tsconfig.json                   # strict, ES2020, bundler, isolatedModules: false
├── tsconfig.unit.json              # Extiende tsconfig, incluye tests/unit
├── vite.config.ts                  # Vite (treeshake: false, minify: false)
├── vitest.config.ts                # Vitest + coverage thresholds (solo 2 archivos)
├── playwright.config.ts            # Playwright (solo WebKit)
├── .nycrc.json                     # ❌ Config de nyc (Istanbul) — incompatible con v8
└── .eslintrc.cjs                   # ESLint mínimo
```

---

## 🔗 Dependencias

| Paquete | Versión | Uso |
|---------|---------|-----|
| `cluster-components` | 0.1.50 (tgz) | `ClBase`, `ClComponent`, `Prop`, `Inject` |
| `cluster-extensions` | 0.1.44 (tgz) | `URLInfoService`, `RouterService` es inyectable |
| `cluster-inject` | 0.1.49 (tgz) | `@Injectable`, `@Inject` |
| `cluster-templates` | 0.1.71 (tgz) | `html`, `css`, `RenderTemplate` |
| `vitest` | ^4.1.9 | Unit testing |
| `@playwright/test` | ^1.51.1 | E2E testing |
| `happy-dom` | ^20.10.6 | DOM environment para unit tests |
| `esbuild` | ^0.25.1 | Bundling |
| `typescript` | ^5.8.2 | Compilador |

---

## ⚠️ Comparación con otros paquetes del ecosistema

| Aspecto | cluster-components | cluster-extensions | cluster-router |
|---------|-------------------|-------------------|----------------|
| Coverage thresholds | ✅ 85/80/95/85 | ❌ Sin configurar | ✅ 85/78/90/85 |
| Coverage include | 7 archivos | 0 (sin config) | 2 archivos |
| E2E browsers | Chromium + Firefox + WebKit | Solo WebKit | Solo WebKit |
| Vitest environment | `happy-dom` | `node` | `happy-dom` |
| Vite minify | `true` | N/A (sin build config) | `false` |
| Vite treeshake | (default true) | N/A | `false` |
| ESLint rules | `no-console: warn` | `no-console: warn` | `no-console: warn` |
| `build-test` vs `test` | Diferentes | Iguales (bug) | Iguales |
| `.nycrc.json` | No | No | ✅ (pero no usado) |
