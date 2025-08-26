import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Browser Accessibility Tests - WCAG 2.1 AA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('should pass axe accessibility scan on homepage', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingLevels = await Promise.all(
      headings.map(h => h.evaluate(el => parseInt(el.tagName.charAt(1))))
    );

    // Check that heading hierarchy is logical
    for (let i = 1; i < headingLevels.length; i++) {
      const currentLevel = headingLevels[i];
      const previousLevel = headingLevels[i - 1];
      
      // Heading level shouldn't skip more than one level
      expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
    }

    // Should have exactly one h1
    const h1Count = headingLevels.filter(level => level === 1).length;
    expect(h1Count).toBe(1);
  });

  test('should have skip links that work', async ({ page }) => {
    // Tab to skip link (should be first focusable element)
    await page.keyboard.press('Tab');
    
    const skipLink = page.locator('text="Skip to main content"');
    await expect(skipLink).toBeFocused();
    
    // Activate skip link
    await page.keyboard.press('Enter');
    
    // Main content should now be focused
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('should support keyboard navigation through bottom nav', async ({ page }) => {
    // Navigate to bottom navigation area
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Tab through each navigation item
    const navButtons = page.locator('nav[aria-label="Bottom navigation"] button');
    const buttonCount = await navButtons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = navButtons.nth(i);
      await expect(button).toBeFocused();
      
      // Check that button has proper aria-label
      const ariaLabel = await button.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      
      // Move to next button
      if (i < buttonCount - 1) {
        await page.keyboard.press('Tab');
      }
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('#main-content')
      .analyze();

    const colorContrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );

    expect(colorContrastViolations).toEqual([]);
  });

  test('should support high contrast mode', async ({ page }) => {
    // Enable high contrast mode simulation
    await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
    
    // Check that elements are still visible and accessible
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper focus indicators', async ({ page }) => {
    // Test focus indicators on various interactive elements
    const interactiveElements = [
      'button',
      'a[href]',
      'input',
      '[role="button"]',
    ];

    for (const selector of interactiveElements) {
      const elements = page.locator(selector).first();
      
      if (await elements.count() > 0) {
        await elements.focus();
        
        // Check that element has visible focus indicator
        const element = elements.first();
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el, ':focus-visible');
          return {
            outline: computed.outline,
            outlineWidth: computed.outlineWidth,
            boxShadow: computed.boxShadow,
          };
        });
        
        // Should have some form of focus indicator
        const hasFocusIndicator = (
          styles.outline !== 'none' ||
          styles.outlineWidth !== '0px' ||
          styles.boxShadow !== 'none'
        );
        
        expect(hasFocusIndicator).toBe(true);
      }
    }
  });

  test('should announce dynamic content changes', async ({ page }) => {
    // Create a spy for ARIA live region updates
    await page.evaluate(() => {
      window.ariaAnnouncements = [];
      
      // Monitor all ARIA live regions
      const liveRegions = document.querySelectorAll('[aria-live]');
      
      liveRegions.forEach(region => {
        const observer = new MutationObserver(mutations => {
          mutations.forEach(mutation => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
              const text = (mutation.target as Element).textContent?.trim();
              if (text) {
                (window as any).ariaAnnouncements.push({
                  text,
                  priority: region.getAttribute('aria-live'),
                  timestamp: Date.now(),
                });
              }
            }
          });
        });
        
        observer.observe(region, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      });
    });

    // Trigger a navigation change
    await page.click('button[aria-label*="Search"]');
    
    // Wait for announcement
    await page.waitForTimeout(100);
    
    // Check that announcement was made
    const announcements = await page.evaluate(() => (window as any).ariaAnnouncements);
    expect(announcements.length).toBeGreaterThan(0);
  });

  test('should have proper form labels and error handling', async ({ page }) => {
    // Navigate to search page which has form inputs
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    
    // Check that all form inputs have proper labels
    const inputs = page.locator('input, select, textarea');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      
      // Check for associated label
      const inputId = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      if (inputId) {
        const label = page.locator(`label[for="${inputId}"]`);
        const hasLabel = await label.count() > 0;
        
        const hasAccessibleName = hasLabel || ariaLabel || ariaLabelledBy;
        expect(hasAccessibleName).toBe(true);
      }
    }
  });

  test('should support screen reader navigation landmarks', async ({ page }) => {
    // Check for proper landmark regions
    const landmarks = [
      'main',
      'nav',
      'header',
      'footer',
      '[role="main"]',
      '[role="navigation"]',
      '[role="banner"]',
      '[role="contentinfo"]',
    ];

    const foundLandmarks = [];
    
    for (const landmark of landmarks) {
      const element = page.locator(landmark).first();
      if (await element.count() > 0) {
        foundLandmarks.push(landmark);
      }
    }

    // Should have at least main navigation and main content
    expect(foundLandmarks.some(l => l.includes('main'))).toBe(true);
    expect(foundLandmarks.some(l => l.includes('nav'))).toBe(true);
  });

  test('should handle touch interactions accessibly', async ({ page }) => {
    // Simulate mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Check that touch targets meet minimum size requirements (44x44px)
    const touchTargets = page.locator('button, a[href], input, [role="button"]');
    const count = await touchTargets.count();
    
    for (let i = 0; i < count; i++) {
      const target = touchTargets.nth(i);
      const box = await target.boundingBox();
      
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should work with reduced motion preferences', async ({ page }) => {
    // Enable reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Check that page still functions properly
    await page.click('button[aria-label*="Search"]');
    await page.waitForURL(/search/);
    
    // Verify no accessibility violations with reduced motion
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Keyboard Navigation Patterns', () => {
  test('should support roving tabindex in navigation', async ({ page }) => {
    await page.goto('/');
    
    // Focus navigation area
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const firstNavButton = page.locator('nav button').first();
    await expect(firstNavButton).toBeFocused();
    
    // Arrow key navigation should work within the navigation
    await page.keyboard.press('ArrowRight');
    const secondNavButton = page.locator('nav button').nth(1);
    await expect(secondNavButton).toBeFocused();
  });

  test('should trap focus in modal dialogs', async ({ page }) => {
    await page.goto('/');
    
    // Look for modal trigger (if any)
    const modalTrigger = page.locator('[data-testid*="modal"], [aria-haspopup="dialog"]').first();
    
    if (await modalTrigger.count() > 0) {
      await modalTrigger.click();
      
      // Wait for modal to open
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      
      // Focus should be trapped within modal
      const focusableInModal = page.locator('[role="dialog"] button, [role="dialog"] a, [role="dialog"] input').all();
      const focusableElements = await focusableInModal;
      
      if (focusableElements.length > 1) {
        // Tab through modal elements
        for (let i = 0; i < focusableElements.length; i++) {
          await page.keyboard.press('Tab');
        }
        
        // Should wrap to first element
        await page.keyboard.press('Tab');
        await expect(focusableElements[0]).toBeFocused();
      }
    }
  });

  test('should support Escape key to close overlays', async ({ page }) => {
    await page.goto('/');
    
    // Look for overlay triggers
    const overlayTrigger = page.locator('[aria-haspopup], [data-testid*="menu"]').first();
    
    if (await overlayTrigger.count() > 0) {
      await overlayTrigger.click();
      
      // Wait for overlay to open
      await page.waitForTimeout(100);
      
      // Press Escape
      await page.keyboard.press('Escape');
      
      // Overlay should close
      await page.waitForTimeout(100);
      
      // Focus should return to trigger
      await expect(overlayTrigger).toBeFocused();
    }
  });
});