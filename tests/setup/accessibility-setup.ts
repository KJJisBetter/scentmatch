import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';
import { configure } from '@testing-library/react';
import { expect, beforeEach, afterEach } from 'vitest';

// Configure React Testing Library
configure({
  testIdAttribute: 'data-testid',
  // Increase timeout for accessibility tests
  asyncUtilTimeout: 5000,
});

// Mock Next.js router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  notFound: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia for media queries and accessibility preferences
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => {
    const queries: Record<string, boolean> = {
      '(prefers-reduced-motion: reduce)': false,
      '(prefers-contrast: high)': false,
      '(prefers-color-scheme: dark)': false,
      '(max-width: 768px)': false,
    };

    return {
      matches: queries[query] || false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  }),
});

// Mock navigator.vibrate for haptic feedback
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: vi.fn(),
});

// Mock window.getComputedStyle for CSS testing
const mockGetComputedStyle = (element: Element) => {
  // Default computed style mock
  const defaultStyles: Record<string, string> = {
    display: 'block',
    visibility: 'visible',
    opacity: '1',
    minHeight: '44px',
    minWidth: '44px',
    fontSize: '16px',
    lineHeight: '1.5',
    color: 'rgb(0, 0, 0)',
    backgroundColor: 'rgb(255, 255, 255)',
  };

  // Check for specific classes and adjust styles accordingly
  const classList = element.classList;
  
  if (classList.contains('sr-only')) {
    return {
      ...defaultStyles,
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0',
    };
  }

  if (classList.contains('focus:not-sr-only')) {
    return {
      ...defaultStyles,
      position: 'static',
      width: 'auto',
      height: 'auto',
      padding: '8px 16px',
      margin: '0',
      overflow: 'visible',
      clip: 'auto',
      whiteSpace: 'normal',
    };
  }

  return defaultStyles;
};

Object.defineProperty(window, 'getComputedStyle', {
  value: mockGetComputedStyle,
});

// Mock Element.scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock HTMLElement.focus with proper implementation
HTMLElement.prototype.focus = vi.fn().mockImplementation(function(this: HTMLElement) {
  // Set this element as the active element
  Object.defineProperty(document, 'activeElement', {
    value: this,
    writable: true,
    configurable: true,
  });
});

// Mock HTMLElement.blur
HTMLElement.prototype.blur = vi.fn().mockImplementation(function() {
  // Reset active element to body
  Object.defineProperty(document, 'activeElement', {
    value: document.body,
    writable: true,
    configurable: true,
  });
});

// Mock Canvas API for axe-core
const mockCanvas = {
  getContext: vi.fn().mockReturnValue({
    fillText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 0 }),
    fillRect: vi.fn(),
    getImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(4) }),
  }),
  width: 0,
  height: 0,
};

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: mockCanvas.getContext,
});

// Accessibility testing utilities
export const accessibility = {
  /**
   * Simulates high contrast mode
   */
  enableHighContrast: () => {
    document.documentElement.classList.add('high-contrast');
    
    // Update matchMedia mock for high contrast
    window.matchMedia = vi.fn().mockImplementation((query: string) => {
      return {
        matches: query === '(prefers-contrast: high)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    });
  },

  /**
   * Disables high contrast mode
   */
  disableHighContrast: () => {
    document.documentElement.classList.remove('high-contrast');
    
    // Reset matchMedia mock
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  },

  /**
   * Simulates reduced motion preference
   */
  enableReducedMotion: () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  },

  /**
   * Creates a mock screen reader element for testing announcements
   */
  createScreenReaderMock: () => {
    const politeRegion = document.createElement('div');
    politeRegion.setAttribute('aria-live', 'polite');
    politeRegion.setAttribute('aria-atomic', 'true');
    politeRegion.setAttribute('role', 'status');
    politeRegion.className = 'sr-only';

    const assertiveRegion = document.createElement('div');
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    assertiveRegion.setAttribute('role', 'alert');
    assertiveRegion.className = 'sr-only';

    document.body.appendChild(politeRegion);
    document.body.appendChild(assertiveRegion);

    return { politeRegion, assertiveRegion };
  },

  /**
   * Cleans up accessibility test environment
   */
  cleanup: () => {
    document.documentElement.classList.remove('high-contrast');
    document.querySelectorAll('[aria-live]').forEach(el => el.remove());
    
    // Reset all mocks
    vi.clearAllMocks();
  },
};

// Setup and cleanup for each test
beforeEach(() => {
  // Clear any existing ARIA live regions
  document.querySelectorAll('[aria-live]').forEach(el => el.remove());
  
  // Reset document.activeElement
  if (document.activeElement && document.activeElement !== document.body) {
    (document.activeElement as HTMLElement).blur();
  }
  
  // Clear router mocks
  Object.values(mockRouter).forEach(mock => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      mock.mockClear();
    }
  });
});

afterEach(() => {
  accessibility.cleanup();
});