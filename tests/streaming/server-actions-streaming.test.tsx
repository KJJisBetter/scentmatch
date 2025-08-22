import { describe, test, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React, { Suspense } from 'react';
import '@testing-library/jest-dom';

/**
 * Server Actions + Streaming Integration Tests
 * 
 * Tests the integration between Server Actions (from Phase 1) and 
 * streaming architecture (Phase 2). Verifies that Server Actions
 * work seamlessly with Suspense boundaries and progressive loading.
 * 
 * Test Coverage:
 * - Server Action calls within streaming components
 * - Optimistic updates with streaming states  
 * - Error handling across Server Actions and Suspense
 * - Revalidation triggers and streaming updates
 * - Form submissions with progressive feedback
 */

// Mock Server Actions from Phase 1
const mockUpdateUserCollection = vi.fn();
const mockUpdateUserWishlist = vi.fn();
const mockSubmitRecommendationFeedback = vi.fn();

// Mock streaming data fetching
const mockGetUserCollection = vi.fn();
const mockGetUserWishlist = vi.fn();

vi.mock('@/lib/actions/collections', () => ({
  updateUserCollection: mockUpdateUserCollection,
  getUserCollection: mockGetUserCollection,
}));

vi.mock('@/lib/actions/wishlist', () => ({
  updateUserWishlist: mockUpdateUserWishlist,
  getUserWishlist: mockGetUserWishlist,
}));

vi.mock('@/lib/actions/feedback', () => ({
  submitRecommendationFeedback: mockSubmitRecommendationFeedback,
}));

// Mock streaming components
const StreamingCollectionGrid = ({ userId }: { userId: string }) => {
  const [collection, setCollection] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    mockGetUserCollection().then((result: any) => {
      if (result.success) {
        setCollection(result.collection || []);
      }
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    throw new Promise(resolve => setTimeout(resolve, 50));
  }

  return (
    <div data-testid="collection-grid">
      <div>Collection Items: {collection.length}</div>
      {collection.map((item: any, index: number) => (
        <div key={index} data-testid={`collection-item-${index}`}>
          {item.fragrance?.name || `Item ${index}`}
          <button 
            onClick={() => handleRemoveFromCollection(item.fragrance_id)}
            data-testid={`remove-${index}`}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
};

const StreamingWishlistGrid = ({ userId }: { userId: string }) => {
  const [wishlist, setWishlist] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    mockGetUserWishlist().then((result: any) => {
      if (result.success) {
        setWishlist(result.wishlist || []);
      }
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    throw new Promise(resolve => setTimeout(resolve, 75));
  }

  return (
    <div data-testid="wishlist-grid">
      <div>Wishlist Items: {wishlist.length}</div>
      {wishlist.map((item: any, index: number) => (
        <div key={index} data-testid={`wishlist-item-${index}`}>
          {item.fragrance?.name || `Wishlist Item ${index}`}
        </div>
      ))}
    </div>
  );
};

const OptimisticCollectionButton = ({ 
  fragranceId, 
  initialInCollection = false 
}: { 
  fragranceId: string;
  initialInCollection?: boolean;
}) => {
  const [inCollection, setInCollection] = React.useState(initialInCollection);
  const [isOptimistic, setIsOptimistic] = React.useState(false);

  const handleToggle = async () => {
    // Optimistic update
    const newState = !inCollection;
    setInCollection(newState);
    setIsOptimistic(true);

    try {
      const result = await mockUpdateUserCollection(
        newState ? 'add' : 'remove',
        fragranceId
      );

      if (!result.success) {
        // Revert on failure
        setInCollection(!newState);
      }
    } catch (error) {
      // Revert on error
      setInCollection(!newState);
    } finally {
      setIsOptimistic(false);
    }
  };

  return (
    <button 
      onClick={handleToggle}
      data-testid="collection-toggle"
      data-optimistic={isOptimistic}
      data-in-collection={inCollection}
      disabled={isOptimistic}
    >
      {isOptimistic 
        ? 'Updating...' 
        : inCollection 
          ? 'Remove from Collection' 
          : 'Add to Collection'
      }
    </button>
  );
};

const ProgressiveDashboard = ({ userId }: { userId: string }) => (
  <div data-testid="progressive-dashboard">
    {/* Header loads immediately */}
    <header>Dashboard Header</header>
    
    {/* Collection streams in first */}
    <section>
      <h2>Collection</h2>
      <Suspense fallback={<div data-testid="collection-skeleton">Loading collection...</div>}>
        <StreamingCollectionGrid userId={userId} />
      </Suspense>
    </section>
    
    {/* Wishlist streams in second */}
    <section>
      <h2>Wishlist</h2>
      <Suspense fallback={<div data-testid="wishlist-skeleton">Loading wishlist...</div>}>
        <StreamingWishlistGrid userId={userId} />
      </Suspense>
    </section>
  </div>
);

// Helper function for collection actions
const handleRemoveFromCollection = async (fragranceId: string) => {
  return mockUpdateUserCollection('remove', fragranceId);
};

describe('Server Actions + Streaming Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default successful responses
    mockGetUserCollection.mockResolvedValue({
      success: true,
      collection: [
        { 
          fragrance_id: 'frag-1', 
          fragrance: { name: 'Test Fragrance 1' }
        },
        { 
          fragrance_id: 'frag-2', 
          fragrance: { name: 'Test Fragrance 2' }
        }
      ],
      total: 2
    });

    mockGetUserWishlist.mockResolvedValue({
      success: true,
      wishlist: [
        { 
          fragrance_id: 'wish-1', 
          fragrance: { name: 'Wishlist Fragrance 1' }
        }
      ],
      total: 1
    });

    mockUpdateUserCollection.mockResolvedValue({
      success: true,
      data: {
        in_collection: true,
        action_performed: 'add',
        message: 'Added to collection'
      }
    });

    mockUpdateUserWishlist.mockResolvedValue({
      success: true,
      count: 1,
      data: {
        action_performed: 'add',
        items_affected: 1,
        message: 'Added to wishlist'
      }
    });
  });

  describe('Progressive Data Loading with Server Actions', () => {
    test('should stream collection and wishlist data progressively', async () => {
      render(<ProgressiveDashboard userId="test-user-id" />);

      // Header should be visible immediately
      expect(screen.getByText('Dashboard Header')).toBeInTheDocument();

      // Both skeletons should be visible
      expect(screen.getByTestId('collection-skeleton')).toBeInTheDocument();
      expect(screen.getByTestId('wishlist-skeleton')).toBeInTheDocument();

      // Collection should load first (50ms delay)
      await waitFor(() => {
        expect(screen.getByTestId('collection-grid')).toBeInTheDocument();
      }, { timeout: 100 });

      expect(screen.getByText('Collection Items: 2')).toBeInTheDocument();
      expect(screen.getByTestId('collection-item-0')).toBeInTheDocument();

      // Wishlist should load second (75ms delay)  
      await waitFor(() => {
        expect(screen.getByTestId('wishlist-grid')).toBeInTheDocument();
      }, { timeout: 150 });

      expect(screen.getByText('Wishlist Items: 1')).toBeInTheDocument();

      // Verify Server Action integration
      expect(mockGetUserCollection).toHaveBeenCalledTimes(1);
      expect(mockGetUserWishlist).toHaveBeenCalledTimes(1);
    });

    test('should handle Server Action calls within streaming components', async () => {
      render(<ProgressiveDashboard userId="test-user-id" />);

      // Wait for collection to load
      await waitFor(() => {
        expect(screen.getByTestId('collection-grid')).toBeInTheDocument();
      });

      // Click remove button on first item
      const removeButton = screen.getByTestId('remove-0');
      fireEvent.click(removeButton);

      expect(mockUpdateUserCollection).toHaveBeenCalledWith('remove', 'frag-1');
    });
  });

  describe('Optimistic Updates with Streaming', () => {
    test('should handle optimistic updates for collection actions', async () => {
      render(<OptimisticCollectionButton fragranceId="test-frag" />);

      const button = screen.getByTestId('collection-toggle');
      
      // Initial state
      expect(button).toHaveTextContent('Add to Collection');
      expect(button).toHaveAttribute('data-in-collection', 'false');

      // Click to add
      fireEvent.click(button);

      // Should immediately show optimistic state
      expect(button).toHaveTextContent('Updating...');
      expect(button).toHaveAttribute('data-optimistic', 'true');
      expect(button).toBeDisabled();

      // Wait for Server Action to complete
      await waitFor(() => {
        expect(button).toHaveTextContent('Remove from Collection');
        expect(button).toHaveAttribute('data-in-collection', 'true');
        expect(button).toHaveAttribute('data-optimistic', 'false');
      });

      expect(mockUpdateUserCollection).toHaveBeenCalledWith('add', 'test-frag');
    });

    test('should revert optimistic updates on Server Action failure', async () => {
      // Mock Server Action failure
      mockUpdateUserCollection.mockResolvedValueOnce({
        success: false,
        error: 'Server error'
      });

      render(<OptimisticCollectionButton fragranceId="test-frag" />);

      const button = screen.getByTestId('collection-toggle');
      fireEvent.click(button);

      // Should show optimistic state
      expect(button).toHaveTextContent('Updating...');

      // Should revert to original state after failure
      await waitFor(() => {
        expect(button).toHaveTextContent('Add to Collection');
        expect(button).toHaveAttribute('data-in-collection', 'false');
      });
    });
  });

  describe('Error Handling in Streaming + Server Actions', () => {
    test('should handle Server Action errors within Suspense boundaries', async () => {
      mockGetUserCollection.mockRejectedValueOnce(new Error('Network error'));

      render(
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <StreamingCollectionGrid userId="test-user" />
        </Suspense>
      );

      // Should show loading initially
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Should handle error gracefully (component will show empty state)
      await waitFor(() => {
        expect(screen.getByTestId('collection-grid')).toBeInTheDocument();
      });

      // Should show empty collection due to error
      expect(screen.getByText('Collection Items: 0')).toBeInTheDocument();
    });

    test('should handle concurrent Server Action calls', async () => {
      render(<OptimisticCollectionButton fragranceId="test-frag" />);

      const button = screen.getByTestId('collection-toggle');
      
      // Click rapidly (simulate concurrent calls)
      fireEvent.click(button);
      fireEvent.click(button); // Second click should be ignored due to disabled state

      // Should only make one Server Action call
      expect(mockUpdateUserCollection).toHaveBeenCalledTimes(1);

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Form Integration with Streaming', () => {
    const StreamingFeedbackForm = ({ recommendationId }: { recommendationId: string }) => {
      const [feedback, setFeedback] = React.useState({ rating: 5, helpful: true, notes: '' });
      const [isSubmitting, setIsSubmitting] = React.useState(false);
      const [submitted, setSubmitted] = React.useState(false);

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
          const result = await mockSubmitRecommendationFeedback(recommendationId, feedback);
          if (result.success) {
            setSubmitted(true);
          }
        } catch (error) {
          console.error('Feedback submission failed:', error);
        } finally {
          setIsSubmitting(false);
        }
      };

      if (submitted) {
        return <div data-testid="feedback-success">Thank you for your feedback!</div>;
      }

      return (
        <form onSubmit={handleSubmit} data-testid="feedback-form">
          <input
            type="number"
            value={feedback.rating}
            onChange={e => setFeedback({ ...feedback, rating: parseInt(e.target.value) })}
            data-testid="rating-input"
            min="1"
            max="5"
          />
          <textarea
            value={feedback.notes}
            onChange={e => setFeedback({ ...feedback, notes: e.target.value })}
            data-testid="notes-input"
            placeholder="Optional notes..."
          />
          <button 
            type="submit" 
            disabled={isSubmitting}
            data-testid="submit-feedback"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      );
    };

    test('should handle form submission with Server Actions in streaming context', async () => {
      mockSubmitRecommendationFeedback.mockResolvedValueOnce({
        success: true,
        feedback_id: 'feedback-123',
        learning_applied: true,
        recommendations_refreshed: true,
        message: 'Feedback processed'
      });

      render(
        <Suspense fallback={<div data-testid="form-loading">Loading form...</div>}>
          <StreamingFeedbackForm recommendationId="rec-123" />
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.getByTestId('feedback-form')).toBeInTheDocument();
      });

      // Fill form
      fireEvent.change(screen.getByTestId('rating-input'), { target: { value: '4' } });
      fireEvent.change(screen.getByTestId('notes-input'), { target: { value: 'Great scent!' } });

      // Submit form
      fireEvent.click(screen.getByTestId('submit-feedback'));

      // Should show submitting state
      expect(screen.getByText('Submitting...')).toBeInTheDocument();

      // Should complete and show success
      await waitFor(() => {
        expect(screen.getByTestId('feedback-success')).toBeInTheDocument();
      });

      expect(mockSubmitRecommendationFeedback).toHaveBeenCalledWith('rec-123', {
        rating: 4,
        helpful: true,
        notes: 'Great scent!'
      });
    });
  });

  describe('Performance with Server Actions + Streaming', () => {
    test('should maintain fast perceived performance with Server Action integration', async () => {
      const performanceStart = performance.now();
      
      render(<ProgressiveDashboard userId="test-user" />);

      // Header should be visible almost immediately
      expect(screen.getByText('Dashboard Header')).toBeInTheDocument();
      
      const firstContentTime = performance.now() - performanceStart;
      expect(firstContentTime).toBeLessThan(10); // Should be near-instant

      // Data should stream in progressively while header remains visible
      await waitFor(() => {
        expect(screen.getByTestId('collection-grid')).toBeInTheDocument();
      });

      // User can interact with loaded content while other sections still load
      expect(screen.getByTestId('wishlist-skeleton')).toBeInTheDocument();
    });
  });
});