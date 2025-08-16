/**
 * Browse Page Functionality Tests
 *
 * Comprehensive tests for the browse page including:
 * - Search functionality
 * - Filtering system
 * - Responsive design
 * - Error handling
 * - Loading states
 * - Data integration
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { FragranceBrowseClient } from '@/components/browse/fragrance-browse-client';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock fetch API
global.fetch = vi.fn();

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

describe('Browse Page Functionality', () => {
  const mockFragranceData = {
    fragrances: [
      {
        fragrance_id: 1,
        name: 'Bleu de Chanel',
        brand: 'Chanel',
        scent_family: 'Woody',
        relevance_score: 0.95,
        description: 'A sophisticated woody fragrance',
        sample_price_usd: 12.99,
        sample_available: true,
        popularity_score: 8.5,
      },
      {
        fragrance_id: 2,
        name: 'La Vie Est Belle',
        brand: 'Lancôme',
        scent_family: 'Floral',
        relevance_score: 0.88,
        description: 'An elegant floral composition',
        sample_price_usd: 9.99,
        sample_available: true,
        popularity_score: 7.8,
      },
    ],
    total: 2,
    query: '',
    filters_applied: {
      scent_families: [],
      sample_only: false,
      occasions: [],
      seasons: [],
    },
    fallback: false,
  };

  const mockFilterOptions = {
    scent_families: [
      { value: 'woody', label: 'Woody', count: 450 },
      { value: 'floral', label: 'Floral', count: 380 },
      { value: 'fresh', label: 'Fresh', count: 290 },
    ],
    brands: [
      { value: 'chanel', label: 'Chanel', count: 45 },
      { value: 'lancome', label: 'Lancôme', count: 32 },
      { value: 'dior', label: 'Dior', count: 28 },
    ],
    occasions: [
      { value: 'evening', label: 'Evening', count: 200 },
      { value: 'office', label: 'Office', count: 150 },
      { value: 'casual', label: 'Casual', count: 300 },
    ],
    seasons: [
      { value: 'spring', label: 'Spring', count: 400 },
      { value: 'summer', label: 'Summer', count: 350 },
      { value: 'fall', label: 'Fall', count: 300 },
      { value: 'winter', label: 'Winter', count: 250 },
    ],
    price_ranges: [
      { min: 0, max: 10, label: 'Under $10', count: 200 },
      { min: 10, max: 20, label: '$10-$20', count: 300 },
      { min: 20, max: 50, label: '$20-$50', count: 150 },
    ],
    availability: [
      { value: 'sample_available', label: 'Sample Available', count: 800 },
      { value: 'in_stock', label: 'In Stock', count: 1200 },
    ],
    metadata: {
      total_fragrances: 1467,
      samples_available: 800,
      last_updated: '2025-08-16T00:00:00Z',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (global.fetch as any).mockClear();
  });

  describe('Component Rendering', () => {
    test('renders browse page with initial data', () => {
      render(
        <FragranceBrowseClient
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      expect(
        screen.getByPlaceholderText(/search fragrances/i)
      ).toBeInTheDocument();
      expect(screen.getByText('2 fragrances found')).toBeInTheDocument();
      expect(screen.getByText('Bleu de Chanel')).toBeInTheDocument();
      expect(screen.getByText('La Vie Est Belle')).toBeInTheDocument();
    });

    test('renders search input and submit button', () => {
      render(
        <FragranceBrowseClient
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search fragrances/i);
      const searchButton = screen.getByText('Search');

      expect(searchInput).toBeInTheDocument();
      expect(searchButton).toBeInTheDocument();
      expect(searchButton).toBeEnabled();
    });

    test('displays fragrance cards with correct information', () => {
      render(
        <FragranceBrowseClient
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      // Check first fragrance card
      expect(screen.getByText('Bleu de Chanel')).toBeInTheDocument();
      expect(screen.getByText('Chanel')).toBeInTheDocument();
      expect(screen.getByText('Woody')).toBeInTheDocument();
      expect(screen.getByText('Sample Available')).toBeInTheDocument();

      // Check sample pricing
      expect(screen.getByText('$12.99 sample')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    test('handles search input changes', () => {
      render(
        <FragranceBrowseClient
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search fragrances/i);

      fireEvent.change(searchInput, { target: { value: 'Chanel' } });

      expect(searchInput).toHaveValue('Chanel');
    });

    test('submits search and calls API', async () => {
      const mockSearchResponse = {
        fragrances: [mockFragranceData.fragrances[0]],
        total: 1,
        query: 'Chanel',
        filters_applied: {
          scent_families: [],
          sample_only: false,
          occasions: [],
          seasons: [],
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSearchResponse),
      });

      render(
        <FragranceBrowseClient
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search fragrances/i);
      const searchButton = screen.getByText('Search');

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'Chanel' } });
        fireEvent.click(searchButton);
      });

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
      });

      // Should call API
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/search?q=Chanel&limit=20'
      );

      // Should update router
      expect(mockRouter.push).toHaveBeenCalledWith('/browse?q=Chanel');
    });

    test('displays current search query', () => {
      render(
        <FragranceBrowseClient
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{ q: 'Chanel' }}
        />
      );

      expect(screen.getByText('Searching for:')).toBeInTheDocument();
      expect(screen.getByText('"Chanel"')).toBeInTheDocument();
      expect(screen.getByText('Clear search')).toBeInTheDocument();
    });

    test('clears search when clear button is clicked', async () => {
      render(
        <FragranceBrowseClient
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{ q: 'Chanel' }}
        />
      );

      const clearButton = screen.getByText('Clear search');
      await act(async () => {
        fireEvent.click(clearButton);
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/browse');
    });
  });

  describe('Loading States', () => {
    test('displays loading skeleton during search', async () => {
      (global.fetch as any).mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve(mockFragranceData),
                }),
              100
            )
          )
      );

      render(
        <FragranceBrowseClient
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search fragrances/i);
      const searchButton = screen.getByText('Search');

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'test' } });
        fireEvent.click(searchButton);
      });

      // Should show loading skeleton
      await waitFor(() => {
        expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
      });

      // Should show loading spinner in button
      expect(screen.getByRole('button', { name: /search/i })).toBeDisabled();
    });

    test('renders loading skeletons with correct structure', async () => {
      render(
        <FragranceBrowseClient
          initialFragrances={{ ...mockFragranceData, fragrances: [] }}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      // Trigger loading state by performing search
      const searchInput = screen.getByPlaceholderText(/search fragrances/i);
      const searchButton = screen.getByText('Search');

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'test' } });
        fireEvent.click(searchButton);
      });

      // Check skeleton structure
      const skeletons = screen.getAllByTestId('loading-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('displays error state when API fails', () => {
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
      expect(
        screen.getByText(/having trouble loading fragrances/i)
      ).toBeInTheDocument();
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });

    test('displays no results state for empty search', () => {
      const noResultsData = {
        fragrances: [],
        total: 0,
        query: 'nonexistent',
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
          initialFragrances={noResultsData}
          filterOptions={mockFilterOptions}
          initialParams={{ q: 'nonexistent' }}
        />
      );

      expect(screen.getByText('No fragrances found')).toBeInTheDocument();
      expect(
        screen.getByText(/try different search terms/i)
      ).toBeInTheDocument();
      expect(screen.getByText('Clear search')).toBeInTheDocument();
    });

    test('handles network errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(
        <FragranceBrowseClient
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search fragrances/i);
      const searchButton = screen.getByText('Search');

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'test' } });
        fireEvent.click(searchButton);
      });

      // Should handle error gracefully and keep existing results
      await waitFor(() => {
        expect(screen.getByText('Bleu de Chanel')).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    test('displays empty browse state when no query and no results', () => {
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

      expect(
        screen.getByText('Start your fragrance discovery')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/search for fragrances by name/i)
      ).toBeInTheDocument();
    });
  });

  describe('Fragrance Card Component', () => {
    test('displays fragrance card with all required information', () => {
      render(
        <FragranceBrowseClient
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      // Check card displays brand, name, family
      expect(screen.getByText('Chanel')).toBeInTheDocument();
      expect(screen.getByText('Bleu de Chanel')).toBeInTheDocument();
      expect(screen.getByText('Woody')).toBeInTheDocument();

      // Check sample availability (multiple cards may have this)
      expect(screen.getAllByText('Sample Available')).toHaveLength(2);
      expect(screen.getByText('$12.99 sample')).toBeInTheDocument();

      // Check action button
      expect(screen.getByText('Try Sample')).toBeInTheDocument();
    });

    test('handles fragrance without sample availability', () => {
      const dataWithoutSample = {
        ...mockFragranceData,
        fragrances: [
          {
            ...mockFragranceData.fragrances[0],
            sample_available: false,
            sample_price_usd: undefined,
          },
        ],
      };

      render(
        <FragranceBrowseClient
          initialFragrances={dataWithoutSample}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      expect(screen.getByText('View details')).toBeInTheDocument();
      expect(screen.getByText('Learn More')).toBeInTheDocument();
      expect(screen.queryByText('Sample Available')).not.toBeInTheDocument();
    });

    test('handles like button interactions', async () => {
      render(
        <FragranceBrowseClient
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      const likeButtons = screen.getAllByRole('button');
      const heartButton = likeButtons.find(button =>
        button.querySelector('svg')?.classList.contains('lucide-heart')
      );

      expect(heartButton).toBeInTheDocument();

      if (heartButton) {
        await act(async () => {
          fireEvent.click(heartButton);
        });
        // Should toggle like state (visual feedback)
        const heartIcon = heartButton.querySelector('svg');
        expect(heartIcon).toBeInTheDocument();
      }
    });

    test('displays mock rating and review count', () => {
      render(
        <FragranceBrowseClient
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      // Should display star rating (mock calculation)
      const starIcons = screen
        .getAllByRole('generic')
        .filter(el =>
          el.querySelector('svg')?.classList.contains('lucide-star')
        );
      expect(starIcons.length).toBeGreaterThan(0);

      // Should display review count (mock calculation)
      const ratingTexts = screen.getAllByText(/\(\d+\)/);
      expect(ratingTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    test('renders grid layout for fragrance cards', () => {
      render(
        <FragranceBrowseClient
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      const grid = screen.getByTestId('fragrance-grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid');
      expect(grid).toHaveClass('md:grid-cols-2');
      expect(grid).toHaveClass('lg:grid-cols-3');
    });

    test('cards have proper aspect ratios and responsive classes', () => {
      render(
        <FragranceBrowseClient
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      // Check for aspect-square images
      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);

      // Cards should have hover effects
      const cards = screen
        .getAllByRole('generic')
        .filter(
          el =>
            el.className.includes('group') &&
            el.className.includes('hover:shadow')
        );
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Data Integration', () => {
    test('handles real fragrance data structure', () => {
      // Test with varied data to ensure robustness
      const variedData = {
        fragrances: [
          {
            fragrance_id: 3,
            name: 'Test Fragrance',
            brand: 'Test Brand',
            scent_family: 'Oriental',
            relevance_score: 0.75,
            sample_available: false,
            popularity_score: 6.2,
          },
        ],
        total: 1,
        query: 'test',
        filters_applied: {
          scent_families: ['oriental'],
          sample_only: false,
          occasions: [],
          seasons: [],
        },
      };

      render(
        <FragranceBrowseClient
          initialFragrances={variedData}
          filterOptions={mockFilterOptions}
          initialParams={{ q: 'test' }}
        />
      );

      expect(screen.getByText('Test Fragrance')).toBeInTheDocument();
      expect(screen.getByText('Test Brand')).toBeInTheDocument();
      expect(screen.getByText('Oriental')).toBeInTheDocument();
      expect(screen.queryByText('Sample Available')).not.toBeInTheDocument();
    });

    test('handles missing optional data gracefully', () => {
      const minimalData = {
        fragrances: [
          {
            fragrance_id: 4,
            name: 'Minimal Fragrance',
            brand: 'Minimal Brand',
            scent_family: 'Fresh',
            relevance_score: 0.5,
            // Missing optional fields
          },
        ],
        total: 1,
        query: '',
        filters_applied: {
          scent_families: [],
          sample_only: false,
          occasions: [],
          seasons: [],
        },
      };

      render(
        <FragranceBrowseClient
          initialFragrances={minimalData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      expect(screen.getByText('Minimal Fragrance')).toBeInTheDocument();
      expect(screen.getByText('Fresh')).toBeInTheDocument();
      expect(screen.getByText('View details')).toBeInTheDocument();
    });
  });

  describe('URL and Navigation', () => {
    test('builds correct search URLs', async () => {
      render(
        <FragranceBrowseClient
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search fragrances/i);
      const searchButton = screen.getByText('Search');

      await act(async () => {
        fireEvent.change(searchInput, {
          target: { value: 'luxury fragrance' },
        });
        fireEvent.click(searchButton);
      });

      expect(mockRouter.push).toHaveBeenCalledWith(
        '/browse?q=luxury+fragrance'
      );
    });

    test('handles initial search parameters correctly', () => {
      render(
        <FragranceBrowseClient
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{
            q: 'Chanel',
            family: 'woody',
            sample_only: 'true',
          }}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search fragrances/i);
      expect(searchInput).toHaveValue('Chanel');
      expect(screen.getByText('Searching for:')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper form semantics', () => {
      render(
        <FragranceBrowseClient
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();

      const searchInput = screen.getByRole('textbox');
      expect(searchInput).toHaveAttribute('placeholder');

      const submitButton = screen.getByRole('button', { name: /search/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    test('has proper image alt text', () => {
      render(
        <FragranceBrowseClient
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).toContain('fragrance');
      });
    });

    test('buttons have proper labels and states', () => {
      render(
        <FragranceBrowseClient
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      const buttons = screen.getAllByRole('button');

      buttons.forEach(button => {
        expect(button).toHaveTextContent(/.+/); // Should have some text content
      });
    });
  });

  describe('Performance Considerations', () => {
    test('handles large fragrance datasets', () => {
      const largeDataset = {
        fragrances: Array.from({ length: 20 }, (_, i) => ({
          fragrance_id: i + 1,
          name: `Fragrance ${i + 1}`,
          brand: `Brand ${Math.floor(i / 5) + 1}`,
          scent_family: ['Woody', 'Floral', 'Fresh', 'Oriental'][i % 4],
          relevance_score: Math.random(),
          sample_available: i % 2 === 0,
          sample_price_usd: 10 + (i % 15),
          popularity_score: Math.random() * 10,
        })),
        total: 20,
        query: '',
        filters_applied: {
          scent_families: [],
          sample_only: false,
          occasions: [],
          seasons: [],
        },
      };

      render(
        <FragranceBrowseClient
          initialFragrances={largeDataset}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      expect(screen.getByText('20 fragrances found')).toBeInTheDocument();

      // Should render all items
      expect(screen.getByText('Fragrance 1')).toBeInTheDocument();
      expect(screen.getByText('Fragrance 20')).toBeInTheDocument();
    });

    test('optimizes image loading with proper attributes', () => {
      render(
        <FragranceBrowseClient
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      const images = screen.getAllByRole('img');

      images.forEach(img => {
        // Should have responsive sizes
        expect(img).toHaveAttribute('sizes');
        // Should have proper loading optimization
        expect(img.getAttribute('sizes')).toContain('(max-width');
      });
    });
  });

  describe('User Experience', () => {
    test('provides clear visual feedback for different states', () => {
      // Test initial state
      render(
        <FragranceBrowseClient
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      );

      // Should show results count
      expect(screen.getByText('2 fragrances found')).toBeInTheDocument();

      // Should show sample badges
      expect(screen.getByText('Sample Available')).toBeInTheDocument();

      // Should show pricing
      expect(screen.getByText('$12.99 sample')).toBeInTheDocument();
    });

    test('maintains search context across interactions', () => {
      render(
        <FragranceBrowseClient
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{ q: 'Chanel' }}
        />
      );

      // Should preserve search context
      expect(screen.getByDisplayValue('Chanel')).toBeInTheDocument();
      expect(screen.getByText('Searching for:')).toBeInTheDocument();
      expect(screen.getByText('"Chanel"')).toBeInTheDocument();
    });
  });
});
