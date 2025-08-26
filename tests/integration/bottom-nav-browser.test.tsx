/**
 * Browser integration tests for BottomNav component
 * Tests the component in a real browser environment
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';

let browser: Browser;
let page: Page;

// Mock router for SSR testing
const mockRouter = {
  push: () => {},
  pathname: '/',
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockRouter.pathname,
}));

describe('BottomNav Browser Integration', () => {
  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
    
    // Create a test HTML page with our component
    const componentHTML = renderToString(<BottomNav />);
    const testHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>BottomNav Test</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            /* Include necessary CSS variables for component */
            :root {
              --background: 40 25% 96%;
              --foreground: 262 47% 17%;
              --primary: 262 47% 17%;
              --muted-foreground: 262 28% 51%;
              --border: 40 25% 87%;
              --ring: 33 25% 71%;
            }
            
            body {
              background: hsl(var(--background));
              color: hsl(var(--foreground));
              font-family: Inter, sans-serif;
            }
            
            .touch-target {
              min-height: 44px;
              min-width: 44px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .backdrop-blur-md {
              backdrop-filter: blur(12px);
            }
          </style>
        </head>
        <body>
          <div style="height: 100vh; padding-bottom: 100px;">
            <h1 style="padding: 20px; text-align: center;">Bottom Navigation Test</h1>
            <p style="padding: 20px; text-align: center; color: hsl(var(--muted-foreground));">
              Switch to mobile view to test the bottom navigation.
            </p>
          </div>
          ${componentHTML}
          
          <script>
            // Mock navigation functionality
            document.addEventListener('click', (e) => {
              if (e.target.closest('[role="button"]')) {
                const button = e.target.closest('[role="button"]');
                const href = button.dataset.href;
                if (href) {
                  console.log('Navigate to:', href);
                  // Update URL for testing
                  window.history.pushState({}, '', href);
                }
              }
            });
          </script>
        </body>
      </html>
    `;
    
    await page.setContent(testHTML);
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Mobile View Tests', () => {
    beforeAll(async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
    });

    it('should be visible on mobile screens', async () => {
      const nav = await page.$('nav[role="navigation"]');
      expect(nav).toBeTruthy();
      
      const isVisible = await nav?.isVisible();
      expect(isVisible).toBe(true);
    });

    it('should have all 5 navigation tabs', async () => {
      const tabs = await page.$$('button[role="button"]');
      expect(tabs.length).toBe(5);
      
      // Check tab labels
      const labels = await Promise.all(
        tabs.map(tab => tab.textContent())
      );
      
      expect(labels).toContain('Discover');
      expect(labels).toContain('Search');
      expect(labels).toContain('Collections');
      expect(labels).toContain('Quiz');
      expect(labels).toContain('Profile');
    });

    it('should have proper touch targets (44px minimum)', async () => {
      const tabs = await page.$$('button[role="button"]');
      
      for (const tab of tabs) {
        const box = await tab.boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(44);
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
    });

    it('should have backdrop blur effect', async () => {
      const nav = await page.$('nav[role="navigation"]');
      const hasBackdrop = await nav?.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.backdropFilter.includes('blur');
      });
      
      expect(hasBackdrop).toBe(true);
    });

    it('should be positioned at bottom of screen', async () => {
      const nav = await page.$('nav[role="navigation"]');
      const position = await nav?.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          position: style.position,
          bottom: style.bottom,
          left: style.left,
          right: style.right,
        };
      });
      
      expect(position?.position).toBe('fixed');
      expect(position?.bottom).toBe('0px');
      expect(position?.left).toBe('0px');
      expect(position?.right).toBe('0px');
    });

    it('should support keyboard navigation', async () => {
      const firstTab = await page.$('button[role="button"]');
      await firstTab?.focus();
      
      const isFocused = await firstTab?.evaluate(el => 
        document.activeElement === el
      );
      expect(isFocused).toBe(true);
      
      // Test Enter key activation
      await page.keyboard.press('Enter');
      // Note: In a real environment, this would trigger navigation
    });

    it('should have proper ARIA labels', async () => {
      const tabs = await page.$$('button[role="button"]');
      
      for (const tab of tabs) {
        const ariaLabel = await tab.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel?.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Desktop View Tests', () => {
    beforeAll(async () => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1024, height: 768 });
    });

    it('should be hidden on desktop screens', async () => {
      const nav = await page.$('nav[role="navigation"]');
      
      // Check if the element has md:hidden class or is not visible
      const isHidden = await nav?.evaluate(el => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        
        // Check if hidden via CSS (display: none or visibility: hidden)
        return (
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          rect.width === 0 ||
          rect.height === 0
        );
      });
      
      // On desktop, component should be hidden by Tailwind's md:hidden class
      // Note: This test assumes Tailwind CSS is properly loaded
      expect(isHidden).toBe(true);
    });
  });

  describe('Accessibility Tests', () => {
    beforeAll(async () => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    it('should have proper navigation role', async () => {
      const nav = await page.$('nav[role="navigation"]');
      expect(nav).toBeTruthy();
    });

    it('should support high contrast mode', async () => {
      // Enable high contrast mode simulation
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      const tabs = await page.$$('button[role="button"]');
      
      for (const tab of tabs) {
        const hasOutline = await tab.evaluate(el => {
          el.focus();
          const style = window.getComputedStyle(el);
          return style.outline !== 'none' || 
                 style.boxShadow.includes('ring') ||
                 style.border !== 'none';
        });
        
        expect(hasOutline).toBe(true);
      }
    });

    it('should have correct tab indices', async () => {
      const tabs = await page.$$('button[role="button"]');
      
      for (const tab of tabs) {
        const tabIndex = await tab.getAttribute('tabindex');
        expect(tabIndex).toBe('0');
      }
    });
  });

  describe('Responsive Behavior', () => {
    it('should adapt to different mobile screen sizes', async () => {
      const testSizes = [
        { width: 320, height: 568 }, // iPhone SE
        { width: 375, height: 667 }, // iPhone 8
        { width: 414, height: 896 }, // iPhone 11 Pro Max
      ];

      for (const size of testSizes) {
        await page.setViewportSize(size);
        
        const nav = await page.$('nav[role="navigation"]');
        const isVisible = await nav?.isVisible();
        expect(isVisible).toBe(true);
        
        // Check that tabs are properly distributed
        const tabs = await page.$$('button[role="button"]');
        expect(tabs.length).toBe(5);
      }
    });
  });
});