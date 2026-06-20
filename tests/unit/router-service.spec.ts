import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { RouterService } from "../../src/services/router";
import { registerAlias } from "../../src/app/page-registry";

// All alias keys and paths use the "/rs-" prefix.

// region: goTo — history and event behaviour

describe("RouterService.goTo — keepHistory=true (default)", () => {
  let router: RouterService;

  beforeEach(() => {
    router = new RouterService();
    vi.spyOn(window.history, "pushState").mockImplementation(() => {});
    vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
    vi.spyOn(window, "dispatchEvent").mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("pushes the path as a new history entry", () => {
    router.goTo("/rs-about");
    expect(window.history.pushState).toHaveBeenCalledWith(
      { scrollY: 0 },
      "",
      "/rs-about",
    );
  });

  test("saves the current scroll position before pushing", () => {
    router.goTo("/rs-scroll-save");
    // replaceState must be called before pushState
    const replaceCalls = (
      window.history.replaceState as ReturnType<typeof vi.fn>
    ).mock.invocationCallOrder;
    const pushCalls = (window.history.pushState as ReturnType<typeof vi.fn>)
      .mock.invocationCallOrder;
    expect(replaceCalls[0]).toBeLessThan(pushCalls[0]);
  });

  test("dispatches a cl-route CustomEvent on the window", () => {
    router.goTo("/rs-dispatch");
    const events = (
      window.dispatchEvent as ReturnType<typeof vi.fn>
    ).mock.calls.map((c: [Event]) => c[0]);
    expect(
      events.some((e) => e instanceof CustomEvent && e.type === "cl-route"),
    ).toBe(true);
  });

  test("appends query params as a URL-encoded query string", () => {
    router.goTo("/rs-search", { q: "hello world", page: "2" });
    const [, , url] = (window.history.pushState as ReturnType<typeof vi.fn>)
      .mock.calls[0] as [unknown, string, string];
    expect(url).toMatch(/^\/rs-search\?/);
    expect(url).toContain("q=hello%20world");
    expect(url).toContain("page=2");
  });

  test("resolves an alias to its registered URL", () => {
    registerAlias("rs-home", "/rs-home-real-url");
    router.goTo("rs-home");
    const [, , url] = (window.history.pushState as ReturnType<typeof vi.fn>)
      .mock.calls[0] as [unknown, string, string];
    expect(url).toBe("/rs-home-real-url");
  });

  test("prepends '/' when the path has no leading slash and no alias match", () => {
    router.goTo("rs-no-slash");
    const [, , url] = (window.history.pushState as ReturnType<typeof vi.fn>)
      .mock.calls[0] as [unknown, string, string];
    expect(url).toBe("/rs-no-slash");
  });

  test("passes alias params as query string", () => {
    registerAlias("rs-alias-params", "/rs-alias-params-url");
    router.goTo("rs-alias-params", { x: "1" });
    const [, , url] = (window.history.pushState as ReturnType<typeof vi.fn>)
      .mock.calls[0] as [unknown, string, string];
    expect(url).toBe("/rs-alias-params-url?x=1");
  });
});

// region: goTo — keepHistory=false

describe("RouterService.goTo — keepHistory=false", () => {
  let router: RouterService;

  beforeEach(() => {
    router = new RouterService();
    vi.spyOn(window.history, "pushState").mockImplementation(() => {});
    vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
    vi.spyOn(window, "dispatchEvent").mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("replaces the current history entry instead of pushing", () => {
    router.goTo("/rs-replace", false);
    expect(window.history.replaceState).toHaveBeenCalledWith(
      { scrollY: 0 },
      "",
      "/rs-replace",
    );
  });

  test("does not push a new history entry", () => {
    router.goTo("/rs-replace-no-push", false);
    expect(window.history.pushState).not.toHaveBeenCalled();
  });

  test("still dispatches cl-route", () => {
    router.goTo("/rs-replace-event", false);
    const events = (
      window.dispatchEvent as ReturnType<typeof vi.fn>
    ).mock.calls.map((c: [Event]) => c[0]);
    expect(
      events.some((e) => e instanceof CustomEvent && e.type === "cl-route"),
    ).toBe(true);
  });

  test("accepts (path, params, keepHistory=false) overload", () => {
    router.goTo("/rs-three-args", { key: "val" }, false);
    expect(window.history.replaceState).toHaveBeenCalledWith(
      { scrollY: 0 },
      "",
      "/rs-three-args?key=val",
    );
    expect(window.history.pushState).not.toHaveBeenCalled();
  });
});

// region: forceGoTo

describe("RouterService.forceGoTo", () => {
  let router: RouterService;
  let capturedHref: string;

  beforeEach(() => {
    router = new RouterService();
    capturedHref = "";
    vi.stubGlobal("location", {
      get href() {
        return capturedHref;
      },
      set href(v: string) {
        capturedHref = v;
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("sets window.location.href to the given path", () => {
    router.forceGoTo("/rs-force-path");
    expect(capturedHref).toBe("/rs-force-path");
  });

  test("appends query params to the href", () => {
    router.forceGoTo("/rs-force", { key: "val", n: "42" });
    expect(capturedHref).toMatch(/^\/rs-force\?/);
    expect(capturedHref).toContain("key=val");
    expect(capturedHref).toContain("n=42");
  });

  test("omits the query string when params is undefined", () => {
    router.forceGoTo("/rs-force-no-params");
    expect(capturedHref).toBe("/rs-force-no-params");
  });

  test("omits the query string when params is an empty object", () => {
    router.forceGoTo("/rs-force-empty", {});
    expect(capturedHref).toBe("/rs-force-empty");
  });
});
