import { test, expect, Browser, Page } from '@playwright/test';

/**
 * Playwright-based Homepage Performance Tests
 * Proper Core Web Vitals measurement for Task 3: Polish Homepage for Affiliate Conversion
 */

// Core Web Vitals Thresholds (Mobile-first)
const THRESHOLDS = {
  LCP: 2500, // Largest Contentful Paint < 2.5s
  FCP: 1800, // First Contentful Paint < 1.8s
  CLS: 0.1, // Cumulative Layout Shift < 0.1
  INP: 200, // Interaction to Next Paint < 200ms
  TTI: 3800, // Time to Interactive < 3.8s
};

test.describe('Homepage Core Web Vitals - Mobile Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport and user agent
    await page.setViewportSize({ width: 375, height: 667 });
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    );
  });

  test('LCP (Largest Contentful Paint) meets 2.5s target', async ({ page }) => {
    // Navigate and measure LCP
    const response = await page.goto('http://localhost:3001', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    expect(response?.status()).toBe(200);

    // Measure LCP using Performance Observer
    const lcpValue = await page.evaluate(() => {
      return new Promise<number>(resolve => {
        let lcp = 0;

        new PerformanceObserver(list => {
          const entries = list.getEntries();
          for (const entry of entries) {
            lcp = entry.startTime;
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Fallback timeout
        setTimeout(() => resolve(lcp), 5000);

        // Also resolve when page is fully loaded
        if (document.readyState === 'complete') {
          setTimeout(() => resolve(lcp), 1000);
        }
      });
    });

    console.log(`✅ LCP: ${lcpValue}ms (target: <${THRESHOLDS.LCP}ms)`);
    expect(lcpValue).toBeGreaterThan(0);
    expect(lcpValue).toBeLessThan(THRESHOLDS.LCP);
  });

  test('FCP (First Contentful Paint) meets 1.8s target', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('http://localhost:3001');

    // Wait for first meaningful content to appear
    await page.waitForSelector('h1:has-text("Find Your Perfect")', {
      timeout: 2000,
    });

    const fcpTime = Date.now() - startTime;

    console.log(`✅ FCP: ${fcpTime}ms (target: <${THRESHOLDS.FCP}ms)`);
    expect(fcpTime).toBeLessThan(THRESHOLDS.FCP);
  });

  test('CLS (Cumulative Layout Shift) meets 0.1 target', async ({ page }) => {
    await page.goto('http://localhost:3001');

    // Measure CLS using Performance Observer
    const clsValue = await page.evaluate(() => {
      return new Promise<number>(resolve => {
        let cls = 0;

        new PerformanceObserver(list => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
        }).observe({ entryTypes: ['layout-shift'] });

        // Measure for 3 seconds
        setTimeout(() => resolve(cls), 3000);
      });
    });

    console.log(`✅ CLS: ${clsValue} (target: <${THRESHOLDS.CLS})`);
    expect(clsValue).toBeLessThan(THRESHOLDS.CLS);
  });

  test('INP (Interaction to Next Paint) - CTA button responsiveness', async ({
    page,
  }) => {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

    // Find the primary CTA button
    const ctaButton = page
      .locator('a:has-text("Start Finding Your Scent")')
      .first();
    await expect(ctaButton).toBeVisible();

    // Measure interaction timing
    const startTime = Date.now();
    await ctaButton.click();
    const responseTime = Date.now() - startTime;

    console.log(
      `✅ CTA Response: ${responseTime}ms (target: <${THRESHOLDS.INP}ms)`
    );
    expect(responseTime).toBeLessThan(THRESHOLDS.INP);
  });

  test('Images have proper dimensions to prevent layout shifts', async ({
    page,
  }) => {
    await page.goto('http://localhost:3001');

    // Check all images have proper sizing
    const imageIssues = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      let issueCount = 0;

      images.forEach(img => {
        const hasWidthHeight =
          img.hasAttribute('width') && img.hasAttribute('height');
        const style = window.getComputedStyle(img);
        const hasAspectRatio = style.aspectRatio !== 'auto';
        const hasFixedSize = style.width !== 'auto' && style.height !== 'auto';

        if (!(hasWidthHeight || hasAspectRatio || hasFixedSize)) {
          issueCount++;
          console.log('Image without proper sizing:', img.src);
        }
      });

      return issueCount;
    });

    console.log(
      `✅ Image sizing: ${imageIssues} images without proper dimensions`
    );
    expect(imageIssues).toBe(0);
  });

  test('Mobile navigation is responsive', async ({ page }) => {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

    // Look for mobile menu button
    const mobileMenuButton = page.locator('button:has-text("Open menu")');

    if (await mobileMenuButton.isVisible()) {
      const startTime = Date.now();
      await mobileMenuButton.click();
      const responseTime = Date.now() - startTime;

      console.log(
        `✅ Mobile nav response: ${responseTime}ms (target: <${THRESHOLDS.INP}ms)`
      );
      expect(responseTime).toBeLessThan(THRESHOLDS.INP);
    } else {
      console.log(
        'ℹ️ Mobile navigation button not visible at current viewport'
      );
    }
  });

  test('Page loads all critical resources successfully', async ({ page }) => {
    const responses: Array<{ url: string; status: number }> = [];

    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
      });
    });

    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

    // Check for failed critical resources
    const failedResources = responses.filter(r => r.status >= 400);
    const criticalFailures = failedResources.filter(
      r =>
        !r.url.includes('favicon') &&
        !r.url.includes('.map') &&
        !r.url.includes('analytics')
    );

    if (criticalFailures.length > 0) {
      console.log('❌ Failed resources:', criticalFailures);
    }

    console.log(
      `✅ Resource loading: ${criticalFailures.length} critical failures`
    );
    expect(criticalFailures.length).toBe(0);
  });

  test('Critical content renders progressively', async ({ page }) => {
    await page.goto('http://localhost:3001');

    // Check progressive rendering of key elements
    const elements = [
      'header', // Navigation
      'h1', // Hero title
      '[data-analytics="hero-cta-quiz"]', // Primary CTA
    ];

    for (const selector of elements) {
      const startTime = Date.now();
      await page.waitForSelector(selector, { timeout: 2000 });
      const renderTime = Date.now() - startTime;

      console.log(`✅ ${selector} rendered in: ${renderTime}ms`);
      expect(renderTime).toBeLessThan(2000);
    }
  });

  test('Performance budgets for mobile', async ({ page }) => {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

    // Measure resource loading
    const resourceStats = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource');
      const stats = {
        totalSize: 0,
        resourceCount: entries.length,
        jsSize: 0,
        cssSize: 0,
        imageSize: 0,
      };

      entries.forEach((entry: any) => {
        const size = entry.transferSize || 0;
        stats.totalSize += size;

        if (entry.name.includes('.js')) stats.jsSize += size;
        else if (entry.name.includes('.css')) stats.cssSize += size;
        else if (entry.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/))
          stats.imageSize += size;
      });

      return stats;
    });

    // Mobile performance budgets
    const budgets = {
      totalSize: 1500000, // 1.5MB total
      resourceCount: 40, // Max 40 resources
      jsSize: 500000, // 500KB JS
      cssSize: 100000, // 100KB CSS
    };

    console.log(`✅ Performance Budget:`);
    console.log(
      `   Total: ${Math.round(resourceStats.totalSize / 1024)}KB / ${Math.round(budgets.totalSize / 1024)}KB`
    );
    console.log(
      `   Resources: ${resourceStats.resourceCount} / ${budgets.resourceCount}`
    );
    console.log(
      `   JS: ${Math.round(resourceStats.jsSize / 1024)}KB / ${Math.round(budgets.jsSize / 1024)}KB`
    );
    console.log(
      `   CSS: ${Math.round(resourceStats.cssSize / 1024)}KB / ${Math.round(budgets.cssSize / 1024)}KB`
    );

    expect(resourceStats.totalSize).toBeLessThan(budgets.totalSize);
    expect(resourceStats.resourceCount).toBeLessThan(budgets.resourceCount);
  });
});
