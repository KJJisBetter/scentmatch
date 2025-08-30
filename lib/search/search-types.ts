/**
 * Search-related type definitions
 * Basic types used by search functionality
 */

// Re-export commonly used types from search-service
export type {
  SearchOptions,
  SearchResult,
  SearchResponse,
  MatchHighlight,
  SuggestionResult,
} from './search-service';

// Additional search-related types
export interface BrandNormalizationResult {
  original: string;
  normalized: string;
  confidence: number;
}

export interface NoteCategory {
  id: string;
  name: string;
  notes: string[];
}

export interface NoteCombination {
  primary: string;
  secondary: string[];
  compatibility: number;
}

export interface Suggestion {
  query: string;
  type: 'brand' | 'fragrance' | 'note' | 'category';
  score: number;
}

export interface SearchEnhancement {
  query: string;
  suggestions: Suggestion[];
  corrections: string[];
}

export interface EnhancedSearchResponse {
  results: SearchResult[];
  enhancements: SearchEnhancement;
  totalCount: number;
  searchTime: number;
}
