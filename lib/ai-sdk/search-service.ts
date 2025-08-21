/**
 * Simplified Search Service
 *
 * Replaces complex SearchSuggestionEngine and QueryProcessor
 * from lib/ai/ai-search.ts with simple, effective implementations
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { aiClient } from './client';
import { embeddingService } from './embedding-service';

export interface SearchSuggestion {
  type: 'fragrance' | 'brand' | 'note' | 'family';
  value: string;
  display_text: string;
  confidence: number;
  result_count?: number;
}

export interface QueryAnalysis {
  original_query: string;
  processed_query: string;
  intent: 'search' | 'discovery' | 'comparison';
  entities: string[];
  confidence: number;
}

/**
 * Simplified Search Suggestion Engine
 * Replaces lib/ai/ai-search.ts SearchSuggestionEngine
 */
export class SearchSuggestionEngine {
  private supabase: SupabaseClient;
  private enableAI: boolean;
  private enablePersonalization: boolean;

  constructor(
    supabase: SupabaseClient,
    config?: {
      enableAI?: boolean;
      enablePersonalization?: boolean;
    }
  ) {
    this.supabase = supabase;
    this.enableAI = config?.enableAI ?? true;
    this.enablePersonalization = config?.enablePersonalization ?? true;
  }

  // Legacy method compatibility
  async getSuggestions(
    query: string,
    limit: number = 8
  ): Promise<SearchSuggestion[]> {
    return this.generateSuggestions(query, undefined, { limit });
  }

  async getPersonalizedSuggestions(
    query: string,
    userId: string,
    limit: number = 8
  ): Promise<SearchSuggestion[]> {
    return this.generateSuggestions(query, userId, {
      limit,
      enablePersonalization: true,
    });
  }

  async getTrendingSuggestions(limit: number = 8): Promise<SearchSuggestion[]> {
    return this.generateSuggestions('', undefined, {
      limit,
      includeTrending: true,
    });
  }

  async generateSuggestions(
    query: string,
    userId?: string,
    options?: {
      limit?: number;
      includeTrending?: boolean;
      enablePersonalization?: boolean;
    }
  ): Promise<SearchSuggestion[]> {
    const limit = options?.limit || 8;
    const suggestions: SearchSuggestion[] = [];

    try {
      // Get basic database suggestions first (fast)
      const dbSuggestions = await this.getDatabaseSuggestions(query, limit);
      suggestions.push(...dbSuggestions);

      // Enhance with AI if enabled and query is substantial
      if (this.enableAI && query.length > 2) {
        try {
          const aiSuggestions = await this.getAISuggestions(
            query,
            userId,
            limit
          );

          // Merge and deduplicate
          const merged = this.mergeSuggestions(suggestions, aiSuggestions);
          return merged.slice(0, limit);
        } catch (error) {
          console.warn('AI suggestions failed, using database only:', error);
        }
      }

      return suggestions.slice(0, limit);
    } catch (error) {
      console.error('Search suggestions failed:', error);
      return [];
    }
  }

  private async getDatabaseSuggestions(
    query: string,
    limit: number
  ): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];

    // Search fragrances
    const { data: fragrances } = await this.supabase
      .from('fragrances')
      .select('name, fragrance_brands(name)')
      .ilike('name', `%${query}%`)
      .limit(Math.ceil(limit / 2));

    fragrances?.forEach(f => {
      suggestions.push({
        type: 'fragrance',
        value: f.name,
        display_text: f.name,
        confidence: 0.8,
      });
    });

    // Search brands
    const { data: brands } = await this.supabase
      .from('fragrance_brands')
      .select('name')
      .ilike('name', `%${query}%`)
      .limit(Math.ceil(limit / 4));

    brands?.forEach(b => {
      suggestions.push({
        type: 'brand',
        value: b.name,
        display_text: b.name,
        confidence: 0.7,
      });
    });

    return suggestions;
  }

  private async getAISuggestions(
    query: string,
    userId?: string,
    limit: number
  ): Promise<SearchSuggestion[]> {
    try {
      // Use embedding search for semantic suggestions
      const queryEmbedding = await embeddingService.generateQueryEmbedding(
        query,
        userId
      );

      // In a full implementation, this would use vector similarity search
      // For now, return empty array as AI suggestions are optional
      return [];
    } catch (error) {
      console.warn('AI suggestions failed:', error);
      return [];
    }
  }

  private mergeSuggestions(
    dbSuggestions: SearchSuggestion[],
    aiSuggestions: SearchSuggestion[]
  ): SearchSuggestion[] {
    const merged = [...dbSuggestions];
    const existingValues = new Set(
      dbSuggestions.map(s => s.value.toLowerCase())
    );

    // Add AI suggestions that don't duplicate database suggestions
    aiSuggestions.forEach(aiSug => {
      if (!existingValues.has(aiSug.value.toLowerCase())) {
        merged.push(aiSug);
        existingValues.add(aiSug.value.toLowerCase());
      }
    });

    // Sort by confidence
    return merged.sort((a, b) => b.confidence - a.confidence);
  }
}

/**
 * Simplified Query Processor
 * Replaces lib/ai/ai-search.ts QueryProcessor
 */
export class QueryProcessor {
  private enableNLP: boolean;

  constructor(config?: { enableNLP?: boolean }) {
    this.enableNLP = config?.enableNLP ?? true;
  }

  async analyzeQuery(query: string): Promise<QueryAnalysis> {
    try {
      // Simple query analysis without complex NLP
      const processed = query.trim().toLowerCase();

      // Basic intent detection
      let intent: 'search' | 'discovery' | 'comparison' = 'search';
      if (query.includes('similar') || query.includes('like')) {
        intent = 'comparison';
      } else if (query.includes('discover') || query.includes('recommend')) {
        intent = 'discovery';
      }

      // Simple entity extraction
      const entities = this.extractEntities(query);

      return {
        original_query: query,
        processed_query: processed,
        intent,
        entities,
        confidence: 0.8,
      };
    } catch (error) {
      console.warn('Query analysis failed:', error);

      return {
        original_query: query,
        processed_query: query.trim().toLowerCase(),
        intent: 'search',
        entities: [],
        confidence: 0.5,
      };
    }
  }

  private extractEntities(query: string): string[] {
    const entities: string[] = [];

    // Simple keyword extraction
    const keywords = query.toLowerCase().split(/\s+/);

    // Known fragrance terms
    const fragranceTerms = [
      'fresh',
      'woody',
      'floral',
      'oriental',
      'citrus',
      'vanilla',
      'rose',
      'sandalwood',
    ];
    const occasionTerms = [
      'evening',
      'daytime',
      'office',
      'date',
      'summer',
      'winter',
    ];

    keywords.forEach(word => {
      if (fragranceTerms.includes(word)) entities.push(word);
      if (occasionTerms.includes(word)) entities.push(word);
    });

    return entities;
  }
}
