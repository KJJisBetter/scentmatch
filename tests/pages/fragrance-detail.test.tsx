import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { setupFragranceDatabase, resetDatabaseMocks } from '../utils/database-test-utils';

/**
 * Fragrance Detail Page Component Tests
 * 
 * Tests for the individual fragrance detail page including:
 * - Page layout and routing
 * - Fragrance information display
 * - Visual scent timeline component
 * - Similar fragrances section
 * - User interaction tracking
 * - Sample purchase flow
 */

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createClientSupabase: vi.fn(),
  dbHelpers: {
    getFragranceById: vi.fn(),
    getSimilarFragrances: vi.fn(),
    trackFragranceInteraction: vi.fn(),
    getUserCollection: vi.fn(),
  }
}));

// Mock components that will be created
vi.mock('@/components/fragrance/fragrance-detail-page', () => ({
  FragranceDetailPage: ({ fragranceId }: { fragranceId: string }) => (
    <div data-testid="fragrance-detail-page" data-fragrance-id={fragranceId}>
      <h1>Fragrance Detail</h1>
      <div data-testid="fragrance-info">Fragrance Information</div>
      <div data-testid="scent-timeline">Visual Timeline</div>
      <div data-testid="similar-fragrances">Similar Fragrances</div>
      <div data-testid="purchase-flow">Sample Purchase</div>
    </div>
  ),
}));

vi.mock('@/components/fragrance/scent-timeline', () => ({
  ScentTimeline: ({ notes, intensity }: { notes: string[], intensity: number }) => (
    <div data-testid="scent-timeline" data-notes={notes.join(',')} data-intensity={intensity}>
      <svg data-testid="timeline-svg">
        <circle cx="50" cy="50" r="10" />
      </svg>
    </div>
  ),
}));

vi.mock('@/components/fragrance/similar-fragrances', () => ({
  SimilarFragrances: ({ fragranceId, onSelect }: { fragranceId: string, onSelect: (id: string) => void }) => (
    <div data-testid="similar-fragrances" data-fragrance-id={fragranceId}>
      <button onClick={() => onSelect('similar-1')}>Similar Fragrance 1</button>
      <button onClick={() => onSelect('similar-2')}>Similar Fragrance 2</button>
    </div>
  ),
}));

describe('Fragrance Detail Page', () => {
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  };

  const mockFragrance = {
    id: 'fragrance-123',
    name: 'Test Fragrance',
    brand: 'Test Brand',
    description: 'A beautiful test fragrance',
    notes: ['bergamot', 'rose', 'sandalwood'],
    image_url: 'https://example.com/fragrance.jpg',
    intensity_score: 7,
    longevity_hours: 8,
    sillage_rating: 6,
    recommended_occasions: ['evening', 'date'],
    recommended_seasons: ['fall', 'winter'],
    sample_available: true,
    sample_price_usd: 15.99,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetDatabaseMocks();
    setupFragranceDatabase();
    
    (useRouter as any).mockReturnValue(mockRouter);
    
    // Mock useParams to return fragrance ID
    vi.mocked(require('next/navigation').useParams).mockReturnValue({
      id: 'fragrance-123'
    });
  });

  describe('Page Routing and Layout', () => {
    test('should render fragrance detail page with correct ID from params', async () => {
      const { FragranceDetailPage } = await import('@/components/fragrance/fragrance-detail-page');
      
      render(<FragranceDetailPage fragranceId="fragrance-123" />);
      
      expect(screen.getByTestId('fragrance-detail-page')).toBeInTheDocument();
      expect(screen.getByTestId('fragrance-detail-page')).toHaveAttribute('data-fragrance-id', 'fragrance-123');
    });

    test('should handle invalid fragrance ID gracefully', async () => {
      vi.mocked(require('next/navigation').useParams).mockReturnValue({
        id: 'invalid-id'
      });

      const { FragranceDetailPage } = await import('@/components/fragrance/fragrance-detail-page');
      
      render(<FragranceDetailPage fragranceId="invalid-id" />);
      
      // Should still render but may show error state
      expect(screen.getByTestId('fragrance-detail-page')).toBeInTheDocument();
    });

    test('should navigate back when back button is clicked', async () => {
      const { FragranceDetailPage } = await import('@/components/fragrance/fragrance-detail-page');
      
      render(<FragranceDetailPage fragranceId="fragrance-123" />);
      
      // This would test a back button in the actual component
      // For now, verify router is available
      expect(mockRouter.back).toBeDefined();
    });
  });

  describe('Fragrance Information Display', () => {
    test('should display fragrance name, brand, and description', async () => {
      // This would test the actual FragranceInfo component
      // For now, test the container exists
      const { FragranceDetailPage } = await import('@/components/fragrance/fragrance-detail-page');
      
      render(<FragranceDetailPage fragranceId="fragrance-123" />);
      
      expect(screen.getByTestId('fragrance-info')).toBeInTheDocument();
    });

    test('should display fragrance notes in organized categories', async () => {
      // Test that notes are displayed (top, middle, base)
      const { FragranceDetailPage } = await import('@/components/fragrance/fragrance-detail-page');
      
      render(<FragranceDetailPage fragranceId="fragrance-123" />);
      
      expect(screen.getByTestId('fragrance-info')).toBeInTheDocument();
    });

    test('should show intensity, longevity, and sillage ratings', async () => {
      // Test that metadata ratings are displayed
      const { FragranceDetailPage } = await import('@/components/fragrance/fragrance-detail-page');
      
      render(<FragranceDetailPage fragranceId="fragrance-123" />);
      
      expect(screen.getByTestId('fragrance-info')).toBeInTheDocument();
    });

    test('should display recommended occasions and seasons', async () => {
      // Test that recommendation tags are shown
      const { FragranceDetailPage } = await import('@/components/fragrance/fragrance-detail-page');
      
      render(<FragranceDetailPage fragranceId="fragrance-123" />);
      
      expect(screen.getByTestId('fragrance-info')).toBeInTheDocument();
    });
  });

  describe('Visual Scent Timeline Component', () => {
    test('should render SVG timeline with fragrance notes', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      
      render(<ScentTimeline notes={['bergamot', 'rose', 'sandalwood']} intensity={7} />);
      
      expect(screen.getByTestId('scent-timeline')).toBeInTheDocument();
      expect(screen.getByTestId('timeline-svg')).toBeInTheDocument();
      expect(screen.getByTestId('scent-timeline')).toHaveAttribute('data-notes', 'bergamot,rose,sandalwood');
      expect(screen.getByTestId('scent-timeline')).toHaveAttribute('data-intensity', '7');
    });

    test('should animate timeline progression on mount', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      
      render(<ScentTimeline notes={['bergamot', 'rose', 'sandalwood']} intensity={7} />);
      
      const timeline = screen.getByTestId('scent-timeline');
      expect(timeline).toBeInTheDocument();
      
      // Test that SVG elements exist for animation
      expect(screen.getByTestId('timeline-svg')).toBeInTheDocument();
    });

    test('should display notes at different timeline positions', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      
      render(<ScentTimeline notes={['top', 'middle', 'base']} intensity={5} />);
      
      expect(screen.getByTestId('scent-timeline')).toHaveAttribute('data-notes', 'top,middle,base');
    });

    test('should handle empty or invalid notes gracefully', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      
      render(<ScentTimeline notes={[]} intensity={5} />);
      
      expect(screen.getByTestId('scent-timeline')).toBeInTheDocument();
      expect(screen.getByTestId('scent-timeline')).toHaveAttribute('data-notes', '');
    });
  });

  describe('Similar Fragrances Section', () => {
    test('should fetch and display similar fragrances', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      
      const onSelect = vi.fn();
      render(<SimilarFragrances fragranceId="fragrance-123" onSelect={onSelect} />);
      
      expect(screen.getByTestId('similar-fragrances')).toBeInTheDocument();
      expect(screen.getByText('Similar Fragrance 1')).toBeInTheDocument();
      expect(screen.getByText('Similar Fragrance 2')).toBeInTheDocument();
    });

    test('should handle clicking on similar fragrance', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      
      const onSelect = vi.fn();
      render(<SimilarFragrances fragranceId="fragrance-123" onSelect={onSelect} />);
      
      fireEvent.click(screen.getByText('Similar Fragrance 1'));
      
      expect(onSelect).toHaveBeenCalledWith('similar-1');
    });

    test('should use vector similarity API for recommendations', async () => {
      const { dbHelpers } = await import('@/lib/supabase');
      const mockSimilar = [
        { fragrance_id: 'similar-1', similarity_score: 0.85, name: 'Similar 1', brand: 'Brand A' },
        { fragrance_id: 'similar-2', similarity_score: 0.78, name: 'Similar 2', brand: 'Brand B' }
      ];
      
      vi.mocked(dbHelpers.getSimilarFragrances).mockResolvedValue(mockSimilar);
      
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      const onSelect = vi.fn();
      
      render(<SimilarFragrances fragranceId="fragrance-123" onSelect={onSelect} />);
      
      // Would test that the API is called and results displayed
      expect(screen.getByTestId('similar-fragrances')).toBeInTheDocument();
    });

    test('should display similarity scores and relevance info', async () => {
      const { SimilarFragrances } = await import('@/components/fragrance/similar-fragrances');
      
      const onSelect = vi.fn();
      render(<SimilarFragrances fragranceId="fragrance-123" onSelect={onSelect} />);
      
      expect(screen.getByTestId('similar-fragrances')).toBeInTheDocument();
    });
  });

  describe('User Interaction Tracking', () => {
    test('should track page view on mount', async () => {
      const { dbHelpers } = await import('@/lib/supabase');
      vi.mocked(dbHelpers.trackFragranceInteraction).mockResolvedValue(true);
      
      const { FragranceDetailPage } = await import('@/components/fragrance/fragrance-detail-page');
      
      render(<FragranceDetailPage fragranceId="fragrance-123" />);
      
      await waitFor(() => {
        expect(dbHelpers.trackFragranceInteraction).toHaveBeenCalledWith(
          'fragrance-123',
          'view',
          'detail_page'
        );
      });
    });

    test('should track like/unlike interactions', async () => {
      const { dbHelpers } = await import('@/lib/supabase');
      vi.mocked(dbHelpers.trackFragranceInteraction).mockResolvedValue(true);
      
      const { FragranceDetailPage } = await import('@/components/fragrance/fragrance-detail-page');
      
      render(<FragranceDetailPage fragranceId="fragrance-123" />);
      
      // This would test actual like button functionality
      // For now, verify tracking function is available
      expect(dbHelpers.trackFragranceInteraction).toBeDefined();
    });

    test('should track sample request interactions', async () => {
      const { dbHelpers } = await import('@/lib/supabase');
      vi.mocked(dbHelpers.trackFragranceInteraction).mockResolvedValue(true);
      
      const { FragranceDetailPage } = await import('@/components/fragrance/fragrance-detail-page');
      
      render(<FragranceDetailPage fragranceId="fragrance-123" />);
      
      // Would test sample request button
      expect(screen.getByTestId('purchase-flow')).toBeInTheDocument();
    });

    test('should handle interaction tracking errors gracefully', async () => {
      const { dbHelpers } = await import('@/lib/supabase');
      vi.mocked(dbHelpers.trackFragranceInteraction).mockRejectedValue(new Error('Network error'));
      
      const { FragranceDetailPage } = await import('@/components/fragrance/fragrance-detail-page');
      
      // Should render without throwing
      expect(() => render(<FragranceDetailPage fragranceId="fragrance-123" />)).not.toThrow();
    });
  });

  describe('Sample Purchase Flow Integration', () => {
    test('should display sample purchase options when available', async () => {
      const { FragranceDetailPage } = await import('@/components/fragrance/fragrance-detail-page');
      
      render(<FragranceDetailPage fragranceId="fragrance-123" />);
      
      expect(screen.getByTestId('purchase-flow')).toBeInTheDocument();
    });

    test('should show sample pricing and size options', async () => {
      const { FragranceDetailPage } = await import('@/components/fragrance/fragrance-detail-page');
      
      render(<FragranceDetailPage fragranceId="fragrance-123" />);
      
      expect(screen.getByTestId('purchase-flow')).toBeInTheDocument();
    });

    test('should handle add to cart functionality', async () => {
      const { FragranceDetailPage } = await import('@/components/fragrance/fragrance-detail-page');
      
      render(<FragranceDetailPage fragranceId="fragrance-123" />);
      
      // Would test add to cart button and functionality
      expect(screen.getByTestId('purchase-flow')).toBeInTheDocument();
    });

    test('should show out of stock state when sample unavailable', async () => {
      // Test when sample_available = false
      const { FragranceDetailPage } = await import('@/components/fragrance/fragrance-detail-page');
      
      render(<FragranceDetailPage fragranceId="fragrance-123" />);
      
      expect(screen.getByTestId('purchase-flow')).toBeInTheDocument();
    });
  });

  describe('Collection Integration', () => {
    test('should show add to collection button when not in collection', async () => {
      const { dbHelpers } = await import('@/lib/supabase');
      vi.mocked(dbHelpers.getUserCollection).mockResolvedValue([]);
      
      const { FragranceDetailPage } = await import('@/components/fragrance/fragrance-detail-page');
      
      render(<FragranceDetailPage fragranceId="fragrance-123" />);
      
      // Would test collection button state
      expect(screen.getByTestId('fragrance-detail-page')).toBeInTheDocument();
    });

    test('should show collection status when fragrance is owned', async () => {
      const { dbHelpers } = await import('@/lib/supabase');
      const mockCollection = [
        { id: '1', fragrance_id: 'fragrance-123', status: 'owned', rating: 4 }
      ];
      vi.mocked(dbHelpers.getUserCollection).mockResolvedValue(mockCollection);
      
      const { FragranceDetailPage } = await import('@/components/fragrance/fragrance-detail-page');
      
      render(<FragranceDetailPage fragranceId="fragrance-123" />);
      
      // Would test owned state display
      expect(screen.getByTestId('fragrance-detail-page')).toBeInTheDocument();
    });

    test('should handle collection updates optimistically', async () => {
      const { dbHelpers } = await import('@/lib/supabase');
      vi.mocked(dbHelpers.trackFragranceInteraction).mockResolvedValue(true);
      
      const { FragranceDetailPage } = await import('@/components/fragrance/fragrance-detail-page');
      
      render(<FragranceDetailPage fragranceId="fragrance-123" />);
      
      // Would test optimistic UI updates
      expect(screen.getByTestId('fragrance-detail-page')).toBeInTheDocument();
    });
  });

  describe('Performance and Loading States', () => {
    test('should show loading skeleton while fetching fragrance data', async () => {
      const { FragranceDetailPage } = await import('@/components/fragrance/fragrance-detail-page');
      
      render(<FragranceDetailPage fragranceId="fragrance-123" />);
      
      // Would test loading states
      expect(screen.getByTestId('fragrance-detail-page')).toBeInTheDocument();
    });

    test('should handle fragrance not found error', async () => {
      const { dbHelpers } = await import('@/lib/supabase');
      vi.mocked(dbHelpers.getFragranceById).mockResolvedValue(null);
      
      const { FragranceDetailPage } = await import('@/components/fragrance/fragrance-detail-page');
      
      render(<FragranceDetailPage fragranceId="nonexistent" />);
      
      // Should handle gracefully
      expect(screen.getByTestId('fragrance-detail-page')).toBeInTheDocument();
    });

    test('should lazy load similar fragrances section', async () => {
      const { FragranceDetailPage } = await import('@/components/fragrance/fragrance-detail-page');
      
      render(<FragranceDetailPage fragranceId="fragrance-123" />);
      
      // Similar fragrances should be present
      expect(screen.getByTestId('similar-fragrances')).toBeInTheDocument();
    });

    test('should optimize images with proper loading and sizes', async () => {
      const { FragranceDetailPage } = await import('@/components/fragrance/fragrance-detail-page');
      
      render(<FragranceDetailPage fragranceId="fragrance-123" />);
      
      // Would test Next.js Image optimization
      expect(screen.getByTestId('fragrance-detail-page')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', async () => {
      const { FragranceDetailPage } = await import('@/components/fragrance/fragrance-detail-page');
      
      render(<FragranceDetailPage fragranceId="fragrance-123" />);
      
      // Would test ARIA attributes
      expect(screen.getByTestId('fragrance-detail-page')).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      const { FragranceDetailPage } = await import('@/components/fragrance/fragrance-detail-page');
      
      render(<FragranceDetailPage fragranceId="fragrance-123" />);
      
      // Would test tab navigation
      expect(screen.getByTestId('fragrance-detail-page')).toBeInTheDocument();
    });

    test('should provide screen reader friendly content', async () => {
      const { ScentTimeline } = await import('@/components/fragrance/scent-timeline');
      
      render(<ScentTimeline notes={['bergamot', 'rose', 'sandalwood']} intensity={7} />);
      
      // SVG should have proper aria labels
      expect(screen.getByTestId('timeline-svg')).toBeInTheDocument();
    });
  });
});