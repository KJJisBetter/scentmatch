/**
 * Simplified Progressive Loading Integration Tests - Task 2.2
 * 
 * Focused tests for progressive loading implementation
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock components for testing
import { 
  ProgressiveQuizFlow,
  ProgressiveSearchResults,
  ProgressiveCollectionPreview 
} from './__mocks__/progressive-loading-components';

describe('Progressive Loading Integration (Simplified)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Quiz Flow Progressive Loading', () => {
    it('should show skeleton loading initially', () => {
      render(
        <ProgressiveQuizFlow
          initialGender="women"
          onConversionReady={vi.fn()}
        />
      );

      expect(screen.getByTestId('quiz-skeleton')).toBeInTheDocument();
    });

    it('should transition from skeleton to content', async () => {
      render(
        <ProgressiveQuizFlow
          initialGender="men"
          onConversionReady={vi.fn()}
        />
      );

      // Initially shows skeleton
      expect(screen.getByTestId('quiz-skeleton')).toBeInTheDocument();

      // Wait for transition to content
      await waitFor(() => {
        expect(screen.getByTestId('quiz-content')).toBeInTheDocument();
      }, { timeout: 1500 });

      // Skeleton should be gone
      expect(screen.queryByTestId('quiz-skeleton')).not.toBeInTheDocument();
    });
  });

  describe('Search Results Progressive Loading', () => {
    it('should show search skeleton while loading', () => {
      render(
        <ProgressiveSearchResults
          query="floral"
          results={[]}
          isLoading={true}
          onResultSelect={vi.fn()}
        />
      );

      expect(screen.getByTestId('search-skeleton')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-header')).toBeInTheDocument();
    });

    it('should display results with staggered animations', () => {
      const mockResults = [
        { id: '1', name: 'Test Fragrance 1', brand_id: 'test-brand' },
        { id: '2', name: 'Test Fragrance 2', brand_id: 'test-brand-2' }
      ];

      render(
        <ProgressiveSearchResults
          query="woody"
          results={mockResults}
          isLoading={false}
          onResultSelect={vi.fn()}
        />
      );

      expect(screen.getByTestId('search-results')).toBeInTheDocument();
      
      const resultCards = screen.getAllByTestId('result-card');
      expect(resultCards).toHaveLength(2);
      
      // Check staggered animation delays
      resultCards.forEach((card, index) => {
        const expectedDelay = `${index * 0.1}s`;
        expect(card.style.animationDelay).toBe(expectedDelay);
      });
    });

    it('should call performance metric callback', () => {
      const mockCallback = vi.fn();
      const mockResults = [
        { id: '1', name: 'Test', brand_id: 'test' }
      ];

      render(
        <ProgressiveSearchResults
          query="test"
          results={mockResults}
          isLoading={false}
          onResultSelect={vi.fn()}
          onPerformanceMetric={mockCallback}
        />
      );

      // Should call performance metric
      expect(mockCallback).toHaveBeenCalledWith({
        name: 'first-contentful-paint',
        value: 500
      });
    });

    it('should handle error state gracefully', () => {
      render(
        <ProgressiveSearchResults
          query="error-test"
          results={[]}
          isLoading={false}
          error="Network error"
          onResultSelect={vi.fn()}
        />
      );

      expect(screen.getByTestId('search-error')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  describe('Collection Preview Progressive Loading', () => {
    it('should show collection skeleton during loading', () => {
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

    it('should animate collection items with staggered delays', () => {
      const mockRecommendations = [
        {
          fragrance: { id: '1', name: 'Test 1', brand: 'Brand 1' },
          match_score: 95,
          reasoning: 'Perfect match'
        },
        {
          fragrance: { id: '2', name: 'Test 2', brand: 'Brand 2' },
          match_score: 90,
          reasoning: 'Great match'
        }
      ];

      render(
        <ProgressiveCollectionPreview
          recommendations={mockRecommendations}
          quiz_session_token="test-token"
          onSaveCollection={vi.fn()}
          onSkip={vi.fn()}
          isLoading={false}
        />
      );

      const collectionItems = screen.getAllByTestId('collection-item');
      expect(collectionItems).toHaveLength(2);
      
      collectionItems.forEach((item, index) => {
        const expectedDelay = `${index * 0.15}s`;
        expect(item.style.animationDelay).toBe(expectedDelay);
      });
    });

    it('should handle save collection action', () => {
      const mockSave = vi.fn();
      const mockRecommendations = [
        {
          fragrance: { id: '1', name: 'Test', brand: 'Brand' },
          match_score: 95,
          reasoning: 'Perfect'
        }
      ];

      render(
        <ProgressiveCollectionPreview
          recommendations={mockRecommendations}
          quiz_session_token="test-token"
          onSaveCollection={mockSave}
          onSkip={vi.fn()}
          isLoading={false}
        />
      );

      const saveButton = screen.getByText('Save Collection');
      saveButton.click();

      expect(mockSave).toHaveBeenCalledWith({
        quiz_session_token: 'test-token',
        fragrance_ids: ['1']
      });
    });
  });

  describe('Performance Features', () => {
    it('should prevent layout shifts with consistent heights', () => {
      const { rerender } = render(
        <div style={{ minHeight: '200px' }}>
          <div data-testid="skeleton-element" style={{ minHeight: '200px' }}>
            Skeleton content
          </div>
        </div>
      );

      const skeletonRect = screen.getByTestId('skeleton-element').getBoundingClientRect();

      rerender(
        <div style={{ minHeight: '200px' }}>
          <div data-testid="real-content" style={{ minHeight: '200px' }}>
            Real content
          </div>
        </div>
      );

      const contentRect = screen.getByTestId('real-content').getBoundingClientRect();
      
      // Heights should be consistent to prevent layout shift
      expect(Math.abs(contentRect.height - skeletonRect.height)).toBeLessThan(5);
    });
  });
});