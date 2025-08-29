// Types for Search Server Actions
// Extracted to keep action files under 200 lines

export interface SearchFilters {
  scent_families?: string[];
  occasions?: string[];
  seasons?: string[];
  sample_only?: boolean;
  brands?: string[];
}

export interface SearchFragrance {
  id: string;
  name: string;
  brand: string;
  brand_id: string;
  scent_family?: string;
  gender?: string;
  relevance_score: number;
  sample_available: boolean;
  sample_price_usd: number;
  match_type?: string;
  source?: string;
}

export interface SearchActionResult {
  success: boolean;
  error?: string;
  data?: {
    fragrances: SearchFragrance[];
    total: number;
    query: string;
    search_method: string;
    filters_applied: {
      scent_families: string[];
      sample_only: boolean;
      occasions: string[];
      seasons: string[];
    };
    metadata: {
      processing_time_ms: number;
      ai_powered: boolean;
      database_integrated: boolean;
      enhanced_features_enabled: boolean;
      performance_target_met: boolean;
    };
  };
}
