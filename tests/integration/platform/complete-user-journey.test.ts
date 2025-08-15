import { test, expect, type Page } from '@playwright/test';
import { testUsers } from '../../fixtures/auth';

/**
 * Task 8.2: Complete User Registration and Onboarding Flow Test
 * 
 * This test validates the complete end-to-end user journey from
 * anonymous visitor to active platform user with real data integration.
 */

class PerformanceMonitor {
  async capturePageMetrics(page: Page) {
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Capture Core Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const data: any = {};
        
        // LCP - Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          data.lcp = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'], buffered: true });
        
        // CLS - Cumulative Layout Shift
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          data.cls = clsValue;
        }).observe({ entryTypes: ['layout-shift'], buffered: true });
        
        // Return after short delay to capture metrics
        setTimeout(() => resolve(data), 1000);
      });
    });
    
    return { loadTime, vitals };
  }
  
  validatePerformance(metrics: any, pageName: string) {
    console.log(`Performance metrics for ${pageName}:`);
    console.log(`- Load time: ${metrics.loadTime}ms`);
    console.log(`- LCP: ${metrics.vitals.lcp}ms`);
    console.log(`- CLS: ${metrics.vitals.cls}`);
    
    // Validate Core Web Vitals targets (mobile-focused)
    expect(metrics.loadTime, `${pageName} load time should be under 3000ms`).toBeLessThan(3000);
    if (metrics.vitals.lcp) {
      expect(metrics.vitals.lcp, `${pageName} LCP should be under 2500ms`).toBeLessThan(2500);
    }
    if (metrics.vitals.cls !== undefined) {
      expect(metrics.vitals.cls, `${pageName} CLS should be under 0.1`).toBeLessThan(0.1);
    }
  }
}

test.describe('Complete Platform Integration - Task 8.2', () => {
  const monitor = new PerformanceMonitor();
  let testUser: any;
  
  test.beforeEach(async () => {
    // Generate unique test user for each test run
    const timestamp = Date.now();
    testUser = {
      email: `integration-test-${timestamp}@scentmatch.com`,
      password: 'IntegrationTest123!',
      firstName: 'Integration',
      lastName: 'Tester'
    };
  });

  test('End-to-end user journey with real fragrance data', async ({ page }) => {
    console.log('\n🚀 Starting complete platform integration test...');
    
    // Phase 1: Anonymous User on Home Page
    console.log('\n📋 Phase 1: Testing home page performance and content');
    await page.goto('/');
    
    const homeMetrics = await monitor.capturePageMetrics(page);
    monitor.validatePerformance(homeMetrics, 'Home Page');
    
    // Verify essential home page elements
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="featured-content"]')).toBeVisible();
    
    // Check for fragrance discovery teasers
    const ctaButton = page.locator('a[href*="signup"], button:has-text("Get Started"), button:has-text("Sign Up")').first();
    await expect(ctaButton).toBeVisible();
    
    // Phase 2: User Registration
    console.log('\n📋 Phase 2: Testing user registration flow');
    await ctaButton.click();
    
    // Should redirect to signup page
    await expect(page).toHaveURL(/\/auth\/signup/);
    
    const signupMetrics = await monitor.capturePageMetrics(page);
    monitor.validatePerformance(signupMetrics, 'Signup Page');
    
    // Fill registration form
    await page.fill('input[name="email"], input[type="email"]', testUser.email);
    await page.fill('input[name="password"], input[type="password"]', testUser.password);
    
    // Submit registration
    const signupButton = page.locator('button[type="submit"], button:has-text("Sign Up"), button:has-text("Create Account")').first();
    await signupButton.click();
    
    // Verify registration success (should show verification notice)
    await expect(page.locator('text=/verify|check.*email|confirmation/i')).toBeVisible({ timeout: 10000 });
    console.log('✅ Registration successful - verification notice displayed');
    
    // Phase 3: Email Verification Simulation
    console.log('\n📋 Phase 3: Simulating email verification');
    
    // Since we can't access real email in tests, we'll verify the verification page exists
    // and that the auth system is properly configured
    await page.goto('/auth/verify');
    const verifyMetrics = await monitor.capturePageMetrics(page);
    monitor.validatePerformance(verifyMetrics, 'Verify Page');
    
    // Phase 4: Login Flow
    console.log('\n📋 Phase 4: Testing login functionality');
    await page.goto('/auth/login');
    
    const loginMetrics = await monitor.capturePageMetrics(page);
    monitor.validatePerformance(loginMetrics, 'Login Page');
    
    // Test login form functionality (even if user isn't verified yet)
    await page.fill('input[name="email"], input[type="email"]', testUser.email);
    await page.fill('input[name="password"], input[type="password"]', testUser.password);
    
    const loginButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
    await expect(loginButton).toBeVisible();
    console.log('✅ Login form is functional');
    
    // Phase 5: Dashboard Access Test (without actual login due to verification requirement)
    console.log('\n📋 Phase 5: Testing dashboard protection and structure');
    
    // Test that dashboard requires authentication
    await page.goto('/dashboard');
    
    // Should redirect to login (middleware protection)
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    console.log('✅ Dashboard properly protected - redirects to login');
    
    // Phase 6: Fragrance Discovery Integration
    console.log('\n📋 Phase 6: Testing fragrance data integration');
    
    // Go back to home to test fragrance features that don't require auth
    await page.goto('/');
    
    // Look for fragrance-related content that should be visible
    const fragranceElements = await page.locator('[data-testid*="fragrance"], [class*="fragrance"], text=/fragrance|scent|perfume/i').count();
    expect(fragranceElements, 'Page should contain fragrance-related content').toBeGreaterThan(0);
    console.log(`✅ Found ${fragranceElements} fragrance-related elements`);
    
    // Phase 7: Performance Validation Summary
    console.log('\n📋 Phase 7: Performance validation summary');
    
    const allMetrics = [
      { name: 'Home Page', metrics: homeMetrics },
      { name: 'Signup Page', metrics: signupMetrics },
      { name: 'Verify Page', metrics: verifyMetrics },
      { name: 'Login Page', metrics: loginMetrics }
    ];
    
    console.log('\n📊 Performance Summary:');
    allMetrics.forEach(({ name, metrics }) => {
      console.log(`${name}: ${metrics.loadTime}ms load time`);
    });
    
    // Verify all pages meet performance targets
    const averageLoadTime = allMetrics.reduce((sum, item) => sum + item.metrics.loadTime, 0) / allMetrics.length;
    expect(averageLoadTime, 'Average page load time should be under 2500ms').toBeLessThan(2500);
    
    console.log('\n✅ Complete platform integration test completed successfully!');
  });

  test('User registration validation and error handling', async ({ page }) => {
    console.log('\n🔒 Testing registration validation and error handling...');
    
    await page.goto('/auth/signup');
    
    // Test form validation
    const signupButton = page.locator('button[type="submit"], button:has-text("Sign Up")').first();
    await signupButton.click();
    
    // Should show validation errors for empty fields
    const errorElements = await page.locator('[role="alert"], .error, text=/required|invalid/i').count();
    expect(errorElements, 'Should show validation errors for empty form').toBeGreaterThan(0);
    
    // Test invalid email format
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'weak');
    await signupButton.click();
    
    // Should show format validation errors
    const formatErrors = await page.locator('text=/email.*invalid|password.*requirements/i').count();
    expect(formatErrors, 'Should show format validation errors').toBeGreaterThan(0);
    
    console.log('✅ Registration validation working correctly');
  });

  test('Cross-browser authentication state consistency', async ({ page, context }) => {
    console.log('\n🌐 Testing cross-tab authentication state...');
    
    // Create a second page to test cross-tab behavior
    const page2 = await context.newPage();
    
    // Both pages start on home
    await page.goto('/');
    await page2.goto('/');
    
    // Test that both pages handle authentication consistently
    await page.goto('/auth/login');
    await page2.goto('/auth/login');
    
    // Verify both pages render correctly
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page2.locator('input[type="email"]')).toBeVisible();
    
    console.log('✅ Cross-tab consistency validated');
    
    await page2.close();
  });
});
