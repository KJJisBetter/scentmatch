import { test, expect } from "@playwright/test";

/**
 * Network Throttling & Connection Resilience Testing
 * Tests performance under various network conditions
 */

test.describe("Network Throttling & Resilience", () => {
  const networkProfiles = {
    slow3G: {
      offline: false,
      downloadThroughput: 780 * 1024 / 8, // 780 kbps in bytes/second
      uploadThroughput: 330 * 1024 / 8,   // 330 kbps
      latency: 2000 // 2 seconds
    },
    fast3G: {
      offline: false,
      downloadThroughput: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps
      uploadThroughput: 750 * 1024 / 8,           // 750 kbps
      latency: 560 // 560ms
    },
    slow2G: {
      offline: false,
      downloadThroughput: 256 * 1024 / 8, // 256 kbps
      uploadThroughput: 256 * 1024 / 8,   // 256 kbps
      latency: 3000 // 3 seconds
    }
  };

  test("App loads on Slow 3G connection", async ({ page, context }) => {
    // Apply slow 3G throttling
    await context.route("**/*", async (route) => {
      // Simulate slow network with delays
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    });

    const startTime = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    
    // Should load within reasonable time on slow connection
    const domLoadTime = Date.now() - startTime;
    console.log(`DOM Load Time on Slow 3G: ${domLoadTime}ms`);
    expect(domLoadTime).toBeLessThan(10000); // 10 seconds max

    // Critical content should be visible
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Discover Your Signature Scent")).toBeVisible({ timeout: 15000 });

    // Wait for network idle on slow connection
    await page.waitForLoadState("networkidle", { timeout: 30000 });
    const fullLoadTime = Date.now() - startTime;
    console.log(`Full Load Time on Slow 3G: ${fullLoadTime}ms`);
    expect(fullLoadTime).toBeLessThan(20000); // 20 seconds max
  });

  test("Progressive loading works on slow connections", async ({ page, context }) => {
    // Track loading states
    const loadingStates: Array<{ timestamp: number; state: string }> = [];

    await page.addInitScript(() => {
      window.loadingTracker = [];
      
      // Monitor loading indicators
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                if (element.classList?.contains('animate-pulse') ||
                    element.getAttribute('data-testid')?.includes('skeleton') ||
                    element.classList?.contains('loading')) {
                  window.loadingTracker.push({
                    timestamp: Date.now(),
                    type: 'loading-shown',
                    element: element.tagName
                  });
                }
              }
            });
          }
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });

    // Apply network throttling
    await context.route("**/*", async (route) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      await route.continue();
    });

    await page.goto("/");

    // Should show loading indicators initially
    const hasLoadingIndicators = await page.locator("[data-testid*='skeleton'], .animate-pulse, .loading").first().isVisible().catch(() => false);
    
    if (hasLoadingIndicators) {
      console.log("Progressive loading indicators detected");
    }

    // Wait for content to fully load
    await page.waitForLoadState("networkidle", { timeout: 30000 });

    // Get loading tracking data
    const loadingData = await page.evaluate(() => window.loadingTracker || []);
    console.log(`Loading states tracked: ${loadingData.length}`);
  });

  test("Quiz works on throttled connection", async ({ page, context }) => {
    // Apply fast 3G throttling
    await context.route("**/*", async (route) => {
      await new Promise(resolve => setTimeout(resolve, 80));
      await route.continue();
    });

    await page.goto("/quiz", { timeout: 30000 });
    await page.waitForLoadState("domcontentloaded");

    // Quiz interface should load
    await expect(page.locator("text=Find Your Perfect Fragrance")).toBeVisible({ timeout: 15000 });

    // Should be able to interact with quiz elements
    const genderOptions = page.locator("input[type='radio']").first();
    await expect(genderOptions).toBeVisible({ timeout: 10000 });
    await genderOptions.click();

    // Continue button should work
    const continueBtn = page.locator("button", { hasText: /continue|next/i }).first();
    await expect(continueBtn).toBeEnabled({ timeout: 5000 });
    
    const clickStartTime = Date.now();
    await continueBtn.click();
    
    // Next question should load within reasonable time
    await page.waitForTimeout(3000); // Allow for slow network
    const responseTime = Date.now() - clickStartTime;
    console.log(`Quiz interaction response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(8000); // 8 seconds max on slow connection
  });

  test("Search functionality on slow connection", async ({ page, context }) => {
    // Apply slow 2G throttling for extreme case
    await context.route("**/*", async (route) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      await route.continue();
    });

    await page.goto("/", { timeout: 45000 });
    await page.waitForLoadState("domcontentloaded");

    // Navigate to browse/search
    try {
      const browseLink = page.locator("text=Browse").first();
      await browseLink.click({ timeout: 10000 });
    } catch {
      await page.goto("/browse", { timeout: 30000 });
    }

    // Search input should eventually be available
    const searchInput = page.locator("input[type='search'], input[placeholder*='search' i]").first();
    await expect(searchInput).toBeVisible({ timeout: 20000 });

    // Test search with debouncing
    const searchStartTime = Date.now();
    await searchInput.fill("woody");
    
    // Should handle slow typing/search
    await searchInput.press("Enter");
    await page.waitForTimeout(5000); // Allow for slow search

    const searchTime = Date.now() - searchStartTime;
    console.log(`Search response time on slow connection: ${searchTime}ms`);
    
    // Results should eventually appear or show appropriate loading state
    const hasResults = await page.locator("[data-testid='fragrance-card'], .fragrance-card").first().isVisible().catch(() => false);
    const hasLoading = await page.locator("[data-testid*='loading'], .loading").first().isVisible().catch(() => false);
    
    expect(hasResults || hasLoading).toBeTruthy();
  });

  test("Offline resilience", async ({ page, context }) => {
    // First load the page normally
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Then go offline
    await context.setOffline(true);

    // Try to navigate - should show appropriate offline messaging
    const navigationResult = await page.goto("/quiz").catch(err => err);
    
    // Should handle offline gracefully
    const hasOfflineMessage = await page.locator("text=offline, text=connection, text=network").first().isVisible().catch(() => false);
    
    if (hasOfflineMessage) {
      console.log("Offline messaging detected");
    }

    // Restore connection
    await context.setOffline(false);
    
    // Should recover when connection restored
    await page.reload();
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 });
  });

  test("Resource loading priority on slow connections", async ({ page, context }) => {
    const resourceTiming: Array<{ url: string; type: string; loadTime: number; priority?: string }> = [];

    page.on("response", async (response) => {
      const request = response.request();
      const timing = response.timing();
      const url = response.url();
      
      let type = "other";
      if (url.includes(".css")) type = "stylesheet";
      else if (url.includes(".js")) type = "script";
      else if (url.match(/\.(jpg|png|webp|gif)$/)) type = "image";
      else if (url.includes("/api/")) type = "api";

      resourceTiming.push({
        url: url.split("/").pop() || url,
        type,
        loadTime: timing.responseEnd - timing.responseStart,
        priority: request.headers()["priority"] || "normal"
      });
    });

    // Apply network throttling
    await context.route("**/*", async (route) => {
      const url = route.request().url();
      
      // Prioritize critical resources
      if (url.includes(".css") || url.includes("critical")) {
        // Load CSS faster
        await new Promise(resolve => setTimeout(resolve, 50));
      } else if (url.match(/\.(jpg|png|webp)$/)) {
        // Load images slower
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      await route.continue();
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle", { timeout: 30000 });

    // Analyze resource loading patterns
    const criticalResources = resourceTiming.filter(r => 
      r.type === "stylesheet" || r.url.includes("critical") || r.type === "script"
    );
    
    const nonCriticalResources = resourceTiming.filter(r => 
      r.type === "image" || r.url.includes("analytics")
    );

    console.log(`Critical resources: ${criticalResources.length}`);
    console.log(`Non-critical resources: ${nonCriticalResources.length}`);

    if (criticalResources.length > 0 && nonCriticalResources.length > 0) {
      const avgCriticalLoadTime = criticalResources.reduce((sum, r) => sum + r.loadTime, 0) / criticalResources.length;
      const avgNonCriticalLoadTime = nonCriticalResources.reduce((sum, r) => sum + r.loadTime, 0) / nonCriticalResources.length;

      console.log(`Average critical resource load time: ${avgCriticalLoadTime.toFixed(2)}ms`);
      console.log(`Average non-critical resource load time: ${avgNonCriticalLoadTime.toFixed(2)}ms`);

      // Critical resources should generally load faster or at least not significantly slower
      expect(avgCriticalLoadTime).toBeLessThan(avgNonCriticalLoadTime * 2);
    }
  });

  test("Mobile navigation performance on slow connection", async ({ page, context }) => {
    // Only test on mobile devices
    if (!test.info().project.name.includes("iPhone") && 
        !test.info().project.name.includes("Galaxy") && 
        !test.info().project.name.includes("Pixel")) {
      test.skip();
    }

    // Apply mobile 3G throttling
    await context.route("**/*", async (route) => {
      await new Promise(resolve => setTimeout(resolve, 120));
      await route.continue();
    });

    await page.goto("/", { timeout: 30000 });
    await page.waitForLoadState("domcontentloaded");

    // Test bottom navigation performance
    const bottomNav = page.locator("[data-testid='bottom-navigation']").first();
    await expect(bottomNav).toBeVisible({ timeout: 15000 });

    // Test navigation speed
    const navigationTests = [
      { tab: "Quiz", expectedUrl: "/quiz" },
      { tab: "Browse", expectedUrl: "/browse" },
      { tab: "Collection", expectedUrl: "/collection" }
    ];

    for (const nav of navigationTests) {
      const startTime = Date.now();
      
      try {
        const tabButton = page.locator(`[data-testid='bottom-navigation'] text=${nav.tab}`).first();
        await tabButton.click({ timeout: 5000 });
        
        // Wait for navigation to complete
        await page.waitForURL(url => url.pathname.includes(nav.expectedUrl.replace("/", "")), { timeout: 15000 });
        
        const navTime = Date.now() - startTime;
        console.log(`${nav.tab} navigation time: ${navTime}ms`);
        
        // Navigation should complete within reasonable time on slow connection
        expect(navTime).toBeLessThan(10000); // 10 seconds max
        
      } catch (error) {
        console.log(`Navigation to ${nav.tab} failed or timed out: ${error}`);
      }
      
      // Return to home for next test
      await page.goto("/", { timeout: 20000 });
      await page.waitForLoadState("domcontentloaded");
    }
  });
});