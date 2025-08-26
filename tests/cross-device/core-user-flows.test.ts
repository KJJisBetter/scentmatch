import { test, expect, type Page } from "@playwright/test";

/**
 * Core User Flow Testing Across All Devices
 * Tests critical paths: quiz → collection, search, browse
 */

test.describe("Cross-Device Core User Flows", () => {
  test.beforeEach(async ({ page }) => {
    // Enable network throttling for mobile devices
    if (test.info().project.name.includes("Mobile") || test.info().project.name.includes("3G")) {
      await page.route("**/*", (route) => {
        // Add artificial delay for slow connections
        setTimeout(() => route.continue(), 100);
      });
    }
  });

  test("Homepage loads and navigation works", async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto("/");
    
    // Wait for page to be interactive
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - startTime;
    
    // Performance assertions
    expect(loadTime).toBeLessThan(5000); // 5s max on slow connections
    
    // Core navigation elements present
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator("text=Discover Your Signature Scent")).toBeVisible();
    
    // Mobile navigation specifically
    if (test.info().project.name.includes("iPhone") || 
        test.info().project.name.includes("Galaxy") || 
        test.info().project.name.includes("Pixel")) {
      
      // Bottom navigation should be visible on mobile
      const bottomNav = page.locator("[data-testid='bottom-navigation']").first();
      await expect(bottomNav).toBeVisible();
      
      // Test bottom nav items
      await expect(page.locator("text=Home")).toBeVisible();
      await expect(page.locator("text=Quiz")).toBeVisible();
      await expect(page.locator("text=Browse")).toBeVisible();
      await expect(page.locator("text=Collection")).toBeVisible();
    }
    
    // Take screenshot for visual regression
    await page.screenshot({ 
      path: `test-results/screenshots/${test.info().project.name}-homepage.png`,
      fullPage: true 
    });
  });

  test("Quiz flow works end-to-end", async ({ page }) => {
    await page.goto("/");
    
    // Start quiz
    const quizButton = page.locator("text=Take the Quiz").first();
    await expect(quizButton).toBeVisible();
    await quizButton.click();
    
    // Should navigate to quiz page
    await expect(page).toHaveURL("/quiz");
    await page.waitForLoadState("networkidle");
    
    // Quiz interface should load
    await expect(page.locator("text=Find Your Perfect Fragrance")).toBeVisible();
    
    // Test progressive loading
    const questionContainer = page.locator("[data-testid='quiz-question']").first();
    await expect(questionContainer).toBeVisible();
    
    // Complete first question (gender selection)
    const genderOptions = page.locator("input[type='radio']");
    await expect(genderOptions.first()).toBeVisible();
    await genderOptions.first().click();
    
    // Continue button should become enabled
    const continueBtn = page.locator("button", { hasText: /continue|next/i }).first();
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();
    
    // Next question should load
    await page.waitForTimeout(1000); // Allow transition
    
    // Touch interaction testing for mobile devices
    if (test.info().project.name.includes("iPhone") || 
        test.info().project.name.includes("Galaxy")) {
      
      // Test touch targets are adequate size (44px minimum)
      const touchTargets = await page.locator("button, input, [role='button']").all();
      for (const target of touchTargets) {
        const box = await target.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(box.width).toBeGreaterThanOrEqual(44);
        }
      }
    }
    
    await page.screenshot({ 
      path: `test-results/screenshots/${test.info().project.name}-quiz.png`,
      fullPage: true 
    });
  });

  test("Search functionality works", async ({ page }) => {
    await page.goto("/");
    
    // Navigate to browse/search
    if (test.info().project.name.includes("Mobile")) {
      // Use bottom navigation on mobile
      const browseTab = page.locator("[data-testid='bottom-navigation'] text=Browse").first();
      await browseTab.click();
    } else {
      // Use main navigation on desktop
      const browseLink = page.locator("nav a[href*='browse']").first();
      if (await browseLink.isVisible()) {
        await browseLink.click();
      } else {
        await page.goto("/browse");
      }
    }
    
    await page.waitForLoadState("networkidle");
    
    // Search input should be visible
    const searchInput = page.locator("input[type='search'], input[placeholder*='search' i]").first();
    await expect(searchInput).toBeVisible();
    
    // Test search functionality
    await searchInput.fill("woody");
    await searchInput.press("Enter");
    
    // Wait for search results
    await page.waitForTimeout(2000);
    
    // Results should appear
    const results = page.locator("[data-testid='fragrance-card'], .fragrance-card").first();
    await expect(results).toBeVisible();
    
    // Filter chips should work on mobile
    if (test.info().project.name.includes("Mobile")) {
      const filterChips = page.locator("[data-testid='filter-chips'] button").first();
      if (await filterChips.isVisible()) {
        await filterChips.click();
        // Filter should toggle
        await expect(filterChips).toHaveClass(/active|selected/);
      }
    }
    
    await page.screenshot({ 
      path: `test-results/screenshots/${test.info().project.name}-search.png`,
      fullPage: true 
    });
  });

  test("Collection page works", async ({ page }) => {
    await page.goto("/");
    
    // Navigate to collection
    if (test.info().project.name.includes("Mobile")) {
      const collectionTab = page.locator("[data-testid='bottom-navigation'] text=Collection").first();
      await collectionTab.click();
    } else {
      await page.goto("/collection");
    }
    
    await page.waitForLoadState("networkidle");
    
    // Collection page should load
    await expect(page.locator("h1, h2").first()).toBeVisible();
    
    // Empty state or content should be visible
    const emptyState = page.locator("text=Start building your collection").first();
    const collectionContent = page.locator("[data-testid='collection-grid']").first();
    
    // Either empty state or collection content should be visible
    await expect(emptyState.or(collectionContent)).toBeVisible();
    
    await page.screenshot({ 
      path: `test-results/screenshots/${test.info().project.name}-collection.png`,
      fullPage: true 
    });
  });

  test("Responsive design works at various breakpoints", async ({ page }) => {
    // Test at different viewport sizes
    const viewports = [
      { width: 320, height: 568, name: "small-mobile" },
      { width: 375, height: 667, name: "mobile" },
      { width: 768, height: 1024, name: "tablet" },
      { width: 1024, height: 768, name: "desktop" },
      { width: 1440, height: 900, name: "large-desktop" }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      
      // Layout should not overflow
      const body = await page.locator("body").boundingBox();
      expect(body?.width).toBeLessThanOrEqual(viewport.width + 1);
      
      // Navigation should be appropriate for screen size
      if (viewport.width < 768) {
        // Mobile navigation
        const bottomNav = page.locator("[data-testid='bottom-navigation']").first();
        await expect(bottomNav).toBeVisible();
      } else {
        // Desktop navigation
        const mainNav = page.locator("nav").first();
        await expect(mainNav).toBeVisible();
      }
      
      await page.screenshot({ 
        path: `test-results/screenshots/${test.info().project.name}-${viewport.name}.png`,
        fullPage: true 
      });
    }
  });

  test("Performance meets Core Web Vitals thresholds", async ({ page }) => {
    // Enable performance monitoring
    await page.addInitScript(() => {
      window.performanceMetrics = [];
      
      // Monitor LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'largest-contentful-paint') {
            window.performanceMetrics.push({ 
              type: 'LCP', 
              value: entry.startTime 
            });
          }
        });
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // Monitor CLS
      new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        window.performanceMetrics.push({ 
          type: 'CLS', 
          value: clsValue 
        });
      }).observe({ entryTypes: ['layout-shift'] });
    });
    
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Get performance metrics
    const metrics = await page.evaluate(() => window.performanceMetrics);
    
    // Check Core Web Vitals thresholds
    const lcpMetric = metrics.find(m => m.type === 'LCP');
    const clsMetric = metrics.find(m => m.type === 'CLS');
    
    if (lcpMetric) {
      // LCP should be under 2.5s for good performance
      expect(lcpMetric.value).toBeLessThan(2500);
    }
    
    if (clsMetric) {
      // CLS should be under 0.1 for good performance
      expect(clsMetric.value).toBeLessThan(0.1);
    }
    
    // Test loading time
    const performanceEntries = await page.evaluate(() => {
      return JSON.stringify(performance.getEntriesByType('navigation'));
    });
    
    const navEntries = JSON.parse(performanceEntries);
    if (navEntries.length > 0) {
      const loadTime = navEntries[0].loadEventEnd - navEntries[0].navigationStart;
      
      // Adjust expectations based on device type
      if (test.info().project.name.includes("3G")) {
        expect(loadTime).toBeLessThan(5000); // 5s for slow connections
      } else {
        expect(loadTime).toBeLessThan(3000); // 3s for normal connections
      }
    }
  });

  test("Memory usage stays within limits", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        };
      }
      return null;
    });
    
    if (initialMemory) {
      // Memory should not exceed reasonable limits
      // Convert to MB for easier reading
      const usedMB = initialMemory.usedJSHeapSize / (1024 * 1024);
      const totalMB = initialMemory.totalJSHeapSize / (1024 * 1024);
      
      console.log(`Memory Usage: ${usedMB.toFixed(2)}MB / ${totalMB.toFixed(2)}MB`);
      
      // Should not use more than 50MB for initial page load
      expect(usedMB).toBeLessThan(50);
    }
    
    // Navigate through app and check for memory leaks
    await page.click("text=Quiz", { force: true });
    await page.waitForTimeout(1000);
    await page.goBack();
    await page.waitForTimeout(1000);
    
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        };
      }
      return null;
    });
    
    if (initialMemory && finalMemory) {
      const memoryIncrease = (finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize) / (1024 * 1024);
      console.log(`Memory increase after navigation: ${memoryIncrease.toFixed(2)}MB`);
      
      // Memory increase should be minimal after navigation
      expect(memoryIncrease).toBeLessThan(10);
    }
  });
});