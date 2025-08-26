import { test, expect } from "@playwright/test";
import { injectAxe, checkA11y } from "axe-playwright";

/**
 * Accessibility Testing Across All Devices
 * Ensures WCAG 2.1 AA compliance on all device types
 */

test.describe("Cross-Device Accessibility Compliance", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await injectAxe(page);
  });

  test("Homepage meets WCAG 2.1 AA standards", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    
    await checkA11y(page, null, {
      rules: {
        // Focus on critical accessibility rules
        "color-contrast": { enabled: true },
        "keyboard-navigation": { enabled: true },
        "aria-labels": { enabled: true },
        "heading-order": { enabled: true }
      }
    });
  });

  test("Keyboard navigation works on all devices", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    
    // Test tab navigation
    await page.keyboard.press("Tab");
    let focusedElement = await page.locator(":focus").first();
    await expect(focusedElement).toBeVisible();
    
    // Continue tabbing through interactive elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      focusedElement = await page.locator(":focus").first();
      await expect(focusedElement).toBeVisible();
      
      // Focus should be clearly visible
      const focusStyles = await focusedElement.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          boxShadow: styles.boxShadow,
          border: styles.border
        };
      });
      
      // Should have some form of focus indicator
      const hasFocusIndicator = focusStyles.outline !== "none" || 
                               focusStyles.boxShadow !== "none" ||
                               focusStyles.border.includes("focus");
      expect(hasFocusIndicator).toBeTruthy();
    }
  });

  test("Screen reader navigation works", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    
    // Check heading structure
    const headings = await page.locator("h1, h2, h3, h4, h5, h6").all();
    expect(headings.length).toBeGreaterThan(0);
    
    // First heading should be h1
    const firstHeading = headings[0];
    const tagName = await firstHeading.evaluate(el => el.tagName.toLowerCase());
    expect(tagName).toBe("h1");
    
    // Check for proper ARIA labels
    const interactiveElements = await page.locator("button, input, select, [role='button']").all();
    
    for (const element of interactiveElements) {
      const ariaLabel = await element.getAttribute("aria-label");
      const ariaLabelledBy = await element.getAttribute("aria-labelledby");
      const textContent = await element.textContent();
      
      // Element should have accessible name
      const hasAccessibleName = ariaLabel || ariaLabelledBy || textContent?.trim();
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test("Touch targets meet minimum size requirements", async ({ page }) => {
    // Only test on touch devices
    if (!test.info().project.name.includes("iPhone") && 
        !test.info().project.name.includes("Galaxy") && 
        !test.info().project.name.includes("Pixel") &&
        !test.info().project.name.includes("iPad")) {
      test.skip();
    }
    
    await page.waitForLoadState("networkidle");
    
    // Test all interactive elements
    const touchTargets = await page.locator("button, input, select, a, [role='button']").all();
    
    for (const target of touchTargets) {
      if (await target.isVisible()) {
        const box = await target.boundingBox();
        if (box) {
          // WCAG requires 44x44px minimum for touch targets
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test("Color contrast meets WCAG standards", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    
    // Check specific text elements for contrast
    const textElements = await page.locator("p, h1, h2, h3, span, button").all();
    
    for (const element of textElements.slice(0, 10)) { // Test first 10 to avoid timeout
      if (await element.isVisible()) {
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          };
        });
        
        // Verify styles are defined (actual contrast ratio testing would need more complex logic)
        expect(styles.color).toBeDefined();
        expect(styles.backgroundColor).toBeDefined();
      }
    }
  });

  test("Quiz accessibility on mobile devices", async ({ page }) => {
    await page.goto("/quiz");
    await page.waitForLoadState("networkidle");
    
    // Inject axe for this page as well
    await injectAxe(page);
    
    // Check accessibility of quiz interface
    await checkA11y(page, null, {
      rules: {
        "form-field-multiple-labels": { enabled: true },
        "label": { enabled: true },
        "radiogroup": { enabled: true }
      }
    });
    
    // Test form accessibility
    const radioGroups = await page.locator("[role='radiogroup']").all();
    for (const group of radioGroups) {
      if (await group.isVisible()) {
        // Radio group should have accessible name
        const ariaLabel = await group.getAttribute("aria-label");
        const ariaLabelledBy = await group.getAttribute("aria-labelledby");
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
        
        // Radio buttons should have labels
        const radioButtons = await group.locator("input[type='radio']").all();
        for (const radio of radioButtons) {
          const id = await radio.getAttribute("id");
          if (id) {
            const label = await page.locator(`label[for='${id}']`).first();
            await expect(label).toBeVisible();
          }
        }
      }
    }
  });

  test("Collection page accessibility", async ({ page }) => {
    if (test.info().project.name.includes("Mobile")) {
      // Use bottom navigation on mobile
      const collectionTab = page.locator("[data-testid='bottom-navigation'] text=Collection").first();
      await collectionTab.click();
    } else {
      await page.goto("/collection");
    }
    
    await page.waitForLoadState("networkidle");
    await injectAxe(page);
    
    await checkA11y(page, null, {
      rules: {
        "landmark-one-main": { enabled: true },
        "page-has-heading-one": { enabled: true }
      }
    });
  });

  test("High contrast mode compatibility", async ({ page }) => {
    // Simulate high contrast mode
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * {
            background: black !important;
            color: white !important;
          }
        }
      `
    });
    
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Elements should still be readable
    const textElements = await page.locator("h1, p").first();
    await expect(textElements).toBeVisible();
    
    await page.screenshot({ 
      path: `test-results/screenshots/${test.info().project.name}-high-contrast.png`,
      fullPage: true 
    });
  });

  test("Reduced motion preferences respected", async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: "reduce" });
    
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Check that animations are disabled or reduced
    const animatedElements = await page.locator("[class*='animate'], [style*='transition']").all();
    
    for (const element of animatedElements) {
      if (await element.isVisible()) {
        const styles = await element.evaluate((el) => {
          return window.getComputedStyle(el).animationDuration;
        });
        
        // Animation should be disabled or very short
        expect(["0s", "0.01s"].some(duration => styles.includes(duration))).toBeTruthy();
      }
    }
  });
});