import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["tests/unit/**/*.spec.ts"],
    // All cluster-* packages ship ESM with extension-less imports that Node
    // cannot resolve natively. Inline them so Vite handles the resolution.
    server: {
      deps: {
        inline: [
          "cluster-templates",
          "cluster-inject",
          "cluster-components",
          "cluster-extensions",
        ],
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: [
        "src/app/page-registry.ts",
        "src/services/router.ts",
        "src/app/cl-body.ts",
      ],
      exclude: ["**/node_modules/**"],
      thresholds: {
        statements: 85,
        branches: 78,
        functions: 90,
        lines: 85,
      },
    },
  },
});
