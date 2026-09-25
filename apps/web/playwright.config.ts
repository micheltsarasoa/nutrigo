import { defineConfig, devices } from "@playwright/test";

// `npm run build` makes two builds: production (dist/, no playground) and
// preview (dist-playground/, ADR-0006). Production is served by the real API
// (`node ../api/src/index.ts`, ADR-0005) so the e2e suite exercises the same
// shape as Docker/Railway, with its own SQLite file per project (mobile,
// desktop) so they never share settings state. The playground keeps using
// `vite preview`, since it has no API calls of its own.
export const PREVIEW = "http://localhost:4174";
const MOBILE = "http://localhost:4173";
const DESKTOP = "http://localhost:4175";
const reuseExistingServer = !process.env.CI;

const apiServer = (port: number, dbFile: string) => ({
  command: `node ../api/src/index.ts`,
  url: `http://localhost:${port}/api/health`,
  reuseExistingServer,
  env: {
    ...process.env,
    PORT: String(port),
    WEB_ROOT: "dist",
    DATABASE_PATH: `.e2e-data/${dbFile}`,
  } as Record<string, string>,
});

export default defineConfig({
  testDir: "e2e",
  forbidOnly: true,
  // Baselines are Linux renders made in CI; other OSes draw fonts differently, so only CI compares them.
  ignoreSnapshots: !process.env.CI,
  reporter: [["html", { open: "never" }], ["list"]],
  webServer: [
    apiServer(4173, "mobile.db"),
    apiServer(4175, "desktop.db"),
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
        baseURL: MOBILE,
      },
    },
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        baseURL: DESKTOP,
      },
    },
  ],
});
