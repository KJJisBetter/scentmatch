'use client';

import React, { Suspense } from 'react';
import { SearchSkeleton } from '@/components/ui/skeletons';
import { SearchFilters } from './search-filters';

interface SearchFiltersStreamingProps {
  onFiltersChange: (filters: any) => void;
  initialFilters?: any;
  className?: string;
}

// Search filters component - optimized for performance
function SearchFiltersData({
  onFiltersChange,
  initialFilters,
}: {
  onFiltersChange: (filters: any) => void;
  initialFilters?: any;
}) {
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
