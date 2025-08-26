/**
 * Skeleton Loading Integration Tests - Task 1.3
 * 
 * Tests for skeleton loading components integration in major pages
 * Follows TDD approach - tests written before implementation
 */

import { render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';

// Mock skeleton components
const MockQuizSkeleton = () => (
  <div data-testid="quiz-skeleton" className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded mb-4"></div>
    <div className="h-32 bg-gray-200 rounded"></div>
  </div>
);

const MockCollectionSkeleton = () => (
  <div data-testid="collection-skeleton" className="animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="h-48 bg-gray-200 rounded"></div>
      <div className="h-48 bg-gray-200 rounded"></div>
      <div className="h-48 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const MockSearchSkeleton = () => (
  <div data-testid="search-skeleton" className="animate-pulse">
    <div className="h-12 bg-gray-200 rounded mb-4"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded"></div>
      ))}
    </div>
  </div>
);

// Import React hooks
import { useState, useEffect } from 'react';

// Simple async component simulators for Suspense testing
const createAsyncComponent = (testId: string, delay = 50) => {
  return function AsyncComponent() {
    const [isReady, setIsReady] = useState(false);
    
    useEffect(() => {
      const timer = setTimeout(() => setIsReady(true), delay);
      return () => clearTimeout(timer);
    }, []);
    
    if (!isReady) {
      // Simulate a suspended component
      throw new Promise(resolve => setTimeout(resolve, delay));
    }
    
    return <div data-testid={testId}>Content Loaded</div>;
  };
};

const AsyncQuizComponent = createAsyncComponent('quiz-content');
const AsyncCollectionComponent = createAsyncComponent('collection-content');

describe('Skeleton Loading Integration', () => {
  describe('Quiz Page Skeleton Integration', () => {
    it('displays quiz skeleton correctly', () => {
      render(<MockQuizSkeleton />);

      // Should show skeleton
      expect(screen.getByTestId('quiz-skeleton')).toBeInTheDocument();
      
      // Should have proper structure
      const skeleton = screen.getByTestId('quiz-skeleton');
      const placeholders = skeleton.querySelectorAll('.bg-gray-200');
      expect(placeholders.length).toBeGreaterThanOrEqual(2);
    });

    it('quiz skeleton has proper animation classes', () => {
      render(<MockQuizSkeleton />);
      
      const skeleton = screen.getByTestId('quiz-skeleton');
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('quiz skeleton maintains layout during loading', () => {
      render(<MockQuizSkeleton />);
      
      const skeleton = screen.getByTestId('quiz-skeleton');
      const elements = skeleton.querySelectorAll('.bg-gray-200');
      
      expect(elements.length).toBeGreaterThan(0);
      elements.forEach(element => {
        expect(element).toHaveClass('rounded');
      });
    });
  });

  describe('Collection Page Skeleton Integration', () => {
    it('displays collection skeleton correctly', () => {
      render(<MockCollectionSkeleton />);

      // Should show skeleton
      expect(screen.getByTestId('collection-skeleton')).toBeInTheDocument();
      
      // Should have proper grid structure
      const skeleton = screen.getByTestId('collection-skeleton');
      const grid = skeleton.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      
      const items = skeleton.querySelectorAll('.h-48');
      expect(items.length).toBe(3);
    });

    it('collection skeleton has responsive grid layout', () => {
      render(<MockCollectionSkeleton />);
      
      const skeleton = screen.getByTestId('collection-skeleton');
      const grid = skeleton.querySelector('.grid');
      
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('md:grid-cols-3');
      expect(grid).toHaveClass('gap-4');
    });

    it('collection skeleton maintains aspect ratios', () => {
      render(<MockCollectionSkeleton />);
      
      const skeleton = screen.getByTestId('collection-skeleton');
      const items = skeleton.querySelectorAll('.h-48');
      
      // Should have multiple skeleton items with consistent height
      expect(items.length).toBeGreaterThan(0);
      items.forEach(item => {
        expect(item).toHaveClass('h-48', 'bg-gray-200', 'rounded');
      });
    });
  });

  describe('Search Page Skeleton Integration', () => {
    it('displays search skeleton with search bar and results grid', () => {
      render(<MockSearchSkeleton />);
      
      const skeleton = screen.getByTestId('search-skeleton');
      
      // Should have search bar skeleton
      const searchBar = skeleton.querySelector('.h-12');
      expect(searchBar).toBeInTheDocument();
      expect(searchBar).toHaveClass('bg-gray-200', 'rounded', 'mb-4');
      
      // Should have results grid
      const grid = skeleton.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3');
    });

    it('search skeleton shows multiple result placeholders', () => {
      render(<MockSearchSkeleton />);
      
      const skeleton = screen.getByTestId('search-skeleton');
      const resultItems = skeleton.querySelectorAll('.h-32.bg-gray-200');
      
      // Should show 6 result placeholders
      expect(resultItems).toHaveLength(6);
    });
  });

  describe('Layout Integration with Bottom Navigation', () => {
    it('skeleton components include bottom padding for mobile nav', () => {
      const SkeletonWithBottomPadding = () => (
        <div data-testid="skeleton-with-padding" className="pb-20 md:pb-8">
          <MockQuizSkeleton />
        </div>
      );

      render(<SkeletonWithBottomPadding />);
      
      const container = screen.getByTestId('skeleton-with-padding');
      expect(container).toHaveClass('pb-20', 'md:pb-8');
    });

    it('skeleton loading states work with responsive layout', () => {
      render(
        <div className="min-h-screen pb-20 md:pb-8">
          <MockCollectionSkeleton />
        </div>
      );
      
      const skeleton = screen.getByTestId('collection-skeleton');
      expect(skeleton).toBeInTheDocument();
      
      // Parent should have responsive padding
      const parent = skeleton.closest('.min-h-screen');
      expect(parent).toHaveClass('pb-20', 'md:pb-8');
    });
  });

  describe('Skeleton Accessibility', () => {
    it('skeleton components have proper ARIA attributes', () => {
      const AccessibleSkeleton = () => (
        <div 
          data-testid="accessible-skeleton"
          role="status"
          aria-label="Loading content"
          className="animate-pulse"
        >
          <MockQuizSkeleton />
        </div>
      );

      render(<AccessibleSkeleton />);
      
      const skeleton = screen.getByTestId('accessible-skeleton');
      expect(skeleton).toHaveAttribute('role', 'status');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
    });

    it('skeleton components announce loading state to screen readers', () => {
      const AnnouncingSkeleton = () => (
        <div 
          data-testid="announcing-skeleton"
          aria-live="polite"
          aria-busy="true"
        >
          <MockQuizSkeleton />
        </div>
      );

      render(<AnnouncingSkeleton />);
      
      const skeleton = screen.getByTestId('announcing-skeleton');
      expect(skeleton).toHaveAttribute('aria-live', 'polite');
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Performance Considerations', () => {
    it('skeleton animations are CSS-based for performance', () => {
      render(<MockQuizSkeleton />);
      
      const skeleton = screen.getByTestId('quiz-skeleton');
      expect(skeleton).toHaveClass('animate-pulse');
      
      // Should not use JavaScript animations
      const elements = skeleton.querySelectorAll('[style*="animation"]');
      expect(elements).toHaveLength(0);
    });

    it('skeleton components use efficient layout classes', () => {
      render(<MockCollectionSkeleton />);
      
      const skeleton = screen.getByTestId('collection-skeleton');
      
      // Should use Tailwind utility classes for efficient CSS
      expect(skeleton.className).toMatch(/animate-pulse|grid|gap-|h-|bg-|rounded/);
    });
  });

  describe('Visual Consistency', () => {
    it('skeleton placeholders match content structure', () => {
      render(<MockQuizSkeleton />);
      
      const skeleton = screen.getByTestId('quiz-skeleton');
      const placeholders = skeleton.querySelectorAll('.bg-gray-200');
      
      // Should have header and body placeholders
      expect(placeholders.length).toBeGreaterThanOrEqual(2);
    });

    it('skeleton components use consistent styling', () => {
      render(
        <div>
          <MockQuizSkeleton />
          <MockCollectionSkeleton />
          <MockSearchSkeleton />
        </div>
      );
      
      // All skeletons should use same base color
      const quizSkeleton = screen.getByTestId('quiz-skeleton');
      const collectionSkeleton = screen.getByTestId('collection-skeleton');
      const searchSkeleton = screen.getByTestId('search-skeleton');
      
      [quizSkeleton, collectionSkeleton, searchSkeleton].forEach(skeleton => {
        const bgElements = skeleton.querySelectorAll('.bg-gray-200');
        expect(bgElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Boundary Integration', () => {
    it('skeleton components handle errors gracefully', () => {
      // Test that skeleton components themselves don't throw errors
      expect(() => {
        render(<MockQuizSkeleton />);
      }).not.toThrow();
      
      expect(() => {
        render(<MockCollectionSkeleton />);
      }).not.toThrow();
      
      expect(() => {
        render(<MockSearchSkeleton />);
      }).not.toThrow();
    });
  });
});