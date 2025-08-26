'use client';

import * as React from 'react';
import { useScreenReaderAnnouncement, useCommonAnnouncements } from '@/components/accessibility/screen-reader-announcements';

interface FocusManagementOptions {
  restoreOnUnmount?: boolean;
  preventScroll?: boolean;
}

interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
  onTab?: (shiftKey: boolean) => void;
}

/**
 * Comprehensive accessibility hook providing focus management,
 * keyboard navigation, and screen reader utilities
 */
export function useAccessibility() {
  const announceToScreenReader = useScreenReaderAnnouncement();
  const announcements = useCommonAnnouncements();
  
  // Track previous focus for restoration
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  /**
   * Focus management utilities
   */
  const focusManagement = React.useMemo(() => ({
    /**
     * Sets focus to an element with optional configuration
     */
    setFocus: (element: HTMLElement | null, options: FocusManagementOptions = {}) => {
      if (!element) return;
      
      // Store previous focus if restoreOnUnmount is enabled
      if (options.restoreOnUnmount && document.activeElement instanceof HTMLElement) {
        previousFocusRef.current = document.activeElement;
      }
      
      // Set focus
      element.focus({ preventScroll: options.preventScroll });
      
      return () => {
        // Cleanup function to restore focus if needed
        if (options.restoreOnUnmount && previousFocusRef.current) {
          previousFocusRef.current.focus();
          previousFocusRef.current = null;
        }
      };
    },

    /**
     * Sets focus to the first focusable element within a container
     */
    focusFirst: (container: HTMLElement, options: FocusManagementOptions = {}) => {
      const focusableElement = getFocusableElements(container)[0];
      return focusManagement.setFocus(focusableElement, options);
    },

    /**
     * Sets focus to the last focusable element within a container
     */
    focusLast: (container: HTMLElement, options: FocusManagementOptions = {}) => {
      const focusableElements = getFocusableElements(container);
      const lastElement = focusableElements[focusableElements.length - 1];
      return focusManagement.setFocus(lastElement, options);
    },

    /**
     * Traps focus within a container (for modals, dialogs)
     */
    trapFocus: (container: HTMLElement) => {
      const focusableElements = getFocusableElements(container);
      if (focusableElements.length === 0) return () => {};

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Tab') return;

        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      };

      // Focus the first element initially
      firstElement.focus();
      
      // Add event listener
      document.addEventListener('keydown', handleKeyDown);

      // Return cleanup function
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    },

    /**
     * Restores focus to the previously focused element
     */
    restoreFocus: () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    },
  }), []);

  /**
   * Keyboard navigation handler
   */
  const handleKeyboardNavigation = React.useCallback((
    event: React.KeyboardEvent,
    options: KeyboardNavigationOptions = {}
  ) => {
    const { key, shiftKey } = event;

    switch (key) {
      case 'Escape':
        if (options.onEscape) {
          event.preventDefault();
          options.onEscape();
        }
        break;

      case 'Enter':
        if (options.onEnter) {
          event.preventDefault();
          options.onEnter();
        }
        break;

      case 'ArrowUp':
        if (options.onArrowUp) {
          event.preventDefault();
          options.onArrowUp();
        }
        break;

      case 'ArrowDown':
        if (options.onArrowDown) {
          event.preventDefault();
          options.onArrowDown();
        }
        break;

      case 'ArrowLeft':
        if (options.onArrowLeft) {
          event.preventDefault();
          options.onArrowLeft();
        }
        break;

      case 'ArrowRight':
        if (options.onArrowRight) {
          event.preventDefault();
          options.onArrowRight();
        }
        break;

      case 'Home':
        if (options.onHome) {
          event.preventDefault();
          options.onHome();
        }
        break;

      case 'End':
        if (options.onEnd) {
          event.preventDefault();
          options.onEnd();
        }
        break;

      case 'Tab':
        if (options.onTab) {
          options.onTab(shiftKey);
        }
        break;

      default:
        break;
    }
  }, []);

  /**
   * High contrast mode detection
   */
  const [isHighContrast, setIsHighContrast] = React.useState(false);
  
  React.useEffect(() => {
    const checkHighContrast = () => {
      const mediaQuery = window.matchMedia('(prefers-contrast: high)');
      setIsHighContrast(mediaQuery.matches);
    };

    checkHighContrast();
    
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    const handleChange = () => checkHighContrast();
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  /**
   * Reduced motion detection
   */
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  
  React.useEffect(() => {
    const checkReducedMotion = () => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
    };

    checkReducedMotion();
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => checkReducedMotion();
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return {
    // Focus management
    focusManagement,
    
    // Keyboard navigation
    handleKeyboardNavigation,
    
    // Screen reader announcements
    announceToScreenReader,
    announcements,
    
    // Accessibility preferences
    isHighContrast,
    prefersReducedMotion,
    
    // Utility functions
    getFocusableElements: (container: HTMLElement) => getFocusableElements(container),
    isElementVisible: (element: HTMLElement) => isElementVisible(element),
  };
}

/**
 * Gets all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
    'details summary',
  ].join(',');

  const elements = container.querySelectorAll(focusableSelectors) as NodeListOf<HTMLElement>;
  
  return Array.from(elements).filter(element => {
    return isElementVisible(element) && !element.hasAttribute('disabled');
  });
}

/**
 * Checks if an element is visible (not hidden or off-screen)
 */
function isElementVisible(element: HTMLElement): boolean {
  if (!element || element.offsetParent === null) return false;
  
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    style.opacity !== '0'
  );
}

/**
 * Hook for managing roving tabindex pattern (common in lists, menus, etc.)
 */
export function useRovingTabindex(
  items: HTMLElement[],
  currentIndex: number,
  onIndexChange: (index: number) => void
) {
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    if (items.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        onIndexChange((currentIndex + 1) % items.length);
        break;

      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        onIndexChange((currentIndex - 1 + items.length) % items.length);
        break;

      case 'Home':
        event.preventDefault();
        onIndexChange(0);
        break;

      case 'End':
        event.preventDefault();
        onIndexChange(items.length - 1);
        break;

      default:
        break;
    }
  }, [items, currentIndex, onIndexChange]);

  // Update tabindex values
  React.useEffect(() => {
    items.forEach((item, index) => {
      item.tabIndex = index === currentIndex ? 0 : -1;
    });

    // Focus current item
    if (items[currentIndex]) {
      items[currentIndex].focus();
    }
  }, [items, currentIndex]);

  return { handleKeyDown };
}