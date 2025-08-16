'use client';

import React from 'react';
import { SearchInput } from './search-input';
import { SearchFilters } from './search-filters';
import { SearchResults } from './search-results';
import { useSearch } from './use-search';

interface SearchPageProps {
  initialQuery?: string;
  initialFilters?: Partial<import('./search-filters').SearchFilters>;
  className?: string;
}

export function SearchPage({ initialQuery = "", initialFilters = {}, className = "" }: SearchPageProps) {
  const {
    query,
    results,
    isLoading,
    error,
    filters,
    totalCount,
    hasSearched,
    search,
    updateFilters,
    selectSuggestion
  } = useSearch(initialFilters);

  // Initialize with query if provided
  React.useEffect(() => {
    if (initialQuery && !hasSearched) {
      search(initialQuery);
    }
  }, [initialQuery, search, hasSearched]);

  // Handle collection actions (MVP placeholders)
  const handleAddToCollection = (fragranceId: string) => {
    console.log('Add to collection:', fragranceId);
    // TODO: Implement collection functionality
  };

  const handleAddToWishlist = (fragranceId: string) => {
    console.log('Add to wishlist:', fragranceId);
    // TODO: Implement wishlist functionality
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header with search */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
              Find Your Perfect Fragrance
            </h1>
            <SearchInput
              defaultValue={initialQuery}
              onSearch={search}
              onSuggestionSelect={selectSuggestion}
              placeholder="Search by fragrance name, brand, or notes..."
            />
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filters sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <SearchFilters onFiltersChange={updateFilters} />
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 mt-8 lg:mt-0">
            <SearchResults
              fragrances={results}
              isLoading={isLoading}
              query={query}
              onAddToCollection={handleAddToCollection}
              onAddToWishlist={handleAddToWishlist}
            />
          </div>
        </div>
      </div>
    </div>
  );
}