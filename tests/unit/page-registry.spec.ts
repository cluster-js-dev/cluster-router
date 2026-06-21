import { beforeEach, describe, test, expect } from "vitest";
import {
  registerPageEntries,
  registerAlias,
  resolveAlias,
  setCurrentAlias,
  getCurrentAlias,
  buildRegistryRoutes,
  _resetForTests,
} from "../../src/app/page-registry";

// Minimal stubs — only the class reference is stored; no instances are created.
class StubPage {}
class AnotherPage {}
class StubLayout {}

beforeEach(() => {
  _resetForTests();
});

// region: registerAlias / resolveAlias

describe("registerAlias / resolveAlias", () => {
  test("stores and retrieves an alias", () => {
    registerAlias("home", "/home-url");
    expect(resolveAlias("home")).toBe("/home-url");
  });

  test("returns undefined for an unknown alias", () => {
    expect(resolveAlias("__no_such_alias__")).toBeUndefined();
  });

  test("later call with same alias overwrites the earlier one", () => {
    registerAlias("overwrite", "/old");
    registerAlias("overwrite", "/new");
    expect(resolveAlias("overwrite")).toBe("/new");
  });
});

// region: setCurrentAlias / getCurrentAlias

describe("setCurrentAlias / getCurrentAlias", () => {
  test("stores and retrieves the current alias", () => {
    setCurrentAlias("active");
    expect(getCurrentAlias()).toBe("active");
  });

  test("stores undefined and returns undefined", () => {
    setCurrentAlias(undefined);
    expect(getCurrentAlias()).toBeUndefined();
  });

  test("overwrites the previous alias", () => {
    setCurrentAlias("first");
    setCurrentAlias("second");
    expect(getCurrentAlias()).toBe("second");
  });
});

// region: registerPageEntries

describe("registerPageEntries", () => {
  test("registers a single URL entry in the registry", () => {
    registerPageEntries(StubPage as any, [{ url: "/single" }]);
    expect(buildRegistryRoutes()["/single"]).toBeDefined();
    expect(buildRegistryRoutes()["/single"]!.page).toBe(StubPage);
  });

  test("registers multiple URL entries from one call", () => {
    registerPageEntries(StubPage as any, [
      { url: "/multi-a" },
      { url: "/multi-b" },
    ]);
    const routes = buildRegistryRoutes();
    expect(routes["/multi-a"]).toBeDefined();
    expect(routes["/multi-b"]).toBeDefined();
  });

  test("stores layout, outlet, transition, and alias from an entry", () => {
    registerPageEntries(StubPage as any, [
      {
        url: "/with-opts",
        layout: StubLayout as any,
        outlet: "sidebar",
        transition: "fade",
        alias: "with-opts-alias",
      },
    ]);
    const route = buildRegistryRoutes()["/with-opts"]!;
    expect(route.layout).toBe(StubLayout);
    expect(route.outlet).toBe("sidebar");
    expect(route.transition).toBe("fade");
    expect(route.alias).toBe("with-opts-alias");
  });

  test("also registers the alias in the alias map when provided", () => {
    registerPageEntries(StubPage as any, [
      { url: "/alias-url", alias: "auto-alias" },
    ]);
    expect(resolveAlias("auto-alias")).toBe("/alias-url");
  });

  test("later call with same URL overwrites the earlier entry (last-write wins)", () => {
    registerPageEntries(StubPage as any, [{ url: "/overwrite-url" }]);
    registerPageEntries(AnotherPage as any, [{ url: "/overwrite-url" }]);
    expect(buildRegistryRoutes()["/overwrite-url"]!.page).toBe(AnotherPage);
  });

  test("does not register an alias when alias is undefined", () => {
    registerPageEntries(StubPage as any, [{ url: "/no-alias" }]);
    expect(resolveAlias("no-alias-key-never-set")).toBeUndefined();
  });

  test("stores undefined layout/outlet/transition when omitted", () => {
    registerPageEntries(StubPage as any, [{ url: "/defaults" }]);
    const route = buildRegistryRoutes()["/defaults"]!;
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

  test("includes routes registered by earlier calls in the same test", () => {
    registerPageEntries(StubPage as any, [{ url: "/build-check" }]);
    expect(buildRegistryRoutes()["/build-check"]).toBeDefined();
  });

  test("accumulates multiple registrations within the same test", () => {
    registerPageEntries(StubPage as any, [{ url: "/snapshot-a" }]);
    const first = buildRegistryRoutes();
    registerPageEntries(StubPage as any, [{ url: "/snapshot-b" }]);
    const second = buildRegistryRoutes();
    expect(first["/snapshot-a"]).toBeDefined();
    expect(second["/snapshot-a"]).toBeDefined();
    expect(second["/snapshot-b"]).toBeDefined();
  });

  test("starts empty after _resetForTests (isolation verification)", () => {
    // At this point beforeEach has run, so the registry is empty.
    expect(Object.keys(buildRegistryRoutes())).toHaveLength(0);
  });
});
