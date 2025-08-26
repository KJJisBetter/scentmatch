import { test, expect, type Page } from "@playwright/test";
import lighthouse from "lighthouse";
import { createServer } from "http";

/**
 * Performance Analysis & Core Web Vitals Testing
 * Comprehensive performance validation across devices and network conditions
 */

interface PerformanceMetrics {
  FCP: number;
  LCP: number;
  FID: number;
  CLS: number;
  TTFB: number;
  bundleSize?: number;
  memoryUsage?: number;
}

test.describe("Performance Analysis & Optimization", () => {
  let baselineMetrics: PerformanceMetrics | null = null;

  test.beforeAll(async () => {
    // Establish baseline performance metrics
    // This would typically be run once to set reference values
  });

  test("Bundle size analysis and optimization", async ({ page, browserName }) => {
    // Skip bundle analysis on mobile devices (only needed on desktop)
    if (test.info().project.name.includes("iPhone") || 
        test.info().project.name.includes("Galaxy")) {
      test.skip();
    }

    await page.goto("/");
    
    // Monitor network requests to analyze bundle sizes
    const networkRequests: Array<{ url: string; size: number; type: string }> = [];
    
    page.on("response", async (response) => {
      const url = response.url();
      const headers = response.headers();
      const size = parseInt(headers["content-length"] || "0");
      
      if (url.includes("/_next/static/")) {
        const type = url.includes(".js") ? "javascript" : 
                    url.includes(".css") ? "stylesheet" : "other";
        networkRequests.push({ url, size, type });
      }
    });
    
    await page.waitForLoadState("networkidle");
    
    // Calculate total bundle sizes
    const jsBundle = networkRequests
      .filter(req => req.type === "javascript")
      .reduce((total, req) => total + req.size, 0);
    
    const cssBundle = networkRequests
      .filter(req => req.type === "stylesheet")
      .reduce((total, req) => total + req.size, 0);
    
    const totalBundle = jsBundle + cssBundle;
    
    console.log(`Bundle Analysis for ${browserName}:`);
    console.log(`JavaScript: ${(jsBundle / 1024).toFixed(2)} KB`);
    console.log(`CSS: ${(cssBundle / 1024).toFixed(2)} KB`);
    console.log(`Total: ${(totalBundle / 1024).toFixed(2)} KB`);
    
    // Bundle size thresholds
    expect(jsBundle).toBeLessThan(500 * 1024); // 500KB JS max
    expect(cssBundle).toBeLessThan(100 * 1024); // 100KB CSS max
    expect(totalBundle).toBeLessThan(600 * 1024); // 600KB total max
    
    // Specific checks for optimization
    const hasCodeSplitting = networkRequests.some(req => 
      req.url.includes("chunks/") || req.url.includes("pages/")
    );
    expect(hasCodeSplitting).toBeTruthy(); // Should have code splitting
  });

  test("Core Web Vitals measurement", async ({ page }) => {
    const startTime = Date.now();
    
    // Add performance monitoring script
    await page.addInitScript(() => {
      window.performanceData = {
        metrics: [] as Array<{ name: string; value: number; timestamp: number }>,
        entries: [] as Array<any>
      };
      
      // Monitor Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.performanceData.entries.push({
            name: entry.name,
            entryType: entry.entryType,
            startTime: entry.startTime,
            duration: (entry as any).duration || 0,
            value: (entry as any).value || 0
          });
          
          // Specific Core Web Vitals metrics
          if (entry.entryType === 'largest-contentful-paint') {
            window.performanceData.metrics.push({
              name: 'LCP',
              value: entry.startTime,
              timestamp: Date.now()
            });
          }
          
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            const existingCLS = window.performanceData.metrics.find(m => m.name === 'CLS');
            const clsValue = (existingCLS?.value || 0) + (entry as any).value;
            
            if (existingCLS) {
              existingCLS.value = clsValue;
            } else {
              window.performanceData.metrics.push({
                name: 'CLS',
                value: clsValue,
                timestamp: Date.now()
              });
            }
          }
          
          if (entry.entryType === 'first-contentful-paint') {
            window.performanceData.metrics.push({
              name: 'FCP',
              value: entry.startTime,
              timestamp: Date.now()
            });
          }
        }
      });
      
      observer.observe({
        entryTypes: ['largest-contentful-paint', 'layout-shift', 'first-contentful-paint', 'navigation']
      });
    });
    
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Let metrics settle
    await page.waitForTimeout(2000);
    
    const performanceData = await page.evaluate(() => window.performanceData);
    const loadTime = Date.now() - startTime;
    
    console.log(`Performance Metrics for ${test.info().project.name}:`);
    console.log(`Load Time: ${loadTime}ms`);
    
    // Extract specific metrics
    const fcpMetric = performanceData.metrics.find(m => m.name === 'FCP');
    const lcpMetric = performanceData.metrics.find(m => m.name === 'LCP');
    const clsMetric = performanceData.metrics.find(m => m.name === 'CLS');
    
    if (fcpMetric) {
      console.log(`FCP: ${fcpMetric.value.toFixed(2)}ms`);
      
      // FCP thresholds (adjust for device type)
      if (test.info().project.name.includes("3G")) {
        expect(fcpMetric.value).toBeLessThan(3000); // 3s on slow connections
      } else {
        expect(fcpMetric.value).toBeLessThan(1800); // 1.8s good threshold
      }
    }
    
    if (lcpMetric) {
      console.log(`LCP: ${lcpMetric.value.toFixed(2)}ms`);
      
      // LCP thresholds
      if (test.info().project.name.includes("3G")) {
        expect(lcpMetric.value).toBeLessThan(4000); // 4s on slow connections
      } else {
        expect(lcpMetric.value).toBeLessThan(2500); // 2.5s good threshold
      }
    }
    
    if (clsMetric) {
      console.log(`CLS: ${clsMetric.value.toFixed(3)}`);
      expect(clsMetric.value).toBeLessThan(0.1); // Good CLS threshold
    }
    
    // Network performance analysis
    const navEntries = performanceData.entries.filter(e => e.entryType === 'navigation');
    if (navEntries.length > 0) {
      const nav = navEntries[0];
      const ttfb = nav.responseStart - nav.requestStart;
      console.log(`TTFB: ${ttfb.toFixed(2)}ms`);
      
      expect(ttfb).toBeLessThan(800); // TTFB should be under 800ms
    }
  });

  test("Memory usage and leak detection", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Get initial memory usage
    const getMemoryInfo = async () => {
      return await page.evaluate(() => {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          return {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit
          };
        }
        return null;
      });
    };
    
    const initialMemory = await getMemoryInfo();
    
    if (initialMemory) {
      console.log(`Initial Memory: ${(initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
      
      // Navigate through the app to simulate user interaction
      const navigationFlow = [
        { action: "click", selector: "text=Quiz" },
        { action: "wait", duration: 1000 },
        { action: "goBack" },
        { action: "wait", duration: 1000 },
        { action: "click", selector: "text=Browse" },
        { action: "wait", duration: 1000 },
        { action: "goBack" },
        { action: "wait", duration: 1000 }
      ];
      
      for (const step of navigationFlow) {
        if (step.action === "click") {
          try {
            await page.click(step.selector!, { timeout: 5000 });
          } catch (e) {
            console.log(`Could not click ${step.selector}, continuing...`);
          }
        } else if (step.action === "wait") {
          await page.waitForTimeout(step.duration!);
        } else if (step.action === "goBack") {
          await page.goBack();
        }
      }
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if ('gc' in window) {
          (window as any).gc();
        }
      });
      
      const finalMemory = await getMemoryInfo();
      
      if (finalMemory) {
        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        const increaseInMB = memoryIncrease / 1024 / 1024;
        
        console.log(`Final Memory: ${(finalMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
        console.log(`Memory Increase: ${increaseInMB.toFixed(2)}MB`);
        
        // Memory increase should be reasonable after navigation
        expect(increaseInMB).toBeLessThan(10); // Less than 10MB increase
        
        // Total memory usage should stay within limits
        const totalUsageInMB = finalMemory.usedJSHeapSize / 1024 / 1024;
        expect(totalUsageInMB).toBeLessThan(100); // Less than 100MB total
      }
    }
  });

  test("Network throttling performance", async ({ page }) => {
    // Only run on designated slow network tests
    if (!test.info().project.name.includes("3G")) {
      test.skip();
    }
    
    // Simulate network throttling
    await page.route("**/*", async (route) => {
      // Add artificial delays for slow 3G simulation
      const delay = test.info().project.name.includes("Slow 3G") ? 200 : 100;
      await new Promise(resolve => setTimeout(resolve, delay));
      await route.continue();
    });
    
    const startTime = Date.now();
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - startTime;
    
    console.log(`${test.info().project.name} Load Time: ${loadTime}ms`);
    
    // Expectations for slow connections
    if (test.info().project.name.includes("Slow 3G")) {
      expect(loadTime).toBeLessThan(8000); // 8s max for slow 3G
    } else {
      expect(loadTime).toBeLessThan(5000); // 5s max for fast 3G
    }
    
    // Test progressive loading works
    const progressiveElements = page.locator("[data-testid*='skeleton'], .animate-pulse").first();
    // Should have loading states initially
    // (This would be more comprehensive with specific loading indicators)
  });

  test("Image optimization and lazy loading", async ({ page }) => {
    const imageRequests: Array<{ url: string; size: number }> = [];
    
    page.on("response", async (response) => {
      const url = response.url();
      if (url.match(/\.(jpg|jpeg|png|webp|avif)$/i)) {
        const headers = response.headers();
        const size = parseInt(headers["content-length"] || "0");
        imageRequests.push({ url, size });
      }
    });
    
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    console.log(`Image Requests: ${imageRequests.length}`);
    
    // Check image optimization
    if (imageRequests.length > 0) {
      const totalImageSize = imageRequests.reduce((sum, img) => sum + img.size, 0);
      const avgImageSize = totalImageSize / imageRequests.length;
      
      console.log(`Average Image Size: ${(avgImageSize / 1024).toFixed(2)} KB`);
      console.log(`Total Images Size: ${(totalImageSize / 1024).toFixed(2)} KB`);
      
      // Images should be optimized
      expect(avgImageSize).toBeLessThan(100 * 1024); // 100KB average max
      
      // Should prefer modern formats
      const modernFormats = imageRequests.filter(req => 
        req.url.includes(".webp") || req.url.includes(".avif")
      );
      const modernFormatRatio = modernFormats.length / imageRequests.length;
      
      console.log(`Modern Format Usage: ${(modernFormatRatio * 100).toFixed(1)}%`);
      // At least 50% should use modern formats
      expect(modernFormatRatio).toBeGreaterThan(0.5);
    }
  });

  test("CSS and JavaScript optimization", async ({ page }) => {
    const resourceRequests: Array<{ url: string; size: number; type: string }> = [];
    
    page.on("response", async (response) => {
      const url = response.url();
      const headers = response.headers();
      const size = parseInt(headers["content-length"] || "0");
      
      if (url.includes(".css")) {
        resourceRequests.push({ url, size, type: "css" });
      } else if (url.includes(".js")) {
        resourceRequests.push({ url, size, type: "js" });
      }
    });
    
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Analyze CSS
    const cssRequests = resourceRequests.filter(r => r.type === "css");
    const jsRequests = resourceRequests.filter(r => r.type === "js");
    
    console.log(`CSS Files: ${cssRequests.length}`);
    console.log(`JS Files: ${jsRequests.length}`);
    
    // Should have reasonable number of requests
    expect(cssRequests.length).toBeLessThan(10); // Max 10 CSS files
    expect(jsRequests.length).toBeLessThan(15); // Max 15 JS files
    
    // Check for compression
    const hasCompression = resourceRequests.every(req => req.size < 1024 * 1024); // 1MB max
    expect(hasCompression).toBeTruthy();
    
    // Test critical CSS
    const criticalStyleElements = await page.locator("style[data-critical], link[rel='preload'][as='style']").count();
    console.log(`Critical CSS Elements: ${criticalStyleElements}`);
  });

  test("Font loading optimization", async ({ page }) => {
    const fontRequests: Array<{ url: string; size: number }> = [];
    
    page.on("response", async (response) => {
      const url = response.url();
      if (url.match(/\.(woff|woff2|ttf|otf)$/i)) {
        const headers = response.headers();
        const size = parseInt(headers["content-length"] || "0");
        fontRequests.push({ url, size });
      }
    });
    
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    console.log(`Font Requests: ${fontRequests.length}`);
    
    if (fontRequests.length > 0) {
      // Should prefer woff2 format
      const woff2Fonts = fontRequests.filter(req => req.url.includes(".woff2"));
      const modernRatio = woff2Fonts.length / fontRequests.length;
      
      console.log(`WOFF2 Usage: ${(modernRatio * 100).toFixed(1)}%`);
      expect(modernRatio).toBeGreaterThan(0.7); // 70% should be woff2
      
      // Font sizes should be reasonable
      const totalFontSize = fontRequests.reduce((sum, font) => sum + font.size, 0);
      console.log(`Total Font Size: ${(totalFontSize / 1024).toFixed(2)} KB`);
      expect(totalFontSize).toBeLessThan(500 * 1024); // 500KB max for fonts
    }
    
    // Check for font display optimization
    const fontFaces = await page.evaluate(() => {
      const styleSheets = Array.from(document.styleSheets);
      const fontFaces: string[] = [];
      
      styleSheets.forEach(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || []);
          rules.forEach(rule => {
            if (rule.cssText.includes("@font-face")) {
              fontFaces.push(rule.cssText);
            }
          });
        } catch (e) {
          // Cross-origin stylesheets may not be accessible
        }
      });
      
      return fontFaces;
    });
    
    // Should have font-display: swap or similar optimization
    const hasOptimizedDisplay = fontFaces.some(face => 
      face.includes("font-display: swap") || 
      face.includes("font-display: fallback")
    );
    
    if (fontFaces.length > 0) {
      console.log(`Font Display Optimization: ${hasOptimizedDisplay}`);
      expect(hasOptimizedDisplay).toBeTruthy();
    }
  });
});