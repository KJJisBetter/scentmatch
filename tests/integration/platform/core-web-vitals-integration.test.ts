import { test, expect } from "@playwright/test";

test.describe("Core Web Vitals Performance Integration - Task 8.6", () => {
  test("Home page performance validation", async ({ page }) => {
    console.log("Testing home page performance...");
    
    await page.setViewportSize({ width: 375, height: 667 });
    
    const start = Date.now();
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - start;
    
    console.log("Home page load time:", loadTime + "ms");
    expect(loadTime, "Home page should load under 3000ms").toBeLessThan(3000);
  });

  test("Authentication pages performance", async ({ page }) => {
    console.log("Testing auth pages performance...");
    
    const authPages = ["/auth/login", "/auth/signup"];
    
    for (const url of authPages) {
      const start = Date.now();
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      const loadTime = Date.now() - start;
      
      console.log(url + " load time:", loadTime + "ms");
      expect(loadTime, url + " should load under 2500ms").toBeLessThan(2500);
    }
  });
});
