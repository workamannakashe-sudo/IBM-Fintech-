import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  /* Run tests in parallel */
  fullyParallel: true,
  /* Fail fast */
  forbidOnly: !!process.env.CI,
  /* Retry on CI */
  retries: process.env.CI ? 2 : 0,
  /* Single worker locally to keep the dev server stable */
  workers: process.env.CI ? 2 : 1,
  /* Reporter */
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    /* Base URL for all tests */
    baseURL: "http://localhost:5173",
    /* Collect trace on first retry */
    trace: "on-first-retry",
    /* Headless by default */
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  /* Start the Vite dev server before tests */
  webServer: {
    command: "npm.cmd run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
