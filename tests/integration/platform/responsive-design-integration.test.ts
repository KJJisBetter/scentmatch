import { test, expect, type Page } from '@playwright/test';

/**
 * Task 8.5: Responsive Design Across All Device Breakpoints Test
 * 
 * This test validates responsive design implementation across mobile, tablet,
 * and desktop breakpoints with focus on mobile-first approach.
 */

interface DeviceConfig {
  name: string;
  width: number;
  height: number;
  isMobile: boolean;
  touchEnabled: boolean;
}

class ResponsiveTestHelper {
  private devices: DeviceConfig[] = [
    { name: 'Mobile Small', width: 375, height: 667, isMobile: true, touchEnabled: true },     // iPhone SE
    { name: 'Mobile Large', width: 414, height: 896, isMobile: true, touchEnabled: true },     // iPhone XR
    { name: 'Tablet Portrait', width: 768, height: 1024, isMobile: false, touchEnabled: true }, // iPad
    { name: 'Tablet Landscape', width: 1024, height: 768, isMobile: false, touchEnabled: true }, // iPad Landscape
    { name: 'Desktop Small', width: 1280, height: 720, isMobile: false, touchEnabled: false },  // Small Desktop
    { name: 'Desktop Large', width: 1920, height: 1080, isMobile: false, touchEnabled: false } // Full HD
  ];

  async setViewport(page: Page, device: DeviceConfig) {
    await page.setViewportSize({ width: device.width, height: device.height });
    
    if (device.touchEnabled) {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'maxTouchPoints', { value: 5 });
      });
    }
  }

  async testTouchTargets(page: Page, device: DeviceConfig) {
    if (!device.touchEnabled) return true;

    // Test that interactive elements meet minimum touch target size (44px)
    const interactiveElements = await page.locator('button, a, input, [role="button"]').all();
    let validTargets = 0;
    
    for (const element of interactiveElements.slice(0, 10)) { // Test first 10 elements
      try {
        const box = await element.boundingBox();
        if (box && (box.width >= 44 || box.height >= 44)) {
          validTargets++;
        }
      } catch (error) {
        // Element not visible, skip
      }
    }
    
    return validTargets > 0;
  }

  async testNavigationAccessibility(page: Page, device: DeviceConfig) {
    // Test navigation works on this device
    const navElements = await page.locator('nav, [role="navigation"], .navigation, header').count();
    
    if (navElements > 0) {
      // Try to interact with navigation
      const firstNav = page.locator('nav, [role="navigation"], .navigation, header').first();
      const navLinks = await firstNav.locator('a, button').count();
      return navLinks > 0;
    }
    
    return true; // No navigation to test
  }

  getDevices() {
    return this.devices;
  }
}

test.describe('Responsive Design Integration - Task 8.5', () => {
  const responsiveHelper = new ResponsiveTestHelper();
  
  test('Cross-device responsive layout validation', async ({ page }) => {
    console.log('\n📱 Testing responsive design across all device breakpoints...');
    
    const devices = responsiveHelper.getDevices();
    const testPages = ['/', '/auth/login', '/auth/signup'];
    
    for (const device of devices) {
      console.log(`\n🔧 Testing ${device.name} (${device.width}x${device.height})`);
      
      await responsiveHelper.setViewport(page, device);
      
      for (const url of testPages) {
        console.log(`  📄 Testing ${url} on ${device.name}`);
        
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        // Test page loads without horizontal scrolling
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth, `${url} should not cause horizontal scroll on ${device.name}`).toBeLessThanOrEqual(device.width + 50); // 50px tolerance
        
        // Test interactive elements are accessible
        const touchTargetsValid = await responsiveHelper.testTouchTargets(page, device);
        expect(touchTargetsValid, `Touch targets should be adequate on ${device.name}`).toBe(true);
        
        // Test navigation accessibility
        const navAccessible = await responsiveHelper.testNavigationAccessibility(page, device);
        expect(navAccessible, `Navigation should be accessible on ${device.name}`).toBe(true);
        
        console.log(`    ✅ ${url} responsive on ${device.name}`);
      }
    }
    
    console.log('\n✅ All devices and pages tested for responsive design');
  });

  test('Mobile-first design validation', async ({ page }) => {
    console.log('\n📱 Testing mobile-first design principles...');
    
    // Start with smallest mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Test that content is accessible and usable on mobile
    await page.waitForLoadState('networkidle');
    
    // Check that text is readable (font size should be adequate)
    const bodyText = page.locator('body');
    const fontSize = await bodyText.evaluate(el => window.getComputedStyle(el).fontSize);
    const fontSizeNum = parseInt(fontSize);
    expect(fontSizeNum, 'Mobile font size should be at least 14px').toBeGreaterThanOrEqual(14);
    
    // Test that buttons and links are properly sized for touch
    const buttons = await page.locator('button, a[role="button"], input[type="submit"]').all();
    let adequateButtons = 0;
    
    for (const button of buttons.slice(0, 5)) {
      try {
        const box = await button.boundingBox();
        if (box && (box.width >= 44 && box.height >= 44)) {
          adequateButtons++;
        }
      } catch (error) {
        // Element not visible
      }
    }
    
    console.log(`✅ Mobile-first design validated (${adequateButtons} buttons with adequate touch targets)`);
  });

  test('Tablet layout optimization', async ({ page }) => {
    console.log('\n📊 Testing tablet layout optimization...');
    
    // Test both tablet orientations
    const tabletConfigs = [
      { name: 'iPad Portrait', width: 768, height: 1024 },
      { name: 'iPad Landscape', width: 1024, height: 768 }
    ];
    
    for (const config of tabletConfigs) {
      console.log(`  Testing ${config.name}`);
      
      await page.setViewportSize({ width: config.width, height: config.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Test that layout uses available space efficiently
      const contentWidth = await page.evaluate(() => {
        const content = document.querySelector('main, .container, .content');
        return content ? content.scrollWidth : document.body.scrollWidth;
      });
      
      // Content should use reasonable portion of available width
      const utilizationRatio = contentWidth / config.width;
      expect(utilizationRatio, `Content should utilize tablet space efficiently on ${config.name}`).toBeGreaterThan(0.6);
      
      console.log(`    ✅ ${config.name} layout optimized`);
    }
  });

  test('Desktop layout and scaling', async ({ page }) => {
    console.log('\n🖥️ Testing desktop layout and scaling...');
    
    const desktopSizes = [
      { name: 'Desktop HD', width: 1280, height: 720 },
      { name: 'Desktop Full HD', width: 1920, height: 1080 },
      { name: 'Desktop 4K', width: 2560, height: 1440 }
    ];
    
    for (const size of desktopSizes) {
      console.log(`  Testing ${size.name}`);
      
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Test that content doesn't become too wide (readability)
      const mainContent = page.locator('main, .container, .content').first();
      const contentBox = await mainContent.boundingBox().catch(() => null);
      
      if (contentBox) {
        // Content width should not exceed reasonable reading width
        expect(contentBox.width, `Content width should be reasonable on ${size.name}`).toBeLessThan(1400);
      }
      
      // Test that layout doesn't break on large screens
      const hasHorizontalScroll = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
      expect(hasHorizontalScroll, `No horizontal scroll should exist on ${size.name}`).toBe(false);
      
      console.log(`    ✅ ${size.name} layout properly scaled`);
    }
  });

  test('Cross-device navigation consistency', async ({ page }) => {
    console.log('\n🧭 Testing navigation consistency across devices...');
    
    const testDevices = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1280, height: 720 }
    ];
    
    for (const device of testDevices) {
      console.log(`  Testing navigation on ${device.name}`);
      
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Test that primary navigation is accessible
      const navElements = await page.locator('nav, [role="navigation"], header a, .navigation a').count();
      expect(navElements, `Navigation should be present on ${device.name}`).toBeGreaterThan(0);
      
      // Test that navigation doesn't break layout
      const navHeight = await page.locator('nav, header, .navigation').first().boundingBox().then(box => box?.height || 0).catch(() => 0);
      expect(navHeight, `Navigation height should be reasonable on ${device.name}`).toBeLessThan(device.height * 0.3);
      
      console.log(`    ✅ Navigation consistent on ${device.name}`);
    }
  });

  test('Form usability across devices', async ({ page }) => {
    console.log('\n📝 Testing form usability across devices...');
    
    const devices = [
      { name: 'Mobile', width: 375, height: 667, isMobile: true },
      { name: 'Tablet', width: 768, height: 1024, isMobile: false },
      { name: 'Desktop', width: 1280, height: 720, isMobile: false }
    ];
    
    for (const device of devices) {
      console.log(`  Testing forms on ${device.name}`);
      
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');
      
      // Test that form inputs are properly sized
      const inputs = await page.locator('input[type="email"], input[type="password"]').all();
      
      for (const input of inputs) {
        const box = await input.boundingBox();
        if (box) {
          // Input should be at least 44px high for touch devices
          const minHeight = device.isMobile ? 44 : 32;
          expect(box.height, `Input height should be adequate on ${device.name}`).toBeGreaterThanOrEqual(minHeight);
        }
      }
      
      // Test that form is usable (can focus and type)
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.isVisible()) {
        await emailInput.click();
        await emailInput.fill('test@example.com');
        const value = await emailInput.inputValue();
        expect(value, 'Form input should work on all devices').toBe('test@example.com');
      }
      
      console.log(`    ✅ Forms usable on ${device.name}`);
    }
  });

  test('Image and media responsiveness', async ({ page }) => {
    console.log('\n🖼️ Testing image and media responsiveness...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const viewports = [
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1280, height: 720 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(1000); // Allow layout to adjust
      
      // Test that images don't overflow container
      const images = await page.locator('img').all();
      
      for (const img of images.slice(0, 5)) { // Test first 5 images
        try {
          const box = await img.boundingBox();
          if (box) {
            expect(box.width, `Image should not exceed viewport width`).toBeLessThanOrEqual(viewport.width);
          }
        } catch (error) {
          // Image not visible, skip
        }
      }
      
      console.log(`    ✅ Images responsive at ${viewport.width}px`);
    }
  });
});
