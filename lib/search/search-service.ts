/**
 * Unified Search Service using Fuse.js
 *
 * Replaces complex custom search logic with fast, accurate fuzzy search.
 * Provides consistent relevance scoring and result highlighting.
 */

import Fuse, { type IFuseOptions, type FuseResult } from 'fuse.js';
import { createServiceSupabase } from '@/lib/supabase/service';
import {
  fuseConfig,
  exactMatchConfig,
  discoveryConfig,
  suggestionConfig,
  transformFragranceForSearch,
  performanceConfig,
  type FragranceSearchItem,
  type SearchableFragrance,
} from './fuse-config';

export interface SearchOptions {
  mode?: 'standard' | 'exact' | 'discovery' | 'suggestions';
  limit?: number;
  filters?: {
    scent_families?: string[];
    gender?: string[];
    occasions?: string[];
    seasons?: string[];
    sample_only?: boolean;
    min_rating?: number;
    max_price?: number;
  };
  include_highlights?: boolean;
  boost_popular?: boolean;
}

export interface SearchResult {
  fragrance: FragranceSearchItem;
  score: number; // 0-1, higher is better match
  highlights?: MatchHighlight[];
  match_reason?: string;
}

export interface MatchHighlight {
  field: string;
  value: string;
  indices: [number, number][];
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  search_time_ms: number;
  metadata: {
    mode: string;
    filters_applied: boolean;
    cache_hit: boolean;
    highlighting_enabled: boolean;
  };
}

export interface SuggestionResult {
  text: string;
  type: 'fragrance' | 'brand' | 'note' | 'family';
  confidence: number;
  result_count?: number;
}

/**
 * Main Search Service Class
 */
export class FuseSearchService {
  private supabase = createServiceSupabase();
  private searchIndex: Fuse<SearchableFragrance> | null = null;
  private suggestionIndex: Fuse<SearchableFragrance> | null = null;
  private dataCache: SearchableFragrance[] = [];
  private resultCache = new Map<
    string,
    { result: SearchResponse; timestamp: number }
  >();
  private lastDataUpdate = 0;

  constructor() {
    this.initializeIndexes();
  }

  /**
   * Main search method - replaces complex search route logic
   */
  async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    const normalizedQuery = query.trim().toLowerCase();

    // Check cache first
    const cacheKey = this.generateCacheKey(normalizedQuery, options);
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return {
        ...cached,
        metadata: { ...cached.metadata, cache_hit: true },
      };
    }

    // Ensure we have fresh data
    await this.ensureDataFreshness();

    // Initialize search index if needed
    if (!this.searchIndex) {
      await this.initializeIndexes();
    }

    if (!this.searchIndex) {
      throw new Error('Search index not available');
    }

    // Get the appropriate config based on mode
    const config = this.getConfigForMode(options.mode || 'standard');

    // Update search index with new config if needed
    if (config !== fuseConfig) {
      this.searchIndex.setCollection(this.dataCache, config);
    }

    // Perform the search
    const fuseResults = this.searchIndex.search(normalizedQuery);

    // Apply filters
    const filteredResults = this.applyFilters(fuseResults, options.filters);

    // Transform and enhance results
    const searchResults = this.transformFuseResults(
      filteredResults,
      normalizedQuery,
      options
    );

    // Apply limit
    const limitedResults = searchResults.slice(0, options.limit || 20);

    // Build response
    const response: SearchResponse = {
      results: limitedResults,
      total: searchResults.length,
      query,
      search_time_ms: Date.now() - startTime,
      metadata: {
        mode: options.mode || 'standard',
        filters_applied:
          !!options.filters && Object.keys(options.filters).length > 0,
        cache_hit: false,
        highlighting_enabled: options.include_highlights || false,
      },
    };

    // Cache the result
    this.cacheResult(cacheKey, response);

    return response;
  }

  /**
   * Generate search suggestions for autocomplete
   */
  async getSuggestions(query: string, limit = 8): Promise<SuggestionResult[]> {
    if (!query || query.length < 2) return [];

    await this.ensureDataFreshness();

    if (!this.suggestionIndex) {
      this.suggestionIndex = new Fuse(this.dataCache, suggestionConfig);
    }

    const results = this.suggestionIndex.search(query, { limit });

    return this.transformSuggestionResults(results, query);
  }

  /**
   * Get search result highlights for better UX
   */
  getHighlights(
    fuseResult: FuseResult<SearchableFragrance>,
    query: string
  ): MatchHighlight[] {
    if (!fuseResult.matches) return [];

    return fuseResult.matches.map(match => ({
      field: match.key || 'unknown',
      value: match.value || '',
      indices: match.indices || [],
    }));
  }

  /**
   * Initialize search indexes with current data
   */
  private async initializeIndexes(): Promise<void> {
    try {
      // Load fragrance data from database
      const { data: fragrances, error } = await (this.supabase as any)
        .from('fragrances')
        .select(
          `
          id,
          name,
          brand_id,
          fragrance_family,
          main_accords,
          top_notes,
          middle_notes,
          base_notes,
          gender,
          full_description,
          popularity_score,
          rating_value,
          sample_available,
          sample_price_usd,
          launch_year,
          fragrance_brands!inner(name)
        `
        )
        .eq('sample_available', true); // Focus on available samples for MVP

      if (error) {
        console.error('Failed to load fragrance data for search:', error);
        return;
      }

      // Transform data for search optimization
      this.dataCache = (fragrances || []).map(fragrance =>
        transformFragranceForSearch({
          ...fragrance,
          brand: fragrance.fragrance_brands?.name || fragrance.brand_id,
          scent_family: fragrance.fragrance_family,
          notes_top: fragrance.top_notes,
          notes_middle: fragrance.middle_notes,
          notes_base: fragrance.base_notes,
          description: fragrance.full_description,
          year_released: fragrance.launch_year,
        })
      );

      // Create search indexes
      this.searchIndex = new Fuse(this.dataCache, fuseConfig);
      this.suggestionIndex = new Fuse(this.dataCache, suggestionConfig);

      this.lastDataUpdate = Date.now();

      console.log(
        `Search service initialized with ${this.dataCache.length} fragrances`
      );
    } catch (error) {
      console.error('Error initializing search indexes:', error);
    }
  }

  /**
   * Ensure data is fresh (reload if needed)
   */
  private async ensureDataFreshness(): Promise<void> {
    const fiveMinutes = 5 * 60 * 1000;
    const now = Date.now();

    if (
      now - this.lastDataUpdate > fiveMinutes ||
      this.dataCache.length === 0
    ) {
      await this.initializeIndexes();
    }
  }

  /**
   * Get config based on search mode
   */
  private getConfigForMode(mode: string): IFuseOptions<SearchableFragrance> {
    switch (mode) {
      case 'exact':
        return exactMatchConfig;
      case 'discovery':
        return discoveryConfig;
      case 'suggestions':
        return suggestionConfig;
      default:
        return fuseConfig;
    }
  }

  /**
   * Apply filters to search results
   */
  private applyFilters(
    results: FuseResult<SearchableFragrance>[],
    filters?: SearchOptions['filters']
  ): FuseResult<SearchableFragrance>[] {
    if (!filters) return results;

    return results.filter(result => {
      const fragrance = result.item;

      // Scent family filter
      if (filters.scent_families?.length && fragrance.scent_family) {
        if (!filters.scent_families.includes(fragrance.scent_family)) {
          return false;
        }
      }

      // Gender filter
      if (filters.gender?.length && fragrance.gender) {
        if (!filters.gender.includes(fragrance.gender)) {
          return false;
        }
      }

      // Sample only filter
      if (filters.sample_only && !fragrance.sample_available) {
        return false;
      }

      // Rating filter
      if (filters.min_rating && fragrance.rating_value) {
        if (fragrance.rating_value < filters.min_rating) {
          return false;
        }
      }

      // Price filter
      if (filters.max_price && fragrance.sample_price_usd) {
        if (fragrance.sample_price_usd > filters.max_price) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Transform Fuse results into SearchResult format
   */
  private transformFuseResults(
    fuseResults: FuseResult<SearchableFragrance>[],
    query: string,
    options: SearchOptions
  ): SearchResult[] {
    return fuseResults.map(fuseResult => {
      const score = fuseResult.score ? 1 - fuseResult.score : 1; // Fuse score is distance, we want similarity

      // Generate match reason
      const matchReason = this.generateMatchReason(fuseResult, query);

      // Get highlights if requested
      const highlights = options.include_highlights
        ? this.getHighlights(fuseResult, query)
        : undefined;

      // Apply popularity boost if requested
      const finalScore =
        options.boost_popular && fuseResult.item.popularity_score
          ? score + fuseResult.item.popularity_score * 0.001 // Small boost for popular items
          : score;

      return {
        fragrance: fuseResult.item,
        score: Math.min(1, finalScore), // Cap at 1.0
        highlights,
        match_reason: matchReason,
      };
    });
  }

  /**
   * Transform Fuse results into suggestion format
   */
  private transformSuggestionResults(
    fuseResults: FuseResult<SearchableFragrance>[],
    query: string
  ): SuggestionResult[] {
    const suggestions: SuggestionResult[] = [];
    const seen = new Set<string>();

    fuseResults.forEach(result => {
      const fragrance = result.item;
      const score = result.score ? 1 - result.score : 1;

      // Add fragrance name suggestion
      if (!seen.has(fragrance.name.toLowerCase())) {
        suggestions.push({
          text: fragrance.name,
          type: 'fragrance',
          confidence: score,
        });
        seen.add(fragrance.name.toLowerCase());
      }

      // Add brand suggestion
      if (!seen.has(fragrance.brand.toLowerCase())) {
        suggestions.push({
          text: fragrance.brand,
          type: 'brand',
          confidence: score * 0.8, // Slightly lower confidence for brand matches
        });
        seen.add(fragrance.brand.toLowerCase());
      }
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 8);
  }

  /**
   * Generate human-readable match reason
   */
  private generateMatchReason(
    fuseResult: FuseResult<SearchableFragrance>,
    query: string
  ): string {
    if (!fuseResult.matches || fuseResult.matches.length === 0) {
      return 'General match';
    }

    const primaryMatch = fuseResult.matches[0];
    const field = primaryMatch.key;

    switch (field) {
      case 'name':
        return 'Fragrance name match';
      case 'brand':
        return 'Brand match';
      case 'brand_variants':
        return 'Brand variation match';
      case 'scent_family':
        return 'Scent family match';
      case 'main_accords':
        return 'Scent accord match';
      case 'notes_top':
      case 'notes_middle':
      case 'notes_base':
        return 'Fragrance notes match';
      case 'note_combinations':
        return 'Note combination match';
      default:
        return 'Content match';
    }
  }

  /**
   * Cache management
   */
  private generateCacheKey(query: string, options: SearchOptions): string {
    return `search:${query}:${JSON.stringify(options)}`;
  }

  private getCachedResult(key: string): SearchResponse | null {
    const cached = this.resultCache.get(key);
    if (!cached) return null;

    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() - cached.timestamp > fiveMinutes) {
      this.resultCache.delete(key);
      return null;
    }

    return cached.result;
  }

  private cacheResult(key: string, result: SearchResponse): void {
    // Limit cache size
    if (this.resultCache.size >= performanceConfig.cacheSize) {
      const firstKey = this.resultCache.keys().next().value;
      this.resultCache.delete(firstKey);
    }

    this.resultCache.set(key, {
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all caches (useful for data updates)
   */
  clearCache(): void {
    this.resultCache.clear();
    this.searchIndex = null;
    this.suggestionIndex = null;
    this.dataCache = [];
  }

  /**
   * Get search statistics (for debugging/monitoring)
   */
  getStats() {
    return {
      indexed_fragrances: this.dataCache.length,
      cache_size: this.resultCache.size,
      last_data_update: new Date(this.lastDataUpdate).toISOString(),
      search_index_ready: !!this.searchIndex,
      suggestion_index_ready: !!this.suggestionIndex,
    };
  }
}

// Export singleton instance
export const searchService = new FuseSearchService();
