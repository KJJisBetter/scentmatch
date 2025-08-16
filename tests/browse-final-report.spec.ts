import { test, expect } from '@playwright/test';

test.describe('Browse Page Validation Report', () => {
  test('Comprehensive Browse Page Analysis', async ({ page }) => {
    test.setTimeout(60000);

    console.log('🔍 BROWSE PAGE VALIDATION REPORT');
    console.log('='.repeat(50));

    // Test 1: Basic connectivity and loading
    console.log('\n1. BASIC CONNECTIVITY TEST');
    await page.goto('http://localhost:3003/browse', {
      waitUntil: 'commit',
      timeout: 20000,
    });
    console.log('✅ Page navigation successful');

    // Test 2: Check what's actually displayed
    console.log('\n2. CONTENT ANALYSIS');
    const bodyText = await page.locator('body').textContent();
    console.log(`   Body text length: ${bodyText?.length || 0} characters`);

    if (bodyText?.includes('Loading ScentMatch')) {
      console.log('❌ ISSUE FOUND: Page stuck on loading screen');
      console.log('   Text found: "Loading ScentMatch"');
      console.log(
        '   Text found: "Preparing your fragrance discovery experience..."'
      );
    }

    // Test 3: Check for expected browse page elements
    console.log('\n3. BROWSE PAGE ELEMENTS CHECK');

    const elements = {
      'Search Input': 'input[type="search"], input[placeholder*="search" i]',
      'Fragrance Cards': '[data-testid="fragrance-card"], .fragrance-card',
      'Filter Sidebar': '[data-testid="filter"], .filter, .sidebar',
      Images: 'img',
      Headings: 'h1, h2, h3',
      Buttons: 'button',
    };

    for (const [name, selector] of Object.entries(elements)) {
      const count = await page.locator(selector).count();
      const status = count > 0 ? '✅' : '❌';
      console.log(`   ${status} ${name}: ${count} found`);
    }

    // Test 4: Test API connectivity from browser perspective
    console.log('\n4. API CONNECTIVITY TEST');
    try {
      const response = await page.evaluate(async () => {
        const resp = await fetch('/api/search?limit=1');
        return {
          ok: resp.ok,
          status: resp.status,
          hasData: (await resp.json()).fragrances?.length > 0,
        };
      });

      if (response.ok && response.hasData) {
        console.log('✅ Browser can access search API successfully');
      } else {
        console.log(
          `❌ API issue: Status ${response.status}, Has data: ${response.hasData}`
        );
      }
    } catch (error) {
      console.log(`❌ API connectivity failed: ${error.message}`);
    }

    // Test 5: Mobile responsiveness check
    console.log('\n5. MOBILE RESPONSIVENESS TEST');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    const viewport = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));

    console.log(`✅ Mobile viewport: ${viewport.width}x${viewport.height}`);

    // Test 6: Performance and error detection
    console.log('\n6. ERROR DETECTION');
    const errors: string[] = [];
    const networkErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('response', response => {
      if (!response.ok()) {
        networkErrors.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.waitForTimeout(3000);

    console.log(`   Console errors: ${errors.length}`);
    if (errors.length > 0) {
      errors.slice(0, 3).forEach(error => console.log(`   ❌ ${error}`));
    }

    console.log(`   Network errors: ${networkErrors.length}`);
    if (networkErrors.length > 0) {
      networkErrors.slice(0, 3).forEach(error => console.log(`   ❌ ${error}`));
    }

    // Test 7: Summary and diagnosis
    console.log('\n7. DIAGNOSIS SUMMARY');
    console.log('='.repeat(30));

    if (bodyText?.includes('Loading ScentMatch')) {
      console.log('🔧 PRIMARY ISSUE IDENTIFIED:');
      console.log('   Browse page is stuck on loading screen');
      console.log('   This indicates a server-side rendering issue');
      console.log('   The page cannot complete its initial data fetch');
      console.log('');
      console.log('💡 LIKELY CAUSE:');
      console.log('   Port mismatch in browse/page.tsx:');
      console.log('   - Code tries to fetch from localhost:3000');
      console.log('   - Development server runs on localhost:3003');
      console.log('');
      console.log('🛠️  RECOMMENDED FIX:');
      console.log('   Update browse/page.tsx line 75 to use correct port');
      console.log('   Change localhost:3000 to localhost:3003 for development');
    }

    console.log('\n✅ BROWSE PAGE VALIDATION COMPLETE');
  });
});
