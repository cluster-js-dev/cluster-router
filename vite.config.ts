import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: ".",
  server: {
    port: 8080,
  },
  build: {
    rollupOptions: {
      treeshake: false,
      cache: false,
      input: {
        main: resolve(__dirname, "src/index.ts"),
        testsSrc: resolve(__dirname, "tests/src/index.ts"),
      },
      output: {
        dir: "dist",
        entryFileNames: (chunk) => {
          if (chunk.name === "testsSrc") return "tests/src/main.js";
          return "src/[name].js";
        },
      },
    },
    outDir: "dist",
    sourcemap: true,
    minify: false,
  },
});
