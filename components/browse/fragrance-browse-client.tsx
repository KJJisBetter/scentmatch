'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EnhancedFragranceCard } from '@/components/browse/enhanced-fragrance-card';
import {
  Search,
  AlertCircle,
  RefreshCw,
  Package,
  Filter,
  X,
} from 'lucide-react';

interface FragranceResult {
  fragrance_id: number;
  id?: number; // Alternative ID field from API
  name: string;
  brand: string;
  scent_family: string;
  relevance_score: number;
  description?: string;
  sample_price_usd?: number;
  sample_available?: boolean;
  popularity_score?: number;
}

interface SearchResponse {
  fragrances: FragranceResult[];
  total: number;
  query: string;
  filters_applied: any;
  fallback?: boolean;
  message?: string;
}

interface FilterOptions {
  scent_families: Array<{ value: string; label: string; count: number }>;
  brands: Array<{ value: string; label: string; count: number }>;
  occasions: Array<{ value: string; label: string; count: number }>;
  seasons: Array<{ value: string; label: string; count: number }>;
  price_ranges: Array<{
    min: number;
    max: number;
    label: string;
    count: number;
  }>;
  availability: Array<{ value: string; label: string; count: number }>;
  metadata: {
    total_fragrances: number;
    samples_available: number;
    last_updated: string;
    error?: string;
  };
}

interface FragranceBrowseClientProps {
  initialFragrances: SearchResponse;
  filterOptions: FilterOptions;
  initialParams: {
    q?: string;
    brand?: string;
    family?: string;
    price_min?: string;
    price_max?: string;
    sample_only?: string;
    page?: string;
  };
}

export function FragranceBrowseClient({
  initialFragrances,
  filterOptions,
  initialParams,
}: FragranceBrowseClientProps) {
  const router = useRouter();

  const [fragrances, setFragrances] =
    useState<SearchResponse>(initialFragrances);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialParams.q || '');

  // Enhanced filter state
  const [activeFilters, setActiveFilters] = useState({
    families: initialParams.family ? [initialParams.family] : [],
    brands: initialParams.brand ? [initialParams.brand] : [],
    priceRange:
      initialParams.price_min && initialParams.price_max
        ? ([
            parseInt(initialParams.price_min),
            parseInt(initialParams.price_max),
          ] as [number, number])
        : null,
    sampleOnly: initialParams.sample_only === 'true',
  });

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(
    parseInt(initialParams.page || '1')
  );
  const itemsPerPage = 20;

  // Build search URL
  const buildSearchUrl = useCallback((params: Record<string, string>) => {
    const urlParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value && value.trim()) {
        urlParams.set(key, value);
      }
    });

    return `/browse${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
  }, []);

  // Enhanced search with filters and pagination
  const performSearch = useCallback(
    async (
      query = searchQuery,
      filters = activeFilters,
      page = currentPage
    ) => {
      setIsLoading(true);

      try {
        // Build comprehensive search parameters
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (filters.families.length > 0)
          params.set('scent_families', filters.families.join(','));
        if (filters.brands.length > 0)
          params.set('brands', filters.brands.join(','));
        if (filters.priceRange && filters.priceRange.length === 2) {
          params.set('price_min', filters.priceRange[0]!.toString());
          params.set('price_max', filters.priceRange[1]!.toString());
        }
        if (filters.sampleOnly) params.set('sample_only', 'true');
        params.set('limit', itemsPerPage.toString());
        params.set('offset', ((page - 1) * itemsPerPage).toString());

        // Fetch new results from API
        const response = await fetch(`/api/search?${params.toString()}`);
        const data = await response.json();

        // Update local state with new results
        setFragrances(data);

        // Update URL for shareable links
        const urlParams: Record<string, string> = {};
        if (query) urlParams.q = query;
        if (filters.families.length > 0 && filters.families[0])
          urlParams.family = filters.families[0]; // For simplicity, use first family
        if (filters.brands.length > 0 && filters.brands[0])
          urlParams.brand = filters.brands[0]; // For simplicity, use first brand
        if (filters.priceRange && filters.priceRange.length === 2) {
          urlParams.price_min = filters.priceRange[0]!.toString();
          urlParams.price_max = filters.priceRange[1]!.toString();
        }
        if (filters.sampleOnly) urlParams.sample_only = 'true';
        if (page > 1) urlParams.page = page.toString();

        const url = buildSearchUrl(urlParams);
        router.push(url);
      } catch (error) {
        console.error('Search error:', error);
        // Keep existing results on error
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, activeFilters, currentPage, buildSearchUrl, router]
  );

  // Handle pagination
  const handlePageChange = useCallback(
    async (newPage: number) => {
      setCurrentPage(newPage);
      await performSearch(searchQuery, activeFilters, newPage);
    },
    [searchQuery, activeFilters, performSearch]
  );

  // Handle search form submission
  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await performSearch();
    },
    [performSearch]
  );

  // Handle filter changes
  const handleFilterChange = useCallback(
    async (newFilters: Partial<typeof activeFilters>) => {
      const updatedFilters = { ...activeFilters, ...newFilters };
      setActiveFilters(updatedFilters);
      await performSearch(searchQuery, updatedFilters);
    },
    [activeFilters, searchQuery, performSearch]
  );

  const hasResults = fragrances.fragrances && fragrances.fragrances.length > 0;
  const hasQuery = searchQuery.trim().length > 0;

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Enhanced Search Bar */}
      <div className='mb-8'>
        <form onSubmit={handleSearch} className='flex gap-2 max-w-4xl mx-auto'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
            <Input
              type='text'
              placeholder='Search fragrances by name, brand, accords, or mood...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='pl-10 h-12 text-base'
            />
          </div>
          <Button type='submit' disabled={isLoading} className='h-12 px-6'>
            {isLoading ? (
              <RefreshCw className='h-4 w-4 animate-spin' />
            ) : (
              'Search'
            )}
          </Button>

          {/* Mobile filter toggle */}
          <Button
            type='button'
            variant='outline'
            className='lg:hidden h-12 px-4'
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <Filter className='h-4 w-4' />
          </Button>
        </form>

        {/* Enhanced search status display */}
        {(hasQuery ||
          Object.values(activeFilters).some(f =>
            Array.isArray(f) ? f.length > 0 : f
          )) && (
          <div className='text-center mt-4 space-y-2'>
            <div className='flex items-center justify-center gap-2 flex-wrap'>
              {hasQuery && (
                <Badge variant='default' className='text-xs'>
                  Search: "{searchQuery}"
                </Badge>
              )}
              {activeFilters.families.map(family => (
                <Badge key={family} variant='secondary' className='text-xs'>
                  {family}
                  <X
                    className='h-3 w-3 ml-1 cursor-pointer'
                    onClick={() =>
                      handleFilterChange({
                        families: activeFilters.families.filter(
                          f => f !== family
                        ),
                      })
                    }
                  />
                </Badge>
              ))}
              {activeFilters.sampleOnly && (
                <Badge variant='accent' className='text-xs'>
                  Samples Only
                  <X
                    className='h-3 w-3 ml-1 cursor-pointer'
                    onClick={() => handleFilterChange({ sampleOnly: false })}
                  />
                </Badge>
              )}
            </div>

            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                setSearchQuery('');
                setActiveFilters({
                  families: [],
                  brands: [],
                  priceRange: null,
                  sampleOnly: false,
                });
                router.push('/browse');
              }}
              className='text-xs'
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      {/* Main Layout with Sidebar */}
      <div className='grid lg:grid-cols-4 gap-8'>
        {/* Desktop Filter Sidebar */}
        <aside
          className={`lg:col-span-1 space-y-6 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}
        >
          <FilterSidebar
            filterOptions={filterOptions}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            isLoading={isLoading}
          />
        </aside>

        {/* Results Area */}
        <main className='lg:col-span-3'>
          {/* Results header */}
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h2 className='text-lg font-medium text-foreground'>
                {hasResults ? (
                  <>
                    {fragrances.total} fragrance
                    {fragrances.total !== 1 ? 's' : ''} found
                    {hasQuery && ` for "${searchQuery}"`}
                  </>
                ) : hasQuery ? (
                  `No results for "${searchQuery}"`
                ) : (
                  'Browse Fragrances'
                )}
              </h2>
              {fragrances.fallback && fragrances.message && (
                <p className='text-sm text-muted-foreground mt-1'>
                  {fragrances.message}
                </p>
              )}
            </div>
          </div>

          {/* Error State */}
          {fragrances.fallback &&
            fragrances.total === 0 &&
            fragrances.message?.includes('unavailable') && (
              <div className='text-center py-12'>
                <AlertCircle className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <h3 className='text-lg font-medium text-foreground mb-2'>
                  Something went wrong
                </h3>
                <p className='text-muted-foreground mb-4'>
                  We're having trouble loading fragrances right now. Please try
                  again.
                </p>
                <Button onClick={() => window.location.reload()}>
                  <RefreshCw className='h-4 w-4 mr-2' />
                  Try again
                </Button>
              </div>
            )}

          {/* No Results State */}
          {!fragrances.fallback && fragrances.total === 0 && hasQuery && (
            <div className='text-center py-12'>
              <Package className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
              <h3 className='text-lg font-medium text-foreground mb-2'>
                No fragrances found
              </h3>
              <p className='text-muted-foreground mb-4'>
                Try different search terms or browse our collection.
              </p>
              <div className='space-x-2'>
                <Button
                  variant='outline'
                  onClick={() => {
                    setSearchQuery('');
                    router.push('/browse');
                  }}
                >
                  Clear search
                </Button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className='product-grid' data-testid='loading-skeleton'>
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={`loading-skeleton-${i}`}>
                  <CardContent className='p-4'>
                    <div className='aspect-square w-full mb-3 rounded bg-muted animate-pulse' />
                    <div className='h-4 w-full mb-2 bg-muted animate-pulse rounded' />
                    <div className='h-3 w-3/4 mb-2 bg-muted animate-pulse rounded' />
                    <div className='h-3 w-1/2 bg-muted animate-pulse rounded' />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Fragrance Grid */}
          {hasResults && !isLoading && (
            <>
              <div className='product-grid' data-testid='fragrance-grid'>
                {fragrances.fragrances.map(fragrance => (
                  <EnhancedFragranceCard
                    key={fragrance.fragrance_id || fragrance.id}
                    fragrance={fragrance}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {fragrances.total > itemsPerPage && (
                <div className='mt-12 flex items-center justify-center'>
                  <PaginationControls
                    currentPage={currentPage}
                    totalItems={fragrances.total}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    isLoading={isLoading}
                  />
                </div>
              )}
            </>
          )}

          {/* Empty State for Browse Page */}
          {!hasResults && !hasQuery && !isLoading && !fragrances.fallback && (
            <div className='text-center py-12'>
              <Search className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
              <h3 className='text-lg font-medium text-foreground mb-2'>
                Start your fragrance discovery
              </h3>
              <p className='text-muted-foreground mb-4'>
                Search for fragrances by name, brand, or scent notes to get
                started.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Professional Filter Sidebar Component
interface ActiveFilters {
  families: string[];
  brands: string[];
  priceRange: [number, number] | null;
  sampleOnly: boolean;
}

interface FilterSidebarProps {
  filterOptions: FilterOptions;
  activeFilters: ActiveFilters;
  onFilterChange: (filters: Partial<ActiveFilters>) => void;
  isLoading: boolean;
}

function FilterSidebar({
  filterOptions,
  activeFilters,
  onFilterChange,
  isLoading,
}: FilterSidebarProps) {
  return (
    <div className='space-y-6'>
      {/* Filter Header */}
      <div className='border-b border-border pb-4'>
        <h3 className='font-semibold text-foreground text-lg'>Filters</h3>
        <p className='text-xs text-muted-foreground mt-1'>
          {filterOptions.metadata.total_fragrances.toLocaleString()} fragrances
          available
        </p>
      </div>

      {/* Sample Only Filter */}
      <div className='space-y-3'>
        <h4 className='font-medium text-foreground text-sm'>Availability</h4>
        <label className='flex items-center space-x-2 cursor-pointer'>
          <input
            type='checkbox'
            checked={activeFilters.sampleOnly}
            onChange={e => onFilterChange({ sampleOnly: e.target.checked })}
            disabled={isLoading}
            className='rounded border-gray-300'
          />
          <span className='text-sm text-foreground'>Samples Available</span>
          <Badge variant='secondary' className='text-xs'>
            {filterOptions.metadata.samples_available}
          </Badge>
        </label>
      </div>

      {/* Scent Family Filter */}
      <div className='space-y-3'>
        <h4 className='font-medium text-foreground text-sm'>Scent Family</h4>
        <div className='space-y-2 max-h-48 overflow-y-auto'>
          {filterOptions.scent_families.slice(0, 8).map(family => (
            <label
              key={family.value}
              className='flex items-center space-x-2 cursor-pointer'
            >
              <input
                type='checkbox'
                checked={activeFilters.families.includes(family.value)}
                onChange={e => {
                  if (e.target.checked) {
                    onFilterChange({
                      families: [...activeFilters.families, family.value],
                    });
                  } else {
                    onFilterChange({
                      families: activeFilters.families.filter(
                        f => f !== family.value
                      ),
                    });
                  }
                }}
                disabled={isLoading}
                className='rounded border-gray-300'
              />
              <span className='text-sm text-foreground flex-1'>
                {family.label}
              </span>
              <Badge variant='outline' className='text-xs'>
                {family.count}
              </Badge>
            </label>
          ))}
        </div>
      </div>

      {/* Brand Filter */}
      <div className='space-y-3'>
        <h4 className='font-medium text-foreground text-sm'>Popular Brands</h4>
        <div className='space-y-2 max-h-48 overflow-y-auto'>
          {filterOptions.brands.slice(0, 10).map(brand => (
            <label
              key={brand.value}
              className='flex items-center space-x-2 cursor-pointer'
            >
              <input
                type='checkbox'
                checked={activeFilters.brands.includes(brand.value)}
                onChange={e => {
                  if (e.target.checked) {
                    onFilterChange({
                      brands: [...activeFilters.brands, brand.value],
                    });
                  } else {
                    onFilterChange({
                      brands: activeFilters.brands.filter(
                        b => b !== brand.value
                      ),
                    });
                  }
                }}
                disabled={isLoading}
                className='rounded border-gray-300'
              />
              <span className='text-sm text-foreground flex-1'>
                {brand.label}
              </span>
              <Badge variant='outline' className='text-xs'>
                {brand.count}
              </Badge>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className='space-y-3'>
        <h4 className='font-medium text-foreground text-sm'>Sample Price</h4>
        <div className='space-y-2'>
          {filterOptions.price_ranges.map(range => (
            <label
              key={`${range.min}-${range.max}`}
              className='flex items-center space-x-2 cursor-pointer'
            >
              <input
                type='radio'
                name='priceRange'
                checked={
                  activeFilters.priceRange?.[0] === range.min &&
                  activeFilters.priceRange?.[1] === range.max
                }
                onChange={() =>
                  onFilterChange({ priceRange: [range.min, range.max] })
                }
                disabled={isLoading}
                className='border-gray-300'
              />
              <span className='text-sm text-foreground flex-1'>
                {range.label}
              </span>
              <Badge variant='outline' className='text-xs'>
                {range.count}
              </Badge>
            </label>
          ))}
          {activeFilters.priceRange && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onFilterChange({ priceRange: null })}
              className='text-xs mt-2'
            >
              Clear price filter
            </Button>
          )}
        </div>
      </div>

      {/* Filter Actions */}
      <div className='border-t border-border pt-4'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => {
            onFilterChange({
              families: [],
              brands: [],
              priceRange: null,
              sampleOnly: false,
            });
          }}
          disabled={isLoading}
          className='w-full text-xs'
        >
          Clear All Filters
        </Button>
      </div>
    </div>
  );
}

// Professional Pagination Component
interface PaginationControlsProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

function PaginationControls({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  isLoading,
}: PaginationControlsProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const delta = 2; // Pages to show on each side of current page
    const pages: (number | string)[] = [];

    for (
      let i = Math.max(1, currentPage - delta);
      i <= Math.min(totalPages, currentPage + delta);
      i++
    ) {
      pages.push(i);
    }

    // Add first page and ellipsis if needed
    if (pages[0] !== 1) {
      if (pages[0] !== 2) {
        pages.unshift('...');
      }
      pages.unshift(1);
    }

    // Add last page and ellipsis if needed
    if (pages[pages.length - 1] !== totalPages) {
      if (pages[pages.length - 1] !== totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className='flex flex-col items-center space-y-4'>
      {/* Results summary */}
      <p className='text-sm text-muted-foreground'>
        Showing {startItem.toLocaleString()}-{endItem.toLocaleString()} of{' '}
        {totalItems.toLocaleString()} fragrances
      </p>

      {/* Pagination buttons */}
      <div className='flex items-center space-x-1'>
        {/* Previous button */}
        <Button
          variant='outline'
          size='sm'
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className='text-xs px-3'
        >
          Previous
        </Button>

        {/* Page numbers */}
        {getPageNumbers().map((page, index) => (
          <Button
            key={index}
            variant={page === currentPage ? 'default' : 'outline'}
            size='sm'
            onClick={() =>
              typeof page === 'number' ? onPageChange(page) : undefined
            }
            disabled={typeof page !== 'number' || isLoading}
            className='text-xs min-w-[2.5rem]'
          >
            {page}
          </Button>
        ))}

        {/* Next button */}
        <Button
          variant='outline'
          size='sm'
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className='text-xs px-3'
        >
          Next
        </Button>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className='flex items-center space-x-2 text-xs text-muted-foreground'>
          <RefreshCw className='h-3 w-3 animate-spin' />
          <span>Loading results...</span>
        </div>
      )}
    </div>
  );
}
