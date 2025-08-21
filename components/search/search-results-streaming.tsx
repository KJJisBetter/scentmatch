'use client';

import React, { Suspense } from 'react';
import {
  SearchSkeleton,
  SearchResultsLoadingSkeleton,
} from '@/components/ui/skeletons';
import { SearchResults } from './search-results';

interface SearchResultsStreamingProps {
  fragrances: any[];
  isLoading: boolean;
  query: string;
  totalCount?: number;
  onAddToCollection: (fragranceId: string) => void;
  onAddToWishlist: (fragranceId: string) => void;
  className?: string;
}

// Async component for progressive search results
async function SearchResultsData({
  fragrances,
  query,
  onAddToCollection,
  onAddToWishlist,
}: {
  fragrances: any[];
  query: string;
  onAddToCollection: (fragranceId: string) => void;
  onAddToWishlist: (fragranceId: string) => void;
}) {
  // Simulate progressive loading with small delay
  await new Promise(resolve => setTimeout(resolve, 50));

  return (
    <SearchResults
      fragrances={fragrances}
      isLoading={false}
      query={query}
      onAddToCollection={onAddToCollection}
      onAddToWishlist={onAddToWishlist}
    />
  );
}

function SearchResultsFallback() {
  return <SearchResultsLoadingSkeleton />;
}

export function SearchResultsStreaming({
  fragrances,
  isLoading,
  query,
  totalCount,
  onAddToCollection,
  onAddToWishlist,
  className = '',
}: SearchResultsStreamingProps) {
  if (isLoading) {
    return <SearchResultsLoadingSkeleton />;
  }

  if (!query) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className='text-muted-foreground'>
          <p className='text-lg mb-2'>Start your fragrance journey</p>
          <p>
            Search for fragrances by name, brand, or notes to discover your
            perfect scent
          </p>
        </div>
      </div>
    );
  }

  if (fragrances.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className='text-muted-foreground'>
          <p className='text-lg mb-2'>No fragrances found</p>
          <p>Try searching with different terms or browse our collection</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Suspense fallback={<SearchResultsFallback />}>
        <SearchResultsData
          fragrances={fragrances}
          query={query}
          onAddToCollection={onAddToCollection}
          onAddToWishlist={onAddToWishlist}
        />
      </Suspense>
    </div>
  );
}
