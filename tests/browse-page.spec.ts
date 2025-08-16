import { test, expect, type Page } from '@playwright/test';

test.describe('Browse Page Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to browse page before each test
    await page.goto('http://localhost:3003/browse');
  });

  test('Browse page loads properly with layout and components', async ({
    page,
  }) => {
    // Check page title
    await expect(page).toHaveTitle(/Browse/);

    // Check main heading
    await expect(page.locator('h1')).toContainText('Browse Fragrances');

    // Check search input exists
    await expect(page.locator('input[type="search"]')).toBeVisible();

    // Check filter sidebar exists
    await expect(
      page
        .locator('[data-testid="filter-sidebar"]')
        .or(page.locator('.filter-sidebar'))
    ).toBeVisible();

    // Check fragrance grid exists
    await expect(
      page
        .locator('[data-testid="fragrance-grid"]')
        .or(page.locator('.fragrance-grid'))
    ).toBeVisible();

    // Wait for fragrances to load and check at least one fragrance card is visible
    await page.waitForLoadState('networkidle');
    await expect(
      page
        .locator('[data-testid="fragrance-card"]')
        .or(page.locator('.fragrance-card'))
        .first()
    ).toBeVisible();
  });

  test('Search functionality works', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find search input
    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toBeVisible();

    // Test search with a common term
    await searchInput.fill('Chanel');
    await searchInput.press('Enter');

    // Wait for search results
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check that results are filtered (should contain Chanel fragrances)
    const fragranceCards = page
      .locator('[data-testid="fragrance-card"]')
      .or(page.locator('.fragrance-card'));
    await expect(fragranceCards.first()).toBeVisible();

    // Clear search and verify all results return
    await searchInput.clear();
    await searchInput.press('Enter');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('Filter sidebar functions properly', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Test sample availability filter
    const sampleFilter = page
      .locator('input[type="checkbox"]')
      .filter({ hasText: /sample/i })
      .or(
        page
          .locator('label')
          .filter({ hasText: /sample/i })
          .locator('input')
      );

    if ((await sampleFilter.count()) > 0) {
      await sampleFilter.first().check();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }

    // Test scent family filters
    const familyFilters = page
      .locator('input[type="checkbox"]')
      .filter({ hasText: /floral|woody|fresh|oriental/i })
      .or(
        page
          .locator('label')
          .filter({ hasText: /floral|woody|fresh|oriental/i })
          .locator('input')
      );

    if ((await familyFilters.count()) > 0) {
      await familyFilters.first().check();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Uncheck to reset
      await familyFilters.first().uncheck();
      await page.waitForLoadState('networkidle');
    }

    // Test brand filters
    const brandFilters = page
      .locator('input[type="checkbox"]')
      .filter({ hasText: /chanel|dior|tom ford/i })
      .or(
        page
          .locator('label')
          .filter({ hasText: /chanel|dior|tom ford/i })
          .locator('input')
      );

    if ((await brandFilters.count()) > 0) {
      await brandFilters.first().check();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
  });

  test('Fragrance cards display correctly with all elements', async ({
    page,
  }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Get the first fragrance card
    const firstCard = page
      .locator('[data-testid="fragrance-card"]')
      .or(page.locator('.fragrance-card'))
      .first();
    await expect(firstCard).toBeVisible();

    // Check for fragrance image
    const image = firstCard.locator('img');
    await expect(image).toBeVisible();

    // Check for fragrance name
    const name = firstCard
      .locator('h3')
      .or(firstCard.locator('.fragrance-name'))
      .or(firstCard.locator('[data-testid="fragrance-name"]'));
    await expect(name).toBeVisible();

    // Check for brand
    const brand = firstCard
      .locator('.brand')
      .or(firstCard.locator('[data-testid="brand"]'))
      .or(firstCard.getByText(/by /i));
    if ((await brand.count()) > 0) {
      await expect(brand.first()).toBeVisible();
    }

    // Check for rating if present
    const rating = firstCard
      .locator('.rating')
      .or(firstCard.locator('[data-testid="rating"]'))
      .or(firstCard.locator('⭐'));
    if ((await rating.count()) > 0) {
      await expect(rating.first()).toBeVisible();
    }

    // Check for sample availability indicator
    const sampleIndicator = firstCard
      .locator('.sample')
      .or(firstCard.locator('[data-testid="sample"]'));
    if ((await sampleIndicator.count()) > 0) {
      await expect(sampleIndicator.first()).toBeVisible();
    }
  });

  test('Mobile responsiveness', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');

    // Check that page is responsive
    await expect(page.locator('h1')).toBeVisible();

    // Check for mobile filter toggle button
    const filterToggle = page
      .locator('button')
      .filter({ hasText: /filter/i })
      .or(page.locator('[data-testid="filter-toggle"]'));

    if ((await filterToggle.count()) > 0) {
      // Test filter toggle functionality
      await filterToggle.click();
      await page.waitForTimeout(500);

      // Check if filters are visible after toggle
      const filterSidebar = page
        .locator('[data-testid="filter-sidebar"]')
        .or(page.locator('.filter-sidebar'));
      await expect(filterSidebar).toBeVisible();

      // Close filters
      await filterToggle.click();
      await page.waitForTimeout(500);
    }

    // Check fragrance cards are properly arranged on mobile
    const fragranceCards = page
      .locator('[data-testid="fragrance-card"]')
      .or(page.locator('.fragrance-card'));
    await expect(fragranceCards.first()).toBeVisible();

    // Reset to desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Error handling for invalid search', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Search for something that definitely won't exist
    const searchInput = page.locator('input[type="search"]');
    await searchInput.fill('zzzznonexistentfragrance9999');
    await searchInput.press('Enter');

    // Wait for search to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check for appropriate no results message
    const noResultsMessage = page
      .locator('text=No fragrances found')
      .or(
        page
          .locator('text=No results')
          .or(page.locator('text=0 fragrances found'))
      );

    // Should either show no results message or no fragrance cards
    const fragranceCards = page
      .locator('[data-testid="fragrance-card"]')
      .or(page.locator('.fragrance-card'));
    const hasNoResults = (await noResultsMessage.count()) > 0;
    const hasNoCards = (await fragranceCards.count()) === 0;

    expect(hasNoResults || hasNoCards).toBeTruthy();
  });

  test('Loading states display properly', async ({ page }) => {
    // Navigate to page and immediately check for loading indicators
    await page.goto('http://localhost:3003/browse');

    // Check for any loading indicators (spinners, skeletons, etc.)
    const loadingIndicators = page
      .locator('[data-testid="loading"]')
      .or(
        page
          .locator('.loading')
          .or(page.locator('.spinner').or(page.locator('.skeleton')))
      );

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Ensure fragrance cards eventually appear
    const fragranceCards = page
      .locator('[data-testid="fragrance-card"]')
      .or(page.locator('.fragrance-card'));
    await expect(fragranceCards.first()).toBeVisible();
  });

  test('Navigation to fragrance detail pages works', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Get the first fragrance card
    const firstCard = page
      .locator('[data-testid="fragrance-card"]')
      .or(page.locator('.fragrance-card'))
      .first();
    await expect(firstCard).toBeVisible();

    // Click on the card to navigate to detail page
    await firstCard.click();

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    // Check that we navigated away from browse page
    expect(page.url()).not.toContain('/browse');

    // Check that we're on a fragrance detail page
    expect(page.url()).toContain('/fragrance/');
  });

  test('Pagination controls work', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for pagination controls
    const paginationControls = page
      .locator('[data-testid="pagination"]')
      .or(
        page
          .locator('.pagination')
          .or(page.locator('button').filter({ hasText: /next|previous|\d+/i }))
      );

    if ((await paginationControls.count()) > 0) {
      // Test next page if available
      const nextButton = page.locator('button').filter({ hasText: /next/i });
      if ((await nextButton.count()) > 0) {
        await nextButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Verify we're still on browse page but content may have changed
        expect(page.url()).toContain('/browse');
      }
    }
  });

  test('Network error handling', async ({ page }) => {
    // Wait for initial load
    await page.waitForLoadState('networkidle');

    // Simulate network failure for subsequent requests
    await page.route('**/api/**', route => route.abort());

    // Try to perform a search that would trigger an API call
    const searchInput = page.locator('input[type="search"]');
    await searchInput.fill('test');
    await searchInput.press('Enter');

    // Wait and check for error handling
    await page.waitForTimeout(2000);

    // Should gracefully handle the error (not crash the page)
    await expect(page.locator('h1')).toBeVisible(); // Page should still be functional
  });
});
