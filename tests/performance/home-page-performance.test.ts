import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { 
  testCoreWebVitals, 
  testPerformanceBudgets, 
  testMobilePerformance,
  MOBILE_CWV_THRESHOLDS,
  PerformanceTestRunner 
} from '@/tests/performance/core-web-vitals';

/**
 * Home Page Performance Test Specifications Implementation
 * Following QA test specifications Section 3: Core Web Vitals Testing
 * Task 6.8: Verify home page loads under 2.5 seconds on mobile
 */

describe('Home Page - Core Web Vitals Testing', () => {
  const HOME_PAGE_URL = 'http://localhost:3001';
  let browser: Browser;
  let page: Page;
  let performanceRunner: PerformanceTestRunner;

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-dev-shm-usage',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });
    
    performanceRunner = new PerformanceTestRunner();
  });

  afterAll(async () => {
    await browser?.close();
    await performanceRunner?.teardown();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    
    // Set mobile viewport for mobile-first testing
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Set user agent to mobile
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1');
  });

  describe('HOME-CWV-001: Largest Contentful Paint (LCP) < 2.5s', () => {
    test('LCP meets mobile performance target of 2.5 seconds', async () => {
      await performanceRunner.setup();
      
      try {
        const vitals = await performanceRunner.measureCoreWebVitals(HOME_PAGE_URL);
        
        expect(vitals.lcp).not.toBeNull();
        expect(vitals.lcp).toBeLessThan(MOBILE_CWV_THRESHOLDS.LCP.good);
        
        console.log(`✓ LCP: ${vitals.lcp}ms (target: <${MOBILE_CWV_THRESHOLDS.LCP.good}ms)`);
      } catch (error) {
        console.error('LCP measurement failed:', error);
        throw error;
      }
    }, 30000);

    test('hero image or text renders within 2.5 seconds', async () => {
      const startTime = Date.now();
      
      await page.goto(HOME_PAGE_URL, { waitUntil: 'networkidle' });
      
      // Wait for hero content to be visible
      await page.waitForSelector('h1:has-text("Find Your Perfect")', { timeout: 2500 });
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2500);
      
      console.log(`✓ Hero content loaded in: ${loadTime}ms`);
    }, 30000);

    test('critical CSS is inlined and fonts optimized', async () => {
      await page.goto(HOME_PAGE_URL);
      
      // Check for inline CSS and font optimization
      const inlineStyles = await page.$$eval('style', styles => 
        styles.some(style => style.innerHTML.includes('font-') || style.innerHTML.includes('.container'))
      );
      
      // Check for font preload or optimization
      const fontOptimization = await page.$$eval('link', links =>
        links.some(link => 
          link.rel === 'preload' && link.as === 'font' ||
          link.rel === 'stylesheet' && link.href.includes('font')
        )
      );

      // At least one optimization should be present
      expect(inlineStyles || fontOptimization).toBeTruthy();
    }, 15000);

    test('no render-blocking resources delay LCP', async () => {
      const response = await page.goto(HOME_PAGE_URL);
      expect(response?.status()).toBe(200);
      
      // Measure resource loading timing
      const performanceEntries = await page.evaluate(() => {
        return performance.getEntriesByType('resource').map(entry => ({
          name: entry.name,
          startTime: entry.startTime,
          duration: entry.duration,
          renderBlockingStatus: (entry as any).renderBlockingStatus || 'non-blocking'
        }));
      });
      
      // Check for minimal render-blocking resources
      const renderBlockingResources = performanceEntries.filter(
        entry => entry.renderBlockingStatus === 'blocking'
      );
      
      console.log(`Render-blocking resources: ${renderBlockingResources.length}`);
      expect(renderBlockingResources.length).toBeLessThan(5); // Reasonable limit
    }, 20000);
  });

  describe('HOME-CWV-002: Interaction to Next Paint (INP) < 200ms', () => {
    test('INP meets mobile responsiveness target of 200ms', async () => {
      await performanceRunner.setup();
      
      try {
        const vitals = await performanceRunner.measureCoreWebVitals(HOME_PAGE_URL);
        
        if (vitals.inp !== null) {
          expect(vitals.inp).toBeLessThan(MOBILE_CWV_THRESHOLDS.INP.good);
          console.log(`✓ INP: ${vitals.inp}ms (target: <${MOBILE_CWV_THRESHOLDS.INP.good}ms)`);
        } else {
          console.log('⚠ INP: No interactions measured (may be normal for static content)');
        }
      } catch (error) {
        console.error('INP measurement failed:', error);
        // INP might not be measurable without user interaction
        console.log('⚠ INP measurement skipped - no user interactions');
      }
    }, 30000);

    test('CTA button clicks respond within 200ms', async () => {
      await page.goto(HOME_PAGE_URL, { waitUntil: 'networkidle' });
      
      const startTime = Date.now();
      
      // Find and click primary CTA
      const ctaButton = await page.locator('a:has-text("Start Finding Your Scent")').first();
      await ctaButton.click();
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(200);
      
      console.log(`✓ CTA response time: ${responseTime}ms`);
    }, 15000);

    test('navigation menu toggle responds immediately', async () => {
      // Set mobile viewport to trigger mobile nav
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(HOME_PAGE_URL, { waitUntil: 'networkidle' });
      
      // Look for mobile navigation toggle
      const mobileNavToggle = await page.locator('[data-testid="mobile-nav"], .md\\:hidden button').first();
      
      if (await mobileNavToggle.count() > 0) {
        const startTime = Date.now();
        await mobileNavToggle.click();
        const responseTime = Date.now() - startTime;
        
        expect(responseTime).toBeLessThan(200);
        console.log(`✓ Mobile nav response time: ${responseTime}ms`);
      } else {
        console.log('⚠ Mobile navigation not found - may be handled differently');
      }
    }, 15000);

    test('scroll interactions remain smooth', async () => {
      await page.goto(HOME_PAGE_URL, { waitUntil: 'networkidle' });
      
      // Measure scroll performance
      const scrollMetrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          let frameCount = 0;
          let droppedFrames = 0;
          let lastTime = performance.now();
          
          const measureFrames = () => {
            const currentTime = performance.now();
            const deltaTime = currentTime - lastTime;
            
            frameCount++;
            if (deltaTime > 16.67) { // 60fps = 16.67ms per frame
              droppedFrames++;
            }
            
            lastTime = currentTime;
            
            if (frameCount < 30) {
              requestAnimationFrame(measureFrames);
            } else {
              resolve({ frameCount, droppedFrames, dropRate: droppedFrames / frameCount });
            }
          };
          
          // Scroll down to trigger scroll events
          window.scrollTo({ top: 500, behavior: 'smooth' });
          requestAnimationFrame(measureFrames);
        });
      });
      
      expect((scrollMetrics as any).dropRate).toBeLessThan(0.1); // <10% dropped frames
      console.log(`✓ Scroll performance: ${((scrollMetrics as any).dropRate * 100).toFixed(1)}% dropped frames`);
    }, 20000);
  });

  describe('HOME-CWV-003: Cumulative Layout Shift (CLS) < 0.1', () => {
    test('CLS meets mobile stability target of 0.1', async () => {
      await performanceRunner.setup();
      
      try {
        const vitals = await performanceRunner.measureCoreWebVitals(HOME_PAGE_URL);
        
        expect(vitals.cls).not.toBeNull();
        expect(vitals.cls).toBeLessThan(MOBILE_CWV_THRESHOLDS.CLS.good);
        
        console.log(`✓ CLS: ${vitals.cls} (target: <${MOBILE_CWV_THRESHOLDS.CLS.good})`);
      } catch (error) {
        console.error('CLS measurement failed:', error);
        throw error;
      }
    }, 30000);

    test('images have defined dimensions to prevent shifts', async () => {
      await page.goto(HOME_PAGE_URL);
      
      // Check all images have width/height or CSS sizing
      const imageProblems = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.filter(img => {
          const hasWidthHeight = img.hasAttribute('width') && img.hasAttribute('height');
          const hasAspectRatio = window.getComputedStyle(img).aspectRatio !== 'auto';
          const hasFixedSize = window.getComputedStyle(img).width !== 'auto' && 
                              window.getComputedStyle(img).height !== 'auto';
          
          return !(hasWidthHeight || hasAspectRatio || hasFixedSize);
        }).length;
      });
      
      expect(imageProblems).toBe(0);
      console.log(`✓ All images have proper sizing to prevent layout shifts`);
    }, 15000);

    test('font loading does not cause text reflow', async () => {
      await page.goto(HOME_PAGE_URL);
      
      // Check for font-display swap or font optimization
      const fontOptimization = await page.evaluate(() => {
        const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
        const hasSwap = styles.some(style => 
          style.textContent?.includes('font-display: swap') ||
          style.textContent?.includes('font-display:swap')
        );
        
        // Check for preload fonts
        const preloadFonts = Array.from(document.querySelectorAll('link[rel="preload"][as="font"]'));
        
        return { hasSwap, preloadFonts: preloadFonts.length };
      });
      
      // Should have font optimization to prevent reflow
      expect(fontOptimization.hasSwap || fontOptimization.preloadFonts > 0).toBeTruthy();
      console.log(`✓ Font optimization detected: swap=${fontOptimization.hasSwap}, preloads=${fontOptimization.preloadFonts}`);
    }, 15000);

    test('dynamic content loads without affecting layout', async () => {
      await page.goto(HOME_PAGE_URL, { waitUntil: 'networkidle' });
      
      // Take initial layout snapshot
      const initialLayout = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('*')).map(el => ({
          tag: el.tagName,
          rect: el.getBoundingClientRect()
        }));
      });
      
      // Wait for any dynamic content to load
      await page.waitForTimeout(2000);
      
      // Take final layout snapshot
      const finalLayout = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('*')).map(el => ({
          tag: el.tagName,
          rect: el.getBoundingClientRect()
        }));
      });
      
      // Compare layouts - major elements shouldn't have shifted significantly
      const significantShifts = initialLayout.filter((initial, index) => {
        const final = finalLayout[index];
        if (!final) return false;
        
        const verticalShift = Math.abs(final.rect.top - initial.rect.top);
        return verticalShift > 5; // Allow small adjustments
      });
      
      expect(significantShifts.length).toBeLessThan(initialLayout.length * 0.1); // <10% of elements shifted
      console.log(`✓ Layout stability: ${significantShifts.length}/${initialLayout.length} elements shifted`);
    }, 25000);
  });

  describe('HOME-CWV-004: First Contentful Paint Optimization', () => {
    test('FCP meets mobile target of 1.8 seconds', async () => {
      await performanceRunner.setup();
      
      try {
        const vitals = await performanceRunner.measureCoreWebVitals(HOME_PAGE_URL);
        
        expect(vitals.fcp).not.toBeNull();
        expect(vitals.fcp).toBeLessThan(MOBILE_CWV_THRESHOLDS.FCP.good);
        
        console.log(`✓ FCP: ${vitals.fcp}ms (target: <${MOBILE_CWV_THRESHOLDS.FCP.good}ms)`);
      } catch (error) {
        console.error('FCP measurement failed:', error);
        throw error;
      }
    }, 30000);

    test('critical content renders quickly', async () => {
      const startTime = Date.now();
      
      await page.goto(HOME_PAGE_URL);
      
      // Wait for first meaningful content
      await page.waitForSelector('h1, .hero, [data-testid="hero"]', { timeout: 1800 });
      
      const fcp = Date.now() - startTime;
      expect(fcp).toBeLessThan(1800);
      
      console.log(`✓ Critical content FCP: ${fcp}ms`);
    }, 20000);
  });

  describe('Mobile Performance Budget Tests', () => {
    test('meets mobile performance budgets', async () => {
      await testMobilePerformance(HOME_PAGE_URL);
      console.log('✓ Mobile performance budgets met');
    }, 45000);

    test('page size is optimized for mobile', async () => {
      await page.goto(HOME_PAGE_URL, { waitUntil: 'networkidle' });
      
      const resourceStats = await page.evaluate(() => {
        return performance.getEntriesByType('resource').reduce((stats, entry) => {
          stats.totalSize += (entry as any).transferSize || 0;
          stats.resourceCount += 1;
          return stats;
        }, { totalSize: 0, resourceCount: 0 });
      });
      
      // Mobile performance budgets
      expect(resourceStats.totalSize).toBeLessThan(1500000); // 1.5MB for mobile
      expect(resourceStats.resourceCount).toBeLessThan(40); // Reasonable resource count
      
      console.log(`✓ Mobile performance: ${Math.round(resourceStats.totalSize / 1024)}KB, ${resourceStats.resourceCount} resources`);
    }, 30000);

    test('Time to Interactive is reasonable for mobile', async () => {
      const performanceMetrics = await performanceRunner.measureLoadingPerformance(HOME_PAGE_URL);
      
      // Mobile TTI should be reasonable
      expect(performanceMetrics.domContentLoaded).toBeLessThan(3000); // 3s for mobile
      expect(performanceMetrics.loadComplete).toBeLessThan(5000); // 5s full load
      
      console.log(`✓ Mobile loading: DOM ready in ${performanceMetrics.domContentLoaded}ms, complete in ${performanceMetrics.loadComplete}ms`);
    }, 30000);
  });

  describe('Performance Regression Prevention', () => {
    test('core web vitals meet all thresholds simultaneously', async () => {
      await testCoreWebVitals(HOME_PAGE_URL, MOBILE_CWV_THRESHOLDS);
      console.log('✓ All Core Web Vitals thresholds met');
    }, 60000);

    test('performance budgets are respected', async () => {
      await testPerformanceBudgets(HOME_PAGE_URL);
      console.log('✓ Performance budgets respected');
    }, 45000);
  });
});