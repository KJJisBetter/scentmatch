'use client';

import React, { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { AffiliateLinksModal } from '@/components/browse/affiliate-links-modal';
import {
  getDisplayBrandName,
  getDisplayFragranceName,
  extractConcentration,
} from '@/lib/brand-utils';
import { toggleCollection, toggleWishlist } from '@/lib/actions';
import {
  Search,
  Star,
  Plus,
  Bookmark,
  Heart,
  AlertCircle,
  RefreshCw,
  Package,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';

interface FragranceResult {
  // API Response format - matches actual search API
  id: string;
  name: string;
  brand_id: string;
  gender?: string;
  relevance_score: number;
  similarity_score?: number;
  sample_available?: boolean;
  sample_price_usd?: number;
  image_url?: string | null;
  metadata?: any;

  // Legacy fields for backwards compatibility
  fragrance_id?: number | string;
  brand?: string;
  scent_family?: string;
  description?: string;
  popularity_score?: number;

  // Collection status fields
  collection_status?: string[];
  in_collection?: boolean;
  in_wishlist?: boolean;
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

  // Handle search with data fetching
  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        // Build search URL parameters
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        params.set('limit', '20');

        // Fetch new results from API
        const response = await fetch(`/api/search?${params.toString()}`);
        const data = await response.json();

        // Update local state with new results
        setFragrances(data);

        // Update URL for shareable links
        const url = buildSearchUrl({
          q: searchQuery,
        });

        router.push(url);
      } catch (error) {
        console.error('Search error:', error);
        // Keep existing results on error
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, buildSearchUrl, router]
  );

  const hasResults = fragrances.fragrances && fragrances.fragrances.length > 0;
  const hasQuery = searchQuery.trim().length > 0;

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Search Bar */}
      <div className='mb-8'>
        <form onSubmit={handleSearch} className='flex gap-2 max-w-2xl mx-auto'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
            <Input
              type='text'
              placeholder='Search fragrances by name, brand, or accords...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='pl-10'
            />
          </div>
          <Button type='submit' disabled={isLoading}>
            {isLoading ? (
              <RefreshCw className='h-4 w-4 animate-spin' />
            ) : (
              'Search'
            )}
          </Button>
        </form>

        {/* Current search display */}
        {hasQuery && (
          <div className='text-center mt-4'>
            <p className='text-muted-foreground'>
              Searching for:{' '}
              <span className='font-medium text-foreground'>
                "{searchQuery}"
              </span>
            </p>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                setSearchQuery('');
                router.push('/browse');
              }}
              className='mt-1 text-xs'
            >
              Clear search
            </Button>
          </div>
        )}
      </div>

      {/* Results */}
      <div>
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
          <div
            className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'
            data-testid='fragrance-grid'
          >
            {fragrances.fragrances.map((fragrance, index) => (
              <FragranceCard
                key={fragrance.id || fragrance.fragrance_id || index}
                fragrance={fragrance}
              />
            ))}
          </div>
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
      </div>
    </div>
  );
}

// Individual Fragrance Card Component
function FragranceCard({ fragrance }: { fragrance: FragranceResult }) {
  const [imageError, setImageError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Create a placeholder image URL based on fragrance ID for consistent placeholders
  const placeholderImage = `https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop&q=80`;

  // Safe data extraction with proper fallbacks
  const fragranceId = String(
    fragrance.id || fragrance.fragrance_id || 'unknown'
  );
  const rawFragranceName = fragrance.name || 'Untitled Fragrance';
  const rawBrandName = fragrance.brand || fragrance.brand_id || 'Unknown Brand';
  const brandName = getDisplayBrandName(rawBrandName, rawFragranceName); // Apply brand intelligence with RAW fragrance name

  // Extract name and concentration separately (following major platform patterns)
  const {
    name: fragranceName,
    concentration,
    abbreviation,
  } = extractConcentration(rawFragranceName);

  const scentFamily = fragrance.scent_family || fragrance.gender || 'Fragrance';
  const relevanceScore =
    typeof fragrance.relevance_score === 'number'
      ? fragrance.relevance_score
      : 0.5;

  // Collection status
  const inCollection = fragrance.in_collection || false;
  const inWishlist = fragrance.in_wishlist || false;

  // Safe mock data calculation with null checks
  const mockRating = Math.max(3.5, Math.min(5.0, 4.0 + relevanceScore * 0.8));
  const mockReviews = Math.floor(
    100 +
      ((typeof fragranceId === 'string' ? fragranceId.length * 23 : 123) % 900)
  );

  // Collection management functions
  const handleCollectionAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCollectionLoading(true);

    startTransition(async () => {
      try {
        const action = inCollection ? 'remove' : 'add';
        const result = await toggleCollection({
          fragrance_id: fragranceId,
          action,
        });

        if (result.success) {
          // Optimistically update UI - Server Action will handle revalidation
          fragrance.in_collection = result.in_collection;
        } else {
          console.error('Failed to update collection:', result.error);
        }
      } catch (error) {
        console.error('Collection update error:', error);
      } finally {
        setCollectionLoading(false);
      }
    });
  };

  const handleWishlistAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlistLoading(true);

    startTransition(async () => {
      try {
        const action = inWishlist ? 'remove' : 'add';
        const result = await toggleWishlist({
          fragrance_id: fragranceId,
          action,
        });

        if (result.success) {
          // Optimistically update UI - Server Action will handle revalidation
          fragrance.in_wishlist = result.in_wishlist;
        } else {
          console.error('Failed to update wishlist:', result.error);
        }
      } catch (error) {
        console.error('Wishlist update error:', error);
      } finally {
        setWishlistLoading(false);
      }
    });
  };

  return (
    <Link href={`/fragrance/${fragranceId}`} className='block'>
      <Card className='group hover:shadow-medium transition-all duration-300 overflow-hidden cursor-pointer'>
        <CardContent className='p-0'>
          {/* Image */}
          <div className='relative aspect-square overflow-hidden bg-muted'>
            <Image
              src={imageError ? placeholderImage : placeholderImage}
              alt={`${fragranceName} fragrance`}
              className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
              onError={() => setImageError(true)}
              fill
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            />

            {/* Collection Status Badges */}
            <div className='absolute top-3 left-3 flex flex-col gap-1'>
              {fragrance.sample_available && (
                <Badge className='bg-green-600 text-white text-xs'>
                  Sample Available
                </Badge>
              )}
              {inCollection && (
                <Badge className='bg-blue-600 text-white text-xs'>
                  <CheckCircle className='h-3 w-3 mr-1' />
                  Owned
                </Badge>
              )}
              {inWishlist && (
                <Badge className='bg-purple-600 text-white text-xs'>
                  <Bookmark className='h-3 w-3 mr-1' />
                  Wishlist
                </Badge>
              )}
            </div>
          </div>

          {/* Content */}
          <div className='p-4'>
            <div className='space-y-3'>
              {/* Brand, Name, and Concentration - Following major platform patterns */}
              <div>
                <p className='text-sm text-muted-foreground font-medium'>
                  {brandName}
                </p>
                <h3 className='font-medium text-foreground leading-tight'>
                  {fragranceName}
                </h3>
                {concentration && (
                  <div className='flex items-center gap-2 mt-1'>
                    <span className='text-xs text-muted-foreground'>
                      {concentration}
                    </span>
                    {abbreviation && (
                      <Badge
                        variant='outline'
                        className='text-xs px-2 py-0.5 h-5'
                      >
                        {abbreviation}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Family and Rating */}
              <div className='flex items-center justify-between text-sm'>
                <Badge variant='secondary'>{scentFamily}</Badge>
                <div className='flex items-center space-x-1'>
                  <Star className='h-3 w-3 fill-yellow-400 text-yellow-400' />
                  <span className='text-muted-foreground'>
                    {mockRating.toFixed(1)}
                  </span>
                  <span className='text-muted-foreground'>({mockReviews})</span>
                </div>
              </div>

              {/* Primary Actions - Collection Management */}
              <div className='flex gap-2 pt-1'>
                <Button
                  size='sm'
                  variant={inCollection ? 'default' : 'outline'}
                  onClick={e => handleCollectionAction(e)}
                  disabled={collectionLoading || isPending}
                  className='flex-1'
                >
                  {collectionLoading ? (
                    <RefreshCw className='h-3 w-3 animate-spin' />
                  ) : inCollection ? (
                    <>
                      <CheckCircle className='h-3 w-3 mr-1' />
                      In Collection
                    </>
                  ) : (
                    <>
                      <Plus className='h-3 w-3 mr-1' />
                      Add to Collection
                    </>
                  )}
                </Button>

                <Button
                  size='sm'
                  variant={inWishlist ? 'secondary' : 'outline'}
                  onClick={e => handleWishlistAction(e)}
                  disabled={wishlistLoading || isPending}
                  className='flex-1'
                >
                  {wishlistLoading ? (
                    <RefreshCw className='h-3 w-3 animate-spin' />
                  ) : inWishlist ? (
                    <>
                      <Bookmark className='h-3 w-3 mr-1 fill-current' />
                      Wishlisted
                    </>
                  ) : (
                    <>
                      <Bookmark className='h-3 w-3 mr-1' />
                      Add to Wishlist
                    </>
                  )}
                </Button>
              </div>

              {/* Secondary Actions - Discrete Purchase Assistance */}
              <div className='flex gap-4 text-xs text-muted-foreground pt-1'>
                <button
                  className='flex items-center gap-1 hover:text-foreground transition-colors'
                  onClick={async e => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Direct to sample search with clean names
                    const searchQuery = encodeURIComponent(
                      `${brandName} ${fragranceName} sample`
                    );
                    window.open(
                      `https://theperfumedcourt.com/search?q=${searchQuery}&ref=scentmatch`,
                      '_blank'
                    );
                  }}
                >
                  <ExternalLink className='h-3 w-3' />
                  Find Samples
                </button>
                <button
                  className='flex items-center gap-1 hover:text-foreground transition-colors'
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Direct to purchase search with clean names
                    const searchQuery = encodeURIComponent(
                      `${brandName} ${fragranceName}`
                    );
                    window.open(
                      `https://www.fragrancex.com/search?search_text=${searchQuery}&ref=scentmatch`,
                      '_blank'
                    );
                  }}
                >
                  <ExternalLink className='h-3 w-3' />
                  Where to Buy
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
