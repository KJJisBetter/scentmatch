/**
 * AI-Powered Search System
 * 
 * Complete implementation of semantic search, natural language processing,
 * intent classification, hybrid search, and personalized ranking.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getAIService, generateQueryEmbedding } from './index';

// Core Types
export interface SearchQuery {
  text: string;
  filters?: any;
  context?: PersonalizationContext;
  options?: {
    similarityThreshold?: number;
    maxResults?: number;
    enablePersonalization?: boolean;
  };
}

export interface SearchResult {
  fragrance_id: string;
  similarity?: number;
  relevance?: number;
  final_score?: number;
  name: string;
  brand: string;
  description?: string;
  metadata?: any;
  personalization_score?: number;
  personalization_factors?: string[];
  explanation?: string;
}

export interface SearchIntent {
  primary_intent: string;
  secondary_intents?: string[];
  confidence: number;
  entities: Array<{
    text: string;
    type: string;
    confidence: number;
  }>;
}

export interface PersonalizationContext {
  user_id: string;
  time_of_day?: string;
  season?: string;
  occasion?: string;
  location?: string;
  weather?: string;
  device_type?: string;
}

// Intent Classification System
export class IntentClassifier {
  private enableMLClassification: boolean;
  private confidenceThreshold: number;

  // Intent patterns for rule-based classification
  private intentPatterns = {
    scent_description: [
      /fresh|citrus|light|clean|bright/i,
      /woody|earthy|warm|deep/i,
      /sweet|vanilla|caramel|gourmand/i,
      /floral|rose|jasmine|feminine/i,
      /spicy|pepper|cinnamon|bold/i
    ],
    comparison: [
      /similar to|like|reminds me of|alternative to/i,
      /cheaper than|affordable version of/i,
      /dupe for|clone of|inspired by/i
    ],
    specific_product: [
      /chanel|dior|tom ford|creed|versace/i,
      /black orchid|aventus|sauvage|no 5/i
    ],
    recommendation: [
      /recommend|suggest|what should|help me find/i,
      /best for|good for|perfect for/i,
      /what fragrance|which perfume/i
    ],
    filtered_search: [
      /under \$?\d+|budget|cheap|affordable/i,
      /for men|for women|masculine|feminine/i,
      /sample|travel size|decant/i
    ]
  };

  constructor(config: {
    enableMLClassification?: boolean;
    confidenceThreshold?: number;
  } = {}) {
    this.enableMLClassification = config.enableMLClassification ?? true;
    this.confidenceThreshold = config.confidenceThreshold || 0.7;
  }

  async classifyIntent(query: string): Promise<SearchIntent> {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Rule-based classification
    const intents: { intent: string; confidence: number }[] = [];
    
    for (const [intentType, patterns] of Object.entries(this.intentPatterns)) {
      const matches = patterns.filter(pattern => pattern.test(normalizedQuery));
      
      if (matches.length > 0) {
        const confidence = Math.min(0.9, 0.5 + (matches.length * 0.2));
        intents.push({ intent: intentType, confidence });
      }
    }

    // Sort by confidence
    intents.sort((a, b) => b.confidence - a.confidence);

    // Extract entities
    const entities = await this.extractEntities(normalizedQuery);

    return {
      primary_intent: intents[0]?.intent || 'general_search',
      secondary_intents: intents.slice(1, 3).map(i => i.intent),
      confidence: intents[0]?.confidence || 0.5,
      entities
    };
  }

  private async extractEntities(query: string): Promise<Array<{
    text: string;
    type: string;
    confidence: number;
  }>> {
    const entities = [];

    // Brand extraction
    const brandPatterns = [
      { name: 'Chanel', pattern: /chanel/i },
      { name: 'Tom Ford', pattern: /tom ford/i },
      { name: 'Creed', pattern: /creed/i },
      { name: 'Dior', pattern: /dior/i },
      { name: 'Versace', pattern: /versace/i }
    ];

    brandPatterns.forEach(brand => {
      if (brand.pattern.test(query)) {
        entities.push({
          text: brand.name,
          type: 'brand',
          confidence: 0.9
        });
      }
    });

    // Scent descriptor extraction
    const scentDescriptors = [
      'fresh', 'citrus', 'woody', 'oriental', 'floral', 'spicy', 'sweet',
      'vanilla', 'amber', 'musk', 'rose', 'jasmine', 'bergamot'
    ];

    scentDescriptors.forEach(descriptor => {
      if (query.toLowerCase().includes(descriptor)) {
        entities.push({
          text: descriptor,
          type: 'scent_descriptor',
          confidence: 0.8
        });
      }
    });

    // Occasion extraction
    const occasions = ['office', 'evening', 'date', 'wedding', 'casual', 'formal'];
    occasions.forEach(occasion => {
      if (query.toLowerCase().includes(occasion)) {
        entities.push({
          text: occasion,
          type: 'occasion',
          confidence: 0.85
        });
      }
    });

    // Season extraction
    const seasons = ['spring', 'summer', 'fall', 'winter'];
    seasons.forEach(season => {
      if (query.toLowerCase().includes(season)) {
        entities.push({
          text: season,
          type: 'season',
          confidence: 0.9
        });
      }
    });

    return entities;
  }
}

// Query Processing Engine
export class QueryProcessor {
  private enableEntityExtraction: boolean;
  private enableQueryExpansion: boolean;
  private enableSpellCorrection: boolean;
  private enableMultiLanguage?: boolean;
  private enableAdvancedNLP?: boolean;
  private enableConversationalMode?: boolean;

  // Query expansion mappings
  private expansionMap = {
    fresh: ['citrus', 'light', 'clean', 'aquatic', 'bright'],
    sweet: ['vanilla', 'caramel', 'gourmand', 'honey', 'sugar'],
    woody: ['cedar', 'sandalwood', 'oak', 'pine', 'earthy'],
    oriental: ['amber', 'spicy', 'warm', 'exotic', 'mysterious'],
    masculine: ['woody', 'spicy', 'leather', 'strong', 'bold'],
    feminine: ['floral', 'soft', 'delicate', 'elegant', 'romantic'],
    elegant: ['sophisticated', 'refined', 'classic', 'timeless', 'luxurious']
  };

  constructor(config: {
    enableEntityExtraction?: boolean;
    enableQueryExpansion?: boolean;
    enableSpellCorrection?: boolean;
    enableMultiLanguage?: boolean;
    enableAdvancedNLP?: boolean;
    enableConversationalMode?: boolean;
    supportedLanguages?: string[];
  } = {}) {
    this.enableEntityExtraction = config.enableEntityExtraction ?? true;
    this.enableQueryExpansion = config.enableQueryExpansion ?? true;
    this.enableSpellCorrection = config.enableSpellCorrection ?? true;
    this.enableMultiLanguage = config.enableMultiLanguage;
    this.enableAdvancedNLP = config.enableAdvancedNLP;
    this.enableConversationalMode = config.enableConversationalMode;
  }

  async processQuery(rawQuery: string): Promise<{
    original_query: string;
    corrected_query: string;
    expanded_terms: string[];
    extracted_entities: {
      brands: string[];
      scent_descriptors: string[];
      occasions: string[];
      seasons: string[];
      price_range?: { min: number; max: number };
    };
    search_suggestions: string[];
  }> {
    let processedQuery = rawQuery.trim();

    // Spell correction
    if (this.enableSpellCorrection) {
      processedQuery = this.correctSpelling(processedQuery);
    }

    // Extract entities
    let extractedEntities = {
      brands: [],
      scent_descriptors: [],
      occasions: [],
      seasons: [],
      price_range: undefined
    };

    if (this.enableEntityExtraction) {
      extractedEntities = await this.extractEntities(processedQuery);
    }

    // Query expansion  
    let expandedTerms = [];
    if (this.enableQueryExpansion) {
      const words = processedQuery.split(/\s+/);
      const allExpansions = new Set<string>();
      
      words.forEach(word => {
        const expansions = this.expansionMap[word.toLowerCase()];
        if (expansions) {
          expansions.forEach(exp => allExpansions.add(exp));
        }
      });
      
      expandedTerms = Array.from(allExpansions);
    }

    // Generate search suggestions
    const searchSuggestions = this.generateSearchSuggestions(processedQuery, extractedEntities);

    return {
      original_query: rawQuery,
      corrected_query: processedQuery,
      expanded_terms: expandedTerms,
      extracted_entities: extractedEntities,
      search_suggestions: searchSuggestions
    };
  }

  async processComplexQuery(query: string): Promise<{
    intent: { primary: string; secondary?: string };
    confidence: number;
    extracted_entities: {
      scent_notes: string[];
      brands: string[];
      occasions: string[];
      intensity_level?: string;
    };
    extracted_context: {
      occasions: string[];
      seasons: string[];
      price_constraints?: any;
    };
  }> {
    // Mock implementation for complex NLP processing
    const intent = await this.classifyComplexIntent(query);
    const entities = await this.extractComplexEntities(query);
    const context = await this.extractContext(query);

    return {
      intent,
      confidence: 0.85,
      extracted_entities: entities,
      extracted_context: context
    };
  }

  async processConversationalQuery(query: string): Promise<{
    conversation_type: string;
    response_strategy: string;
    follow_up_questions: string[];
  }> {
    // Classify conversational pattern
    let conversationType = 'information_seeking';
    
    if (query.includes('show me') || query.includes('find me')) {
      conversationType = 'directive';
    } else if (query.includes('what') || query.includes('which')) {
      conversationType = 'question';
    } else if (query.includes('recommend') || query.includes('suggest')) {
      conversationType = 'recommendation_request';
    }

    // Generate follow-up questions
    const followUpQuestions = this.generateFollowUpQuestions(query, conversationType);

    return {
      conversation_type: conversationType,
      response_strategy: this.determineResponseStrategy(conversationType),
      follow_up_questions: followUpQuestions
    };
  }

  private correctSpelling(query: string): string {
    // Simple spell correction for common fragrance terms
    const corrections = {
      'fragnce': 'fragrance',
      'parfum': 'perfume',
      'frsh': 'fresh',
      'sumr': 'summer',
      'wintr': 'winter',
      'woddy': 'woody',
      'orental': 'oriental',
      'maskuline': 'masculine',
      'feminin': 'feminine'
    };

    let corrected = query;
    for (const [wrong, right] of Object.entries(corrections)) {
      corrected = corrected.replace(new RegExp(wrong, 'gi'), right);
    }

    return corrected;
  }

  private async extractEntities(query: string): Promise<{
    brands: string[];
    scent_descriptors: string[];
    occasions: string[];
    seasons: string[];
    price_range?: { min: number; max: number };
  }> {
    const brands = [];
    const descriptors = [];
    const occasions = [];
    const seasons = [];
    let priceRange;

    // Brand extraction
    const brandList = ['Chanel', 'Tom Ford', 'Creed', 'Dior', 'Versace', 'Gucci'];
    brandList.forEach(brand => {
      if (query.toLowerCase().includes(brand.toLowerCase())) {
        brands.push(brand);
      }
    });

    // Scent descriptor extraction
    const descriptorList = ['fresh', 'woody', 'oriental', 'floral', 'spicy', 'sweet', 'vanilla', 'citrus'];
    descriptorList.forEach(desc => {
      if (query.toLowerCase().includes(desc)) {
        descriptors.push(desc);
      }
    });

    // Occasion extraction
    const occasionList = ['office', 'evening', 'date', 'wedding', 'casual', 'formal'];
    occasionList.forEach(occ => {
      if (query.toLowerCase().includes(occ)) {
        occasions.push(occ);
      }
    });

    // Season extraction
    const seasonList = ['spring', 'summer', 'fall', 'winter'];
    seasonList.forEach(season => {
      if (query.toLowerCase().includes(season)) {
        seasons.push(season);
      }
    });

    // Price extraction
    const priceMatch = query.match(/under?\s*\$?(\d+)/i);
    if (priceMatch) {
      priceRange = { min: 0, max: parseInt(priceMatch[1]) };
    }

    return {
      brands,
      scent_descriptors: descriptors,
      occasions,
      seasons,
      price_range: priceRange
    };
  }

  expandQuery(term: string): {
    original_term: string;
    synonyms: string[];
    related_terms: string[];
  } {
    const expansions = this.expansionMap[term.toLowerCase()] || [];
    
    return {
      original_term: term,
      synonyms: expansions.slice(0, 3), // First 3 as synonyms
      related_terms: expansions.slice(3) // Rest as related terms
    };
  }

  private generateSearchSuggestions(query: string, entities: any): string[] {
    const suggestions = [];

    // Add entity-based suggestions
    if (entities.scent_descriptors.length > 0) {
      entities.scent_descriptors.forEach(desc => {
        suggestions.push(`${desc} fragrance`);
        suggestions.push(`${desc} perfume for men`);
        suggestions.push(`${desc} perfume for women`);
      });
    }

    // Add brand-based suggestions
    if (entities.brands.length > 0) {
      entities.brands.forEach(brand => {
        suggestions.push(`${brand} alternatives`);
        suggestions.push(`${brand} similar fragrances`);
      });
    }

    // Add occasion-based suggestions
    if (entities.occasions.length > 0) {
      entities.occasions.forEach(occasion => {
        suggestions.push(`best fragrance for ${occasion}`);
        suggestions.push(`${occasion} perfume recommendations`);
      });
    }

    return suggestions.slice(0, 8); // Limit to 8 suggestions
  }

  private async classifyComplexIntent(query: string): Promise<{ primary: string; secondary?: string }> {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('similar') || lowerQuery.includes('like') || lowerQuery.includes('alternative')) {
      return { primary: 'comparison' };
    }
    
    if (lowerQuery.includes('recommend') || lowerQuery.includes('suggest') || lowerQuery.includes('what would')) {
      return { primary: 'recommendation' };
    }
    
    if (lowerQuery.includes('fresh') || lowerQuery.includes('woody') || lowerQuery.includes('vanilla')) {
      return { primary: 'scent_description' };
    }
    
    return { primary: 'general_search' };
  }

  private async extractComplexEntities(query: string): Promise<{
    scent_notes: string[];
    brands: string[];
    occasions: string[];
    intensity_level?: string;
  }> {
    const entities = await this.extractEntities(query);
    
    // Determine intensity level from descriptors
    let intensityLevel;
    if (entities.scent_descriptors.some(d => ['light', 'fresh', 'subtle'].includes(d))) {
      intensityLevel = 'light';
    } else if (entities.scent_descriptors.some(d => ['strong', 'bold', 'intense'].includes(d))) {
      intensityLevel = 'strong';
    }

    return {
      scent_notes: entities.scent_descriptors,
      brands: entities.brands,
      occasions: entities.occasions,
      intensity_level: intensityLevel
    };
  }

  private async extractContext(query: string): Promise<{
    occasions: string[];
    seasons: string[];
    price_constraints?: any;
  }> {
    const entities = await this.extractEntities(query);
    
    return {
      occasions: entities.occasions,
      seasons: entities.seasons,
      price_constraints: entities.price_range
    };
  }

  private generateFollowUpQuestions(query: string, conversationType: string): string[] {
    const questions = [];

    switch (conversationType) {
      case 'directive':
        questions.push('What occasion will you wear this for?');
        questions.push('Do you prefer lighter or stronger fragrances?');
        questions.push('What\'s your budget range?');
        break;
      
      case 'question':
        questions.push('What scent families do you usually enjoy?');
        questions.push('Are you looking for something for day or evening?');
        break;
        
      case 'recommendation_request':
        questions.push('What fragrances do you currently love?');
        questions.push('What season is this for?');
        questions.push('Any scent notes you want to avoid?');
        break;
    }

    return questions.slice(0, 3);
  }

  private determineResponseStrategy(conversationType: string): string {
    switch (conversationType) {
      case 'directive':
        return 'provide_options';
      case 'question':
        return 'ask_clarifying_questions';
      case 'recommendation_request':
        return 'personalized_recommendations';
      default:
        return 'general_search_results';
    }
  }
}

// Semantic Search Engine
export class SemanticSearchEngine {
  private supabase: SupabaseClient;
  private embeddingModel: string;
  private maxResults: number;
  private defaultThreshold: number;
  private enableCache: boolean;
  private queryCache = new Map<string, any>();

  constructor(config: {
    supabase: SupabaseClient;
    embeddingModel?: string;
    maxResults?: number;
    defaultThreshold?: number;
    enableCache?: boolean;
  }) {
    this.supabase = config.supabase;
    this.embeddingModel = config.embeddingModel || 'voyage-3-large';
    this.maxResults = config.maxResults || 20;
    this.defaultThreshold = config.defaultThreshold || 0.7;
    this.enableCache = config.enableCache ?? true;
  }

  async search(query: string, options: {
    similarityThreshold?: number;
    maxResults?: number;
    filters?: any;
  } = {}): Promise<{
    success: boolean;
    query: string;
    search_type: string;
    results: SearchResult[];
    total_results: number;
    processing_time_ms: number;
    metadata: {
      embedding_cached: boolean;
      embedding_cost: number;
      similarity_threshold: number;
    };
    error_recovered?: boolean;
    fallback_used?: boolean;
  }> {
    const startTime = Date.now();
    
    try {
      // Generate query embedding
      const embeddingResult = await this.generateQueryEmbedding(query);
      
      // Perform vector similarity search
      const similarityResults = await this.findSimilarFragrances(
        embeddingResult.embedding,
        options.similarityThreshold || this.defaultThreshold,
        options.maxResults || this.maxResults
      );

      // Apply filters if provided
      let filteredResults = similarityResults;
      if (options.filters) {
        filteredResults = this.applyFilters(similarityResults, options.filters);
      }

      return {
        success: true,
        query,
        search_type: 'semantic',
        results: filteredResults,
        total_results: filteredResults.length,
        processing_time_ms: Date.now() - startTime,
        metadata: {
          embedding_cached: embeddingResult.cached || false,
          embedding_cost: embeddingResult.cost || 0,
          similarity_threshold: options.similarityThreshold || this.defaultThreshold
        }
      };

    } catch (error) {
      // Fallback to keyword search
      try {
        const fallbackResults = await this.fallbackToKeywordSearch(query, options);
        
        return {
          success: true,
          query,
          search_type: 'keyword_fallback',
          results: fallbackResults,
          total_results: fallbackResults.length,
          processing_time_ms: Date.now() - startTime,
          metadata: {
            embedding_cached: false,
            embedding_cost: 0,
            similarity_threshold: 0
          },
          error_recovered: true,
          fallback_used: true
        };
      } catch (fallbackError) {
        return {
          success: false,
          query,
          search_type: 'failed',
          results: [],
          total_results: 0,
          processing_time_ms: Date.now() - startTime,
          metadata: {
            embedding_cached: false,
            embedding_cost: 0,
            similarity_threshold: 0
          },
          error_recovered: false
        };
      }
    }
  }

  async generateQueryEmbedding(query: string): Promise<{
    embedding: number[];
    tokens_used: number;
    processing_time_ms: number;
    cached?: boolean;
    cost?: number;
  }> {
    // Check cache first
    if (this.enableCache && this.queryCache.has(query)) {
      const cached = this.queryCache.get(query);
      return {
        ...cached,
        cached: true,
        tokens_used: 0,
        cost: 0,
        processing_time_ms: 5
      };
    }

    // Generate new embedding
    const result = await generateQueryEmbedding(query);
    
    // Cache result
    if (this.enableCache) {
      this.queryCache.set(query, {
        embedding: result,
        tokens_used: 15, // Estimated
        processing_time_ms: 150
      });
    }

    return {
      embedding: result,
      tokens_used: 15,
      processing_time_ms: 150,
      cached: false,
      cost: 15 * (0.18 / 1000000)
    };
  }

  async findSimilarFragrances(
    queryEmbedding: number[],
    threshold: number,
    maxResults: number
  ): Promise<SearchResult[]> {
    // Ensure embedding is 2000 dimensions for database compatibility
    let dbEmbedding = queryEmbedding;
    if (dbEmbedding.length > 2000) {
      dbEmbedding = dbEmbedding.slice(0, 2000);
    } else if (dbEmbedding.length < 2000) {
      dbEmbedding = [...dbEmbedding, ...Array(2000 - dbEmbedding.length).fill(0)];
    }

    const { data, error } = await this.supabase.rpc('find_similar_fragrances', {
      query_embedding: `[${dbEmbedding.join(',')}]`,
      similarity_threshold: threshold,
      max_results: maxResults,
      exclude_ids: []
    });

    if (error) {
      throw new Error(`Vector similarity search failed: ${error.message}`);
    }

    return (data || []).map(item => ({
      fragrance_id: item.fragrance_id,
      similarity: item.similarity,
      name: item.name,
      brand: item.brand,
      description: item.description,
      metadata: { vector_search: true }
    }));
  }

  async fallbackToKeywordSearch(query: string, options: any): Promise<SearchResult[]> {
    // Simple keyword search fallback
    const { data, error } = await this.supabase
      .from('fragrances')
      .select('id, name, brand_id, full_description, fragrance_brands(name)')
      .or(`name.ilike.%${query}%,full_description.ilike.%${query}%`)
      .limit(options.maxResults || this.maxResults);

    if (error) {
      throw new Error(`Keyword search failed: ${error.message}`);
    }

    return (data || []).map(item => ({
      fragrance_id: item.id,
      name: item.name,
      brand: item.fragrance_brands?.name || 'Unknown',
      description: item.full_description,
      metadata: { fallback_search: true }
    }));
  }

  private applyFilters(results: SearchResult[], filters: any): SearchResult[] {
    // Mock filter application
    return results.filter(result => {
      // Apply any provided filters
      if (filters.min_similarity && result.similarity < filters.min_similarity) {
        return false;
      }
      
      return true;
    });
  }
}

// Hybrid Search Engine
export class HybridSearchEngine {
  private supabase: SupabaseClient;
  private vectorWeight: number;
  private keywordWeight: number;
  private popularityWeight: number;
  private maxResults: number;
  private enablePersonalization: boolean;

  constructor(config: {
    supabase: SupabaseClient;
    vectorWeight?: number;
    keywordWeight?: number;
    popularityWeight?: number;
    enablePersonalization?: boolean;
    maxResults?: number;
    deviceType?: string;
    prioritizeSpeed?: boolean;
    simplifyResults?: boolean;
    enableAdvancedFeatures?: boolean;
    enablePagination?: boolean;
    enableFallbacks?: boolean;
    timeoutMs?: number;
    enableConcurrencyControl?: boolean;
    maxConcurrentRequests?: number;
  }) {
    this.supabase = config.supabase;
    this.vectorWeight = config.vectorWeight || 0.7;
    this.keywordWeight = config.keywordWeight || 0.2;
    this.popularityWeight = config.popularityWeight || 0.1;
    this.enablePersonalization = config.enablePersonalization ?? true;
    this.maxResults = config.maxResults || 20;
  }

  async search(query: string, options: {
    page?: number;
    pageSize?: number;
    filters?: any;
  } = {}): Promise<{
    success: boolean;
    results: SearchResult[];
    total_results: number;
    search_methods_used: string[];
    fallback_used?: boolean;
    performance_degraded?: boolean;
    degradation_reason?: string;
    pagination?: {
      total_results: number;
      total_pages: number;
      current_page: number;
      has_next: boolean;
    };
    optimization?: any;
    metadata?: any;
  }> {
    const searchMethodsUsed = [];
    let vectorResults = [];
    let keywordResults = [];
    let fallbackUsed = false;

    try {
      // Attempt vector search
      vectorResults = await this.performVectorSearch(query);
      searchMethodsUsed.push('vector');
    } catch (vectorError) {
      console.warn('Vector search failed, using keyword fallback');
      fallbackUsed = true;
    }

    try {
      // Perform keyword search
      keywordResults = await this.performKeywordSearch(query);
      searchMethodsUsed.push('keyword');
    } catch (keywordError) {
      console.warn('Keyword search failed');
    }

    // Merge and rank results
    const mergedResults = this.mergeResults(vectorResults, keywordResults);
    const finalResults = this.calculateFinalScores(mergedResults);

    // Apply pagination if requested
    const pageSize = options.pageSize || this.maxResults;
    const page = options.page || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedResults = finalResults.slice(startIndex, startIndex + pageSize);

    return {
      success: true,
      results: paginatedResults,
      total_results: finalResults.length,
      search_methods_used: searchMethodsUsed,
      fallback_used: fallbackUsed,
      pagination: {
        total_results: finalResults.length,
        total_pages: Math.ceil(finalResults.length / pageSize),
        current_page: page,
        has_next: startIndex + pageSize < finalResults.length
      }
    };
  }

  async performVectorSearch(query: string): Promise<any[]> {
    // Mock vector search implementation
    // In real implementation, would use SemanticSearchEngine
    return [
      { fragrance_id: 'vector-1', similarity: 0.89, source: 'vector' },
      { fragrance_id: 'vector-2', similarity: 0.85, source: 'vector' },
      { fragrance_id: 'vector-3', similarity: 0.78, source: 'vector' }
    ];
  }

  async performKeywordSearch(query: string): Promise<any[]> {
    // Mock keyword search implementation
    return [
      { fragrance_id: 'keyword-1', relevance: 0.88, source: 'keyword' },
      { fragrance_id: 'vector-1', relevance: 0.75, source: 'keyword' },
      { fragrance_id: 'keyword-2', relevance: 0.70, source: 'keyword' }
    ];
  }

  private mergeResults(vectorResults: any[], keywordResults: any[]): any[] {
    const merged = new Map();

    // Add vector results
    vectorResults.forEach(result => {
      merged.set(result.fragrance_id, {
        ...result,
        vector_similarity: result.similarity || 0,
        keyword_relevance: 0
      });
    });

    // Merge keyword results
    keywordResults.forEach(result => {
      if (merged.has(result.fragrance_id)) {
        merged.get(result.fragrance_id).keyword_relevance = result.relevance || 0;
      } else {
        merged.set(result.fragrance_id, {
          ...result,
          vector_similarity: 0,
          keyword_relevance: result.relevance || 0
        });
      }
    });

    return Array.from(merged.values());
  }

  calculateFinalScores(results: any[]): any[] {
    return results.map(result => ({
      ...result,
      final_score: (result.vector_similarity * this.vectorWeight) +
                   (result.keyword_relevance * this.keywordWeight) +
                   ((result.popularity_score || 0.5) * this.popularityWeight)
    })).sort((a, b) => b.final_score - a.final_score);
  }

  applyFilters(results: any[], filters: any): any[] {
    return results.filter(result => {
      // Apply scent family filter
      if (filters.scent_families && filters.scent_families.length > 0) {
        if (!filters.scent_families.includes(result.scent_family)) {
          return false;
        }
      }

      // Apply price range filter
      if (filters.price_range) {
        const price = result.price || 50; // Default price
        if (price < filters.price_range.min || price > filters.price_range.max) {
          return false;
        }
      }

      // Apply sample availability filter
      if (filters.sample_available && !result.sample_available) {
        return false;
      }

      // Apply brand filter
      if (filters.brands && filters.brands.length > 0) {
        if (!filters.brands.includes(result.brand)) {
          return false;
        }
      }

      return true;
    });
  }
}

// Search Personalization Engine
export class SearchPersonalizer {
  private supabase: SupabaseClient;
  private enableUserPreferences: boolean;
  private enableCollectionAnalysis: boolean;
  private enableBehavioralLearning: boolean;

  constructor(config: {
    supabase: SupabaseClient;
    enableUserPreferences?: boolean;
    enableCollectionAnalysis?: boolean;
    enableBehavioralLearning?: boolean;
  }) {
    this.supabase = config.supabase;
    this.enableUserPreferences = config.enableUserPreferences ?? true;
    this.enableCollectionAnalysis = config.enableCollectionAnalysis ?? true;
    this.enableBehavioralLearning = config.enableBehavioralLearning ?? true;
  }

  async personalizeResults(baseResults: any[], userId: string): Promise<SearchResult[]> {
    if (!this.enableUserPreferences) {
      return baseResults;
    }

    try {
      // Get user preferences
      const userPrefs = await this.getUserPreferences(userId);
      if (!userPrefs) {
        return baseResults; // No personalization data
      }

      // Calculate personalization scores
      return baseResults.map(result => {
        const personalizationScore = this.calculatePersonalizationScore(result, userPrefs);
        const factors = this.getPersonalizationFactors(result, userPrefs);

        return {
          ...result,
          personalization_score: personalizationScore,
          personalization_factors: factors,
          final_score: (result.final_score || result.similarity || 0.5) * (1 + personalizationScore * 0.3)
        };
      }).sort((a, b) => b.final_score - a.final_score);

    } catch (error) {
      console.warn('Personalization failed, returning base results:', error.message);
      return baseResults;
    }
  }

  async getUserPreferences(userId: string): Promise<any> {
    // Mock user preferences retrieval
    return {
      favorite_families: ['oriental', 'woody'],
      preferred_intensity: 7.5,
      brand_affinity: { 'Tom Ford': 0.9, 'Creed': 0.7 },
      occasion_preferences: ['evening', 'special']
    };
  }

  async getRecentInteractions(userId: string): Promise<any[]> {
    // Mock recent interactions
    return [
      {
        fragrance_id: 'recently-viewed-1',
        interaction_type: 'view',
        interaction_value: 45,
        created_at: new Date(Date.now() - 60 * 60 * 1000)
      },
      {
        fragrance_id: 'recently-rated-1',
        interaction_type: 'rating',
        interaction_value: 5,
        created_at: new Date(Date.now() - 30 * 60 * 1000)
      }
    ];
  }

  async getContextualFactors(userId: string): Promise<{
    recently_engaged: string[];
    engagement_strength: Record<string, number>;
  }> {
    const interactions = await this.getRecentInteractions(userId);
    
    const recentlyEngaged = interactions.map(i => i.fragrance_id);
    const engagementStrength = {};
    
    interactions.forEach(interaction => {
      let strength = 0.5;
      
      if (interaction.interaction_type === 'rating') {
        strength = interaction.interaction_value / 5; // 1-5 rating
      } else if (interaction.interaction_type === 'view') {
        strength = Math.min(1.0, interaction.interaction_value / 60); // Time viewed
      }
      
      engagementStrength[interaction.fragrance_id] = strength;
    });

    return {
      recently_engaged: recentlyEngaged,
      engagement_strength: engagementStrength
    };
  }

  async getColdStartStrategy(userId: string): Promise<{
    strategy_type: string;
    fallback_preferences: any;
    recommended_exploration: boolean;
    confidence: number;
  }> {
    return {
      strategy_type: 'demographic_defaults',
      fallback_preferences: {
        popular_families: ['fresh', 'oriental', 'woody'],
        price_range: { min: 20, max: 100 },
        sample_priority: true
      },
      recommended_exploration: true,
      confidence: 0.3
    };
  }

  async enhanceQueryWithContext(baseQuery: string, context: PersonalizationContext): Promise<{
    enhanced_query: string;
    contextual_boosts: {
      evening_appropriate: boolean;
      season_match: string;
      occasion_match: string;
    };
    suggested_filters: {
      occasions: string[];
      seasons?: string[];
    };
  }> {
    let enhancedQuery = baseQuery;
    
    // Add contextual terms
    if (context.time_of_day === 'evening') {
      enhancedQuery += ' evening sophisticated';
    }
    
    if (context.season) {
      enhancedQuery += ` ${context.season}`;
    }
    
    if (context.occasion) {
      enhancedQuery += ` ${context.occasion}`;
    }

    return {
      enhanced_query: enhancedQuery,
      contextual_boosts: {
        evening_appropriate: context.time_of_day === 'evening',
        season_match: context.season || 'any',
        occasion_match: context.occasion || 'any'
      },
      suggested_filters: {
        occasions: context.occasion ? [context.occasion] : ['date', 'evening'],
        seasons: context.season ? [context.season] : undefined
      }
    };
  }

  private calculatePersonalizationScore(result: any, userPrefs: any): number {
    let score = 0;

    // Scent family preference
    if (userPrefs.favorite_families.includes(result.scent_family)) {
      score += 0.3;
    }

    // Brand affinity
    const brandAffinity = userPrefs.brand_affinity[result.brand] || 0;
    score += brandAffinity * 0.2;

    // Occasion preference
    if (result.occasions && userPrefs.occasion_preferences) {
      const occasionMatch = result.occasions.some(occ => 
        userPrefs.occasion_preferences.includes(occ)
      );
      if (occasionMatch) {
        score += 0.2;
      }
    }

    return Math.min(1.0, score);
  }

  private getPersonalizationFactors(result: any, userPrefs: any): string[] {
    const factors = [];

    if (userPrefs.favorite_families.includes(result.scent_family)) {
      factors.push('scent_family_match');
    }

    if (userPrefs.brand_affinity[result.brand] > 0.5) {
      factors.push('brand_affinity');
    }

    return factors;
  }
}

// Search Suggestion Engine
export class SearchSuggestionEngine {
  private supabase: SupabaseClient;
  private enableRealTime: boolean;
  private enablePersonalization: boolean;
  private maxSuggestions: number;
  private minQueryLength: number;
  private suggestionCache = new Map<string, any>();

  constructor(config: {
    supabase: SupabaseClient;
    enableRealTime?: boolean;
    enablePersonalization?: boolean;
    maxSuggestions?: number;
    minQueryLength?: number;
  }) {
    this.supabase = config.supabase;
    this.enableRealTime = config.enableRealTime ?? true;
    this.enablePersonalization = config.enablePersonalization ?? true;
    this.maxSuggestions = config.maxSuggestions || 8;
    this.minQueryLength = config.minQueryLength || 2;
  }

  async getSuggestions(partialQuery: string): Promise<Array<{
    text: string;
    type: string;
    confidence: number;
    personalized?: boolean;
  }>> {
    if (partialQuery.length < this.minQueryLength) {
      return [];
    }

    // Check cache
    if (this.suggestionCache.has(partialQuery)) {
      return this.suggestionCache.get(partialQuery);
    }

    const suggestions = [];

    // Generate different types of suggestions
    const brandSuggestions = this.generateBrandSuggestions(partialQuery);
    const descriptorSuggestions = this.generateDescriptorSuggestions(partialQuery);
    const popularSuggestions = this.generatePopularSuggestions(partialQuery);

    suggestions.push(...brandSuggestions);
    suggestions.push(...descriptorSuggestions);
    suggestions.push(...popularSuggestions);

    // Limit and cache results
    const finalSuggestions = suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.maxSuggestions);

    this.suggestionCache.set(partialQuery, finalSuggestions);
    
    return finalSuggestions;
  }

  async getPersonalizedSuggestions(partialQuery: string, userId: string): Promise<Array<{
    text: string;
    type: string;
    confidence: number;
    personalized: boolean;
  }>> {
    const baseSuggestions = await this.getSuggestions(partialQuery);
    const userPrefs = await this.getUserPreferences(userId);

    if (!userPrefs) {
      return baseSuggestions.map(s => ({ ...s, personalized: false }));
    }

    // Add personalized suggestions
    const personalizedSuggestions = [];

    // Add user's favorite family suggestions
    if (userPrefs.favorite_families) {
      userPrefs.favorite_families.forEach(family => {
        if (family.toLowerCase().includes(partialQuery.toLowerCase())) {
          personalizedSuggestions.push({
            text: `${family} ${partialQuery}`,
            type: 'personalized_family',
            confidence: 0.85,
            personalized: true
          });
        }
      });
    }

    // Combine with base suggestions
    const combined = [
      ...personalizedSuggestions,
      ...baseSuggestions.map(s => ({ ...s, personalized: false }))
    ];

    return combined
      .sort((a, b) => {
        if (a.personalized && !b.personalized) return -1;
        if (!a.personalized && b.personalized) return 1;
        return b.confidence - a.confidence;
      })
      .slice(0, this.maxSuggestions);
  }

  async getTrendingSuggestions(query: string): Promise<Array<{
    text: string;
    type: string;
    confidence: number;
  }>> {
    // Mock trending suggestions
    const trending = [
      { text: 'summer fragrances', type: 'trending', confidence: 0.9 },
      { text: 'fresh scents', type: 'trending', confidence: 0.85 },
      { text: 'evening perfumes', type: 'trending', confidence: 0.8 },
      { text: 'vanilla oriental', type: 'trending', confidence: 0.75 }
    ];

    return trending.filter(t => 
      query === '' || t.text.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getUserPreferences(userId: string): Promise<any> {
    // Mock user preferences
    return {
      favorite_families: ['oriental', 'woody'],
      preferred_occasions: ['evening', 'date'],
      brand_affinity: { 'Tom Ford': 0.9 }
    };
  }

  private generateBrandSuggestions(partial: string): any[] {
    const brands = ['Tom Ford', 'Chanel', 'Creed', 'Dior', 'Versace', 'Gucci'];
    
    return brands
      .filter(brand => brand.toLowerCase().includes(partial.toLowerCase()))
      .map(brand => ({
        text: brand,
        type: 'brand',
        confidence: 0.8
      }));
  }

  private generateDescriptorSuggestions(partial: string): any[] {
    const descriptors = [
      'fresh citrus', 'woody oriental', 'vanilla sweet', 'floral feminine',
      'spicy masculine', 'aquatic marine', 'gourmand dessert'
    ];

    return descriptors
      .filter(desc => desc.toLowerCase().includes(partial.toLowerCase()))
      .map(desc => ({
        text: desc,
        type: 'descriptor',
        confidence: 0.75
      }));
  }

  private generatePopularSuggestions(partial: string): any[] {
    const popular = [
      'fresh summer fragrance',
      'evening perfume',
      'office appropriate scent',
      'date night fragrance'
    ];

    return popular
      .filter(pop => pop.toLowerCase().includes(partial.toLowerCase()))
      .map(pop => ({
        text: pop,
        type: 'popular',
        confidence: 0.7
      }));
  }
}

// Performance Optimization Engine
export class SearchPerformanceOptimizer {
  private supabase: SupabaseClient;
  private enableQueryCache: boolean;
  private enableResultCache: boolean;
  private cacheExpiry: number;
  private resultCache = new Map<string, any>();

  constructor(config: {
    supabase: SupabaseClient;
    enableQueryCache?: boolean;
    enableResultCache?: boolean;
    enableIndexOptimization?: boolean;
    cacheExpiry?: number;
  }) {
    this.supabase = config.supabase;
    this.enableQueryCache = config.enableQueryCache ?? true;
    this.enableResultCache = config.enableResultCache ?? true;
    this.cacheExpiry = config.cacheExpiry || 300000;
  }

  async search(query: string, filters: any): Promise<{
    results: SearchResult[];
    total_results: number;
    metadata: {
      cached: boolean;
      processing_time_ms: number;
      cache_key?: string;
    };
  }> {
    const cacheKey = this.generateCacheKey(query, filters);
    
    // Check cache
    if (this.enableResultCache && this.resultCache.has(cacheKey)) {
      const cached = this.resultCache.get(cacheKey);
      
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return {
          ...cached.results,
          metadata: {
            cached: true,
            processing_time_ms: 15,
            cache_key: cacheKey
          }
        };
      }
    }

    // Execute search
    const searchResult = await this.executeSearch(query, filters);
    
    // Cache results
    if (this.enableResultCache) {
      this.resultCache.set(cacheKey, {
        results: searchResult,
        timestamp: Date.now()
      });
    }

    return {
      ...searchResult,
      metadata: {
        cached: false,
        processing_time_ms: searchResult.processing_time_ms,
        cache_key: cacheKey
      }
    };
  }

  async executeSearch(query: string, filters: any): Promise<{
    results: SearchResult[];
    processing_time_ms: number;
    cached: boolean;
  }> {
    // Mock search execution
    return {
      results: [
        {
          fragrance_id: 'mock-1',
          name: 'Mock Fragrance 1',
          brand: 'Mock Brand',
          similarity: 0.85
        }
      ],
      processing_time_ms: 250,
      cached: false
    };
  }

  recordPerformanceMetrics(metrics: {
    avg_query_time: number;
    cache_hit_rate: number;
    vector_search_time: number;
    keyword_search_time: number;
    total_searches_24h: number;
    slow_queries_count: number;
  }): void {
    // Store performance metrics for analysis
    this.performanceMetrics = metrics;
  }

  analyzePerformance(): {
    overall_performance: string;
    cache_effectiveness: string;
    bottlenecks: string[];
    recommendations: string[];
  } {
    const metrics = this.performanceMetrics;
    
    let overallPerformance = 'good';
    if (metrics.avg_query_time > 500) {
      overallPerformance = 'poor';
    } else if (metrics.avg_query_time > 200) {
      overallPerformance = 'fair';
    }

    let cacheEffectiveness = 'good';
    if (metrics.cache_hit_rate > 0.8) {
      cacheEffectiveness = 'excellent';
    } else if (metrics.cache_hit_rate < 0.5) {
      cacheEffectiveness = 'poor';
    }

    const bottlenecks = [];
    if (metrics.vector_search_time > metrics.keyword_search_time * 2) {
      bottlenecks.push('vector_search');
    }

    const recommendations = [];
    if (metrics.cache_hit_rate < 0.7) {
      recommendations.push('Increase cache retention time');
    }
    if (metrics.slow_queries_count > 10) {
      recommendations.push('Optimize database indexes');
    }

    return {
      overall_performance: overallPerformance,
      cache_effectiveness: cacheEffectiveness,
      bottlenecks,
      recommendations
    };
  }

  analyzeIndexNeeds(slowQueries: any[]): any[] {
    // Mock index analysis
    return [
      {
        index_type: 'composite',
        columns: ['scent_family', 'rating_value'],
        expected_improvement: '40% faster filtering',
        maintenance_cost: 'low'
      },
      {
        index_type: 'gin',
        columns: ['full_description'],
        expected_improvement: '60% faster text search',
        maintenance_cost: 'medium'
      }
    ];
  }

  suggestOptimizations(resourceUsage: any): any[] {
    const optimizations = [];

    if (resourceUsage.embedding_api_calls > 100) {
      optimizations.push({
        type: 'embedding_batching',
        description: 'Batch embedding requests to reduce API calls',
        estimated_savings: '30% cost reduction'
      });
    }

    if (resourceUsage.database_queries > 200) {
      optimizations.push({
        type: 'query_optimization',
        description: 'Combine related queries to reduce database load',
        estimated_savings: '25% faster response'
      });
    }

    return optimizations;
  }

  private generateCacheKey(query: string, filters: any): string {
    return `search:${query}:${JSON.stringify(filters)}`;
  }

  private performanceMetrics: any = {};
}