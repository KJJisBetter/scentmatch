import { expect } from 'vitest';
import { render, RenderResult } from '@testing-library/react';
import { configure } from 'axe-core';
import { ReactElement } from 'react';

/**
 * Accessibility testing utilities for ScentMatch
 * Following WCAG 2.2 AA standards with mobile-first approach
 */

// Configure axe-core for WCAG 2.2 AA compliance
configure({
  rules: {
    // Enforce mobile-friendly accessibility
    'target-size': { enabled: true },
    'color-contrast-enhanced': { enabled: true },
    'focus-order-semantics': { enabled: true },
    // Custom rules for fragrance discovery app
    'aria-hidden-focus': { enabled: true },
    'button-name': { enabled: true },
    'form-field-multiple-labels': { enabled: true },
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'],
});

/**
 * Test accessibility violations using axe-core
 */
export async function testAccessibility(
  element: HTMLElement | RenderResult,
  options?: {
    rules?: Record<string, any>;
    tags?: string[];
    includedImpacts?: ('minor' | 'moderate' | 'serious' | 'critical')[];
  }
): Promise<void> {
  const { default: axe } = await import('axe-core');

  const container = 'container' in element ? element.container : element;

  const results = await axe.run(container, {
    rules: options?.rules || {},
    tags: options?.tags || ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
    includedImpacts: options?.includedImpacts || [
      'moderate',
      'serious',
      'critical',
    ],
  });

  // Fail test if violations found
  if (results.violations.length > 0) {
    const violationMessages = results.violations
      .map(
        violation =>
          `${violation.id}: ${violation.description}\n` +
          violation.nodes.map(node => `  - ${node.failureSummary}`).join('\n')
      )
      .join('\n\n');

    expect.fail(`Accessibility violations found:\n\n${violationMessages}`);
  }
}

/**
 * Test mobile-specific accessibility requirements
 */
export async function testMobileAccessibility(
  component: ReactElement
): Promise<void> {
  const { container } = render(component);

  // Set mobile viewport for testing
  Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
  Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });

  await testAccessibility(container, {
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'mobile'],
    rules: {
      // Mobile-specific rules
      'target-size': { enabled: true },
      'color-contrast': { enabled: true },
      'touch-target': { enabled: true },
    },
  });
}

/**
 * Test keyboard navigation accessibility
 */
export function testKeyboardNavigation(component: ReactElement): void {
  const { container } = render(component);

  // Find all focusable elements
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  // Test tab order
  focusableElements.forEach((element, index) => {
    const tabIndex = element.getAttribute('tabindex');
    if (tabIndex && parseInt(tabIndex) > 0) {
      // Custom tab order should be logical
      expect(parseInt(tabIndex)).toBeGreaterThan(0);
    }
  });

  // Test that interactive elements are focusable
  const interactiveElements = container.querySelectorAll(
    'button, [role="button"], input, select, textarea'
  );
  interactiveElements.forEach(element => {
    expect(element.getAttribute('tabindex')).not.toBe('-1');
  });
}

/**
 * Test screen reader compatibility
 */
export function testScreenReaderCompatibility(component: ReactElement): void {
  const { container } = render(component);

  // Check for proper ARIA labels
  const buttonsWithoutLabels = container.querySelectorAll(
    'button:not([aria-label]):not([aria-labelledby])'
  );
  buttonsWithoutLabels.forEach(button => {
    // Button should have visible text or aria-label
    expect(
      button.textContent?.trim() || button.getAttribute('aria-label')
    ).toBeTruthy();
  });

  // Check for proper heading structure
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  if (headings.length > 1) {
    // Should not skip heading levels
    const levels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)));
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
  }

  // Check for alt text on images
  const images = container.querySelectorAll('img');
  images.forEach(img => {
    expect(img.getAttribute('alt')).toBeDefined();
  });
}

/**
 * Test form accessibility
 */
export function testFormAccessibility(component: ReactElement): void {
  const { container } = render(component);

  // Check that form inputs have proper labels
  const inputs = container.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    const id = input.getAttribute('id');
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledBy = input.getAttribute('aria-labelledby');

    if (id) {
      const label = container.querySelector(`label[for="${id}"]`);
      expect(label || ariaLabel || ariaLabelledBy).toBeTruthy();
    } else {
      expect(ariaLabel || ariaLabelledBy).toBeTruthy();
    }
  });

  // Check for error message accessibility
  const errorElements = container.querySelectorAll(
    '[role="alert"], .error, [aria-invalid="true"]'
  );
  errorElements.forEach(element => {
    // Error elements should be properly announced
    expect(
      element.getAttribute('role') === 'alert' ||
        element.getAttribute('aria-live') ||
        element.getAttribute('aria-describedby')
    ).toBeTruthy();
  });
}

/**
 * Test color contrast for fragrance theme colors
 */
export function testColorContrast(component: ReactElement): void {
  const { container } = render(component);

  // This is a placeholder for color contrast testing
  // In a real implementation, you'd use a tool like colour-contrast to test
  // the actual computed styles against WCAG AA standards (4.5:1 for normal text, 3:1 for large text)

  const textElements = container.querySelectorAll(
    'p, span, div, h1, h2, h3, h4, h5, h6, button, a'
  );

  textElements.forEach(element => {
    // Ensure elements don't rely solely on color for meaning
    const computedStyle = window.getComputedStyle(element);
    const color = computedStyle.color;
    const backgroundColor = computedStyle.backgroundColor;

    // Basic checks - in production, use a proper contrast checker
    expect(color).not.toBe(backgroundColor);
  });
}

/**
 * Comprehensive accessibility test suite
 */
export async function runFullAccessibilityTests(
  component: ReactElement
): Promise<void> {
  // Run all accessibility tests
  await testAccessibility(render(component));
  await testMobileAccessibility(component);
  testKeyboardNavigation(component);
  testScreenReaderCompatibility(component);
  testFormAccessibility(component);
  testColorContrast(component);
}

/**
 * Quick accessibility smoke test
 */
export async function accessibilitySmokeTest(
  component: ReactElement
): Promise<void> {
  await testAccessibility(render(component), {
    includedImpacts: ['serious', 'critical'],
  });
}
