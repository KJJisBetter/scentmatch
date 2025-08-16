import { test, expect } from '@playwright/test';

/**
 * Critical User Walkthrough Validation
 * Tests the exact issues reported in user-walkthrough-issues.md
 */

test.describe('Critical Platform Functionality', () => {
  
  test('Browse Page - Should NOT show useState errors', async ({ page }) => {
    console.log('🔍 Testing Browse Page for useState errors...');
    
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');
    
    // Check for the specific error mentioned in walkthrough
    const hasUseStateError = await page.locator('text=/useState only works in Client Components/').count() > 0;
    const hasApplicationError = await page.locator('text=/Application error: a server-side exception has occurred/').count() > 0;
    
    expect(hasUseStateError, 'Should NOT show useState error').toBe(false);
    expect(hasApplicationError, 'Should NOT show application error').toBe(false);
    
    // Verify page actually loads content
    const hasSearchInput = await page.locator('input[placeholder*="search"]').count() > 0;
    const hasFilterButton = await page.locator('button:has-text("Filter")').count() > 0;
    
    expect(hasSearchInput, 'Browse page should have search input').toBe(true);
    expect(hasFilterButton, 'Browse page should have filter button').toBe(true);
    
    console.log('✅ Browse page working without useState errors');
  });

  test('Authentication - Should NOT show client-side exceptions', async ({ page }) => {
    console.log('🔐 Testing Authentication system...');
    
    // Test login page
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    const hasClientException = await page.locator('text=/Cannot read properties of undefined/').count() > 0;
    const hasApplicationError = await page.locator('text=/Application error: a client-side exception has occurred/').count() > 0;
    
    expect(hasClientException, 'Should NOT show client-side exception').toBe(false);
    expect(hasApplicationError, 'Should NOT show application error').toBe(false);
    
    // Verify login form is present and functional
    const emailInput = await page.locator('input[type="email"]').count() > 0;
    const passwordInput = await page.locator('input[type="password"]').count() > 0;
    const signInButton = await page.locator('button:has-text("Sign In")').count() > 0;
    
    expect(emailInput, 'Login should have email input').toBe(true);
    expect(passwordInput, 'Login should have password input').toBe(true);
    expect(signInButton, 'Login should have sign in button').toBe(true);
    
    console.log('✅ Authentication system working without client exceptions');
    
    // Test signup page
    await page.goto('/auth/signup');
    await page.waitForLoadState('networkidle');
    
    const signupHasError = await page.locator('text=/Application error|Cannot read properties/').count() > 0;
    expect(signupHasError, 'Signup should NOT show application errors').toBe(false);
    
    console.log('✅ Signup page working without errors');
  });

  test('Quiz Search - Should NOT show Server Action errors', async ({ page }) => {
    console.log('📝 Testing Quiz search functionality...');
    
    await page.goto('/quiz');
    await page.waitForLoadState('networkidle');
    
    // Check for the specific Server Action error
    const hasServerActionError = await page.locator('text=/Server Action not found/').count() > 0;
    const hasSearchError = await page.locator('text=/Search Error/').count() > 0;
    
    expect(hasServerActionError, 'Should NOT show Server Action not found error').toBe(false);
    expect(hasSearchError, 'Should NOT show Search Error').toBe(false);
    
    // Verify quiz loads properly
    const hasQuizContent = await page.locator('h1, h2, h3').count() > 0;
    expect(hasQuizContent, 'Quiz should load with content').toBe(true);
    
    console.log('✅ Quiz page working without Server Action errors');
  });

  test('Professional Error Handling - No raw technical errors', async ({ page }) => {
    console.log('🛡️ Testing professional error handling...');
    
    // Test that we don't expose raw technical errors anywhere
    const pagesToTest = ['/', '/auth/login', '/auth/signup', '/quiz'];
    
    for (const url of pagesToTest) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      
      // Check for unprofessional technical errors
      const hasTechnicalErrors = await page.locator('text=/TypeError|ReferenceError|SyntaxError|Internal Server Error|500|stack trace/i').count() > 0;
      expect(hasTechnicalErrors, `${url} should NOT show raw technical errors`).toBe(false);
      
      console.log(`✅ ${url} - No raw technical errors exposed`);
    }
  });

  test('Core User Journey - Complete walkthrough', async ({ page }) => {
    console.log('🎯 Testing complete user journey...');
    
    // 1. Homepage loads
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const homeTitle = await page.title();
    expect(homeTitle).toContain('ScentMatch');
    console.log('✅ Homepage loads successfully');
    
    // 2. Navigate to browse (the critical issue from walkthrough)
    await page.click('a[href="/browse"]');
    await page.waitForLoadState('networkidle');
    
    // Verify NO useState error (the main issue reported)
    const browseHasError = await page.locator('text=/useState only works in Client Components|Application error/').count() > 0;
    expect(browseHasError, 'Browse navigation should work without errors').toBe(false);
    console.log('✅ Browse navigation working');
    
    // 3. Navigate to quiz
    await page.goto('/quiz');
    await page.waitForLoadState('networkidle');
    
    // Verify quiz loads without Server Action errors
    const quizHasError = await page.locator('text=/Server Action not found|Search Error/').count() > 0;
    expect(quizHasError, 'Quiz should work without Server Action errors').toBe(false);
    console.log('✅ Quiz navigation working');
    
    // 4. Test auth pages
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    const authHasError = await page.locator('text=/Cannot read properties|Application error/').count() > 0;
    expect(authHasError, 'Auth should work without client exceptions').toBe(false);
    console.log('✅ Authentication pages working');
    
    console.log('🎉 Complete user journey functional - affiliate ready!');
  });
});