import { defineConfig } from "vitest/config";

// Thresholds from docs/testing/strategy.md §3.
export default defineConfig({
  test: {
    projects: ["packages/*", "apps/*"],
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**", "apps/*/src/**"],
      exclude: [
        "**/*.test.*",
        "**/*.playground.tsx",
        "**/main.tsx",
        "apps/api/src/index.ts",
        "**/migrations/**",
        "**/fixtures/**",
      ],
      thresholds: {
        "packages/shared/src/**": { lines: 95, branches: 90 },
        "apps/api/src/**": { lines: 85, branches: 80 },
        "apps/web/src/**": { lines: 80, branches: 75 },
      },
    },
  },
});
