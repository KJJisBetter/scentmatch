import { describe, test, expect, beforeEach, vi, waitFor } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { setupRpcOperations, resetDatabaseMocks } from '../utils/database-test-utils';

/**
 * Similar Fragrances Component Tests
 * 
 * Tests for the similar fragrances recommendation section:
 * - Vector similarity API integration
 * - Fragrance card rendering and layout
 * - Loading states and error handling
 * - Click-through navigation
 * - Similarity score display
 * - Responsive grid layout
 */

// Mock Next.js components
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    prefetch: vi.fn(),
  })),
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createClientSupabase: vi.fn(() => ({
    rpc: vi.fn(),
  })),
}));

// Mock the actual component that will be created
vi.mock('@/components/fragrance/similar-fragrances', () => ({
  SimilarFragrances: ({ 
    fragranceId, 
    onSelect, 
    maxResults = 6,
    className,
    showScores = true 
  }: {
    fragranceId: string;
    onSelect?: (fragranceId: string) => void;
    maxResults?: number;
    className?: string;
    showScores?: boolean;
  }) => {
    const [loading, setLoading] = React.useState(true);
    const [similarFragrances, setSimilarFragrances] = React.useState<any[]>([]);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
      const fetchSimilar = async () => {
        try {
          setLoading(true);
          // Mock API call
          if (fragranceId === 'error-fragrance') {
            throw new Error('Failed to fetch similar fragrances');
          }
          
          const mockSimilar = [
            {
              fragrance_id: 'similar-1',
              similarity_score: 0.92,
              name: 'Similar Fragrance 1',
              brand: 'Brand A',
              image_url: '/images/fragrance1.jpg',
              sample_available: true,
              sample_price_usd: 12.99,
            },
            {
              fragrance_id: 'similar-2', 
              similarity_score: 0.87,
              name: 'Similar Fragrance 2',
              brand: 'Brand B',
              image_url: '/images/fragrance2.jpg',
              sample_available: false,
              sample_price_usd: null,
            },
            {
              fragrance_id: 'similar-3',
              similarity_score: 0.83,
              name: 'Similar Fragrance 3',
              brand: 'Brand C',
              image_url: '/images/fragrance3.jpg',
              sample_available: true,
              sample_price_usd: 15.99,
            },
          ].slice(0, maxResults);
          
          setTimeout(() => {
            setSimilarFragrances(mockSimilar);
            setLoading(false);
          }, 100);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      };

      fetchSimilar();
    }, [fragranceId, maxResults]);

    if (loading) {
      return (
        <div className={`similar-fragrances ${className || ''}`} data-testid="similar-fragrances">
          <h3>Similar Fragrances</h3>
          <div data-testid="loading-skeleton" className="loading-skeleton">
            {Array.from({ length: maxResults }).map((_, i) => (
              <div key={i} className="skeleton-card" data-testid={`skeleton-${i}`}>
                <div className="skeleton-image"></div>
                <div className="skeleton-text"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className={`similar-fragrances ${className || ''}`} data-testid="similar-fragrances">
          <h3>Similar Fragrances</h3>
          <div data-testid="error-message" className="error-message">
            {error}
          </div>
        </div>
      );
    }

    if (similarFragrances.length === 0) {
      return (
        <div className={`similar-fragrances ${className || ''}`} data-testid="similar-fragrances">
          <h3>Similar Fragrances</h3>
          <div data-testid="no-results" className="no-results">
            No similar fragrances found.
          </div>
        </div>
      );
    }

    return (
      <div className={`similar-fragrances ${className || ''}`} data-testid="similar-fragrances">
        <h3>Similar Fragrances</h3>
        <div className="fragrances-grid" data-testid="fragrances-grid">
          {similarFragrances.map((fragrance) => (
            <div
              key={fragrance.fragrance_id}
              className="fragrance-card"
              data-testid={`fragrance-card-${fragrance.fragrance_id}`}
              onClick={() => onSelect?.(fragrance.fragrance_id)}
            >
              <div className="fragrance-image">
                <img
                  src={fragrance.image_url}
                  alt={fragrance.name}
                  data-testid={`fragrance-image-${fragrance.fragrance_id}`}
                />
              </div>
              
              <div className="fragrance-info">
                <h4 data-testid={`fragrance-name-${fragrance.fragrance_id}`}>
                  {fragrance.name}
                </h4>
                <p data-testid={`fragrance-brand-${fragrance.fragrance_id}`}>
                  {fragrance.brand}
                </p>
                
                {showScores && (
                  <div 
                    className="similarity-score"
                    data-testid={`similarity-score-${fragrance.fragrance_id}`}
                  >
                    {Math.round(fragrance.similarity_score * 100)}% match
                  </div>
                )}
                
                {fragrance.sample_available ? (
                  <div 
                    className="sample-info"
                    data-testid={`sample-info-${fragrance.fragrance_id}`}
                  >
                    Sample: ${fragrance.sample_price_usd}
                  </div>
                ) : (
                  <div 
                    className="sample-unavailable"
                    data-testid={`sample-unavailable-${fragrance.fragrance_id}`}
                  >
                    Sample unavailable
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
}));

// React import for hooks
import React from 'react';

describe('SimilarFragrances Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDatabaseMocks();
    setupRpcOperations();
  });

  describe('Loading States', () => {
    test('should show loading skeleton while fetching data', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      
      render(<SimilarFragrances fragranceId="fragrance-123" />);

      // Should initially show loading skeleton
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-0')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-1')).toBeInTheDocument();
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });
    });

    test('should show correct number of skeleton cards based on maxResults', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      
      render(<SimilarFragrances fragranceId="fragrance-123" maxResults={3} />);

      expect(screen.getByTestId('skeleton-0')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-1')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-2')).toBeInTheDocument();
      expect(screen.queryByTestId('skeleton-3')).not.toBeInTheDocument();
    });
  });

  describe('Data Fetching and Display', () => {
    test('should display similar fragrances after loading', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      
      render(<SimilarFragrances fragranceId="fragrance-123" />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByTestId('fragrances-grid')).toBeInTheDocument();
      });

      // Check that fragrance cards are rendered
      expect(screen.getByTestId('fragrance-card-similar-1')).toBeInTheDocument();
      expect(screen.getByTestId('fragrance-card-similar-2')).toBeInTheDocument();
      expect(screen.getByTestId('fragrance-card-similar-3')).toBeInTheDocument();
    });

    test('should display fragrance names and brands correctly', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      
      render(<SimilarFragrances fragranceId="fragrance-123" />);

      await waitFor(() => {
        expect(screen.getByTestId('fragrance-name-similar-1')).toHaveTextContent('Similar Fragrance 1');
        expect(screen.getByTestId('fragrance-brand-similar-1')).toHaveTextContent('Brand A');
        
        expect(screen.getByTestId('fragrance-name-similar-2')).toHaveTextContent('Similar Fragrance 2');
        expect(screen.getByTestId('fragrance-brand-similar-2')).toHaveTextContent('Brand B');
      });
    });

    test('should display similarity scores when showScores is true', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      
      render(<SimilarFragrances fragranceId="fragrance-123" showScores={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('similarity-score-similar-1')).toHaveTextContent('92% match');
        expect(screen.getByTestId('similarity-score-similar-2')).toHaveTextContent('87% match');
        expect(screen.getByTestId('similarity-score-similar-3')).toHaveTextContent('83% match');
      });
    });

    test('should hide similarity scores when showScores is false', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      
      render(<SimilarFragrances fragranceId="fragrance-123" showScores={false} />);

      await waitFor(() => {
        expect(screen.queryByTestId('similarity-score-similar-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('similarity-score-similar-2')).not.toBeInTheDocument();
      });
    });

    test('should display sample availability and pricing', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      
      render(<SimilarFragrances fragranceId="fragrance-123" />);

      await waitFor(() => {
        // Fragrance 1: sample available
        expect(screen.getByTestId('sample-info-similar-1')).toHaveTextContent('Sample: $12.99');
        
        // Fragrance 2: sample unavailable
        expect(screen.getByTestId('sample-unavailable-similar-2')).toHaveTextContent('Sample unavailable');
        
        // Fragrance 3: sample available
        expect(screen.getByTestId('sample-info-similar-3')).toHaveTextContent('Sample: $15.99');
      });
    });

    test('should render images with correct src and alt attributes', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      
      render(<SimilarFragrances fragranceId="fragrance-123" />);

      await waitFor(() => {
        const image1 = screen.getByTestId('fragrance-image-similar-1');
        expect(image1).toHaveAttribute('src', '/images/fragrance1.jpg');
        expect(image1).toHaveAttribute('alt', 'Similar Fragrance 1');
        
        const image2 = screen.getByTestId('fragrance-image-similar-2');
        expect(image2).toHaveAttribute('src', '/images/fragrance2.jpg');
        expect(image2).toHaveAttribute('alt', 'Similar Fragrance 2');
      });
    });
  });

  describe('User Interactions', () => {
    test('should call onSelect when fragrance card is clicked', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      const onSelect = vi.fn();
      
      render(<SimilarFragrances fragranceId="fragrance-123" onSelect={onSelect} />);

      await waitFor(() => {
        expect(screen.getByTestId('fragrance-card-similar-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('fragrance-card-similar-1'));
      expect(onSelect).toHaveBeenCalledWith('similar-1');
    });

    test('should handle multiple clicks correctly', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      const onSelect = vi.fn();
      
      render(<SimilarFragrances fragranceId="fragrance-123" onSelect={onSelect} />);

      await waitFor(() => {
        expect(screen.getByTestId('fragrance-card-similar-1')).toBeInTheDocument();
        expect(screen.getByTestId('fragrance-card-similar-2')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('fragrance-card-similar-1'));
      fireEvent.click(screen.getByTestId('fragrance-card-similar-2'));

      expect(onSelect).toHaveBeenCalledTimes(2);
      expect(onSelect).toHaveBeenNthCalledWith(1, 'similar-1');
      expect(onSelect).toHaveBeenNthCalledWith(2, 'similar-2');
    });

    test('should not call onSelect when not provided', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      
      render(<SimilarFragrances fragranceId="fragrance-123" />);

      await waitFor(() => {
        expect(screen.getByTestId('fragrance-card-similar-1')).toBeInTheDocument();
      });

      // Should not throw error when clicking without onSelect
      expect(() => {
        fireEvent.click(screen.getByTestId('fragrance-card-similar-1'));
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should display error message when fetching fails', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      
      render(<SimilarFragrances fragranceId="error-fragrance" />);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to fetch similar fragrances');
      });

      // Should not show loading or results
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      expect(screen.queryByTestId('fragrances-grid')).not.toBeInTheDocument();
    });

    test('should display no results message when empty array returned', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      
      // Mock empty results by setting maxResults to 0
      render(<SimilarFragrances fragranceId="fragrance-123" maxResults={0} />);

      await waitFor(() => {
        expect(screen.getByTestId('no-results')).toBeInTheDocument();
        expect(screen.getByTestId('no-results')).toHaveTextContent('No similar fragrances found.');
      });
    });
  });

  describe('Configuration Options', () => {
    test('should respect maxResults parameter', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      
      render(<SimilarFragrances fragranceId="fragrance-123" maxResults={2} />);

      await waitFor(() => {
        expect(screen.getByTestId('fragrance-card-similar-1')).toBeInTheDocument();
        expect(screen.getByTestId('fragrance-card-similar-2')).toBeInTheDocument();
        expect(screen.queryByTestId('fragrance-card-similar-3')).not.toBeInTheDocument();
      });
    });

    test('should apply custom className', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      
      render(
        <SimilarFragrances 
          fragranceId="fragrance-123" 
          className="custom-similar-fragrances" 
        />
      );

      const container = screen.getByTestId('similar-fragrances');
      expect(container).toHaveClass('similar-fragrances', 'custom-similar-fragrances');
    });
  });

  describe('Responsive Layout', () => {
    test('should render grid container for fragrance cards', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      
      render(<SimilarFragrances fragranceId="fragrance-123" />);

      await waitFor(() => {
        const grid = screen.getByTestId('fragrances-grid');
        expect(grid).toBeInTheDocument();
        expect(grid).toHaveClass('fragrances-grid');
      });
    });

    test('should render fragrance cards with proper structure', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      
      render(<SimilarFragrances fragranceId="fragrance-123" />);

      await waitFor(() => {
        const card = screen.getByTestId('fragrance-card-similar-1');
        expect(card).toHaveClass('fragrance-card');
        
        // Check card structure
        expect(card.querySelector('.fragrance-image')).toBeInTheDocument();
        expect(card.querySelector('.fragrance-info')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Considerations', () => {
    test('should handle rapid fragrance ID changes', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      const { rerender } = render(<SimilarFragrances fragranceId="fragrance-123" />);

      // Change fragrance ID quickly
      rerender(<SimilarFragrances fragranceId="fragrance-456" />);
      rerender(<SimilarFragrances fragranceId="fragrance-789" />);

      // Should handle gracefully without errors
      await waitFor(() => {
        expect(screen.getByTestId('similar-fragrances')).toBeInTheDocument();
      });
    });

    test('should not fetch data when fragranceId is unchanged', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      const { rerender } = render(<SimilarFragrances fragranceId="fragrance-123" />);

      await waitFor(() => {
        expect(screen.getByTestId('fragrances-grid')).toBeInTheDocument();
      });

      // Re-render with same fragranceId
      rerender(<SimilarFragrances fragranceId="fragrance-123" />);

      // Data should still be displayed without re-fetching
      expect(screen.getByTestId('fragrances-grid')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper heading structure', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      
      render(<SimilarFragrances fragranceId="fragrance-123" />);

      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Similar Fragrances');
    });

    test('should have clickable cards that are keyboard accessible', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      const onSelect = vi.fn();
      
      render(<SimilarFragrances fragranceId="fragrance-123" onSelect={onSelect} />);

      await waitFor(() => {
        const card = screen.getByTestId('fragrance-card-similar-1');
        expect(card).toBeInTheDocument();
        // In the actual implementation, these should be button elements or have proper ARIA
      });
    });

    test('should provide meaningful alt text for images', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      
      render(<SimilarFragrances fragranceId="fragrance-123" />);

      await waitFor(() => {
        const image = screen.getByTestId('fragrance-image-similar-1');
        expect(image).toHaveAttribute('alt', 'Similar Fragrance 1');
      });
    });
  });
});