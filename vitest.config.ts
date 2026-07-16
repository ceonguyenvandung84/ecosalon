import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.{ts,tsx}"],
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});