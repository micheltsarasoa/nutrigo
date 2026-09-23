import { defineConfig, devices } from "@playwright/test";

// Runs against `vite preview` of the production build until the Docker image exists (#18).
export default defineConfig({
  testDir: "e2e",
  forbidOnly: true,
  reporter: [["html", { open: "never" }], ["list"]],
  use: { baseURL: "http://localhost:4173" },
  webServer: {
    command: "npm run preview -- --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
  },
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
