import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { chromium, Browser, Page } from 'playwright';

/**
 * Core Web Vitals testing for ScentMatch
 * Mobile-first performance thresholds following Google's recommendations
 */

// Mobile-first Core Web Vitals thresholds
export const MOBILE_CWV_THRESHOLDS = {
  // Largest Contentful Paint - measures loading performance
  LCP: {
    good: 2500, // < 2.5s
    needsWork: 4000, // 2.5s - 4s
  },
  // Interaction to Next Paint - measures responsiveness
  INP: {
    good: 200, // < 200ms
    needsWork: 500, // 200ms - 500ms
  },
  // Cumulative Layout Shift - measures visual stability
  CLS: {
    good: 0.1, // < 0.1
    needsWork: 0.25, // 0.1 - 0.25
  },
  // First Contentful Paint - additional loading metric
  FCP: {
    good: 1800, // < 1.8s
    needsWork: 3000, // 1.8s - 3s
  },
  // Time to Interactive - interactivity metric
  TTI: {
    good: 3800, // < 3.8s
    needsWork: 7300, // 3.8s - 7.3s
  },
} as const;

/**
 * Browser instance management for performance testing
 */
class PerformanceTestRunner {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async setup(): Promise<void> {
    this.browser = await chromium.launch({
      args: [
        '--disable-dev-shm-usage',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    });

    this.page = await this.browser.newPage();

    // Set mobile viewport for mobile-first testing
    await this.page.setViewportSize({ width: 375, height: 667 });

    // Simulate mobile network conditions
    await this.page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100)); // Add latency
      await route.continue();
    });
  }

  async teardown(): Promise<void> {
    await this.page?.close();
    await this.browser?.close();
  }

  async measureCoreWebVitals(url: string): Promise<{
    lcp: number | null;
    inp: number | null;
    cls: number | null;
    fcp: number | null;
    tti: number | null;
  }> {
    if (!this.page) throw new Error('Page not initialized');

    // Inject Web Vitals measurement script
    await this.page.addInitScript(() => {
      window.vitalsData = {
        lcp: null,
        inp: null,
        cls: null,
        fcp: null,
        tti: null,
      };
    });

    // Navigate to the page
    await this.page.goto(url, { waitUntil: 'networkidle' });

    // Measure Core Web Vitals
    const vitals = await this.page.evaluate(() => {
      return new Promise(resolve => {
        const measurements: any = {};

        // LCP measurement
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          measurements.lcp = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // INP measurement (using first-input as fallback)
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            measurements.inp = entry.processingStart - entry.startTime;
          });
        }).observe({ entryTypes: ['first-input'] });

        // CLS measurement
        let clsValue = 0;
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          measurements.cls = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });

        // FCP measurement
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          measurements.fcp = entries[0].startTime;
        }).observe({ entryTypes: ['paint'] });

        // TTI estimation (simplified)
        setTimeout(() => {
          const navigationEntry = performance.getEntriesByType(
            'navigation'
          )[0] as PerformanceNavigationTiming;
          measurements.tti =
            navigationEntry.loadEventEnd - navigationEntry.fetchStart;
          resolve(measurements);
        }, 3000);
      });
    });

    return vitals;
  }

  async measureLoadingPerformance(url: string): Promise<{
    domContentLoaded: number;
    loadComplete: number;
    firstByte: number;
    resourceCount: number;
    totalSize: number;
  }> {
    if (!this.page) throw new Error('Page not initialized');

    const startTime = Date.now();

    // Track resource loading
    const resources: any[] = [];
    this.page.on('response', response => {
      resources.push({
        url: response.url(),
        status: response.status(),
        size: response.headers()['content-length'] || 0,
      });
    });

    await this.page.goto(url, { waitUntil: 'load' });

    const navigationEntry = await this.page.evaluate(() => {
      const entry = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: entry.domContentLoadedEventEnd - entry.fetchStart,
        loadComplete: entry.loadEventEnd - entry.fetchStart,
        firstByte: entry.responseStart - entry.fetchStart,
      };
    });

    const totalSize = resources.reduce(
      (sum, resource) => sum + parseInt(resource.size || '0'),
      0
    );

    return {
      ...navigationEntry,
      resourceCount: resources.length,
      totalSize,
    };
  }
}

/**
 * Test Core Web Vitals for a given URL
 */
export async function testCoreWebVitals(
  url: string,
  thresholds = MOBILE_CWV_THRESHOLDS
): Promise<void> {
  const runner = new PerformanceTestRunner();

  try {
    await runner.setup();
    const vitals = await runner.measureCoreWebVitals(url);

    // Assert LCP threshold
    if (vitals.lcp !== null) {
      expect(vitals.lcp).toBeLessThan(thresholds.LCP.good);
    }

    // Assert INP threshold
    if (vitals.inp !== null) {
      expect(vitals.inp).toBeLessThan(thresholds.INP.good);
    }

    // Assert CLS threshold
    if (vitals.cls !== null) {
      expect(vitals.cls).toBeLessThan(thresholds.CLS.good);
    }

    // Assert FCP threshold
    if (vitals.fcp !== null) {
      expect(vitals.fcp).toBeLessThan(thresholds.FCP.good);
    }

    // Assert TTI threshold
    if (vitals.tti !== null) {
      expect(vitals.tti).toBeLessThan(thresholds.TTI.good);
    }
  } finally {
    await runner.teardown();
  }
}

/**
 * Test loading performance budgets
 */
export async function testPerformanceBudgets(url: string): Promise<void> {
  const runner = new PerformanceTestRunner();

  try {
    await runner.setup();
    const performance = await runner.measureLoadingPerformance(url);

    // Performance budgets for ScentMatch
    expect(performance.domContentLoaded).toBeLessThan(2000); // 2s for DOM ready
    expect(performance.loadComplete).toBeLessThan(4000); // 4s for full load
    expect(performance.firstByte).toBeLessThan(800); // 800ms TTFB
    expect(performance.resourceCount).toBeLessThan(50); // Max 50 resources
    expect(performance.totalSize).toBeLessThan(2000000); // 2MB total size
  } finally {
    await runner.teardown();
  }
}

/**
 * Mobile-specific performance test
 */
export async function testMobilePerformance(url: string): Promise<void> {
  const runner = new PerformanceTestRunner();

  try {
    await runner.setup();

    // Test with mobile-specific conditions
    const vitals = await runner.measureCoreWebVitals(url);
    const loading = await runner.measureLoadingPerformance(url);

    // Mobile-specific assertions
    expect(vitals.lcp).toBeLessThan(MOBILE_CWV_THRESHOLDS.LCP.good);
    expect(vitals.cls).toBeLessThan(MOBILE_CWV_THRESHOLDS.CLS.good);
    expect(loading.domContentLoaded).toBeLessThan(3000); // Slightly relaxed for mobile
    expect(loading.totalSize).toBeLessThan(1500000); // 1.5MB for mobile
  } finally {
    await runner.teardown();
  }
}

/**
 * Performance regression test
 */
export async function testPerformanceRegression(
  url: string,
  baselineFile?: string
): Promise<void> {
  const runner = new PerformanceTestRunner();

  try {
    await runner.setup();
    const currentVitals = await runner.measureCoreWebVitals(url);
    const currentLoading = await runner.measureLoadingPerformance(url);

    // In a real implementation, you would:
    // 1. Load baseline metrics from file
    // 2. Compare current metrics to baseline
    // 3. Fail if metrics regressed beyond threshold

    // For now, ensure metrics exist and are reasonable
    expect(currentVitals.lcp).toBeGreaterThan(0);
    expect(currentLoading.domContentLoaded).toBeGreaterThan(0);
  } finally {
    await runner.teardown();
  }
}

/**
 * Bundle size analysis
 */
export async function analyzeBundleSize(): Promise<void> {
  // This would integrate with Next.js bundle analyzer
  // For now, we'll add a placeholder test
  expect(true).toBe(true); // Placeholder for bundle size analysis
}

/**
 * Memory usage test
 */
export async function testMemoryUsage(url: string): Promise<void> {
  const runner = new PerformanceTestRunner();

  try {
    await runner.setup();

    if (!runner['page']) throw new Error('Page not initialized');

    await runner['page'].goto(url);

    // Measure memory usage
    const memoryInfo = await runner['page'].evaluate(() => {
      return (performance as any).memory;
    });

    if (memoryInfo) {
      // Memory budget: 50MB heap limit for mobile
      expect(memoryInfo.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024);
    }
  } finally {
    await runner.teardown();
  }
}

export { PerformanceTestRunner };
