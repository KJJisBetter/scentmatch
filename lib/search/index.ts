/**
 * Search Module Exports
 *
 * Centralized exports for Fuse.js-powered search functionality.
 */

// Main search service
export { searchService, FuseSearchService } from './search-service';

// Configuration and types
export type {
  FragranceSearchItem,
  SearchableFragrance,
  fuseConfig,
  exactMatchConfig,
  discoveryConfig,
  suggestionConfig,
  transformFragranceForSearch,
  performanceConfig,
} from './fuse-config';

export type {
  FragranceBase,
  FragranceNotes,
  FragranceSearchData,
  SearchFilters,
  SearchOptions,
  SearchMode,
  SortOption,
  SearchResultItem,
  ResultHighlight,
  SearchResponse,
  SearchMetadata,
  PaginationInfo,
  SuggestionItem,
  SuggestionType,
  SuggestionResponse,
  SearchAnalytics,
  SearchPerformanceMetrics,
  FuseSearchConfig,
  SearchServiceConfig,
  SearchError,
  SearchValidationError,
  SearchField,
  FieldWeight,
  SearchContext,
  UserSearchPreferences,
  BrandMapping,
  BrandNormalizationResult,
  NoteCategory,
  NoteCombination,
  Suggestion,
  SearchResult,
  SearchEnhancement,
  EnhancedSearchResponse,
} from './search-types';

// Re-export Fuse.js for direct usage if needed
export { default as Fuse } from 'fuse.js';

// Utility functions
export {
  fuseConfig,
  exactMatchConfig,
  discoveryConfig,
  suggestionConfig,
  transformFragranceForSearch,
  performanceConfig,
} from './fuse-config';
