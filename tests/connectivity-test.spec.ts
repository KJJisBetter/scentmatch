import { test, expect } from '@playwright/test';

test('Simple connectivity test', async ({ page }) => {
  test.setTimeout(10000);

  try {
    console.log('Attempting to connect to localhost:3003...');

    // Just try to connect to the homepage first
    await page.goto('http://localhost:3003', {
      waitUntil: 'domcontentloaded',
      timeout: 8000,
    });

    console.log('✅ Successfully connected to homepage');

    // Check if page loads
    const body = await page.locator('body').isVisible();
    expect(body).toBe(true);

    console.log('✅ Homepage body is visible');
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    throw error;
  }
});

test('Browse page accessibility test', async ({ page }) => {
  test.setTimeout(15000);

  try {
    console.log('Testing browse page accessibility...');

    // Try to load the browse page with a longer timeout
    await page.goto('http://localhost:3003/browse', {
      waitUntil: 'domcontentloaded',
      timeout: 12000,
    });

    console.log('✅ Browse page loaded');

    // Check for any visible content
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBe(true);

    console.log('✅ Browse page has visible content');

    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
  } catch (error) {
    console.log('❌ Browse page test failed:', error.message);

    // Try to get the page title for debugging
    try {
      const title = await page.title();
      console.log('Page title:', title);
    } catch (e) {
      console.log('Could not get page title');
    }

    throw error;
  }
});
