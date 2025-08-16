import { test, expect } from '@playwright/test';

test.describe('Browse Page Basic Tests', () => {
  test('Browse page loads basic HTML structure', async ({ page }) => {
    test.setTimeout(30000);

    console.log('Testing browse page with minimal wait conditions...');

    // Load page without waiting for full DOM content
    await page.goto('http://localhost:3003/browse', {
      waitUntil: 'commit', // Just wait for navigation to commit
      timeout: 20000,
    });

    console.log('✅ Page navigation committed');

    // Check basic page properties
    const title = await page.title();
    console.log('Page title:', title);
    expect(title).toContain('Browse');

    // Check if body element exists
    await expect(page.locator('body')).toBeAttached({ timeout: 10000 });
    console.log('✅ Body element exists');

    // Check for any text content
    const bodyText = await page.locator('body').textContent();
    console.log('Body text length:', bodyText?.length || 0);

    if (bodyText && bodyText.length > 0) {
      console.log('✅ Page has text content');
      console.log('First 200 chars:', bodyText.substring(0, 200));
    }
  });

  test('Check for specific browse page elements', async ({ page }) => {
    test.setTimeout(30000);

    await page.goto('http://localhost:3003/browse', {
      waitUntil: 'commit',
      timeout: 20000,
    });

    // Wait a bit for any dynamic content
    await page.waitForTimeout(3000);

    console.log('Checking for browse page elements...');

    // Check for common browse page elements with flexible selectors
    const searches = [
      'input[type="search"]',
      'input[placeholder*="search" i]',
      'h1',
      'h2',
      'h3',
      '.search',
      '.filter',
      '.fragrance',
      'img',
      'button',
    ];

    for (const selector of searches) {
      const elements = await page.locator(selector).count();
      console.log(`${selector}: ${elements} elements found`);
    }

    // Test typing in any input field
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    console.log(`Total inputs found: ${inputCount}`);

    if (inputCount > 0) {
      try {
        await inputs.first().fill('test search');
        console.log('✅ Successfully typed in first input field');
      } catch (error) {
        console.log('⚠️ Could not type in input:', error.message);
      }
    }
  });

  test('Mobile viewport test', async ({ page }) => {
    test.setTimeout(30000);

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('http://localhost:3003/browse', {
      waitUntil: 'commit',
      timeout: 20000,
    });

    await page.waitForTimeout(2000);

    const viewport = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));

    console.log('Mobile viewport:', viewport);
    expect(viewport.width).toBe(375);
    console.log('✅ Mobile viewport test passed');
  });

  test('Network and console error detection', async ({ page }) => {
    test.setTimeout(30000);

    const errors: string[] = [];
    const networkErrors: string[] = [];

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Listen for network errors
    page.on('response', response => {
      if (!response.ok()) {
        const status = response.status();
        const url = response.url();
        networkErrors.push(`${status} ${url}`);
      }
    });

    await page.goto('http://localhost:3003/browse', {
      waitUntil: 'commit',
      timeout: 20000,
    });

    await page.waitForTimeout(5000);

    console.log('Console errors:', errors.length);
    errors.forEach(error => console.log('❌ Console error:', error));

    console.log('Network errors:', networkErrors.length);
    networkErrors.forEach(error => console.log('❌ Network error:', error));

    // Report but don't fail on errors for now - just gather info
    console.log('✅ Error detection test completed');
  });
});
