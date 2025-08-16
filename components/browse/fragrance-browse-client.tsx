'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Star,
  ShoppingCart,
  Heart,
  AlertCircle,
  RefreshCw,
  Package,
  Filter,
  X,
  ChevronDown,
  Check,
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
            <div
              className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'
              data-testid='loading-skeleton'
            >
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
              <div
                className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'
                data-testid='fragrance-grid'
              >
                {fragrances.fragrances.map(fragrance => (
                  <FragranceCard
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

// Enhanced Professional Fragrance Card Component
function FragranceCard({ fragrance }: { fragrance: FragranceResult }) {
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const router = useRouter();

  // Get consistent fragrance ID
  const fragranceId = fragrance.fragrance_id || fragrance.id || 0;

  // Enhanced placeholder with better variety
  const defaultPlaceholder =
    'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop&q=80';
  const placeholderImages = [
    defaultPlaceholder,
    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=400&h=400&fit=crop&q=80',
  ];
  const placeholderImage =
    placeholderImages[fragranceId % placeholderImages.length] ||
    defaultPlaceholder;

  // Enhanced mock data for professional display
  const mockRating = Math.max(
    3.8,
    Math.min(5.0, 4.2 + fragrance.relevance_score * 0.6)
  );
  const mockReviews = Math.floor(150 + ((fragranceId * 31) % 1200));
  const mockPrice = fragrance.sample_price_usd || 8 + (fragranceId % 12);

  // Calculate discount badge
  const hasDiscount = fragranceId % 4 === 0;
  const discountPercent = hasDiscount ? 15 : 0;

  const handleCardClick = () => {
    router.push(`/fragrance/${fragranceId}`);
  };

  const handleSampleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Handle sample ordering
    console.log('Sample clicked for:', fragranceId);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <Card
      className='group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer border-0 shadow-sm hover:shadow-xl'
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <CardContent className='p-0'>
        {/* Enhanced Image Section */}
        <div className='relative aspect-square overflow-hidden bg-gradient-to-br from-amber-50 to-rose-50'>
          <Image
            src={placeholderImage}
            alt={`${fragrance.name} by ${fragrance.brand} - Fragrance`}
            className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
            onError={() => setImageError(true)}
            fill
            sizes='(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw'
            priority={fragrance.fragrance_id <= 6} // Priority for first 6 items
          />

          {/* Enhanced overlay with gradient */}
          <div className='absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />

          {/* Action buttons overlay */}
          <div className='absolute top-3 right-3 flex flex-col gap-2'>
            {/* Like button */}
            <button
              onClick={handleLikeClick}
              className='p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md'
              aria-label={`${isLiked ? 'Remove from' : 'Add to'} favorites`}
            >
              <Heart
                className={`h-4 w-4 transition-colors ${
                  isLiked
                    ? 'fill-red-500 text-red-500'
                    : 'text-gray-600 hover:text-red-400'
                }`}
              />
            </button>
          </div>

          {/* Enhanced badges */}
          <div className='absolute top-3 left-3 flex flex-col gap-1'>
            {/* Sample available badge */}
            {fragrance.sample_available && (
              <Badge className='bg-emerald-600 text-white shadow-sm text-xs font-medium'>
                <Package className='h-3 w-3 mr-1' />
                Sample Ready
              </Badge>
            )}

            {/* Discount badge */}
            {hasDiscount && (
              <Badge className='bg-red-600 text-white shadow-sm text-xs font-medium'>
                {discountPercent}% OFF
              </Badge>
            )}

            {/* Popular badge */}
            {fragrance.popularity_score && fragrance.popularity_score > 8 && (
              <Badge className='bg-orange-600 text-white shadow-sm text-xs font-medium'>
                <Star className='h-3 w-3 mr-1' />
                Popular
              </Badge>
            )}
          </div>

          {/* Quick preview on hover */}
          {isHovering && (
            <div className='absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white'>
              <p className='text-sm opacity-90 line-clamp-2'>
                {fragrance.description ||
                  `A ${fragrance.scent_family.toLowerCase()} fragrance perfect for those who appreciate quality.`}
              </p>
            </div>
          )}
        </div>

        {/* Enhanced Content Section */}
        <div className='p-4 space-y-3'>
          {/* Brand and Name */}
          <div>
            <p className='text-xs text-muted-foreground font-medium uppercase tracking-wider'>
              {fragrance.brand}
            </p>
            <h3 className='font-semibold text-foreground line-clamp-2 leading-snug'>
              {fragrance.name}
            </h3>
          </div>

          {/* Enhanced Family and Rating */}
          <div className='flex items-center justify-between'>
            <Badge
              variant='secondary'
              className='text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200'
            >
              {fragrance.scent_family}
            </Badge>
            <div className='flex items-center space-x-1'>
              <Star className='h-3 w-3 fill-amber-400 text-amber-400' />
              <span className='text-sm font-medium text-foreground'>
                {mockRating.toFixed(1)}
              </span>
              <span className='text-xs text-muted-foreground'>
                ({mockReviews.toLocaleString()})
              </span>
            </div>
          </div>

          {/* Enhanced Price and Actions */}
          <div className='flex items-center justify-between pt-2 border-t border-border/50'>
            <div>
              {fragrance.sample_available ? (
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    {hasDiscount ? (
                      <>
                        <span className='text-sm font-bold text-emerald-600'>
                          $
                          {(
                            (mockPrice * (100 - discountPercent)) /
                            100
                          ).toFixed(2)}
                        </span>
                        <span className='text-xs text-muted-foreground line-through'>
                          ${mockPrice}
                        </span>
                      </>
                    ) : (
                      <span className='text-sm font-bold text-emerald-600'>
                        ${mockPrice}
                      </span>
                    )}
                    <span className='text-xs text-muted-foreground'>
                      sample
                    </span>
                  </div>
                </div>
              ) : (
                <span className='text-sm text-muted-foreground'>
                  View details
                </span>
              )}
            </div>

            <div className='flex gap-2'>
              {fragrance.sample_available && (
                <Button
                  size='sm'
                  onClick={handleSampleClick}
                  className='text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white'
                >
                  <ShoppingCart className='h-3 w-3 mr-1' />
                  Try Sample
                </Button>
              )}
              <Button
                size='sm'
                variant='outline'
                className='text-xs px-3 py-1.5'
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Trust signals */}
          <div className='flex items-center justify-between text-xs text-muted-foreground pt-1'>
            <div className='flex items-center gap-3'>
              <span className='flex items-center gap-1'>
                <span>🚚</span>
                Free shipping
              </span>
              <span className='flex items-center gap-1'>
                <span>🛡️</span>
                Authentic
              </span>
            </div>
            {fragrance.popularity_score && (
              <span className='font-medium text-orange-600'>
                #{Math.floor((10 - fragrance.popularity_score) * 10)} seller
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
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
