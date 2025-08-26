'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface ScreenReaderContextType {
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
}

const ScreenReaderContext = React.createContext<ScreenReaderContextType | null>(null);

export function useScreenReaderAnnouncement() {
  const context = React.useContext(ScreenReaderContext);
  
  if (!context) {
    // Fallback for components used outside provider
    return (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const liveRegion = document.querySelector(`[aria-live="${priority}"]`) as HTMLElement;
      if (liveRegion) {
        liveRegion.textContent = message;
        setTimeout(() => {
          liveRegion.textContent = '';
        }, 1000);
      }
    };
  }
  
  return context.announceToScreenReader;
}

interface ScreenReaderAnnouncementsProps {
  children?: React.ReactNode;
}

export function ScreenReaderAnnouncements({ children }: ScreenReaderAnnouncementsProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Refs for live regions
  const politeRef = React.useRef<HTMLDivElement>(null);
  const assertiveRef = React.useRef<HTMLDivElement>(null);
  
  // Timeout refs for clearing messages
  const politeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const assertiveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const announceToScreenReader = React.useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    const isPolite = priority === 'polite';
    const ref = isPolite ? politeRef : assertiveRef;
    const timeoutRef = isPolite ? politeTimeoutRef : assertiveTimeoutRef;
    
    if (ref.current) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set the message
      ref.current.textContent = message;
      
      // Clear the message after a delay to allow screen readers to announce it
      timeoutRef.current = setTimeout(() => {
        if (ref.current) {
          ref.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  // Announce route changes
  React.useEffect(() => {
    const getPageTitle = (path: string): string => {
      switch (path) {
        case '/':
          return 'Home page';
        case '/search':
          return 'Search fragrances page';
        case '/quiz':
          return 'Fragrance quiz page';
        case '/collection':
        case '/dashboard/collection':
          return 'My collections page';
        case '/profile':
          return 'Profile page';
        default:
          return 'Page';
      }
    };

    const pageTitle = getPageTitle(pathname);
    const message = `${pageTitle} loaded`;
    
    // Delay announcement to ensure page is fully loaded
    const timeoutId = setTimeout(() => {
      announceToScreenReader(message, 'polite');
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname, announceToScreenReader]);

  // Announce loading states
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      announceToScreenReader('Loading new page...', 'polite');
    };

    // Listen for browser navigation events
    const handlePopState = () => {
      announceToScreenReader('Navigating to previous page...', 'polite');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [announceToScreenReader]);

  // Clean up timeouts on unmount
  React.useEffect(() => {
    return () => {
      if (politeTimeoutRef.current) {
        clearTimeout(politeTimeoutRef.current);
      }
      if (assertiveTimeoutRef.current) {
        clearTimeout(assertiveTimeoutRef.current);
      }
    };
  }, []);

  const contextValue = React.useMemo(() => ({
    announceToScreenReader,
  }), [announceToScreenReader]);

  return (
    <>
      {/* Live regions for screen reader announcements */}
      <div
        ref={politeRef}
        aria-live="polite"
        aria-atomic="true"
        aria-label="Live announcements"
        role="status"
        className="sr-only"
      />
      
      <div
        ref={assertiveRef}
        aria-live="assertive"
        aria-atomic="true"
        aria-label="Important announcements"
        role="alert"
        className="sr-only"
      />

      {children && (
        <ScreenReaderContext.Provider value={contextValue}>
          {children}
        </ScreenReaderContext.Provider>
      )}
    </>
  );
}

// Convenience hook for common announcements
export function useCommonAnnouncements() {
  const announceToScreenReader = useScreenReaderAnnouncement();

  return {
    announceLoading: (entity: string = 'content') => {
      announceToScreenReader(`Loading ${entity}...`, 'polite');
    },
    announceLoaded: (entity: string = 'content') => {
      announceToScreenReader(`${entity} loaded successfully`, 'polite');
    },
    announceError: (message: string) => {
      announceToScreenReader(`Error: ${message}`, 'assertive');
    },
    announceSuccess: (message: string) => {
      announceToScreenReader(`Success: ${message}`, 'polite');
    },
    announceFormError: (fieldName: string, error: string) => {
      announceToScreenReader(`${fieldName} error: ${error}`, 'assertive');
    },
    announceSearchResults: (count: number, query: string) => {
      const message = count === 0 
        ? `No results found for "${query}"`
        : `${count} result${count === 1 ? '' : 's'} found for "${query}"`;
      announceToScreenReader(message, 'polite');
    },
    announceFilterChange: (filterType: string, value: string) => {
      announceToScreenReader(`Filter ${filterType} changed to ${value}`, 'polite');
    },
    announceQuizProgress: (currentQuestion: number, totalQuestions: number) => {
      announceToScreenReader(`Question ${currentQuestion} of ${totalQuestions}`, 'polite');
    },
    announceCollectionAction: (action: string, item: string) => {
      announceToScreenReader(`${action} ${item}`, 'polite');
    },
  };
}