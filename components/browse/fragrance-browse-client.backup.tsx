'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Filter, 
  Star, 
  ShoppingCart, 
  Heart,
  MapPin,
  Clock,
  DollarSign,
  Package,
  AlertCircle,
  RefreshCw,
  X
} from 'lucide-react';

interface FragranceResult {
  fragrance_id: number;
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
  price_ranges: Array<{ min: number; max: number; label: string; count: number }>;
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
  initialParams 
}: FragranceBrowseClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [fragrances, setFragrances] = useState<SearchResponse>(initialFragrances);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialParams.q || '');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [selectedBrand, setSelectedBrand] = useState(initialParams.brand || '');
  const [selectedFamily, setSelectedFamily] = useState(initialParams.family || '');
  const [sampleOnly, setSampleOnly] = useState(initialParams.sample_only === 'true');

  // Build current search URL
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
  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Build search URL parameters
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedBrand) params.set('brand', selectedBrand);
      if (selectedFamily) params.set('scent_families', selectedFamily);
      if (sampleOnly) params.set('sample_only', 'true');
      params.set('limit', '20');
      
      // Fetch new results from API
      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();
      
      // Update local state with new results
      setFragrances(data);
      
      // Update URL for shareable links
      const url = buildSearchUrl({
        q: searchQuery,
        brand: selectedBrand,
        family: selectedFamily,
        sample_only: sampleOnly ? 'true' : '',
      });
      
      router.push(url);
    } catch (error) {
      console.error('Search error:', error);
      // Keep existing results on error
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedBrand, selectedFamily, sampleOnly, buildSearchUrl, router]);

  // Handle filter changes
  const handleFilterChange = useCallback((filterType: string, value: string) => {
    const newParams: Record<string, string> = {
      q: searchQuery,
    };

    if (filterType === 'brand') {
      setSelectedBrand(value);
      newParams.brand = value;
    } else if (filterType === 'family') {
      setSelectedFamily(value);
      newParams.family = value;
    }

    newParams.sample_only = sampleOnly ? 'true' : '';

    const url = buildSearchUrl(newParams);
    router.push(url);
  }, [searchQuery, sampleOnly, buildSearchUrl, router]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedBrand('');
    setSelectedFamily('');
    setSampleOnly(false);
    setSearchQuery('');
    router.push('/browse');
  }, [router]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedBrand) count++;
    if (selectedFamily) count++;
    if (sampleOnly) count++;
    return count;
  }, [selectedBrand, selectedFamily, sampleOnly]);

  const hasResults = fragrances.fragrances && fragrances.fragrances.length > 0;
  const hasQuery = searchQuery.trim().length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Bar */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search fragrances by name, brand, or accords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Search'}
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filter
            {activeFilterCount > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </form>

        {/* Current search display */}
        {hasQuery && (
          <div className="text-center mt-4">
            <p className="text-muted-foreground">
              Searching for: <span className="font-medium text-foreground">"{searchQuery}"</span>
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setSearchQuery('');
                router.push('/browse');
              }}
              className="mt-1 text-xs"
            >
              Clear search
            </Button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className={`lg:col-span-1 ${showFilters || activeFilterCount > 0 ? 'block' : 'hidden lg:block'}`}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground">Filter by</h3>
              {activeFilterCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear all
                </Button>
              )}
            </div>

            {/* Sample Availability */}
            <div>
              <Label className="text-sm font-medium text-foreground">Availability</Label>
              <div className="mt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sampleOnly}
                    onChange={(e) => {
                      setSampleOnly(e.target.checked);
                      handleFilterChange('sample_only', e.target.checked ? 'true' : '');
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">Samples Available</span>
                  <Badge variant="secondary" className="text-xs">
                    {filterOptions.metadata.samples_available}
                  </Badge>
                </label>
              </div>
            </div>

            {/* Brand Filter */}
            {filterOptions.brands && filterOptions.brands.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-foreground">Brand</Label>
                <select
                  value={selectedBrand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  className="w-full mt-2 p-2 border border-input rounded-md bg-background"
                >
                  <option value="">All brands</option>
                  {filterOptions.brands.map((brand) => (
                    <option key={brand.value} value={brand.value}>
                      {brand.label} ({brand.count})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Fragrance Family Filter */}
            {filterOptions.scent_families && filterOptions.scent_families.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-foreground">Fragrance Family</Label>
                <select
                  value={selectedFamily}
                  onChange={(e) => handleFilterChange('family', e.target.value)}
                  className="w-full mt-2 p-2 border border-input rounded-md bg-background"
                >
                  <option value="">All families</option>
                  {filterOptions.scent_families.map((family) => (
                    <option key={family.value} value={family.value}>
                      {family.label} ({family.count})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Price Ranges */}
            {filterOptions.price_ranges && filterOptions.price_ranges.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-foreground">Sample Price Range</Label>
                <div className="mt-2 space-y-2">
                  {filterOptions.price_ranges.map((range) => (
                    <div key={`${range.min}-${range.max}`} className="flex items-center justify-between text-sm">
                      <span>{range.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {range.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          {/* Results header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-medium text-foreground">
                {hasResults ? (
                  <>
                    {fragrances.total} fragrance{fragrances.total !== 1 ? 's' : ''} found
                    {hasQuery && ` for "${searchQuery}"`}
                  </>
                ) : hasQuery ? (
                  `No results for "${searchQuery}"`
                ) : (
                  'Browse Fragrances'
                )}
              </h2>
              {fragrances.fallback && fragrances.message && (
                <p className="text-sm text-muted-foreground mt-1">
                  {fragrances.message}
                </p>
              )}
            </div>
          </div>

          {/* Error State */}
          {fragrances.fallback && fragrances.total === 0 && fragrances.message?.includes('unavailable') && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Something went wrong</h3>
              <p className="text-muted-foreground mb-4">
                We're having trouble loading fragrances right now. Please try again.
              </p>
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try again
              </Button>
            </div>
          )}

          {/* No Results State */}
          {!fragrances.fallback && fragrances.total === 0 && hasQuery && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No fragrances found</h3>
              <p className="text-muted-foreground mb-4">
                Try different search terms or adjust your filters.
              </p>
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    router.push('/browse');
                  }}
                >
                  Clear search
                </Button>
                <Button onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="loading-skeleton">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={`loading-skeleton-${i}`}>
                  <CardContent className="p-4">
                    <Skeleton className="aspect-square w-full mb-3 rounded" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Fragrance Grid */}
          {hasResults && !isLoading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="fragrance-grid">
              {fragrances.fragrances.map((fragrance) => (
                <FragranceCard key={fragrance.fragrance_id} fragrance={fragrance} />
              ))}
            </div>
          )}

          {/* Empty State for Browse Page */}
          {!hasResults && !hasQuery && !isLoading && !fragrances.fallback && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Start your fragrance discovery</h3>
              <p className="text-muted-foreground mb-4">
                Search for fragrances by name, brand, or scent notes to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Individual Fragrance Card Component
function FragranceCard({ fragrance }: { fragrance: FragranceResult }) {
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Create a placeholder image URL based on fragrance ID for consistent placeholders
  const placeholderImage = `https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop&q=80`;
  
  // Mock some additional data for better display
  const mockRating = Math.max(3.5, Math.min(5.0, 4.0 + (fragrance.relevance_score * 0.8)));
  const mockReviews = Math.floor(100 + (fragrance.fragrance_id * 23) % 900);
  const mockPrice = fragrance.sample_price_usd || (5 + (fragrance.fragrance_id % 15));

  return (
    <Card className="group hover:shadow-medium transition-all duration-300 overflow-hidden">
      <CardContent className="p-0">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={imageError ? placeholderImage : placeholderImage}
            alt={`${fragrance.name} fragrance`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Like button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsLiked(!isLiked);
            }}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur hover:bg-white transition-colors"
          >
            <Heart 
              className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
            />
          </button>

          {/* Sample available badge */}
          {fragrance.sample_available && (
            <Badge 
              className="absolute top-3 left-3 bg-green-600 text-white"
            >
              Sample Available
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="space-y-2">
            {/* Brand and Name */}
            <div>
              <p className="text-sm text-muted-foreground font-medium">{fragrance.brand}</p>
              <h3 className="font-medium text-foreground line-clamp-1">{fragrance.name}</h3>
            </div>

            {/* Family and Rating */}
            <div className="flex items-center justify-between text-sm">
              <Badge variant="secondary">{fragrance.scent_family}</Badge>
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-muted-foreground">{mockRating.toFixed(1)}</span>
                <span className="text-muted-foreground">({mockReviews})</span>
              </div>
            </div>

            {/* Price and Action */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm">
                {fragrance.sample_available ? (
                  <span className="font-medium text-foreground">
                    ${mockPrice} sample
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    View details
                  </span>
                )}
              </div>
              <Button size="sm" className="shrink-0">
                <ShoppingCart className="h-3 w-3 mr-1" />
                {fragrance.sample_available ? 'Try Sample' : 'Learn More'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}