import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { FragranceBrowseClient } from '@/components/browse/fragrance-browse-client';
import { createServerSupabase } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'Browse Fragrances | ScentMatch',
  description: 'Discover your perfect fragrance with our AI-powered search and filtering system. Try samples first, buy with confidence.',
  keywords: 'fragrance, perfume, cologne, search, samples, discovery'
};

interface BrowsePageProps {
  searchParams: Promise<{
    q?: string;
    brand?: string;
    family?: string;
    price_min?: string;
    price_max?: string;
    sample_only?: string;
    page?: string;
  }>;
}

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
  filters_applied: {
    scent_families: string[];
    sample_only: boolean;
    occasions: string[];
    seasons: string[];
  };
  fallback?: boolean;
  message?: string;
}

async function getFragrances(params: {
  q?: string;
  brand?: string;
  family?: string;
  price_min?: string;
  price_max?: string;
  sample_only?: string;
  page?: string;
}): Promise<SearchResponse> {
  try {
    const searchParams = new URLSearchParams();
    
    if (params.q) searchParams.set('q', params.q);
    if (params.brand) searchParams.set('brand', params.brand);
    if (params.family) searchParams.set('scent_families', params.family);
    if (params.sample_only) searchParams.set('sample_only', params.sample_only);
    if (params.price_min) searchParams.set('price_min', params.price_min);
    if (params.price_max) searchParams.set('price_max', params.price_max);
    
    // Default to 20 items per page for MVP
    searchParams.set('limit', '20');
    
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/search?${searchParams.toString()}`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Search API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching fragrances:', error);
    
    // Return fallback empty state
    return {
      fragrances: [],
      total: 0,
      query: params.q || '',
      filters_applied: {
        scent_families: [],
        sample_only: false,
        occasions: [],
        seasons: [],
      },
      fallback: true,
      message: 'Search temporarily unavailable',
    };
  }
}

async function getFilterOptions() {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/search/filters`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Filters API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching filter options:', error);
    
    // Return fallback empty filters
    return {
      scent_families: [],
      brands: [],
      occasions: [],
      seasons: [],
      price_ranges: [],
      availability: [],
      metadata: {
        total_fragrances: 0,
        samples_available: 0,
        last_updated: new Date().toISOString(),
        error: 'Filter data temporarily unavailable'
      }
    };
  }
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  
  // Fetch data in parallel
  const [fragranceData, filterOptions] = await Promise.all([
    getFragrances(params),
    getFilterOptions(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Discover Your Perfect Fragrance
            </h1>
            <p className="text-muted-foreground">
              {filterOptions.metadata.total_fragrances > 0 
                ? `Browse ${filterOptions.metadata.total_fragrances.toLocaleString()} real fragrances`
                : 'Loading fragrance collection...'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Suspense fallback={<BrowsePageSkeleton />}>
        <FragranceBrowseClient 
          initialFragrances={fragranceData}
          filterOptions={filterOptions}
          initialParams={params}
        />
      </Suspense>
    </div>
  );
}

// Loading skeleton component
function BrowsePageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8" data-testid="loading-skeleton">
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Filter skeleton */}
        <div className="lg:col-span-1">
          <div className="space-y-4">
            <div className="h-6 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          </div>
        </div>
        
        {/* Results skeleton */}
        <div className="lg:col-span-3">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`browse-skeleton-${i}`} className="space-y-3">
                <div className="aspect-square bg-muted animate-pulse rounded-lg" />
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}