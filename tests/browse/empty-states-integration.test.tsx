/**
 * Integration tests for empty states on browse page
 * Tests all empty state scenarios in real browse page context
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FragranceBrowseClient } from '@/components/browse/fragrance-browse-client';

// Mock Next.js modules
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(() => ''),
    has: vi.fn(() => false),
  }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Browse Page Empty States Integration', () => {
  const mockFilterOptions = {
    scent_families: [
      { value: 'Floral', label: 'Floral', count: 150 },
      { value: 'Fresh', label: 'Fresh', count: 120 },
    ],
    brands: [
      { value: 'Chanel', label: 'Chanel', count: 25 },
      { value: 'Dior', label: 'Dior', count: 20 },
    ],
    occasions: [],
    seasons: [],
    price_ranges: [
      { min: 0, max: 10, label: 'Under $10', count: 50 },
      { min: 10, max: 20, label: '$10-$20', count: 75 },
    ],
    availability: [
      { value: 'sample_available', label: 'Samples Available', count: 200 },
    ],
    metadata: {
      total_fragrances: 1467,
      samples_available: 200,
      last_updated: new Date().toISOString(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default fetch mock
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        fragrances: [],
        total: 0,
        query: '',
        filters_applied: {
          scent_families: [],
          sample_only: false,
          occasions: [],
          seasons: [],
        },
      }),
    });
  });

  describe('No Search Results State', () => {
    it('should display no results empty state when search returns empty', async () => {
      const emptySearchData = {
        fragrances: [],
        total: 0,
        query: 'nonexistent-fragrance',
        filters_applied: {
          scent_families: [],
          sample_only: false,
          occasions: [],
          seasons: [],
        },
        fallback: false,
      };

      render(
        <FragranceBrowseClient 
          initialFragrances={emptySearchData}
          filterOptions={mockFilterOptions}
          initialParams={{ q: 'nonexistent-fragrance' }}
        />
      );

      expect(screen.getByText('No fragrances found')).toBeInTheDocument();
      expect(screen.getByText('Try different search terms or browse our collection.')).toBeInTheDocument();
      // Clear search button should be available from the search display, not EmptyState
      expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
    });

    it('should handle clear search action in no results state', async () => {
      const emptySearchData = {
        fragrances: [],
        total: 0,
        query: 'test-query',
        filters_applied: {
          scent_families: [],
          sample_only: false,
          occasions: [],
          seasons: [],
        },
        fallback: false,
      };

      render(
        <FragranceBrowseClient 
          initialFragrances={emptySearchData}
          filterOptions={mockFilterOptions}
          initialParams={{ q: 'test-query' }}
        />
      );

      const clearButton = screen.getByRole('button', { name: 'Clear search' });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/browse');
      });
    });
  });

  describe('Loading Error State', () => {
    it('should display error empty state when API fails', async () => {
      const errorData = {
        fragrances: [],
        total: 0,
        query: '',
        filters_applied: {
          scent_families: [],
          sample_only: false,
          occasions: [],
          seasons: [],
        },
        fallback: true,
        message: 'Search temporarily unavailable',
      };

      render(
        <FragranceBrowseClient 
          initialFragrances={errorData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText("We're having trouble loading fragrances right now. Please try again.")).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    });

    it('should handle try again action in error state', async () => {
      const errorData = {
        fragrances: [],
        total: 0,
        query: '',
        filters_applied: {
          scent_families: [],
          sample_only: false,
          occasions: [],
          seasons: [],
        },
        fallback: true,
        message: 'Search temporarily unavailable',
      };

      // Mock window.location.reload
      const mockReload = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });

      render(
        <FragranceBrowseClient 
          initialFragrances={errorData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      const tryAgainButton = screen.getByRole('button', { name: 'Try again' });
      fireEvent.click(tryAgainButton);

      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });

  describe('Initial Browse State', () => {
    it('should display initial browse empty state when no search query', async () => {
      const initialData = {
        fragrances: [],
        total: 0,
        query: '',
        filters_applied: {
          scent_families: [],
          sample_only: false,
          occasions: [],
          seasons: [],
        },
        fallback: false,
      };

      render(
        <FragranceBrowseClient 
          initialFragrances={initialData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      expect(screen.getByText('Start your fragrance discovery')).toBeInTheDocument();
      expect(screen.getByText('Search for fragrances by name, brand, or scent notes to get started.')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should display loading skeleton when fetching results', async () => {
      // Mock fetch with a delayed response to capture loading state
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({
              fragrances: [],
              total: 0,
              query: 'test',
              filters_applied: {
                scent_families: [],
                sample_only: false,
                occasions: [],
                seasons: [],
              },
            }),
          }), 100)
        )
      );

      const loadingData = {
        fragrances: [],
        total: 0,
        query: '',
        filters_applied: {
          scent_families: [],
          sample_only: false,
          occasions: [],
          seasons: [],
        },
        fallback: false,
      };

      render(
        <FragranceBrowseClient 
          initialFragrances={loadingData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      // Trigger a search to show loading state
      const searchInput = screen.getByPlaceholderText(/search fragrances/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.click(searchButton);

      // Should show loading state briefly
      await waitFor(() => {
        expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for empty states', async () => {
      const emptyData = {
        fragrances: [],
        total: 0,
        query: 'test',
        filters_applied: {
          scent_families: [],
          sample_only: false,
          occasions: [],
          seasons: [],
        },
        fallback: false,
      };

      render(
        <FragranceBrowseClient 
          initialFragrances={emptyData}
          filterOptions={mockFilterOptions}
          initialParams={{ q: 'test' }}
        />
      );

      const emptyState = screen.getByRole('status');
      expect(emptyState).toHaveAttribute('aria-live', 'polite');
    });

    it('should have accessible headings in empty states', async () => {
      const emptyData = {
        fragrances: [],
        total: 0,
        query: 'test',
        filters_applied: {
          scent_families: [],
          sample_only: false,
          occasions: [],
          seasons: [],
        },
        fallback: false,
      };

      render(
        <FragranceBrowseClient 
          initialFragrances={emptyData}
          filterOptions={mockFilterOptions}
          initialParams={{ q: 'test' }}
        />
      );

      // Check that there's a heading within the empty state
      const emptyState = screen.getByTestId('empty-state');
      const heading = emptyState.querySelector('h2');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('No fragrances found');
    });
  });

  describe('Responsive Behavior', () => {
    it('should maintain responsive layout in empty states', async () => {
      const emptyData = {
        fragrances: [],
        total: 0,
        query: '',
        filters_applied: {
          scent_families: [],
          sample_only: false,
          occasions: [],
          seasons: [],
        },
        fallback: false,
      };

      render(
        <FragranceBrowseClient 
          initialFragrances={emptyData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      const emptyStateContainer = screen.getByRole('status');
      expect(emptyStateContainer).toHaveClass('text-center', 'py-12');
    });
  });

  describe('Error Recovery', () => {
    it('should handle network errors gracefully', async () => {
      const networkErrorData = {
        fragrances: [],
        total: 0,
        query: '',
        filters_applied: {
          scent_families: [],
          sample_only: false,
          occasions: [],
          seasons: [],
        },
        fallback: true,
        message: 'Network error occurred',
      };

      render(
        <FragranceBrowseClient 
          initialFragrances={networkErrorData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      expect(screen.getByText('Connection error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    });
  });
});