import { defineConfig, devices } from "@playwright/test";

// Two builds from `npm run build`: production (dist/, no playground) and preview (dist-playground/, ADR-0006).
// They're served with `vite preview` until the Docker image exists (#18).
export const PROD = "http://localhost:4173";
export const PREVIEW = "http://localhost:4174";
const reuseExistingServer = !process.env.CI;

export default defineConfig({
  testDir: "e2e",
  forbidOnly: true,
  // Baselines are Linux renders made in CI; other OSes draw fonts differently, so only CI compares them.
  ignoreSnapshots: !process.env.CI,
  reporter: [["html", { open: "never" }], ["list"]],
  use: { baseURL: PROD },
  webServer: [
    {
      command: "npm run preview -- --port 4173 --strictPort",
      url: PROD,
      reuseExistingServer,
    },
    {
      command:
        "npm run preview -- --outDir dist-playground --port 4174 --strictPort",
      url: PREVIEW,
      reuseExistingServer,
    },
  ],
  projects: [
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
});
