import { test, expect } from "@playwright/test";

test.describe("Complete System Integration - Task 8.8", () => {
  test("Platform holistic integration validation", async ({ page }) => {
    console.log("Starting complete platform integration validation...");
    
    // Phase 1: System Availability and Basic Functionality
    console.log("Phase 1: System availability check");
    
    // Test all core pages are accessible
    const corePages = ["/", "/auth/login", "/auth/signup"];
    
    for (const url of corePages) {
      console.log("Testing page:", url);
      
      const start = Date.now();
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      const loadTime = Date.now() - start;
      
      // Verify page loads successfully
      expect(page.url()).toContain(url.split("?")[0]);
      expect(loadTime, url + " should load within reasonable time").toBeLessThan(10000);
      
      // Verify page has essential content
      const title = await page.title();
      expect(title.length, url + " should have a meaningful title").toBeGreaterThan(0);
      
      console.log("SUCCESS:", url, "loaded in", loadTime + "ms");
    }
    
    console.log("All core pages accessible and functional");
  });
});
