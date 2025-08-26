import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/accessibility',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report-accessibility' }],
    ['junit', { outputFile: 'playwright-accessibility-results.xml' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true, // Always run headless for accessibility tests
  },
  
  projects: [
    {
      name: 'accessibility-chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /browser-accessibility\.test\.ts$/,
    },
    
    {
      name: 'accessibility-firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /browser-accessibility\.test\.ts$/,
    },

    {
      name: 'accessibility-mobile',
      use: { ...devices['Pixel 5'] },
      testMatch: /browser-accessibility\.test\.ts$/,
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});