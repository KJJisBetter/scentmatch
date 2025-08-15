import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright Configuration for End-to-End Frontend Verification
 * 
 * Optimized for comprehensive QA specifications testing
 * Supports multiple devices and performance measurement
 */

export default defineConfig({
  // Test directory
  testDir: './tests/qa',
  
  // Test files pattern
  testMatch: /.*end-to-end-verification\.test\.ts/,
  
  // Global test timeout
  timeout: 30 * 1000, // 30 seconds per test
  
  // Expect timeout for assertions
  expect: {
    timeout: 5000
  },

  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configurations
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],

  // Shared settings for all tests
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:3000',

    // Collect trace when retrying failed tests
    trace: 'on-first-retry',

    // Capture screenshot on failure
    screenshot: 'only-on-failure',

    // Record video on failure
    video: 'retain-on-failure',

    // Navigation timeout
    navigationTimeout: 15000,

    // Action timeout  
    actionTimeout: 10000,

    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,

    // User agent
    userAgent: 'ScentMatch-E2E-Tests/1.0',

    // Viewport size for desktop tests
    viewport: { width: 1280, height: 720 },

    // Color scheme
    colorScheme: 'light',

    // Locale
    locale: 'en-US',

    // Timezone
    timezoneId: 'America/New_York'
  },

  // Configure projects for major browsers and devices
  projects: [
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    {
      name: 'webkit-desktop',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    // Mobile testing
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },

    // Tablet testing
    {
      name: 'tablet-chrome',
      use: { ...devices['Galaxy Tab S4'] },
    },

    {
      name: 'tablet-safari',
      use: { ...devices['iPad Pro'] },
    }
  ],

  // Web server configuration for tests
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
    env: {
      NODE_ENV: 'test',
      // Ensure test environment variables are set
      SUPABASE_URL: process.env.SUPABASE_URL || '',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    }
  },

  // Global setup files
  globalSetup: './tests/qa/global-setup.ts',
  globalTeardown: './tests/qa/global-teardown.ts',

  // Test output directory
  outputDir: 'test-results/screenshots-videos',

  // Maximum time one test can run
  maxFailures: process.env.CI ? 10 : undefined
})