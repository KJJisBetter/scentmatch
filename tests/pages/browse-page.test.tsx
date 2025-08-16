/**
 * Test suite for browse page functionality
 * Tests the professional fragrance discovery and search interface
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FragranceBrowseClient } from '@/components/browse/fragrance-browse-client';

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(() => ''),
    has: vi.fn(() => false),
  }),
}));

describe('Browse Page Functionality', () => {
  const mockFragranceData = {
    fragrances: [
      {
        fragrance_id: 1,
        name: 'Chanel No. 5',
        brand: 'Chanel',
        scent_family: 'Floral',
        relevance_score: 0.9,
        description: 'A timeless classic',
        sample_price_usd: 12,
        sample_available: true,
        popularity_score: 95,
      },
      {
        fragrance_id: 2,
        name: 'Dior Sauvage',
        brand: 'Dior',
        scent_family: 'Fresh',
        relevance_score: 0.8,
        description: 'Fresh and masculine',
        sample_price_usd: 15,
        sample_available: true,
        popularity_score: 88,
      }
    ],
    total: 2,
    query: '',
    filters_applied: {
      scent_families: [],
      sample_only: false,
      occasions: [],
      seasons: [],
    },
  };

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
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  describe('Search Results Display', () => {
    it('should display fragrance cards with essential information', async () => {
      render(
        <FragranceBrowseClient 
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{ q: 'chanel' }}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Chanel No. 5')).toBeInTheDocument();
        expect(screen.getByText('Dior Sauvage')).toBeInTheDocument();
      });
      
      // Check essential information is displayed
      expect(screen.getByText('Chanel')).toBeInTheDocument();
      expect(screen.getByText('Dior')).toBeInTheDocument();
      expect(screen.getByText('Floral')).toBeInTheDocument();
      expect(screen.getByText('Fresh')).toBeInTheDocument();
    });

    it('should display price information correctly', async () => {
      render(
        <FragranceBrowseClient 
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{ q: 'fragrance' }}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('$12 sample')).toBeInTheDocument();
        expect(screen.getByText('$15 sample')).toBeInTheDocument();
      });
    });

    it('should display fragrance families', async () => {
      render(
        <FragranceBrowseClient 
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{ q: 'test' }}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Floral')).toBeInTheDocument();
        expect(screen.getByText('Fresh')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Layout', () => {
    it('should render cards in a responsive grid', async () => {
      render(
        <FragranceBrowseClient 
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{ q: 'test' }}
        />
      );
      
      await waitFor(() => {
        const resultsGrid = screen.getByTestId('fragrance-grid');
        expect(resultsGrid).toHaveClass('grid');
        expect(resultsGrid).toHaveClass('md:grid-cols-2');
        expect(resultsGrid).toHaveClass('lg:grid-cols-3');
      });
    });

    it('should display fragrance images with proper alt text', async () => {
      render(
        <FragranceBrowseClient 
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{ q: 'test' }}
        />
      );
      
      await waitFor(() => {
        const chanelImage = screen.getByAltText('Chanel No. 5 fragrance');
        const diorImage = screen.getByAltText('Dior Sauvage fragrance');
        
        expect(chanelImage).toBeInTheDocument();
        expect(diorImage).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should handle search input and form submission', async () => {
      const BrowsePage = (await import('@/app/browse/page')).default;
      
      render(<BrowsePage searchParams={Promise.resolve({})} />);
      
      const searchInput = screen.getByPlaceholderText(/search fragrances/i);
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      expect(searchInput).toBeInTheDocument();
      expect(searchButton).toBeInTheDocument();
      
      fireEvent.change(searchInput, { target: { value: 'vanilla' } });
      expect(searchInput).toHaveValue('vanilla');
    });

    it('should display current search query when present', async () => {
      const BrowsePage = (await import('@/app/browse/page')).default;
      
      render(<BrowsePage searchParams={Promise.resolve({ q: 'rose' })} />);
      
      await waitFor(() => {
        expect(screen.getByText(/searching for.*rose/i)).toBeInTheDocument();
      });
    });

    it('should provide clear search functionality', async () => {
      const BrowsePage = (await import('@/app/browse/page')).default;
      
      render(<BrowsePage searchParams={Promise.resolve({ q: 'vanilla' })} />);
      
      await waitFor(() => {
        const clearLink = screen.getByText(/clear search/i);
        expect(clearLink).toBeInTheDocument();
        expect(clearLink).toHaveAttribute('href', '/browse');
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should display loading skeleton when data is loading', async () => {
      // Mock delayed response
      global.fetch = vi.fn(() =>
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ fragrances: [], total: 0 })
          }), 100)
        )
      ) as any;

      const BrowsePage = (await import('@/app/browse/page')).default;
      
      render(<BrowsePage searchParams={Promise.resolve({ q: 'test' })} />);
      
      // Should show loading state initially
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('should display no results message when search returns empty', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            fragrances: [],
            total: 0,
            page: 1,
            totalPages: 0,
          }),
        })
      ) as any;

      const BrowsePage = (await import('@/app/browse/page')).default;
      
      render(<BrowsePage searchParams={Promise.resolve({ q: 'nonexistent' })} />);
      
      await waitFor(() => {
        expect(screen.getByText(/no fragrances found/i)).toBeInTheDocument();
        expect(screen.getByText(/try different search terms/i)).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        })
      ) as any;

      const BrowsePage = (await import('@/app/browse/page')).default;
      
      render(<BrowsePage searchParams={Promise.resolve({ q: 'error' })} />);
      
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
        expect(screen.getByText(/try again/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering System', () => {
    it('should display filter options when results are present', async () => {
      const BrowsePage = (await import('@/app/browse/page')).default;
      
      render(<BrowsePage searchParams={Promise.resolve({ q: 'test' })} />);
      
      await waitFor(() => {
        expect(screen.getByText(/filter by/i)).toBeInTheDocument();
        expect(screen.getByText(/brand/i)).toBeInTheDocument();
        expect(screen.getByText(/fragrance family/i)).toBeInTheDocument();
        expect(screen.getByText(/price range/i)).toBeInTheDocument();
      });
    });

    it('should allow filtering by brand', async () => {
      const BrowsePage = (await import('@/app/browse/page')).default;
      
      render(<BrowsePage searchParams={Promise.resolve({ q: 'test' })} />);
      
      await waitFor(() => {
        const brandFilter = screen.getByLabelText(/brand/i);
        expect(brandFilter).toBeInTheDocument();
        
        fireEvent.change(brandFilter, { target: { value: 'Chanel' } });
        expect(brandFilter).toHaveValue('Chanel');
      });
    });
  });

  describe('Pagination', () => {
    it('should display pagination when there are multiple pages', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            fragrances: [/* mock fragrances */],
            total: 100,
            page: 1,
            totalPages: 5,
          }),
        })
      ) as any;

      const BrowsePage = (await import('@/app/browse/page')).default;
      
      render(<BrowsePage searchParams={Promise.resolve({ q: 'test' })} />);
      
      await waitFor(() => {
        expect(screen.getByText(/page 1 of 5/i)).toBeInTheDocument();
        expect(screen.getByText(/next/i)).toBeInTheDocument();
      });
    });
  });
});