import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { ClBody } from "../../src/app/cl-body";

// Creates a minimal stub for ClBody lifecycle testing without needing a real
// DOM connection. Object.create bypasses the constructor so the framework
// lifecycle is not triggered; we call beforeRender/dispose directly.
function makeStub(name: string = "default"): ClBody {
  const stub = Object.create(ClBody.prototype) as ClBody;
  (stub as unknown as Record<string, unknown>)["name"] = name;
  return stub;
}

// Prevent super.dispose() (ClBase) from erroring on a stub object.
function spyDispose() {
  return vi
    .spyOn(
      Object.getPrototypeOf(ClBody.prototype) as { dispose(): void },
      "dispose",
    )
    .mockImplementation(() => {});
}

describe("ClBody — static registry", () => {
  beforeEach(() => {
    (
      ClBody as unknown as { _instances: Map<string, ClBody> }
    )._instances.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // region: static getters

  it("named() returns undefined for an unregistered name", () => {
    expect(ClBody.named("never-registered")).toBeUndefined();
  });

  it("instance returns undefined when no default outlet is registered", () => {
    expect(ClBody.instance).toBeUndefined();
  });

  // region: beforeRender registration

  it("beforeRender() registers the instance under its name", () => {
    const body = makeStub("sidebar");
    (body as unknown as { beforeRender(): void }).beforeRender();
    expect(ClBody.named("sidebar")).toBe(body);
  });

  it("instance getter returns the entry registered under 'default'", () => {
    const body = makeStub("default");
    (body as unknown as { beforeRender(): void }).beforeRender();
    expect(ClBody.instance).toBe(body);
  });

  it("second beforeRender() under the same name replaces the first registration", () => {
    const body1 = makeStub("slot");
    const body2 = makeStub("slot");
    (body1 as unknown as { beforeRender(): void }).beforeRender();
    (body2 as unknown as { beforeRender(): void }).beforeRender();
    expect(ClBody.named("slot")).toBe(body2);
  });

  // region: dispose deregistration

  it("dispose() removes the instance when it is the current registrant", () => {
    spyDispose();
    const body = makeStub("main");
    (body as unknown as { beforeRender(): void }).beforeRender();
    (body as unknown as { dispose(): void }).dispose();
    expect(ClBody.named("main")).toBeUndefined();
  });

  it("dispose() does not remove a different instance that owns the same name", () => {
    spyDispose();
    const body1 = makeStub("slot");
    const body2 = makeStub("slot");
    (body1 as unknown as { beforeRender(): void }).beforeRender();
    (body2 as unknown as { beforeRender(): void }).beforeRender(); // body2 takes over
    (body1 as unknown as { dispose(): void }).dispose(); // must NOT remove body2
    expect(ClBody.named("slot")).toBe(body2);
  });

  // region: html() rendering

  it("html() returns the result of templateHtml when set", () => {
    const body = makeStub();
    const mockTemplate = { __isTemplate: true };
    (body as unknown as { templateHtml: () => unknown }).templateHtml = () =>
      mockTemplate;
    const result = (body as unknown as { html(): unknown }).html();
    expect(result).toBe(mockTemplate);
  });

  it("html() returns an empty RenderTemplate when templateHtml is not set", () => {
    const body = makeStub();
    (body as unknown as { templateHtml: undefined }).templateHtml = undefined;
    const result = (body as unknown as { html(): unknown }).html();
    // html`` from cluster-templates returns a RenderTemplate object
    expect(result).toBeDefined();
  });

  // region: constructor initializes defaults

  it("element created via document.createElement has templateHtml undefined by default", () => {
    const el = document.createElement("cl-body") as ClBody;
    expect(el.templateHtml).toBeUndefined();
    expect(el.name).toBe("default");
  });

  // region: name-change leak fix

  it("changing name before next beforeRender() removes the stale entry", () => {
    const body = makeStub("sidebar");
    (body as unknown as { beforeRender(): void }).beforeRender();
    // Simulate a name prop change
    (body as unknown as Record<string, unknown>)["name"] = "main";
    (body as unknown as { beforeRender(): void }).beforeRender();
    expect(ClBody.named("sidebar")).toBeUndefined();
    expect(ClBody.named("main")).toBe(body);
  });

  it("stale entry is NOT removed if a different instance already owns it", () => {
    const body1 = makeStub("sidebar");
    const body2 = makeStub("sidebar");
    (body1 as unknown as { beforeRender(): void }).beforeRender();
    (body2 as unknown as { beforeRender(): void }).beforeRender(); // body2 takes over "sidebar"
    // body1 changes its name and re-registers
    (body1 as unknown as Record<string, unknown>)["name"] = "main";
    (body1 as unknown as { beforeRender(): void }).beforeRender();
    // "sidebar" still belongs to body2 — body1 must not have cleared it
    expect(ClBody.named("sidebar")).toBe(body2);
    expect(ClBody.named("main")).toBe(body1);
  });
});
