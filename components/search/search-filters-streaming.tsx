'use client';

import React, { Suspense } from 'react';
import { SearchSkeleton } from '@/components/ui/skeletons';
import { SearchFilters } from './search-filters';

interface SearchFiltersStreamingProps {
  onFiltersChange: (filters: any) => void;
  initialFilters?: any;
  className?: string;
}

// Async component for filters (if they need to load data)
async function SearchFiltersData({
  onFiltersChange,
  initialFilters,
}: {
  onFiltersChange: (filters: any) => void;
  initialFilters?: any;
}) {
  // Small delay to demonstrate progressive loading
  await new Promise(resolve => setTimeout(resolve, 30));

  return <SearchFilters onFiltersChange={onFiltersChange} />;
}

function SearchFiltersFallback() {
  return <SearchSkeleton variant='filters' />;
}

export function SearchFiltersStreaming({
  onFiltersChange,
  initialFilters,
  className = '',
}: SearchFiltersStreamingProps) {
  return (
    <div className={className}>
      <Suspense fallback={<SearchFiltersFallback />}>
        <SearchFiltersData
          onFiltersChange={onFiltersChange}
          initialFilters={initialFilters}
        />
      </Suspense>
    </div>
  );
}
