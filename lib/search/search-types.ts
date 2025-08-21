/**
 * TypeScript interfaces for Fuse.js search system
 *
 * Centralized type definitions for search functionality,
 * results, filters, and configuration.
 */

export interface FragranceBase {
  id: string;
  name: string;
  brand: string;
  brand_id?: string;
  scent_family?: string;
  gender?: 'men' | 'women' | 'unisex';
  description?: string;
  year_released?: number;
  sample_available?: boolean;
  sample_price_usd?: number;
  popularity_score?: number;
  rating_value?: number;
  rating_count?: number;
}

export interface FragranceNotes {
  notes_top?: string[];
  notes_middle?: string[];
  notes_base?: string[];
  main_accords?: string[];
}

export interface FragranceSearchData extends FragranceBase, FragranceNotes {
  // Enhanced search fields
  searchable_text?: string;
  brand_variants?: string[];
  note_combinations?: string[];
  accent_keywords?: string[];
}

export interface SearchFilters {
  scent_families?: string[];
  gender?: ('men' | 'women' | 'unisex')[];
  occasions?: string[];
  seasons?: string[];
  sample_only?: boolean;
  min_rating?: number;
  max_price?: number;
  min_year?: number;
  max_year?: number;
  brands?: string[];
  notes?: string[];
}

export interface SearchOptions {
  mode?: SearchMode;
  limit?: number;
  offset?: number;
  filters?: SearchFilters;
  include_highlights?: boolean;
  boost_popular?: boolean;
  sort?: SortOption;
}

export type SearchMode = 'standard' | 'exact' | 'discovery' | 'suggestions';

export interface SortOption {
  field: 'relevance' | 'popularity' | 'rating' | 'name' | 'year' | 'price';
  direction: 'asc' | 'desc';
}

export interface SearchResultItem {
  fragrance: FragranceSearchData;
  score: number; // 0-1, higher is better match
  highlights?: ResultHighlight[];
  match_reason?: string;
  rank?: number;
}

export interface ResultHighlight {
  field: string;
  value: string;
  indices: [number, number][];
  snippet?: string;
}

export interface SearchResponse {
  results: SearchResultItem[];
  total: number;
  query: string;
  search_time_ms: number;
  metadata: SearchMetadata;
  filters?: SearchFilters;
  pagination?: PaginationInfo;
}

export interface SearchMetadata {
  mode: SearchMode;
  filters_applied: boolean;
  cache_hit: boolean;
  highlighting_enabled: boolean;
  index_size?: number;
  query_processed?: string;
  fallback_used?: boolean;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface SuggestionItem {
  text: string;
  type: SuggestionType;
  confidence: number;
  result_count?: number;
  category?: string;
  metadata?: Record<string, any>;
}

export type SuggestionType =
  | 'fragrance'
  | 'brand'
  | 'note'
  | 'family'
  | 'accord'
  | 'keyword';

export interface SuggestionResponse {
  suggestions: SuggestionItem[];
  query: string;
  total_suggestions: number;
  processing_time_ms: number;
  personalization_applied?: boolean;
}

// Search analytics and monitoring
export interface SearchAnalytics {
  query: string;
  results_count: number;
  search_time_ms: number;
  mode: SearchMode;
  filters_used?: string[];
  clicked_result?: string;
  user_id?: string;
  session_id?: string;
  timestamp: string;
}

export interface SearchPerformanceMetrics {
  avg_search_time_ms: number;
  cache_hit_rate: number;
  total_searches: number;
  popular_queries: Array<{ query: string; count: number }>;
  search_success_rate: number;
  index_size: number;
  last_updated: string;
}

// Configuration types
export interface FuseSearchConfig {
  threshold: number;
  distance: number;
  minMatchCharLength: number;
  includeScore: boolean;
  includeMatches: boolean;
  shouldSort: boolean;
  fieldWeights?: Record<string, number>;
}

export interface SearchServiceConfig {
  enable_caching: boolean;
  cache_ttl_minutes: number;
  max_cache_size: number;
  data_refresh_interval_minutes: number;
  enable_analytics: boolean;
  default_limit: number;
  max_limit: number;
}

// Error types
export interface SearchError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface SearchValidationError extends SearchError {
  field: string;
  value: any;
  expected: string;
}

// Utility types
export type SearchField = keyof FragranceSearchData;

export interface FieldWeight {
  field: SearchField;
  weight: number;
}

export interface SearchContext {
  user_id?: string;
  session_id?: string;
  preferences?: UserSearchPreferences;
  location?: string;
  device_type?: 'mobile' | 'tablet' | 'desktop';
}

export interface UserSearchPreferences {
  preferred_brands?: string[];
  preferred_families?: string[];
  preferred_notes?: string[];
  gender_preference?: 'men' | 'women' | 'unisex';
  price_range?: { min?: number; max?: number };
  sample_preference?: boolean;
}

// Brand-specific types for better brand handling
export interface BrandMapping {
  canonical_name: string;
  variants: string[];
  aliases: string[];
  abbreviations: string[];
}

export interface BrandNormalizationResult {
  original: string;
  canonical: string;
  confidence: number;
  variant_matched?: string;
}

// Note-related types for fragrance notes search
export interface NoteCategory {
  name: string;
  notes: string[];
  synonyms?: string[];
  weight?: number;
}

export interface NoteCombination {
  notes: string[];
  label: string;
  popularity?: number;
}

// Export for backward compatibility with existing code
export interface Suggestion extends SuggestionItem {
  // Legacy fields for compatibility
}

export interface SearchResult extends SearchResultItem {
  // Legacy fields for compatibility
  relevance_score?: number;
}

// Search enhancement types
export interface SearchEnhancement {
  type: 'spell_correction' | 'query_expansion' | 'synonym_replacement';
  original: string;
  enhanced: string;
  confidence: number;
}

export interface EnhancedSearchResponse extends SearchResponse {
  enhancements?: SearchEnhancement[];
  original_query?: string;
  suggestions_for_no_results?: SuggestionItem[];
}
