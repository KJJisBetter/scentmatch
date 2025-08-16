import { test } from '@playwright/test';

test('Take screenshot of browse page', async ({ page }) => {
  test.setTimeout(30000);

  await page.goto('http://localhost:3003/browse', {
    waitUntil: 'commit',
    timeout: 20000,
  });

  // Wait a moment for any content to load
  await page.waitForTimeout(5000);

  // Take screenshot
  await page.screenshot({
    path: 'browse-page-screenshot.png',
    fullPage: true,
  });

  console.log('✅ Screenshot saved as browse-page-screenshot.png');

  // Get page HTML for analysis
  const html = await page.content();
  console.log('Page HTML length:', html.length);
  console.log('HTML preview:', html.substring(0, 500));
});
