import { test, expect } from "@playwright/test";

test.describe("Basic Integration Test - Tasks 8.2-8.8", () => {
  test("Platform basic functionality validation", async ({ page }) => {
    console.log("Testing basic platform functionality...");
    
    try {
      // Test home page accessibility
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
      
      const title = await page.title();
      console.log("Home page title:", title);
      expect(title.length, "Home page should have a title").toBeGreaterThan(0);
      
      // Test auth pages accessibility
      await page.goto("/auth/login");
      await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
      
      const loginTitle = await page.title();
      console.log("Login page title:", loginTitle);
      expect(loginTitle.length, "Login page should have a title").toBeGreaterThan(0);
      
      // Test form elements exist
      const emailInput = await page.locator("input[type=\"email\"]").count();
      const passwordInput = await page.locator("input[type=\"password\"]").count();
      
      console.log("Login form elements - Email inputs:", emailInput, "Password inputs:", passwordInput);
      expect(emailInput, "Should have email input").toBeGreaterThan(0);
      expect(passwordInput, "Should have password input").toBeGreaterThan(0);
      
      console.log("INTEGRATION TEST PASSED: Basic platform functionality validated");
      
    } catch (error) {
      console.error("Integration test error:", error.message);
      throw error;
    }
  });
});
