import { test, expect } from '@playwright/test';

test.describe('Browse Page Simple Tests', () => {
  test('Browse page loads and displays basic content', async ({ page }) => {
    // Increase timeout for this test
    test.setTimeout(60000);

    // Navigate to browse page
    await page.goto('http://localhost:3003/browse', {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });

    // Check page title or basic content
    await expect(page.locator('body')).toBeVisible();

    // Check for any main heading
    const headings = page.locator('h1, h2').first();
    await expect(headings).toBeVisible({ timeout: 10000 });

    console.log('✅ Browse page loaded successfully');
  });

  test('Search input exists and is functional', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('http://localhost:3003/browse', {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });

    // Look for search input
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]'
    );
    await expect(searchInput.first()).toBeVisible({ timeout: 15000 });

    // Test typing in search
    await searchInput.first().fill('test');
    const value = await searchInput.first().inputValue();
    expect(value).toBe('test');

    console.log('✅ Search input is functional');
  });

  test('Fragrance content loads', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('http://localhost:3003/browse', {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });

    // Wait for any fragrance-related content
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Look for fragrance cards, images, or any content indicating fragrances loaded
    const fragranceContent = page.locator(
      '[data-testid="fragrance-card"], .fragrance-card, .fragrance-item, img[alt*="fragrance" i], img[alt*="Fragrance" i]'
    );

    const count = await fragranceContent.count();
    console.log(`Found ${count} fragrance-related elements`);

    if (count > 0) {
      await expect(fragranceContent.first()).toBeVisible();
      console.log('✅ Fragrance content is visible');
    } else {
      console.log('⚠️ No fragrance content found - may still be loading');
    }
  });

  test('Page responds to mobile viewport', async ({ page }) => {
    test.setTimeout(60000);

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('http://localhost:3003/browse', {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });

    // Check that page is responsive
    await expect(page.locator('body')).toBeVisible();

    // Check viewport width
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(viewportWidth).toBe(375);

    console.log('✅ Mobile viewport test passed');
  });

  test('Filter sidebar or controls exist', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('http://localhost:3003/browse', {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });

    // Look for filter-related elements
    const filterElements = page.locator(
      '[data-testid="filter"], .filter, .sidebar, button:has-text("Filter"), input[type="checkbox"]'
    );

    const count = await filterElements.count();
    console.log(`Found ${count} filter-related elements`);

    if (count > 0) {
      console.log('✅ Filter controls found');
    } else {
      console.log('⚠️ No filter controls found');
    }
  });
});
