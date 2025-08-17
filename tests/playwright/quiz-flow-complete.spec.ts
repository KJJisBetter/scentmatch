import { test, expect } from '@playwright/test';

/**
 * Complete Quiz Flow End-to-End Tests
 * Task 4: Complete Quiz Flow Experience - Comprehensive Testing
 */

test.describe('Complete Quiz Flow - End-to-End Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport for mobile-first testing
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('Complete quiz journey from start to conversion', async ({ page }) => {
    // 1. Navigate to quiz page
    await page.goto('http://localhost:3001/quiz');

    // Verify quiz page loads properly
    await expect(page.locator('h1')).toContainText(
      'Discover Your Fragrance Personality'
    );
    await expect(page.locator('text=Question 1 of 5')).toBeVisible();
    await expect(page.locator('text=20% complete')).toBeVisible();

    console.log('✅ Quiz page loaded with proper progress tracking');

    // 2. Answer Question 1: Personal Style
    await page.getByRole('button', { name: '💼 Professional &' }).click();

    // Verify progress to Question 2
    await expect(page.locator('text=Question 2 of 5')).toBeVisible();
    await expect(page.locator('text=40% complete')).toBeVisible();

    console.log('✅ Question 1 answered, smooth transition to Question 2');

    // 3. Answer Question 2: Occasions
    await page
      .getByRole('button', { name: '🌙 Evening dinners & dates' })
      .click();

    // Verify progress to Question 3
    await expect(page.locator('text=Question 3 of 5')).toBeVisible();
    await expect(page.locator('text=60% complete')).toBeVisible();

    console.log('✅ Question 2 answered, progress tracking accurate');

    // 4. Answer Question 3: Scent Style
    await page
      .getByRole('button', { name: '🎭 Complex & layered (evolves' })
      .click();

    // Verify progress to Question 4
    await expect(page.locator('text=Question 4 of 5')).toBeVisible();
    await expect(page.locator('text=80% complete')).toBeVisible();

    console.log('✅ Question 3 answered, approaching completion');

    // 5. Answer Question 4: Intensity
    await page
      .getByRole('button', { name: '💫 Strong - memorable and' })
      .click();

    // Verify progress to final question
    await expect(page.locator('text=Question 5 of 5')).toBeVisible();
    await expect(page.locator('text=100% complete')).toBeVisible();

    console.log('✅ Question 4 answered, final question ready');

    // 6. Answer Final Question: Shopping Approach
    await page
      .getByRole('button', { name: '🧪 Try samples first, then' })
      .click();

    // 7. Verify analysis loading state
    await expect(
      page.locator('text=Analyzing Your Fragrance Personality...')
    ).toBeVisible();
    await expect(
      page.locator('text=Finding your perfect fragrance matches')
    ).toBeVisible();

    console.log('✅ Professional analysis loading state displayed');

    // 8. Wait for results and verify personality
    await expect(page.locator('text=Your Fragrance Personality')).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.locator('text=Sophisticated Evening Enthusiast')
    ).toBeVisible();
    await expect(page.locator('text=100% match confidence')).toBeVisible();

    console.log('✅ Personality analysis completed successfully');

    // 9. Verify recommendations are displayed
    await expect(page.locator('text=Your Top 3 Matches')).toBeVisible();
    await expect(
      page.locator('button', { hasText: 'Try Sample $' })
    ).toHaveCount(2); // 2 recommendations shown

    console.log('✅ Recommendations displayed with sample pricing');

    // 10. Verify conversion prompt
    await expect(
      page.locator('text=Unlock 12 More Perfect Matches')
    ).toBeVisible();
    await expect(page.locator('text=Create your free account')).toBeVisible();
    await expect(
      page.locator('text=15 total personalized recommendations')
    ).toBeVisible();
    await expect(
      page.locator('text=20% off your first sample order')
    ).toBeVisible();

    console.log('✅ Conversion optimization elements present and compelling');

    // 11. Test account creation flow
    await page
      .getByRole('button', { name: 'Create Free Account - See All' })
      .click();

    // Verify account creation form
    await expect(
      page.locator('text=Create Your ScentMatch Account')
    ).toBeVisible();
    await expect(
      page.locator(
        'text=Your sophisticated personality and quiz results will be saved'
      )
    ).toBeVisible();

    console.log(
      '✅ Account creation form displayed with value preservation message'
    );

    // 12. Test form validation
    const createButton = page.getByRole('button', {
      name: 'Create Account & Unlock All Matches',
    });
    await expect(createButton).toBeDisabled();

    // Fill form and verify button enables
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.fill('input[type="text"]', 'Test User');

    await expect(createButton).toBeEnabled();

    console.log(
      '✅ Form validation working properly - button enables when complete'
    );

    // 13. Test back navigation
    await page.getByRole('button', { name: 'Back to Results' }).click();
    await expect(page.locator('text=Your Top 3 Matches')).toBeVisible();

    console.log('✅ Back navigation working - returns to results');

    // 14. Test guest limitations flow
    await page
      .getByRole('button', { name: 'Continue without account (' })
      .click();

    // Verify guest limitations messaging
    await expect(page.locator('text=Continuing as Guest')).toBeVisible();
    await expect(page.locator('text=Limited Guest Experience:')).toBeVisible();
    await expect(
      page.locator('text=Only 3 recommendations (missing 12 perfect matches)')
    ).toBeVisible();

    console.log('✅ Guest limitations clearly communicated');

    // 15. Test conversion recovery
    await expect(
      page.locator('text=Most sophisticated users create accounts')
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Actually, I Want All My Matches' })
    ).toBeVisible();

    console.log('✅ Conversion recovery opportunity provided');

    console.log(
      '🎉 COMPLETE QUIZ FLOW VERIFIED - All user journeys working perfectly!'
    );
  });

  test('Quiz progress indicators work correctly', async ({ page }) => {
    await page.goto('http://localhost:3001/quiz');

    // Test progress bar visual accuracy
    const progressBar = page.locator('[style*="width: 20%"]');
    await expect(progressBar).toBeVisible();

    // Answer question and verify progress updates
    await page.getByRole('button', { name: '💼 Professional &' }).click();

    const progressBar40 = page.locator('[style*="width: 40%"]');
    await expect(progressBar40).toBeVisible();

    console.log('✅ Progress bar updates accurately with question progression');
  });

  test('Quiz analytics tracking functions', async ({ page }) => {
    await page.goto('http://localhost:3001/quiz');

    // Mock gtag for analytics testing
    await page.addInitScript(() => {
      (window as any).gtag = (event: string, action: string, params: any) => {
        console.log(`Analytics: ${event} - ${action}`, params);
        (window as any).analytics = (window as any).analytics || [];
        (window as any).analytics.push({ event, action, params });
      };
    });

    // Answer questions and check analytics
    await page.getByRole('button', { name: '💼 Professional &' }).click();

    // Verify analytics were called
    const analyticsData = await page.evaluate(() => (window as any).analytics);
    expect(analyticsData).toBeTruthy();

    console.log('✅ Quiz analytics tracking implemented');
  });

  test('Quiz performance meets standards', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('http://localhost:3001/quiz');

    // Verify quick page load
    await expect(page.locator('h1')).toBeVisible();
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000); // Quiz should load in under 3 seconds

    console.log(`✅ Quiz page performance: ${loadTime}ms (target: <3000ms)`);
  });

  test('Mobile responsiveness verified', async ({ page }) => {
    await page.goto('http://localhost:3001/quiz');

    // Test different mobile viewports
    const viewports = [
      { width: 320, height: 568 }, // iPhone SE
      { width: 375, height: 667 }, // iPhone 8
      { width: 414, height: 896 }, // iPhone 11
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);

      // Verify key elements are visible and properly sized
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('button').first()).toBeVisible();

      // Check touch target sizes (minimum 44px)
      const buttonHeight = await page
        .locator('button')
        .first()
        .evaluate(el => el.getBoundingClientRect().height);
      expect(buttonHeight).toBeGreaterThanOrEqual(44);
    }

    console.log('✅ Mobile responsiveness verified across device sizes');
  });
});
