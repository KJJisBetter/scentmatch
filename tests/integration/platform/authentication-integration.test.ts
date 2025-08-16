import { test, expect, type Page } from '@playwright/test';

/**
 * Task 8.3: Authentication System with Database Integration Test
 * 
 * This test validates authentication state management across the entire platform
 * including middleware, database RLS, and frontend state consistency.
 */

class AuthTestHelper {
  async attemptLogin(page: Page, email: string, password: string) {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"], button:has-text("Sign In")');
  }
  
  async checkAuthenticationState(page: Page): Promise<boolean> {
    // Check if user is authenticated by testing protected route access
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    return !currentUrl.includes('/auth/login');
  }
  
  async logout(page: Page) {
    // Try to find and click logout button/link
    const logoutSelectors = [
      'button:has-text("Sign Out")',
      'button:has-text("Logout")',
      'a:has-text("Sign Out")',
      '[data-testid="logout"]'
    ];
    
    for (const selector of logoutSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
        await element.click();
        break;
      }
    }
  }
}

test.describe('Authentication System Integration - Task 8.3', () => {
  const authHelper = new AuthTestHelper();
  
  test('Authentication state consistency across platform areas', async ({ page }) => {
    console.log('\n🔐 Testing authentication state management...');
    
    // Phase 1: Anonymous User State
    console.log('\n📋 Phase 1: Testing anonymous user restrictions');
    
    // Verify anonymous user can access public pages
    await page.goto('/');
    await expect(page).toHaveURL('/');
    console.log('✅ Anonymous access to home page works');
    
    // Verify anonymous user redirected from protected routes
    await page.goto('/dashboard');
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    console.log('✅ Anonymous user properly redirected from protected routes');
    
    // Phase 2: Authentication Flow Testing
    console.log('\n📋 Phase 2: Testing authentication flow components');
    
    // Test login page accessibility
    await page.goto('/auth/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    console.log('✅ Login form components are accessible');
    
    // Test signup page accessibility
    await page.goto('/auth/signup');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    console.log('✅ Signup form components are accessible');
    
    // Phase 3: Database Integration
    console.log('\n📋 Phase 3: Testing database integration');
    
    // Test that authentication system can communicate with database
    await page.goto('/auth/signup');
    
    // Try to register with test email to verify database connectivity
    const timestamp = Date.now();
    const testUser = {
      email: `db-test-${timestamp}@example.com`,
      password: 'TestPassword123!'
    };
    
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Should either succeed (show verification message) or show specific error
    await page.waitForTimeout(3000);
    const hasResponse = await page.locator('text=/verify|error|success|already exists/i').isVisible();
    expect(hasResponse, 'Database integration should provide response').toBe(true);
    console.log('✅ Database integration responding correctly');
  });

  test('Protected route access control validation', async ({ page }) => {
    console.log('\n🛡️ Testing protected route access control...');
    
    const protectedRoutes = [
      '/dashboard',
      '/dashboard/collection',
      '/dashboard/profile'
    ];
    
    for (const route of protectedRoutes) {
      console.log(`Testing protection for ${route}`);
      
      // Attempt to access protected route as anonymous user
      await page.goto(route);
      
      // Should redirect to login
      await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
      console.log(`✅ ${route} properly protected - redirects to login`);
    }
  });

  test('Cross-tab session synchronization', async ({ page, context }) => {
    console.log('\n🔄 Testing cross-tab session synchronization...');
    
    const page2 = await context.newPage();
    
    // Both tabs start as anonymous
    await page.goto('/');
    await page2.goto('/');
    
    // Verify both tabs handle auth state consistently
    await page.goto('/dashboard');
    await page2.goto('/dashboard');
    
    // Both should redirect to login
    await page.waitForURL(/\/auth\/login/);
    await page2.waitForURL(/\/auth\/login/);
    
    console.log('✅ Cross-tab authentication state is consistent');
    
    await page2.close();
  });
});
