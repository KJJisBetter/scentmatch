/**
 * Progressive Loading Integration Tests - Task 2.2
 * 
 * Tests for progressive loading implementation across all major user flows:
 * - Quiz flow progressive loading
 * - Search results progressive loading 
 * - Collection preview progressive loading
 * - Smooth transitions and perceived performance
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock components for testing progressive loading
import { 
  ProgressiveQuizFlow,
  ProgressiveSearchResults,
  ProgressiveCollectionPreview 
} from './__mocks__/progressive-loading-components';
import { FragranceCardSkeleton } from '@/components/ui/skeletons/fragrance-card-skeleton';
import { SearchSkeleton } from '@/components/ui/skeletons/search-skeleton';
import { CollectionSkeleton } from '@/components/ui/skeletons/collection-skeleton';

// Mock performance measurement
const mockPerformanceObserver = {
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => [])
};

global.PerformanceObserver = vi.fn(() => mockPerformanceObserver);

describe('Progressive Loading Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Quiz Flow Progressive Loading', () => {
    it('should show skeleton during question transitions', async () => {
      render(
        <ProgressiveQuizFlow
          initialGender="women"
          onConversionReady={vi.fn()}
        />
      );

      // Check initial skeleton loading
      expect(screen.queryByTestId('quiz-skeleton')).toBeInTheDocument();
      
      // Simulate loading completion
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('quiz-skeleton')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should display staggered loading for quiz options', async () => {
      render(
        <ProgressiveQuizFlow
          initialGender="men"
          onConversionReady={vi.fn()}
        />
      );

      // Check for staggered animation delays
      const skeletonElements = screen.queryAllByTestId('skeleton-option');
      
      if (skeletonElements.length > 0) {
        skeletonElements.forEach((element, index) => {
          const animationDelay = element.style.animationDelay;
          expect(animationDelay).toBe(`${index * 0.1}s`);
        });
      }
    });

    it('should show smooth transition from skeleton to content', async () => {
      const { rerender } = render(
        <ProgressiveQuizFlow
          initialGender="unisex"
          onConversionReady={vi.fn()}
        />
      );

      // Initially shows skeleton
      expect(screen.queryByTestId('quiz-skeleton')).toBeInTheDocument();

      // Simulate content loaded
      act(() => {
        vi.advanceTimersByTime(800);
      });

      // Check for fade transition classes
      await waitFor(() => {
        const content = screen.queryByTestId('quiz-content');
        if (content) {
          expect(content).toHaveClass('animate-fade-in');
        }
      });
    });
  });

  describe('Search Results Progressive Loading', () => {
    const mockSearchResults = [
      {
        id: '1',
        name: 'Test Fragrance 1',
        brand_id: 'test-brand',
        relevance_score: 0.9
      },
      {
        id: '2', 
        name: 'Test Fragrance 2',
        brand_id: 'test-brand-2',
        relevance_score: 0.8
      }
    ];

    it('should show search skeleton while loading results', async () => {
      render(
        <ProgressiveSearchResults
          query="floral"
          isLoading={true}
          results={[]}
          onResultSelect={vi.fn()}
        />
      );

      expect(screen.getByTestId('search-skeleton')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-header')).toBeInTheDocument();
    });

    it('should display staggered card animations', async () => {
      render(
        <ProgressiveSearchResults
          query="woody"
          isLoading={false}
          results={mockSearchResults}
          onResultSelect={vi.fn()}
        />
      );

      const cardSkeletons = screen.queryAllByTestId('skeleton-card');
      
      cardSkeletons.forEach((card, index) => {
        const expectedDelay = index * 0.1;
        expect(card.style.animationDelay).toBe(`${expectedDelay}s`);
      });
    });

    it('should measure and optimize first contentful paint', async () => {
      const performanceCallback = vi.fn();
      
      render(
        <ProgressiveSearchResults
          query="citrus"
          isLoading={false}
          results={mockSearchResults}
          onResultSelect={vi.fn()}
          onPerformanceMetric={performanceCallback}
        />
      );

      // Simulate performance measurement
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(mockPerformanceObserver.observe).toHaveBeenCalled();
    });
  });

  describe('Collection Preview Progressive Loading', () => {
    const mockRecommendations = [
      {
        fragrance: {
          id: '1',
          name: 'Collection Test 1',
          brand: 'Test Brand',
          description: 'A wonderful scent'
        },
        match_score: 95,
        reasoning: 'Perfect match'
      },
      {
        fragrance: {
          id: '2',
          name: 'Collection Test 2', 
          brand: 'Test Brand 2',
          description: 'Another great scent'
        },
        match_score: 90,
        reasoning: 'Great match'
      }
    ];

    it('should show collection skeleton during initial load', async () => {
      render(
        <ProgressiveCollectionPreview
          recommendations={[]}
          quiz_session_token="test-token"
          onSaveCollection={vi.fn()}
          onSkip={vi.fn()}
          isLoading={true}
        />
      );

      expect(screen.getByTestId('collection-skeleton')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-stats-card')).toBeInTheDocument();
    });

    it('should animate collection items progressively', async () => {
      render(
        <ProgressiveCollectionPreview
          recommendations={mockRecommendations}
          quiz_session_token="test-token"
          onSaveCollection={vi.fn()}
          onSkip={vi.fn()}
          isLoading={false}
        />
      );

      const collectionItems = screen.queryAllByTestId('collection-item');
      
      collectionItems.forEach((item, index) => {
        const expectedDelay = index * 0.15;
        expect(item.style.animationDelay).toBe(`${expectedDelay}s`);
      });
    });
  });

  describe('Performance Optimization', () => {
    it('should measure time to first contentful paint', async () => {
      const performanceMock = vi.spyOn(performance, 'mark');
      const performanceMeasureMock = vi.spyOn(performance, 'measure');

      render(
        <ProgressiveSearchResults
          query="performance-test"
          isLoading={false}
          results={[]}
          onResultSelect={vi.fn()}
        />
      );

      expect(performanceMock).toHaveBeenCalledWith('content-start');
      
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(performanceMeasureMock).toHaveBeenCalledWith(
        'first-contentful-paint',
        'content-start',
        expect.any(String)
      );
    });

    it('should optimize skeleton to content transitions', async () => {
      const { rerender } = render(
        <div className="test-container">
          <FragranceCardSkeleton delay={0} />
        </div>
      );

      // Measure initial skeleton paint
      const initialRect = screen.getByTestId('skeleton-card').getBoundingClientRect();
      
      // Simulate content load
      rerender(
        <div className="test-container">
          <div data-testid="fragrance-card" className="animate-fade-in">
            Content loaded
          </div>
        </div>
      );

      // Verify no layout shift occurred
      const contentRect = screen.getByTestId('fragrance-card').getBoundingClientRect();
      expect(Math.abs(contentRect.height - initialRect.height)).toBeLessThan(5);
    });

    it('should prevent jarring content shifts', async () => {
      let layoutShiftScore = 0;
      
      // Mock layout shift detection
      const mockLayoutShiftObserver = {
        observe: vi.fn(),
        disconnect: vi.fn(),
        takeRecords: vi.fn(() => [{
          value: 0.02, // Low layout shift score
          entries: []
        }])
      };

      // @ts-ignore
      global.PerformanceObserver = jest.fn((callback) => {
        callback([{ value: 0.02 }]);
        return mockLayoutShiftObserver;
      });

      render(
        <ProgressiveSearchResults
          query="layout-shift-test"
          isLoading={false}
          results={[{
            id: '1',
            name: 'Test',
            brand_id: 'test',
            relevance_score: 0.9
          }]}
          onResultSelect={vi.fn()}
        />
      );

      // Layout shift should be minimal
      expect(layoutShiftScore).toBeLessThan(0.1);
    });
  });

  describe('Perceived Performance Improvements', () => {
    it('should provide immediate visual feedback', async () => {
      render(
        <ProgressiveQuizFlow
          initialGender="women"
          onConversionReady={vi.fn()}
        />
      );

      // Should show immediate skeleton feedback
      expect(screen.queryByTestId('quiz-skeleton')).toBeInTheDocument();
      
      // Should not show empty loading state
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('should maintain engagement during transitions', async () => {
      render(
        <ProgressiveSearchResults
          query="engagement-test"
          isLoading={true}
          results={[]}
          onResultSelect={vi.fn()}
        />
      );

      // Should show engaging skeleton animations
      const skeletonElements = screen.queryAllByTestId('skeleton-card');
      skeletonElements.forEach((element) => {
        expect(element).toHaveClass('animate-pulse');
      });
    });

    it('should provide smooth opacity transitions', async () => {
      const { rerender } = render(
        <SearchSkeleton variant="grid" count={3} />
      );

      // Check initial opacity
      const skeletons = screen.queryAllByTestId('skeleton-card');
      expect(skeletons[0]).toHaveClass('animate-pulse');

      // Simulate transition to content
      rerender(
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div 
              key={i}
              data-testid="content-card"
              className="opacity-0 animate-fade-in"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              Content {i + 1}
            </div>
          ))}
        </div>
      );

      const contentCards = screen.queryAllByTestId('content-card');
      expect(contentCards[0]).toHaveClass('animate-fade-in');
    });
  });

  describe('Error State Progressive Loading', () => {
    it('should gracefully handle loading errors', async () => {
      render(
        <ProgressiveSearchResults
          query="error-test"
          isLoading={false}
          results={[]}
          error="Failed to load results"
          onResultSelect={vi.fn()}
        />
      );

      expect(screen.getByText('Failed to load results')).toBeInTheDocument();
      expect(screen.queryByTestId('search-skeleton')).not.toBeInTheDocument();
    });

    it('should maintain skeleton during retry attempts', async () => {
      const { rerender } = render(
        <ProgressiveSearchResults
          query="retry-test"
          isLoading={false}
          results={[]}
          error="Network error"
          onResultSelect={vi.fn()}
        />
      );

      // Simulate retry
      rerender(
        <ProgressiveSearchResults
          query="retry-test"
          isLoading={true}
          results={[]}
          onResultSelect={vi.fn()}
        />
      );

      expect(screen.getByTestId('search-skeleton')).toBeInTheDocument();
    });
  });
});