import { defineConfig, devices } from "@playwright/test";

/**
 * Cross-Device Testing Configuration
 * Tests mobile-first UX enhancements across all major device types
 */
export default defineConfig({
  testDir: "./tests/cross-device",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 2,
  reporter: [
    ["html", { outputFolder: "test-results/cross-device-report" }],
    ["json", { outputFile: "test-results/cross-device-results.json" }],
    ["list"]
  ],
  timeout: 60000, // Extended timeout for performance testing
  expect: {
    // Screenshots for visual regression testing
    toHaveScreenshot: { threshold: 0.2, maxDiffPixels: 100 }
  },
  use: {
    baseURL: process.env.TEST_URL || "http://localhost:3001",
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: [
    // Mobile Devices
    {
      name: "iPhone 14",
      use: {
        ...devices["iPhone 14"],
        // Test slow 3G network conditions
        launchOptions: {
          slowMo: 50
        }
      }
    },
    {
      name: "iPhone SE",
      use: {
        ...devices["iPhone SE"],
        // Small screen edge case testing
        viewport: { width: 375, height: 667 }
      }
    },
    {
      name: "Samsung Galaxy S23",
      use: {
        ...devices["Galaxy S5"], // Closest approximation
        userAgent: "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36"
      }
    },
    {
      name: "Pixel 7",
      use: {
        ...devices["Pixel 5"],
        userAgent: "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36"
      }
    },
    
    // Tablets
    {
      name: "iPad Pro",
      use: {
        ...devices["iPad Pro"]
      }
    },
    {
      name: "Surface Pro",
      use: {
        viewport: { width: 1368, height: 912 },
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        hasTouch: true
      }
    },
    {
      name: "Galaxy Tab",
      use: {
        viewport: { width: 1280, height: 800 },
        userAgent: "Mozilla/5.0 (Linux; Android 12; SM-T870) AppleWebKit/537.36",
        hasTouch: true
      }
    },
    
    // Desktop Cross-Browser
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "Desktop Firefox",
      use: { ...devices["Desktop Firefox"] }
    },
    {
      name: "Desktop Safari",
      use: { ...devices["Desktop Safari"] }
    },
    {
      name: "Desktop Edge",
      use: { ...devices["Desktop Edge"] }
    },
    
    // Network Throttling Tests
    {
      name: "Slow 3G Mobile",
      use: {
        ...devices["iPhone 14"],
        // Simulate slow 3G connection
        launchOptions: {
          args: ["--disable-web-security", "--disable-features=VizDisplayCompositor"]
        }
      }
    },
    {
      name: "Fast 3G Mobile",
      use: {
        ...devices["Galaxy S5"],
        // Simulate fast 3G connection
        launchOptions: {
          slowMo: 25
        }
      }
    }
  ],
  
  // Global setup for development server
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});