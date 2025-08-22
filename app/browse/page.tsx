import React, { Suspense } from 'react';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';

// Dynamic import for large browse client (599 lines) - bundle optimization
const FragranceBrowseClient = dynamic(
  () => import('@/components/browse/fragrance-browse-client').then(mod => ({ default: mod.FragranceBrowseClient })),
  {
    loading: () => (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border p-6">
                <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  }
);
import { createServerSupabase } from '@/lib/supabase/server';
import { normalizeBrandName } from '@/lib/brand-utils';

export const metadata: Metadata = {
  title: 'Browse Fragrances | ScentMatch',
  description:
    'Discover your perfect fragrance with our AI-powered search and filtering system. Try samples first, buy with confidence.',
  keywords: 'fragrance, perfume, cologne, search, samples, discovery',
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
  id: string;
  fragrance_id?: number | string;
  name: string;
  brand: string;
  brand_id: string;
  scent_family: string;
  relevance_score: number;
  description?: string;
  sample_price_usd?: number;
  sample_available?: boolean;
  popularity_score?: number;
  gender?: string;
  collection_status?: string[];
  in_collection?: boolean;
  in_wishlist?: boolean;
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
  sorting_strategy?: 'popularity' | 'personalized';
  user_collection_size?: number;
  metadata?: {
    processing_time_ms: number;
    authenticated: boolean;
    personalized: boolean;
  };
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
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'http://localhost:3000';

    // If user is searching or filtering, use search API
    if (params.q || params.brand || params.family || params.sample_only) {
      const searchParams = new URLSearchParams();

      if (params.q) searchParams.set('q', params.q);
      if (params.brand) searchParams.set('brand', params.brand);
      if (params.family) searchParams.set('scent_families', params.family);
      if (params.sample_only)
        searchParams.set('sample_only', params.sample_only);
      if (params.price_min) searchParams.set('price_min', params.price_min);
      if (params.price_max) searchParams.set('price_max', params.price_max);

      // Default to 20 items per page for MVP
      searchParams.set('limit', '20');

      const response = await fetch(
        `${baseUrl}/api/search?${searchParams.toString()}`,
        {
          next: { revalidate: 300 }, // Cache for 5 minutes
        }
      );

      if (!response.ok) {
        throw new Error(`Search API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    }

    // For general browsing (no search query), get popular fragrances directly
    // Avoid server-side fetch issues by calling database directly
    const supabase = await createServerSupabase();

    try {
      // Get balanced representation across genders instead of pure popularity
      const [menResults, womenResults, unisexResults] = await Promise.all([
        // Get top men's fragrances
        (supabase as any)
          .from('fragrances')
          .select(
            `
            id,
            name,
            brand_id,
            gender,
            popularity_score,
            rating_value,
            rating_count,
            sample_available,
            sample_price_usd,
            fragrance_brands!inner(name)
          `
          )
          .eq('gender', 'men')
          .order('popularity_score', { ascending: false })
          .order('rating_value', { ascending: false })
          .limit(10),

        // Get top women's fragrances
        (supabase as any)
          .from('fragrances')
          .select(
            `
            id,
            name,
            brand_id,
            gender,
            popularity_score,
            rating_value,
            rating_count,
            sample_available,
            sample_price_usd,
            fragrance_brands!inner(name)
          `
          )
          .eq('gender', 'women')
          .order('popularity_score', { ascending: false })
          .order('rating_value', { ascending: false })
          .limit(6),

        // Get top unisex fragrances
        (supabase as any)
          .from('fragrances')
          .select(
            `
            id,
            name,
            brand_id,
            gender,
            popularity_score,
            rating_value,
            rating_count,
            sample_available,
            sample_price_usd,
            fragrance_brands!inner(name)
          `
          )
          .eq('gender', 'unisex')
          .order('popularity_score', { ascending: false })
          .order('rating_value', { ascending: false })
          .limit(4),
      ]);

      // Check for errors
      if (menResults.error || womenResults.error || unisexResults.error) {
        throw new Error(
          `Database error: ${menResults.error?.message || womenResults.error?.message || unisexResults.error?.message}`
        );
      }

      // Combine and shuffle for balanced representation
      const popular = [
        ...(menResults.data || []),
        ...(womenResults.data || []),
        ...(unisexResults.data || []),
      ]
        // Re-sort by popularity to maintain quality while ensuring gender balance
        .sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0));

      console.log(
        '🔥 Direct database query - got',
        popular?.length || 0,
        'popular fragrances'
      );

      const fragrances =
        popular?.map((result: any) => {
          const rawBrandName = result.fragrance_brands?.name || 'Unknown Brand';
          const fragranceName = result.name || '';

          // Apply intelligent brand detection using both brand and fragrance name
          const fragLower = fragranceName.toLowerCase();
          let displayBrand = rawBrandName;

          // Emporio detection from fragrance name
          if (fragLower.includes('emporio')) {
            displayBrand = 'Emporio Armani';
          } else {
            // Use existing brand normalization
            displayBrand = rawBrandName; // Use raw brand name for now
          }

          return {
            id: result.id,
            name: result.name,
            brand: displayBrand,
            brand_id: result.brand_id,
            gender: result.gender || 'unisex',
            scent_family: result.gender || 'Fragrance',
            popularity_score: result.popularity_score || 0,
            rating_value: result.rating_value || 0,
            rating_count: result.rating_count || 0,
            relevance_score: 0.7,
            sample_available: result.sample_available ?? true,
            sample_price_usd: result.sample_price_usd || 15,
          };
        }) || [];

      return {
        fragrances,
        total: fragrances.length,
        query: '',
        filters_applied: {
          scent_families: [],
          sample_only: false,
          occasions: [],
          seasons: [],
        },
        sorting_strategy: 'popularity',
        user_collection_size: 0,
        metadata: {
          processing_time_ms: 0,
          authenticated: false,
          personalized: false,
        },
      };
    } catch (dbError) {
      console.error('🔥 Direct database error:', dbError);
      throw dbError;
    }
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
      message: 'Browse temporarily unavailable',
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
        error: 'Filter data temporarily unavailable',
      },
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
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='container mx-auto px-4 py-6'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-foreground mb-2'>
              {fragranceData.sorting_strategy === 'personalized'
                ? 'Your Personal Fragrance Recommendations'
                : 'Discover Your Perfect Fragrance'}
            </h1>
            <p className='text-muted-foreground'>
              {fragranceData.sorting_strategy === 'personalized'
                ? `Based on your collection of ${fragranceData.user_collection_size} fragrances`
                : filterOptions.metadata.total_fragrances > 0
                  ? `Browse ${filterOptions.metadata.total_fragrances.toLocaleString()} real fragrances`
                  : 'Build your collection to get personalized recommendations'}
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
    <div className='container mx-auto px-4 py-8' data-testid='loading-skeleton'>
      <div className='grid lg:grid-cols-4 gap-6'>
        {/* Filter skeleton */}
        <div className='lg:col-span-1'>
          <div className='space-y-4'>
            <div className='h-6 bg-muted animate-pulse rounded' />
            <div className='h-4 bg-muted animate-pulse rounded w-3/4' />
            <div className='h-4 bg-muted animate-pulse rounded w-1/2' />
          </div>
        </div>

        {/* Results skeleton */}
        <div className='lg:col-span-3'>
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`browse-skeleton-${i}`} className='space-y-3'>
                <div className='aspect-square bg-muted animate-pulse rounded-lg' />
                <div className='h-4 bg-muted animate-pulse rounded' />
                <div className='h-4 bg-muted animate-pulse rounded w-2/3' />
                <div className='h-3 bg-muted animate-pulse rounded w-1/2' />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
