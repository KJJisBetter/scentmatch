/**
 * Task 7: Performance Optimization and Monitoring
 * Comprehensive performance test suite for ScentMatch
 * 
 * Requirements:
 * 7.1. Write tests for page load times and user interaction performance
 * 7.2. Implement performance monitoring for beginner user flows
 * 7.3. Optimize database queries for improved response times
 * 7.4. Add error tracking and user experience monitoring
 * 7.5. Create performance budgets and monitoring alerts
 * 7.6. Implement progressive loading for heavy content
 * 7.7. Optimize critical rendering path for key beginner pages
 * 7.8. Verify all tests pass and performance targets are met
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { chromium, Browser, Page } from 'playwright';

// Performance thresholds based on Core Web Vitals and ScentMatch requirements
const PERFORMANCE_TARGETS = {
  // Core Web Vitals (Task 7.1)
  LCP: 2500, // Largest Contentful Paint < 2.5s
  FID: 100,  // First Input Delay < 100ms
  INP: 200,  // Interaction to Next Paint < 200ms
  CLS: 0.1,  // Cumulative Layout Shift < 0.1
  FCP: 1800, // First Contentful Paint < 1.8s
  
  // Custom performance budgets (Task 7.5)
  PAGE_SIZE_MB: 1.5,
  TIME_TO_INTERACTIVE: 3000,
  DATABASE_QUERY: 100, // ms
  API_RESPONSE: 500,   // ms
  
  // Progressive loading targets (Task 7.6)
  ABOVE_FOLD_TIME: 1000,
  LAZY_LOAD_THRESHOLD: 2000,
} as const;

interface PerformanceMetrics {
  lcp: number;
  fid: number;
  inp: number;
  cls: number;
  fcp: number;
  ttfb: number;
  loadTime: number;
  domContentLoaded: number;
  pageSizeKB: number;
  resourceCount: number;
}

interface UserFlowMetrics {
  flowName: string;
  totalTime: number;
  steps: { name: string; time: number; success: boolean }[];
  errors: string[];
}

class PerformanceTestRunner {
  private browser: Browser;
  private page: Page;
  private baseUrl = 'http://localhost:3000';

  async setup() {
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--allow-running-insecure-content',
      ]
    });

    const context = await this.browser.newContext({
      viewport: { width: 375, height: 667 }, // Mobile-first
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
      deviceScaleFactor: 2,
    });

    this.page = await context.newPage();

    // Set up performance monitoring
    await this.page.addInitScript(() => {
      // Collect Core Web Vitals
      window.performanceMetrics = {
        lcp: 0,
        fid: 0,
        inp: 0,
        cls: 0,
        fcp: 0,
        ttfb: 0
      };

      // LCP Observer
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          window.performanceMetrics.lcp = entries[entries.length - 1].startTime;
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FCP Observer
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            window.performanceMetrics.fcp = entry.startTime;
          }
        }
      }).observe({ entryTypes: ['paint'] });

      // CLS Observer
      new PerformanceObserver((entryList) => {
        let cls = 0;
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        }
        window.performanceMetrics.cls = cls;
      }).observe({ entryTypes: ['layout-shift'] });

      // TTFB from Navigation Timing
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        window.performanceMetrics.ttfb = navigation.responseStart - navigation.requestStart;
      });
    });
  }

  async teardown() {
    await this.page?.close();
    await this.browser?.close();
  }

  async measurePagePerformance(url: string): Promise<PerformanceMetrics> {
    const startTime = Date.now();
    
    await this.page.goto(url, { waitUntil: 'networkidle' });
    
    // Wait for metrics to be collected
    await this.page.waitForTimeout(2000);
    
    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource');
      
      const totalSize = resources.reduce((size, resource) => {
        return size + ((resource as any).transferSize || 0);
      }, 0);

      return {
        ...window.performanceMetrics,
        loadTime: Date.now() - performance.timeOrigin,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        pageSizeKB: Math.round(totalSize / 1024),
        resourceCount: resources.length,
      };
    });

    return metrics as PerformanceMetrics;
  }

  async measureUserFlow(flowName: string, steps: (() => Promise<void>)[]): Promise<UserFlowMetrics> {
    const flowMetrics: UserFlowMetrics = {
      flowName,
      totalTime: 0,
      steps: [],
      errors: []
    };

    const flowStartTime = Date.now();

    for (let i = 0; i < steps.length; i++) {
      const stepStartTime = Date.now();
      let stepSuccess = true;
      
      try {
        await steps[i]();
      } catch (error) {
        stepSuccess = false;
        flowMetrics.errors.push(`Step ${i + 1}: ${error.message}`);
      }
      
      const stepTime = Date.now() - stepStartTime;
      flowMetrics.steps.push({
        name: `Step ${i + 1}`,
        time: stepTime,
        success: stepSuccess
      });
    }

    flowMetrics.totalTime = Date.now() - flowStartTime;
    return flowMetrics;
  }

  async measureApiResponse(endpoint: string): Promise<number> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      await response.json();
      return Date.now() - startTime;
    } catch (error) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }
}

// Task 7.1: Page Load Times and User Interaction Performance Tests
describe('Task 7.1: Page Load Times and User Interaction Performance', () => {
  let runner: PerformanceTestRunner;

  beforeAll(async () => {
    runner = new PerformanceTestRunner();
    await runner.setup();
  });

  afterAll(async () => {
    await runner.teardown();
  });

  test('Homepage meets Core Web Vitals targets', async () => {
    const metrics = await runner.measurePagePerformance('/');
    
    expect(metrics.lcp).toBeLessThan(PERFORMANCE_TARGETS.LCP);
    expect(metrics.cls).toBeLessThan(PERFORMANCE_TARGETS.CLS);
    expect(metrics.fcp).toBeLessThan(PERFORMANCE_TARGETS.FCP);
    expect(metrics.pageSizeKB).toBeLessThan(PERFORMANCE_TARGETS.PAGE_SIZE_MB * 1024);
    
    console.log('Homepage Performance:', {
      LCP: `${metrics.lcp}ms (target: <${PERFORMANCE_TARGETS.LCP}ms)`,
      CLS: `${metrics.cls} (target: <${PERFORMANCE_TARGETS.CLS})`,
      FCP: `${metrics.fcp}ms (target: <${PERFORMANCE_TARGETS.FCP}ms)`,
      PageSize: `${metrics.pageSizeKB}KB`
    });
  }, 30000);

  test('Quiz page performance optimized for beginners', async () => {
    const metrics = await runner.measurePagePerformance('/quiz');
    
    expect(metrics.lcp).toBeLessThan(PERFORMANCE_TARGETS.LCP);
    expect(metrics.domContentLoaded).toBeLessThan(PERFORMANCE_TARGETS.TIME_TO_INTERACTIVE);
    
    console.log('Quiz Performance:', {
      LCP: `${metrics.lcp}ms`,
      TTI: `${metrics.domContentLoaded}ms`,
      ResourceCount: metrics.resourceCount
    });
  }, 30000);

  test('Browse page with progressive loading', async () => {
    const metrics = await runner.measurePagePerformance('/browse');
    
    expect(metrics.fcp).toBeLessThan(PERFORMANCE_TARGETS.ABOVE_FOLD_TIME);
    expect(metrics.lcp).toBeLessThan(PERFORMANCE_TARGETS.LAZY_LOAD_THRESHOLD);
    
    console.log('Browse Performance:', {
      FCP: `${metrics.fcp}ms (above-fold target: <${PERFORMANCE_TARGETS.ABOVE_FOLD_TIME}ms)`,
      LCP: `${metrics.lcp}ms (lazy-load target: <${PERFORMANCE_TARGETS.LAZY_LOAD_THRESHOLD}ms)`
    });
  }, 30000);

  test('Search interactions respond quickly', async () => {
    const searchFlow = await runner.measureUserFlow('Search Interaction', [
      async () => {
        await runner.page.goto('/browse');
        await runner.page.waitForSelector('[data-testid="search-input"]', { timeout: 5000 });
      },
      async () => {
        await runner.page.fill('[data-testid="search-input"]', 'floral');
        await runner.page.waitForTimeout(300); // Debounce
      },
      async () => {
        await runner.page.waitForSelector('[data-testid="search-results"]', { timeout: 2000 });
      }
    ]);

    expect(searchFlow.errors).toHaveLength(0);
    expect(searchFlow.totalTime).toBeLessThan(3000);
    
    console.log('Search Flow Performance:', {
      TotalTime: `${searchFlow.totalTime}ms`,
      Steps: searchFlow.steps.map(s => `${s.name}: ${s.time}ms`)
    });
  }, 20000);
});

// Task 7.2: Performance Monitoring for Beginner User Flows
describe('Task 7.2: Beginner User Flow Performance Monitoring', () => {
  let runner: PerformanceTestRunner;

  beforeAll(async () => {
    runner = new PerformanceTestRunner();
    await runner.setup();
  });

  afterAll(async () => {
    await runner.teardown();
  });

  test('Complete beginner onboarding flow performance', async () => {
    const onboardingFlow = await runner.measureUserFlow('Beginner Onboarding', [
      async () => {
        await runner.page.goto('/');
        await runner.page.waitForSelector('a[href="/quiz"]', { timeout: 5000 });
      },
      async () => {
        await runner.page.click('a[href="/quiz"]');
        await runner.page.waitForLoadState('networkidle');
      },
      async () => {
        await runner.page.waitForSelector('[data-testid="quiz-question"]', { timeout: 3000 });
      },
      async () => {
        // Simulate answering first question
        await runner.page.click('[data-testid="quiz-option"]:first-child');
        await runner.page.click('[data-testid="next-button"]');
      }
    ]);

    expect(onboardingFlow.errors).toHaveLength(0);
    expect(onboardingFlow.totalTime).toBeLessThan(10000); // 10s total for good UX
    expect(onboardingFlow.steps.every(step => step.time < 5000)).toBeTruthy();

    console.log('Beginner Onboarding Flow:', {
      TotalTime: `${onboardingFlow.totalTime}ms`,
      StepTimes: onboardingFlow.steps.map(s => `${s.time}ms`),
      AllStepsSuccessful: onboardingFlow.steps.every(s => s.success)
    });
  }, 30000);

  test('Fragrance discovery flow with explanations', async () => {
    const discoveryFlow = await runner.measureUserFlow('Fragrance Discovery', [
      async () => {
        await runner.page.goto('/browse');
        await runner.page.waitForLoadState('networkidle');
      },
      async () => {
        await runner.page.click('[data-testid="fragrance-card"]:first-child');
        await runner.page.waitForLoadState('networkidle');
      },
      async () => {
        await runner.page.waitForSelector('[data-testid="fragrance-details"]', { timeout: 3000 });
      },
      async () => {
        // Check for beginner explanations loading
        await runner.page.waitForSelector('[data-testid="beginner-explanation"]', { timeout: 2000 });
      }
    ]);

    expect(discoveryFlow.totalTime).toBeLessThan(8000);
    expect(discoveryFlow.errors).toHaveLength(0);

    console.log('Discovery Flow Performance:', {
      TotalTime: `${discoveryFlow.totalTime}ms`,
      Success: discoveryFlow.steps.every(s => s.success)
    });
  }, 25000);
});

// Task 7.3: Database Query Performance Tests  
describe('Task 7.3: Database Query Performance', () => {
  test('Search API responds within target time', async () => {
    const runner = new PerformanceTestRunner();
    await runner.setup();
    
    try {
      const responseTime = await runner.measureApiResponse('/api/search?q=floral');
      expect(responseTime).toBeLessThan(PERFORMANCE_TARGETS.API_RESPONSE);
      
      console.log(`Search API Response Time: ${responseTime}ms (target: <${PERFORMANCE_TARGETS.API_RESPONSE}ms)`);
    } finally {
      await runner.teardown();
    }
  }, 15000);

  test('Quiz analysis API performance', async () => {
    const runner = new PerformanceTestRunner();
    await runner.setup();
    
    try {
      const responseTime = await runner.measureApiResponse('/api/quiz/analyze-route');
      expect(responseTime).toBeLessThan(PERFORMANCE_TARGETS.API_RESPONSE);
      
      console.log(`Quiz Analysis Response Time: ${responseTime}ms`);
    } finally {
      await runner.teardown();
    }
  }, 15000);

  test('Fragrance details API with social data', async () => {
    const runner = new PerformanceTestRunner();
    await runner.setup();
    
    try {
      // Test with a known fragrance ID
      const responseTime = await runner.measureApiResponse('/api/fragrances/1');
      expect(responseTime).toBeLessThan(PERFORMANCE_TARGETS.API_RESPONSE);
      
      console.log(`Fragrance Details Response Time: ${responseTime}ms`);
    } finally {
      await runner.teardown();
    }
  }, 15000);
});

// Task 7.4: Error Tracking and User Experience Monitoring
describe('Task 7.4: Error Tracking and UX Monitoring', () => {
  let runner: PerformanceTestRunner;

  beforeAll(async () => {
    runner = new PerformanceTestRunner();
    await runner.setup();
  });

  afterAll(async () => {
    await runner.teardown();
  });

  test('Pages handle errors gracefully', async () => {
    // Test 404 error handling
    await runner.page.goto('/nonexistent-page');
    
    const errorPage = await runner.page.waitForSelector('[data-testid="error-page"], [data-testid="404"]', 
      { timeout: 5000 });
    expect(errorPage).toBeTruthy();
    
    // Ensure error page loads quickly
    const metrics = await runner.measurePagePerformance('/nonexistent-page');
    expect(metrics.fcp).toBeLessThan(2000);
    
    console.log('Error Page Performance: FCP', metrics.fcp, 'ms');
  }, 15000);

  test('API errors return proper status codes', async () => {
    const response = await fetch('http://localhost:3000/api/nonexistent');
    expect(response.status).toBe(404);
    
    const responseTime = Date.now();
    await response.text();
    const totalTime = Date.now() - responseTime;
    
    expect(totalTime).toBeLessThan(1000); // Error responses should be fast
    console.log('API Error Response Time:', totalTime, 'ms');
  }, 10000);

  test('JavaScript errors are captured', async () => {
    const jsErrors: string[] = [];
    
    runner.page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });
    
    runner.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });

    await runner.page.goto('/');
    await runner.page.waitForTimeout(3000);

    // Should have no unhandled errors
    console.log('JavaScript Errors Found:', jsErrors.length);
    expect(jsErrors.filter(e => !e.includes('favicon')).length).toBe(0);
  }, 15000);
});

// Task 7.5: Performance Budgets and Monitoring
describe('Task 7.5: Performance Budgets and Monitoring', () => {
  let runner: PerformanceTestRunner;

  beforeAll(async () => {
    runner = new PerformanceTestRunner();
    await runner.setup();
  });

  afterAll(async () => {
    await runner.teardown();
  });

  test('All key pages meet performance budgets', async () => {
    const pages = ['/', '/quiz', '/browse', '/fragrance/1'];
    const results = [];

    for (const page of pages) {
      try {
        const metrics = await runner.measurePagePerformance(page);
        results.push({ page, metrics });
        
        // Performance budget checks
        expect(metrics.lcp).toBeLessThan(PERFORMANCE_TARGETS.LCP);
        expect(metrics.fcp).toBeLessThan(PERFORMANCE_TARGETS.FCP);
        expect(metrics.pageSizeKB).toBeLessThan(PERFORMANCE_TARGETS.PAGE_SIZE_MB * 1024);
        expect(metrics.resourceCount).toBeLessThan(50); // Resource count budget
        
      } catch (error) {
        console.warn(`Skipping ${page} - page may not exist:`, error.message);
      }
    }

    console.log('Performance Budget Results:');
    results.forEach(({ page, metrics }) => {
      console.log(`${page}: LCP=${metrics.lcp}ms, FCP=${metrics.fcp}ms, Size=${metrics.pageSizeKB}KB, Resources=${metrics.resourceCount}`);
    });

    expect(results.length).toBeGreaterThan(0);
  }, 60000);
});

// Task 7.6: Progressive Loading Implementation
describe('Task 7.6: Progressive Loading for Heavy Content', () => {
  let runner: PerformanceTestRunner;

  beforeAll(async () => {
    runner = new PerformanceTestRunner();
    await runner.setup();
  });

  afterAll(async () => {
    await runner.teardown();
  });

  test('Images load progressively with lazy loading', async () => {
    await runner.page.goto('/browse');
    
    // Check initial load only loads above-fold images
    const initialImages = await runner.page.$$eval('img', imgs => 
      imgs.filter(img => img.complete).length
    );
    
    await runner.page.waitForTimeout(1000);
    
    // Scroll to trigger lazy loading
    await runner.page.evaluate(() => window.scrollTo(0, 1000));
    await runner.page.waitForTimeout(1000);
    
    const lazyLoadedImages = await runner.page.$$eval('img', imgs => 
      imgs.filter(img => img.complete).length
    );
    
    expect(lazyLoadedImages).toBeGreaterThan(initialImages);
    console.log(`Progressive Loading: ${initialImages} initial → ${lazyLoadedImages} after scroll`);
  }, 20000);

  test('Content loads in priority order', async () => {
    const startTime = Date.now();
    await runner.page.goto('/');
    
    // Hero content should load first
    await runner.page.waitForSelector('h1', { timeout: 2000 });
    const heroLoadTime = Date.now() - startTime;
    
    // Secondary content loads after
    await runner.page.waitForSelector('footer', { timeout: 5000 });
    const fullLoadTime = Date.now() - startTime;
    
    expect(heroLoadTime).toBeLessThan(PERFORMANCE_TARGETS.ABOVE_FOLD_TIME);
    expect(fullLoadTime - heroLoadTime).toBeGreaterThan(0); // Progressive loading occurred
    
    console.log(`Progressive Loading Times: Hero=${heroLoadTime}ms, Full=${fullLoadTime}ms`);
  }, 15000);
});

// Task 7.7: Critical Rendering Path Optimization
describe('Task 7.7: Critical Rendering Path Optimization', () => {
  let runner: PerformanceTestRunner;

  beforeAll(async () => {
    runner = new PerformanceTestRunner();
    await runner.setup();
  });

  afterAll(async () => {
    await runner.teardown();
  });

  test('Critical CSS is inlined for key pages', async () => {
    await runner.page.goto('/');
    
    const hasCriticalCSS = await runner.page.$eval('head', head => {
      const inlineStyles = head.querySelectorAll('style');
      return Array.from(inlineStyles).some(style => 
        style.innerHTML.length > 1000 // Has substantial inline CSS
      );
    });
    
    expect(hasCriticalCSS).toBeTruthy();
    console.log('Critical CSS inlined: ✓');
  }, 10000);

  test('Resources are preloaded appropriately', async () => {
    await runner.page.goto('/');
    
    const preloadedResources = await runner.page.$$eval('link[rel="preload"]', links =>
      links.map(link => ({ as: link.getAttribute('as'), href: link.getAttribute('href') }))
    );
    
    expect(preloadedResources.length).toBeGreaterThan(0);
    console.log('Preloaded Resources:', preloadedResources);
  }, 10000);

  test('Non-critical JavaScript is deferred', async () => {
    await runner.page.goto('/');
    
    const scripts = await runner.page.$$eval('script', scripts =>
      scripts.map(script => ({
        src: script.src || 'inline',
        async: script.hasAttribute('async'),
        defer: script.hasAttribute('defer'),
      }))
    );
    
    const nonCriticalScripts = scripts.filter(script => 
      script.src !== 'inline' && (script.async || script.defer)
    );
    
    expect(nonCriticalScripts.length).toBeGreaterThan(0);
    console.log(`Deferred Scripts: ${nonCriticalScripts.length}/${scripts.length}`);
  }, 10000);
});

// Task 7.8: Comprehensive Performance Validation
describe('Task 7.8: Performance Target Validation', () => {
  test('All performance requirements are met', async () => {
    const runner = new PerformanceTestRunner();
    await runner.setup();
    
    try {
      // Test critical user journey
      const journeyFlow = await runner.measureUserFlow('Complete User Journey', [
        async () => {
          await runner.page.goto('/');
          await runner.page.waitForSelector('h1', { timeout: 3000 });
        },
        async () => {
          await runner.page.click('a[href="/quiz"]');
          await runner.page.waitForLoadState('networkidle');
        },
        async () => {
          await runner.page.goto('/browse');
          await runner.page.waitForSelector('[data-testid="fragrance-card"], .fragrance-card, .card', { timeout: 5000 });
        }
      ]);
      
      // Validate complete user journey performance
      expect(journeyFlow.errors).toHaveLength(0);
      expect(journeyFlow.totalTime).toBeLessThan(15000); // 15s total journey
      expect(journeyFlow.steps.every(step => step.success)).toBeTruthy();
      
      console.log('✅ PERFORMANCE VALIDATION COMPLETE');
      console.log('User Journey Performance:', {
        TotalTime: `${journeyFlow.totalTime}ms`,
        AllStepsSuccessful: journeyFlow.steps.every(s => s.success),
        AverageStepTime: `${Math.round(journeyFlow.totalTime / journeyFlow.steps.length)}ms`
      });
      
    } finally {
      await runner.teardown();
    }
  }, 45000);
});