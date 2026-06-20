import { describe, test, expect } from "vitest";
import {
  registerPageEntries,
  registerAlias,
  resolveAlias,
  setCurrentAlias,
  getCurrentAlias,
  buildRegistryRoutes,
} from "../../src/app/page-registry";

// Minimal stubs — only the class reference is stored; no instances are created.
class StubPage {}
class AnotherPage {}
class StubLayout {}

// All URL patterns use the "/pr-" prefix to avoid collision with other test
// modules that share the same module-level registry instance.

// region: registerAlias / resolveAlias

describe("registerAlias / resolveAlias", () => {
  test("stores and retrieves an alias", () => {
    registerAlias("pr-home", "/pr-home-url");
    expect(resolveAlias("pr-home")).toBe("/pr-home-url");
  });

  test("returns undefined for an unknown alias", () => {
    expect(resolveAlias("pr-__no_such_alias__")).toBeUndefined();
  });

  test("later call with same alias overwrites the earlier one", () => {
    registerAlias("pr-overwrite", "/pr-old");
    registerAlias("pr-overwrite", "/pr-new");
    expect(resolveAlias("pr-overwrite")).toBe("/pr-new");
  });
});

// region: setCurrentAlias / getCurrentAlias

describe("setCurrentAlias / getCurrentAlias", () => {
  test("stores and retrieves the current alias", () => {
    setCurrentAlias("pr-active");
    expect(getCurrentAlias()).toBe("pr-active");
  });

  test("stores undefined and returns undefined", () => {
    setCurrentAlias(undefined);
    expect(getCurrentAlias()).toBeUndefined();
  });

  test("overwrites the previous alias", () => {
    setCurrentAlias("pr-first");
    setCurrentAlias("pr-second");
    expect(getCurrentAlias()).toBe("pr-second");
  });
});

// region: registerPageEntries

describe("registerPageEntries", () => {
  test("registers a single URL entry in the registry", () => {
    registerPageEntries(StubPage as any, [{ url: "/pr-single" }]);
    expect(buildRegistryRoutes()["/pr-single"]).toBeDefined();
    expect(buildRegistryRoutes()["/pr-single"]!.page).toBe(StubPage);
  });

  test("registers multiple URL entries from one call", () => {
    registerPageEntries(StubPage as any, [
      { url: "/pr-multi-a" },
      { url: "/pr-multi-b" },
    ]);
    const routes = buildRegistryRoutes();
    expect(routes["/pr-multi-a"]).toBeDefined();
    expect(routes["/pr-multi-b"]).toBeDefined();
  });

  test("stores layout, outlet, transition, and alias from an entry", () => {
    registerPageEntries(StubPage as any, [
      {
        url: "/pr-with-opts",
        layout: StubLayout as any,
        outlet: "sidebar",
        transition: "fade",
        alias: "pr-with-opts-alias",
      },
    ]);
    const route = buildRegistryRoutes()["/pr-with-opts"]!;
    expect(route.layout).toBe(StubLayout);
    expect(route.outlet).toBe("sidebar");
    expect(route.transition).toBe("fade");
    expect(route.alias).toBe("pr-with-opts-alias");
  });

  test("also registers the alias in the alias map when provided", () => {
    registerPageEntries(StubPage as any, [
      { url: "/pr-alias-url", alias: "pr-auto-alias" },
    ]);
    expect(resolveAlias("pr-auto-alias")).toBe("/pr-alias-url");
  });

  test("later call with same URL overwrites the earlier entry (last-write wins)", () => {
    registerPageEntries(StubPage as any, [{ url: "/pr-overwrite-url" }]);
    registerPageEntries(AnotherPage as any, [{ url: "/pr-overwrite-url" }]);
    expect(buildRegistryRoutes()["/pr-overwrite-url"]!.page).toBe(AnotherPage);
  });

  test("does not register an alias when alias is undefined", () => {
    registerPageEntries(StubPage as any, [{ url: "/pr-no-alias" }]);
    // A unique key that was never registered must still return undefined.
    expect(resolveAlias("pr-no-alias-key-never-set")).toBeUndefined();
  });

  test("stores undefined layout/outlet/transition when omitted", () => {
    registerPageEntries(StubPage as any, [{ url: "/pr-defaults" }]);
    const route = buildRegistryRoutes()["/pr-defaults"]!;
    expect(route.layout).toBeUndefined();
    expect(route.outlet).toBeUndefined();
    expect(route.transition).toBeUndefined();
    expect(route.alias).toBeUndefined();
  });
});

// region: buildRegistryRoutes

describe("buildRegistryRoutes", () => {
  test("returns a plain object, not a Map", () => {
    const routes = buildRegistryRoutes();
    expect(routes).toBeTypeOf("object");
    expect(routes instanceof Map).toBe(false);
  });

  test("includes routes registered by earlier calls", () => {
    registerPageEntries(StubPage as any, [{ url: "/pr-build-check" }]);
    expect(buildRegistryRoutes()["/pr-build-check"]).toBeDefined();
  });

  test("subsequent calls return the same accumulated routes", () => {
    registerPageEntries(StubPage as any, [{ url: "/pr-snapshot-a" }]);
    const first = buildRegistryRoutes();
    registerPageEntries(StubPage as any, [{ url: "/pr-snapshot-b" }]);
    const second = buildRegistryRoutes();
    // second contains both entries; first was a snapshot so it only had snapshot-a
    expect(first["/pr-snapshot-a"]).toBeDefined();
    expect(second["/pr-snapshot-a"]).toBeDefined();
    expect(second["/pr-snapshot-b"]).toBeDefined();
  });
});
