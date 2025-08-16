import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/integration/platform",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  timeout: 60000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { 
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 }
      },
    }
  ],
  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },
});
