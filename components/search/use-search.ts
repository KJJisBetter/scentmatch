'use client';

import { useState, useCallback, useRef } from 'react';
import { SearchFilters } from './search-filters';

interface Fragrance {
  id: string;
  name: string;
  brand: string;
  scent_family?: string;
  relevance_score?: number;
  sample_available?: boolean;
  sample_price_usd?: number;
  travel_size_available?: boolean;
  travel_size_price_usd?: number;
  image_url?: string;
  description?: string;
  notes?: string[];
  recommended_occasions?: string[];
  recommended_seasons?: string[];
}

interface SearchState {
  query: string;
  results: Fragrance[];
  isLoading: boolean;
  error: string | null;
  filters: SearchFilters;
  totalCount: number;
  hasSearched: boolean;
}

export function useSearch(initialFilters?: Partial<SearchFilters>) {
  const [state, setState] = useState<SearchState>({
    query: '',
    results: [],
    isLoading: false,
    error: null,
    filters: {
      scent_families: initialFilters?.scent_families || [],
      sample_only: initialFilters?.sample_only || false,
      occasions: initialFilters?.occasions || [],
      seasons: initialFilters?.seasons || [],
      brands: initialFilters?.brands || []
    },
    totalCount: 0,
    hasSearched: false
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Build search URL with query and filters
  const buildSearchUrl = useCallback((query: string, filters: SearchFilters) => {
    const params = new URLSearchParams();
    
    if (query.trim()) {
      params.set('q', query.trim());
    }

    if (filters.scent_families.length > 0) {
      params.set('scent_families', filters.scent_families.join(','));
    }

    if (filters.sample_only) {
      params.set('sample_only', 'true');
    }

    if (filters.occasions.length > 0) {
      params.set('occasions', filters.occasions.join(','));
    }

    if (filters.seasons.length > 0) {
      params.set('seasons', filters.seasons.join(','));
    }

    if (filters.brands.length > 0) {
      params.set('brands', filters.brands.join(','));
    }

    // MVP default limit
    params.set('limit', '20');

    return `/api/search?${params.toString()}`;
  }, []);

  // Perform search
  const performSearch = useCallback(async (query: string, filters: SearchFilters) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      query
    }));

    try {
      const url = buildSearchUrl(query, filters);
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        results: data.fragrances || [],
        totalCount: data.total || 0,
        isLoading: false,
        hasSearched: true,
        error: null
      }));

    } catch (error) {
      // Don't set error state for aborted requests
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      console.error('Search error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Search failed',
        results: [],
        totalCount: 0
      }));
    }
  }, [buildSearchUrl]);

  // Handle search query change
  const search = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      query
    }));
    performSearch(query, state.filters);
  }, [performSearch, state.filters]);

  // Handle filters change with URL update for MVP sharing
  const updateFilters = useCallback((newFilters: SearchFilters) => {
    setState(prev => ({
      ...prev,
      filters: newFilters
    }));
    
    // Update URL for MVP sharing functionality
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams();
      
      if (state.query.trim()) {
        params.set('q', state.query.trim());
      }
      
      if (newFilters.sample_only) {
        params.set('sample_only', 'true');
      }
      
      if (newFilters.scent_families.length > 0) {
        params.set('scent_families', newFilters.scent_families.join(','));
      }
      
      if (newFilters.occasions.length > 0) {
        params.set('occasions', newFilters.occasions.join(','));
      }
      
      if (newFilters.seasons.length > 0) {
        params.set('seasons', newFilters.seasons.join(','));
      }
      
      if (newFilters.brands.length > 0) {
        params.set('brands', newFilters.brands.join(','));
      }
      
      // Update URL without reload
      const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
      window.history.replaceState(null, '', newUrl);
    }
    
    performSearch(state.query, newFilters);
  }, [performSearch, state.query]);

  // Clear search
  const clearSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      query: '',
      results: [],
      isLoading: false,
      error: null,
      filters: {
        scent_families: [],
        sample_only: false,
        occasions: [],
        seasons: [],
        brands: []
      },
      totalCount: 0,
      hasSearched: false
    });
  }, []);

  // Handle suggestion selection
  const selectSuggestion = useCallback((suggestion: { text: string; type: string }) => {
    search(suggestion.text);
  }, [search]);

  return {
    // State
    query: state.query,
    results: state.results,
    isLoading: state.isLoading,
    error: state.error,
    filters: state.filters,
    totalCount: state.totalCount,
    hasSearched: state.hasSearched,

    // Actions
    search,
    updateFilters,
    clearSearch,
    selectSuggestion
  };
}