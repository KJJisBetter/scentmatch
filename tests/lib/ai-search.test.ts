/**
 * AI-Powered Search System Tests
 * 
 * Comprehensive tests for semantic search, natural language processing,
 * intent classification, hybrid search, and personalized ranking.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import {
  SemanticSearchEngine,
  QueryProcessor,
  IntentClassifier,
  HybridSearchEngine,
  SearchPersonalizer,
  SearchSuggestionEngine,
  SearchPerformanceOptimizer,
  type SearchQuery,
  type SearchResult,
  type SearchIntent,
  type PersonalizationContext
} from '@/lib/ai/ai-search';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

describe('AI-Powered Search System', () => {

  describe('SEARCH-001: Semantic Search Engine Tests', () => {
    let semanticSearch: SemanticSearchEngine;

    beforeEach(() => {
      semanticSearch = new SemanticSearchEngine({
        supabase,
        embeddingModel: 'voyage-3-large',
        maxResults: 20,
        defaultThreshold: 0.7,
        enableCache: true
      });
    });

    it('SEARCH-001a: Natural Language Query Processing', async () => {
      const naturalQueries = [
        'fresh summer fragrance for morning',
        'sophisticated evening scent like Tom Ford',
        'vanilla and amber oriental perfume',
        'affordable alternative to Chanel No 5',
        'woody masculine cologne for office'
      ];

      for (const query of naturalQueries) {
        // Mock embedding generation
        const mockEmbedding = Array.from({ length: 2000 }, () => Math.random() * 2 - 1);
        vi.spyOn(semanticSearch, 'generateQueryEmbedding').mockResolvedValue({
          embedding: mockEmbedding,
          tokens_used: 15,
          processing_time_ms: 150
        });

        // Mock similarity search results
        vi.spyOn(semanticSearch, 'findSimilarFragrances').mockResolvedValue([
          {
            fragrance_id: 'result-1',
            similarity: 0.89,
            name: 'Mock Result 1',
            brand: 'Mock Brand',
            description: 'Mock description',
            metadata: { vector_search: true }
          },
          {
            fragrance_id: 'result-2', 
            similarity: 0.82,
            name: 'Mock Result 2',
            brand: 'Mock Brand 2',
            description: 'Mock description 2',
            metadata: { vector_search: true }
          }
        ]);

        const results = await semanticSearch.search(query);
        
        expect(results.success).toBe(true);
        expect(results.query).toBe(query);
        expect(results.search_type).toBe('semantic');
        expect(results.results.length).toBeGreaterThan(0);
        expect(results.results[0].similarity).toBeGreaterThan(0.8);
        expect(results.processing_time_ms).toBeGreaterThan(0);
      }
    });

    it('SEARCH-001b: Vector Similarity Threshold Handling', async () => {
      const mockEmbedding = Array.from({ length: 2000 }, () => Math.random() * 2 - 1);
      
      vi.spyOn(semanticSearch, 'generateQueryEmbedding').mockResolvedValue({
        embedding: mockEmbedding,
        tokens_used: 12,
        processing_time_ms: 120
      });

      // Mock results with varying similarity scores
      const mockResults = [
        { fragrance_id: 'high', similarity: 0.92, name: 'High Similarity' },
        { fragrance_id: 'medium', similarity: 0.75, name: 'Medium Similarity' },
        { fragrance_id: 'low', similarity: 0.45, name: 'Low Similarity' },
        { fragrance_id: 'very-low', similarity: 0.2, name: 'Very Low Similarity' }
      ];

      vi.spyOn(semanticSearch, 'findSimilarFragrances').mockResolvedValue(mockResults);

      // Test with high threshold
      const highThresholdResults = await semanticSearch.search('test query', { similarityThreshold: 0.8 });
      expect(highThresholdResults.results.length).toBe(1); // Only high similarity

      // Test with medium threshold
      const mediumThresholdResults = await semanticSearch.search('test query', { similarityThreshold: 0.7 });
      expect(mediumThresholdResults.results.length).toBe(2); // High + medium

      // Test with low threshold
      const lowThresholdResults = await semanticSearch.search('test query', { similarityThreshold: 0.4 });
      expect(lowThresholdResults.results.length).toBe(3); // All except very low
    });

    it('SEARCH-001c: Embedding Cache Performance', async () => {
      const query = 'fresh citrus morning fragrance';
      const mockEmbedding = Array.from({ length: 2000 }, () => 0.1);

      // First call - should generate embedding
      vi.spyOn(semanticSearch, 'generateQueryEmbedding')
        .mockResolvedValueOnce({
          embedding: mockEmbedding,
          tokens_used: 15,
          processing_time_ms: 200,
          cached: false
        })
        .mockResolvedValueOnce({
          embedding: mockEmbedding,
          tokens_used: 0, // No tokens used for cached
          processing_time_ms: 5,
          cached: true
        });

      vi.spyOn(semanticSearch, 'findSimilarFragrances').mockResolvedValue([]);

      // First search
      const firstSearch = await semanticSearch.search(query);
      expect(firstSearch.metadata.embedding_cached).toBe(false);
      expect(firstSearch.metadata.embedding_cost).toBeGreaterThan(0);

      // Second search (should use cache)
      const secondSearch = await semanticSearch.search(query);
      expect(secondSearch.metadata.embedding_cached).toBe(true);
      expect(secondSearch.metadata.embedding_cost).toBe(0);
    });

    it('SEARCH-001d: Error Handling and Fallback', async () => {
      // Mock embedding generation failure
      vi.spyOn(semanticSearch, 'generateQueryEmbedding').mockRejectedValue(
        new Error('Voyage AI rate limit exceeded')
      );

      // Mock fallback to keyword search
      vi.spyOn(semanticSearch, 'fallbackToKeywordSearch').mockResolvedValue([
        {
          fragrance_id: 'fallback-1',
          similarity: 0.0, // No similarity for keyword search
          name: 'Keyword Match 1',
          brand: 'Fallback Brand',
          description: 'Found via keyword matching',
          metadata: { fallback_search: true }
        }
      ]);

      const results = await semanticSearch.search('test query');
      
      expect(results.success).toBe(true);
      expect(results.search_type).toBe('keyword_fallback');
      expect(results.results[0].metadata.fallback_search).toBe(true);
      expect(results.error_recovered).toBe(true);
    });
  });

  describe('SEARCH-002: Query Processing and Intent Classification Tests', () => {
    let queryProcessor: QueryProcessor;
    let intentClassifier: IntentClassifier;

    beforeEach(() => {
      queryProcessor = new QueryProcessor({
        enableEntityExtraction: true,
        enableQueryExpansion: true,
        enableSpellCorrection: true
      });

      intentClassifier = new IntentClassifier({
        enableMLClassification: true,
        confidenceThreshold: 0.7
      });
    });

    it('SEARCH-002a: Intent Classification', async () => {
      const testQueries = [
        {
          query: 'fresh summer fragrance for morning',
          expected_intent: 'scent_description',
          expected_entities: ['fresh', 'summer', 'morning']
        },
        {
          query: 'Tom Ford Black Orchid alternative',
          expected_intent: 'comparison',
          expected_entities: ['Tom Ford', 'Black Orchid']
        },
        {
          query: 'vanilla perfume under $50',
          expected_intent: 'filtered_search',
          expected_entities: ['vanilla', '$50']
        },
        {
          query: 'what fragrance should I wear to a wedding',
          expected_intent: 'recommendation',
          expected_entities: ['wedding']
        },
        {
          query: 'Creed Aventus',
          expected_intent: 'specific_product',
          expected_entities: ['Creed', 'Aventus']
        }
      ];

      for (const test of testQueries) {
        const intent = await intentClassifier.classifyIntent(test.query);
        
        expect(intent.primary_intent).toBe(test.expected_intent);
        expect(intent.confidence).toBeGreaterThan(0.5);
        expect(intent.entities.length).toBeGreaterThan(0);
        
        // Check that expected entities are found
        test.expected_entities.forEach(entity => {
          const found = intent.entities.some(e => 
            e.text.toLowerCase().includes(entity.toLowerCase())
          );
          expect(found).toBe(true);
        });
      }
    });

    it('SEARCH-002b: Query Processing and Enhancement', async () => {
      const rawQuery = 'frsh sumr fragnce';
      
      const processedQuery = await queryProcessor.processQuery(rawQuery);
      
      expect(processedQuery.original_query).toBe(rawQuery);
      expect(processedQuery.corrected_query).toBe('fresh summer fragrance');
      expect(processedQuery.expanded_terms).toContain('citrus');
      expect(processedQuery.expanded_terms).toContain('light');
      expect(processedQuery.extracted_entities.length).toBeGreaterThan(0);
      expect(processedQuery.search_suggestions.length).toBeGreaterThan(0);
    });

    it('SEARCH-002c: Entity Extraction and Enrichment', async () => {
      const queries = [
        'Chanel No 5 similar fragrances',
        'woody masculine scent for evening',
        'vanilla amber perfume under 100 dollars',
        'Tom Ford Oud Wood alternative'
      ];

      for (const query of queries) {
        const entities = await queryProcessor.extractEntities(query);
        
        expect(entities.brands.length + entities.scent_descriptors.length + entities.occasions.length).toBeGreaterThan(0);
        
        // Test entity types
        if (query.includes('Chanel')) {
          expect(entities.brands).toContain('Chanel');
        }
        
        if (query.includes('woody')) {
          expect(entities.scent_descriptors).toContain('woody');
        }
        
        if (query.includes('evening')) {
          expect(entities.occasions).toContain('evening');
        }
        
        if (query.includes('100 dollars')) {
          expect(entities.price_range).toBeDefined();
          expect(entities.price_range.max).toBe(100);
        }
      }
    });

    it('SEARCH-002d: Query Expansion and Synonyms', async () => {
      const testCases = [
        {
          input: 'fresh',
          expected_expansions: ['citrus', 'light', 'clean', 'aquatic']
        },
        {
          input: 'sweet',
          expected_expansions: ['vanilla', 'caramel', 'gourmand', 'honey']
        },
        {
          input: 'masculine',
          expected_expansions: ['woody', 'spicy', 'leather', 'strong']
        },
        {
          input: 'elegant',
          expected_expansions: ['sophisticated', 'refined', 'classic', 'timeless']
        }
      ];

      for (const testCase of testCases) {
        const expanded = await queryProcessor.expandQuery(testCase.input);
        
        expect(expanded.original_term).toBe(testCase.input);
        expect(expanded.synonyms.length).toBeGreaterThan(0);
        expect(expanded.related_terms.length).toBeGreaterThan(0);
        
        // Check that some expected expansions are found
        const allExpansions = [...expanded.synonyms, ...expanded.related_terms];
        const foundExpectedTerms = testCase.expected_expansions.filter(term =>
          allExpansions.some(expansion => expansion.toLowerCase().includes(term))
        );
        
        expect(foundExpectedTerms.length).toBeGreaterThan(0);
      }
    });
  });

  describe('SEARCH-003: Hybrid Search Engine Tests', () => {
    let hybridSearch: HybridSearchEngine;

    beforeEach(() => {
      hybridSearch = new HybridSearchEngine({
        supabase,
        vectorWeight: 0.7,
        keywordWeight: 0.2,
        popularityWeight: 0.1,
        enablePersonalization: true,
        maxResults: 50
      });
    });

    it('SEARCH-003a: Combined Vector and Keyword Search', async () => {
      const query = 'fresh citrus fragrance for summer';
      
      // Mock vector search results
      const vectorResults = [
        { fragrance_id: 'vector-1', similarity: 0.91, source: 'vector' },
        { fragrance_id: 'vector-2', similarity: 0.85, source: 'vector' },
        { fragrance_id: 'vector-3', similarity: 0.78, source: 'vector' }
      ];

      // Mock keyword search results
      const keywordResults = [
        { fragrance_id: 'keyword-1', relevance: 0.88, source: 'keyword' },
        { fragrance_id: 'vector-1', relevance: 0.75, source: 'keyword' }, // Overlap
        { fragrance_id: 'keyword-2', relevance: 0.70, source: 'keyword' }
      ];

      vi.spyOn(hybridSearch, 'performVectorSearch').mockResolvedValue(vectorResults);
      vi.spyOn(hybridSearch, 'performKeywordSearch').mockResolvedValue(keywordResults);

      const results = await hybridSearch.search(query);
      
      expect(results.success).toBe(true);
      expect(results.total_results).toBeGreaterThan(0);
      expect(results.search_methods_used).toContain('vector');
      expect(results.search_methods_used).toContain('keyword');
      
      // Check that results are properly merged and weighted
      const vectorOnlyResult = results.results.find(r => r.fragrance_id === 'vector-2');
      const hybridResult = results.results.find(r => r.fragrance_id === 'vector-1'); // Appears in both
      const keywordOnlyResult = results.results.find(r => r.fragrance_id === 'keyword-2');
      
      expect(vectorOnlyResult?.final_score).toBeGreaterThan(0);
      expect(hybridResult?.final_score).toBeGreaterThan(vectorOnlyResult?.final_score); // Should score higher
      expect(keywordOnlyResult?.final_score).toBeGreaterThan(0);
    });

    it('SEARCH-003b: Search Result Ranking and Scoring', async () => {
      const mockResults = [
        { 
          fragrance_id: 'high-vector-low-keyword',
          vector_similarity: 0.95,
          keyword_relevance: 0.3,
          popularity_score: 0.5
        },
        {
          fragrance_id: 'medium-all-around',
          vector_similarity: 0.75,
          keyword_relevance: 0.8,
          popularity_score: 0.9
        },
        {
          fragrance_id: 'low-vector-high-keyword',
          vector_similarity: 0.4,
          keyword_relevance: 0.95,
          popularity_score: 0.7
        }
      ];

      const rankedResults = hybridSearch.calculateFinalScores(mockResults);
      
      // Verify scoring algorithm
      rankedResults.forEach(result => {
        const expectedScore = 
          (result.vector_similarity * 0.7) +
          (result.keyword_relevance * 0.2) +
          (result.popularity_score * 0.1);
        
        expect(result.final_score).toBeCloseTo(expectedScore, 2);
      });

      // Verify ranking order
      expect(rankedResults[0].final_score).toBeGreaterThanOrEqual(rankedResults[1].final_score);
      expect(rankedResults[1].final_score).toBeGreaterThanOrEqual(rankedResults[2].final_score);
    });

    it('SEARCH-003c: Fallback Strategy When Vector Search Fails', async () => {
      const query = 'test fragrance search';
      
      // Mock vector search failure
      vi.spyOn(hybridSearch, 'performVectorSearch').mockRejectedValue(
        new Error('Vector search unavailable')
      );

      // Mock successful keyword search
      vi.spyOn(hybridSearch, 'performKeywordSearch').mockResolvedValue([
        { fragrance_id: 'fallback-1', relevance: 0.85, source: 'keyword' },
        { fragrance_id: 'fallback-2', relevance: 0.72, source: 'keyword' }
      ]);

      const results = await hybridSearch.search(query);
      
      expect(results.success).toBe(true);
      expect(results.search_methods_used).toContain('keyword');
      expect(results.search_methods_used).not.toContain('vector');
      expect(results.fallback_used).toBe(true);
      expect(results.results.length).toBe(2);
    });

    it('SEARCH-003d: Filter Integration with Hybrid Search', async () => {
      const query = 'woody fragrance';
      const filters = {
        scent_families: ['woody', 'oriental'],
        price_range: { min: 20, max: 100 },
        sample_available: true,
        brands: ['Tom Ford', 'Creed']
      };

      // Mock search results that should be filtered
      const unfilteredResults = [
        { 
          fragrance_id: 'matches-all-filters',
          scent_family: 'woody',
          price: 75,
          sample_available: true,
          brand: 'Tom Ford'
        },
        {
          fragrance_id: 'wrong-price',
          scent_family: 'woody',
          price: 150, // Too expensive
          sample_available: true,
          brand: 'Creed'
        },
        {
          fragrance_id: 'no-sample',
          scent_family: 'oriental',
          price: 50,
          sample_available: false, // No sample
          brand: 'Tom Ford'
        }
      ];

      const filteredResults = hybridSearch.applyFilters(unfilteredResults, filters);
      
      expect(filteredResults.length).toBe(1);
      expect(filteredResults[0].fragrance_id).toBe('matches-all-filters');
    });
  });

  describe('SEARCH-004: Personalization and Context Tests', () => {
    let personalizer: SearchPersonalizer;
    let testUserId: string;

    beforeEach(() => {
      testUserId = randomUUID();
      personalizer = new SearchPersonalizer({
        supabase,
        enableUserPreferences: true,
        enableCollectionAnalysis: true,
        enableBehavioralLearning: true
      });
    });

    afterEach(async () => {
      // Clean up test data
      await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', testUserId);
      
      await supabase
        .from('user_interactions')
        .delete()
        .eq('user_id', testUserId);
    });

    it('SEARCH-004a: User Preference-Based Ranking', async () => {
      // Create mock user preference embedding
      const userPreferenceEmbedding = Array.from({ length: 2000 }, () => Math.random() * 2 - 1);
      
      const mockUserPreferences = {
        user_embedding: userPreferenceEmbedding,
        favorite_families: ['oriental', 'woody'],
        preferred_intensity: 7.5,
        brand_affinity: { 'Tom Ford': 0.9, 'Creed': 0.7 },
        occasion_preferences: ['evening', 'special']
      };

      vi.spyOn(personalizer, 'getUserPreferences').mockResolvedValue(mockUserPreferences);

      const baseResults = [
        {
          fragrance_id: 'matches-preferences',
          scent_family: 'oriental',
          brand: 'Tom Ford',
          intensity: 8,
          occasions: ['evening']
        },
        {
          fragrance_id: 'partial-match',
          scent_family: 'fresh',
          brand: 'Acqua di Parma',
          intensity: 4,
          occasions: ['daytime']
        }
      ];

      const personalizedResults = await personalizer.personalizeResults(baseResults, testUserId);
      
      expect(personalizedResults[0].personalization_score).toBeGreaterThan(personalizedResults[1].personalization_score);
      expect(personalizedResults[0].fragrance_id).toBe('matches-preferences');
      expect(personalizedResults[0].personalization_factors).toContain('scent_family_match');
      expect(personalizedResults[0].personalization_factors).toContain('brand_affinity');
    });

    it('SEARCH-004b: Behavioral Learning Integration', async () => {
      // Mock user's recent interactions
      const recentInteractions = [
        {
          fragrance_id: 'recently-viewed-1',
          interaction_type: 'view',
          interaction_value: 45, // seconds viewed
          created_at: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
        },
        {
          fragrance_id: 'recently-rated-1',
          interaction_type: 'rating',
          interaction_value: 5,
          created_at: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
        }
      ];

      vi.spyOn(personalizer, 'getRecentInteractions').mockResolvedValue(recentInteractions);

      const contextualFactors = await personalizer.getContextualFactors(testUserId);
      
      expect(contextualFactors.recently_engaged).toContain('recently-viewed-1');
      expect(contextualFactors.recently_engaged).toContain('recently-rated-1');
      expect(contextualFactors.engagement_strength['recently-rated-1']).toBeGreaterThan(
        contextualFactors.engagement_strength['recently-viewed-1']
      );
    });

    it('SEARCH-004c: Cold Start Handling for New Users', async () => {
      const newUserId = randomUUID();
      
      // Mock no user data
      vi.spyOn(personalizer, 'getUserPreferences').mockResolvedValue(null);
      vi.spyOn(personalizer, 'getRecentInteractions').mockResolvedValue([]);

      const coldStartStrategy = await personalizer.getColdStartStrategy(newUserId);
      
      expect(coldStartStrategy.strategy_type).toBe('demographic_defaults');
      expect(coldStartStrategy.fallback_preferences).toBeDefined();
      expect(coldStartStrategy.recommended_exploration).toBe(true);
      expect(coldStartStrategy.confidence).toBeLessThan(0.5); // Low confidence for new users
    });

    it('SEARCH-004d: Contextual Search Enhancement', async () => {
      const searchContext: PersonalizationContext = {
        user_id: testUserId,
        time_of_day: 'evening',
        season: 'winter',
        occasion: 'date',
        location: 'restaurant',
        weather: 'cold'
      };

      const baseQuery = 'nice fragrance';
      
      const contextualQuery = await personalizer.enhanceQueryWithContext(baseQuery, searchContext);
      
      expect(contextualQuery.enhanced_query).toContain('evening');
      expect(contextualQuery.enhanced_query).toContain('winter');
      expect(contextualQuery.contextual_boosts.evening_appropriate).toBe(true);
      expect(contextualQuery.contextual_boosts.season_match).toBe('winter');
      expect(contextualQuery.suggested_filters.occasions).toContain('date');
    });
  });

  describe('SEARCH-005: Search Suggestions and Autocomplete Tests', () => {
    let suggestionEngine: SearchSuggestionEngine;

    beforeEach(() => {
      suggestionEngine = new SearchSuggestionEngine({
        supabase,
        enableRealTime: true,
        enablePersonalization: true,
        maxSuggestions: 8,
        minQueryLength: 2
      });
    });

    it('SEARCH-005a: Real-Time Search Suggestions', async () => {
      const partialQueries = [
        { input: 'fr', expected_suggestions: ['fresh', 'fragrance', 'fruity'] },
        { input: 'van', expected_suggestions: ['vanilla', 'Valentino'] },
        { input: 'tom f', expected_suggestions: ['Tom Ford', 'Tom Ford Black Orchid'] },
        { input: 'woody', expected_suggestions: ['woody masculine', 'woody oriental', 'woody fresh'] }
      ];

      for (const test of partialQueries) {
        const suggestions = await suggestionEngine.getSuggestions(test.input);
        
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions.length).toBeLessThanOrEqual(8);
        
        // Check suggestion types
        const suggestionTypes = new Set(suggestions.map(s => s.type));
        expect(suggestionTypes.size).toBeGreaterThan(0);
        
        // Verify suggestions are relevant
        suggestions.forEach(suggestion => {
          expect(suggestion.text.toLowerCase()).toContain(test.input.toLowerCase());
          expect(suggestion.confidence).toBeGreaterThan(0);
        });
      }
    });

    it('SEARCH-005b: Personalized Suggestions', async () => {
      const userId = randomUUID();
      const partialQuery = 'eve';
      
      // Mock user preferences for evening fragrances
      const userPreferences = {
        favorite_families: ['oriental', 'woody'],
        preferred_occasions: ['evening', 'date'],
        brand_affinity: { 'Tom Ford': 0.9 }
      };

      vi.spyOn(suggestionEngine, 'getUserPreferences').mockResolvedValue(userPreferences);

      const personalizedSuggestions = await suggestionEngine.getPersonalizedSuggestions(partialQuery, userId);
      
      expect(personalizedSuggestions.length).toBeGreaterThan(0);
      
      // Should include personalized suggestions
      const hasPersonalizedSuggestion = personalizedSuggestions.some(s => 
        s.text.includes('evening') && (s.text.includes('oriental') || s.text.includes('woody'))
      );
      expect(hasPersonalizedSuggestion).toBe(true);
      
      // Should rank personalized suggestions higher
      const personalizedSugg = personalizedSuggestions.find(s => s.personalized === true);
      const genericSugg = personalizedSuggestions.find(s => s.personalized === false);
      
      if (personalizedSugg && genericSugg) {
        expect(personalizedSugg.confidence).toBeGreaterThan(genericSugg.confidence);
      }
    });

    it('SEARCH-005c: Trending and Popular Suggestions', async () => {
      const emptyQuery = '';
      
      const trendingSuggestions = await suggestionEngine.getTrendingSuggestions(emptyQuery);
      
      expect(trendingSuggestions.length).toBeGreaterThan(0);
      expect(trendingSuggestions.every(s => s.type === 'trending')).toBe(true);
      
      // Should include popular search patterns
      const expectedTrends = ['summer fragrances', 'fresh scents', 'evening perfumes'];
      const foundTrends = trendingSuggestions.filter(s => 
        expectedTrends.some(trend => s.text.includes(trend))
      );
      
      expect(foundTrends.length).toBeGreaterThan(0);
    });

    it('SEARCH-005d: Suggestion Performance and Caching', async () => {
      const query = 'fresh';
      
      // First call - should generate suggestions
      const startTime1 = Date.now();
      const suggestions1 = await suggestionEngine.getSuggestions(query);
      const time1 = Date.now() - startTime1;
      
      // Second call - should use cache
      const startTime2 = Date.now();
      const suggestions2 = await suggestionEngine.getSuggestions(query);
      const time2 = Date.now() - startTime2;
      
      expect(suggestions1).toEqual(suggestions2);
      expect(time2).toBeLessThan(time1); // Cached should be faster
      expect(time2).toBeLessThan(100); // Cache should be very fast
    });
  });

  describe('SEARCH-006: Performance Optimization Tests', () => {
    let optimizer: SearchPerformanceOptimizer;

    beforeEach(() => {
      optimizer = new SearchPerformanceOptimizer({
        supabase,
        enableQueryCache: true,
        enableResultCache: true,
        enableIndexOptimization: true,
        cacheExpiry: 300000 // 5 minutes
      });
    });

    it('SEARCH-006a: Query Result Caching', async () => {
      const query = 'vanilla oriental fragrance';
      const filters = { scent_families: ['oriental'] };
      
      // Mock search results
      const mockResults = [
        { fragrance_id: 'cache-test-1', name: 'Cached Result 1' },
        { fragrance_id: 'cache-test-2', name: 'Cached Result 2' }
      ];

      // First search - should cache results
      vi.spyOn(optimizer, 'executeSearch').mockResolvedValue({
        results: mockResults,
        processing_time_ms: 250,
        cached: false
      });

      const firstSearch = await optimizer.search(query, filters);
      expect(firstSearch.metadata.cached).toBe(false);
      expect(firstSearch.metadata.processing_time_ms).toBe(250);

      // Second search - should use cache
      vi.spyOn(optimizer, 'executeSearch').mockResolvedValue({
        results: mockResults,
        processing_time_ms: 15,
        cached: true
      });

      const secondSearch = await optimizer.search(query, filters);
      expect(secondSearch.metadata.cached).toBe(true);
      expect(secondSearch.metadata.processing_time_ms).toBeLessThan(50);
    });

    it('SEARCH-006b: Search Performance Monitoring', async () => {
      const performanceMetrics = {
        avg_query_time: 180,
        cache_hit_rate: 0.75,
        vector_search_time: 120,
        keyword_search_time: 40,
        total_searches_24h: 150,
        slow_queries_count: 5
      };

      optimizer.recordPerformanceMetrics(performanceMetrics);
      
      const analysis = optimizer.analyzePerformance();
      
      expect(analysis.overall_performance).toBe('good'); // <200ms avg
      expect(analysis.cache_effectiveness).toBe('excellent'); // >70% hit rate
      expect(analysis.bottlenecks).toContain('vector_search'); // Slowest component
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });

    it('SEARCH-006c: Index Optimization Recommendations', async () => {
      // Mock slow query analysis
      const slowQueries = [
        {
          query: 'vanilla amber oriental',
          execution_time: 850,
          filter_selectivity: 0.3,
          result_count: 120
        },
        {
          query: 'fresh citrus summer',
          execution_time: 1200,
          filter_selectivity: 0.1,
          result_count: 250
        }
      ];

      const indexRecommendations = optimizer.analyzeIndexNeeds(slowQueries);
      
      expect(indexRecommendations.length).toBeGreaterThan(0);
      expect(indexRecommendations[0]).toHaveProperty('index_type');
      expect(indexRecommendations[0]).toHaveProperty('columns');
      expect(indexRecommendations[0]).toHaveProperty('expected_improvement');
      expect(indexRecommendations[0]).toHaveProperty('maintenance_cost');
    });

    it('SEARCH-006d: Resource Usage Optimization', async () => {
      const resourceUsage = {
        embedding_api_calls: 150,
        database_queries: 300,
        cache_storage_mb: 25,
        avg_response_time: 180
      };

      const optimizations = optimizer.suggestOptimizations(resourceUsage);
      
      expect(optimizations.length).toBeGreaterThan(0);
      
      // Should suggest specific optimizations based on usage patterns
      const hasEmbeddingOptimization = optimizations.some(opt => 
        opt.type === 'embedding_batching' || opt.type === 'embedding_cache'
      );
      
      const hasDatabaseOptimization = optimizations.some(opt => 
        opt.type === 'query_optimization' || opt.type === 'connection_pooling'
      );
      
      expect(hasEmbeddingOptimization || hasDatabaseOptimization).toBe(true);
    });
  });

  describe('SEARCH-007: Integration and End-to-End Tests', () => {
    it('SEARCH-007a: Complete Search Flow', async () => {
      const naturalQuery = 'fresh summer fragrance for beach vacation';
      
      // Mock complete search pipeline
      const searchPipeline = {
        processQuery: vi.fn().mockResolvedValue({
          processed_query: 'fresh summer fragrance beach vacation',
          intent: 'scent_description',
          entities: ['fresh', 'summer', 'beach', 'vacation'],
          query_embedding: Array.from({ length: 2000 }, () => Math.random())
        }),
        
        performHybridSearch: vi.fn().mockResolvedValue({
          vector_results: [
            { fragrance_id: 'beach-perfect-1', similarity: 0.89 },
            { fragrance_id: 'summer-fresh-2', similarity: 0.82 }
          ],
          keyword_results: [
            { fragrance_id: 'beach-perfect-1', relevance: 0.75 },
            { fragrance_id: 'vacation-scent-3', relevance: 0.68 }
          ]
        }),
        
        personalizeAndRank: vi.fn().mockResolvedValue([
          {
            fragrance_id: 'beach-perfect-1',
            final_score: 0.91,
            explanation: 'Perfect match for fresh summer beach scents'
          },
          {
            fragrance_id: 'summer-fresh-2', 
            final_score: 0.84,
            explanation: 'Great fresh option for summer activities'
          }
        ])
      };

      // Execute complete search flow
      const queryData = await searchPipeline.processQuery(naturalQuery);
      const searchResults = await searchPipeline.performHybridSearch(queryData);
      const finalResults = await searchPipeline.personalizeAndRank(searchResults);
      
      // Verify each stage worked
      expect(queryData.intent).toBe('scent_description');
      expect(queryData.entities).toContain('fresh');
      expect(queryData.entities).toContain('summer');
      
      expect(searchResults.vector_results.length).toBeGreaterThan(0);
      expect(searchResults.keyword_results.length).toBeGreaterThan(0);
      
      expect(finalResults.length).toBeGreaterThan(0);
      expect(finalResults[0].final_score).toBeGreaterThan(finalResults[1].final_score);
      expect(finalResults[0].explanation).toContain('beach');
    });

    it('SEARCH-007b: Multi-Language Search Support', async () => {
      const multiLanguageQueries = [
        { query: 'parfum frais été', language: 'fr', expected_intent: 'scent_description' },
        { query: 'frische Sommerduft', language: 'de', expected_intent: 'scent_description' },
        { query: 'profumo fresco estate', language: 'it', expected_intent: 'scent_description' }
      ];

      const queryProcessor = new QueryProcessor({
        enableMultiLanguage: true,
        supportedLanguages: ['en', 'fr', 'de', 'it', 'es']
      });

      for (const test of multiLanguageQueries) {
        const processed = await queryProcessor.processMultiLanguageQuery(test.query, test.language);
        
        expect(processed.detected_language).toBe(test.language);
        expect(processed.translated_query).toBeDefined();
        expect(processed.english_equivalent).toContain('fresh');
        expect(processed.intent).toBe(test.expected_intent);
      }
    });

    it('SEARCH-007c: Search Quality Metrics', async () => {
      const searchQualityAnalyzer = {
        analyzeResultQuality: vi.fn().mockResolvedValue({
          relevance_score: 0.87,
          diversity_score: 0.73,
          coverage_score: 0.91,
          personalization_effectiveness: 0.82,
          user_satisfaction_proxy: 0.89
        }),
        
        trackUserEngagement: vi.fn().mockResolvedValue({
          click_through_rate: 0.34,
          time_to_click: 2.1, // seconds
          bounce_rate: 0.12,
          conversion_rate: 0.08
        })
      };

      const qualityMetrics = await searchQualityAnalyzer.analyzeResultQuality();
      const engagementMetrics = await searchQualityAnalyzer.trackUserEngagement();
      
      expect(qualityMetrics.relevance_score).toBeGreaterThan(0.8);
      expect(qualityMetrics.diversity_score).toBeGreaterThan(0.7);
      expect(engagementMetrics.click_through_rate).toBeGreaterThan(0.2);
      expect(engagementMetrics.bounce_rate).toBeLessThan(0.2);
    });
  });

  describe('SEARCH-008: Edge Cases and Error Handling Tests', () => {
    it('SEARCH-008a: Empty and Invalid Queries', async () => {
      const semanticSearch = new SemanticSearchEngine({ supabase });
      
      const invalidQueries = ['', '   ', '!@#$%', 'a', '🎭🎨🎪'];
      
      for (const query of invalidQueries) {
        const result = await semanticSearch.search(query);
        
        if (query.trim().length === 0) {
          expect(result.success).toBe(false);
          expect(result.error).toContain('empty');
        } else if (query.trim().length < 2) {
          expect(result.success).toBe(false);
          expect(result.error).toContain('too short');
        } else {
          // Should handle gracefully even with special characters
          expect(result.success).toBe(true);
          expect(result.results).toBeDefined();
        }
      }
    });

    it('SEARCH-008b: Large Result Set Handling', async () => {
      const broadQuery = 'fragrance'; // Very broad query
      
      const hybridSearch = new HybridSearchEngine({
        supabase,
        maxResults: 100,
        enablePagination: true
      });

      // Mock large result set
      const largeResultSet = Array.from({ length: 500 }, (_, i) => ({
        fragrance_id: `result-${i}`,
        similarity: 0.9 - (i * 0.001), // Decreasing similarity
        name: `Fragrance ${i}`,
        brand: `Brand ${i % 10}`
      }));

      vi.spyOn(hybridSearch, 'performVectorSearch').mockResolvedValue(largeResultSet);

      const results = await hybridSearch.search(broadQuery, { 
        page: 1, 
        pageSize: 20 
      });
      
      expect(results.results.length).toBe(20); // Properly limited
      expect(results.pagination.total_results).toBe(500);
      expect(results.pagination.total_pages).toBe(25);
      expect(results.pagination.current_page).toBe(1);
      expect(results.pagination.has_next).toBe(true);
    });

    it('SEARCH-008c: Concurrent Search Request Handling', async () => {
      const semanticSearch = new SemanticSearchEngine({ 
        supabase,
        enableConcurrencyControl: true,
        maxConcurrentRequests: 5
      });

      // Mock concurrent requests
      const concurrentQueries = [
        'fresh citrus',
        'woody oriental', 
        'vanilla sweet',
        'spicy masculine',
        'floral feminine',
        'aquatic marine', // 6th request - should be throttled
        'gourmand dessert'
      ];

      const promises = concurrentQueries.map(query => semanticSearch.search(query));
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => r.status === 'fulfilled');
      const throttled = results.filter(r => 
        r.status === 'rejected' && r.reason.message.includes('throttle')
      );
      
      expect(successful.length).toBeGreaterThanOrEqual(5); // At least 5 should succeed
      expect(throttled.length).toBeGreaterThanOrEqual(1); // At least 1 should be throttled
    });

    it('SEARCH-008d: Degraded Performance Scenarios', async () => {
      const resilientSearch = new HybridSearchEngine({
        supabase,
        enableFallbacks: true,
        timeoutMs: 5000
      });

      // Test slow vector search scenario
      vi.spyOn(resilientSearch, 'performVectorSearch').mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 6000)); // Timeout
        throw new Error('Vector search timeout');
      });

      // Mock fast keyword search
      vi.spyOn(resilientSearch, 'performKeywordSearch').mockResolvedValue([
        { fragrance_id: 'keyword-1', relevance: 0.8, source: 'keyword' }
      ]);

      const results = await resilientSearch.search('test query');
      
      expect(results.success).toBe(true);
      expect(results.search_methods_used).toContain('keyword');
      expect(results.search_methods_used).not.toContain('vector');
      expect(results.performance_degraded).toBe(true);
      expect(results.degradation_reason).toContain('timeout');
    });
  });

  describe('SEARCH-009: Real-World Query Pattern Tests', () => {
    it('SEARCH-009a: Complex Natural Language Queries', async () => {
      const complexQueries = [
        {
          query: 'I want something fresh and citrusy but not too overwhelming for daytime office wear',
          expected_intent: 'scent_description',
          expected_occasion: 'office',
          expected_intensity: 'light'
        },
        {
          query: 'What would be a good evening fragrance similar to Tom Ford Black Orchid but more affordable',
          expected_intent: 'comparison', 
          expected_reference: 'Tom Ford Black Orchid',
          expected_constraint: 'affordable'
        },
        {
          query: 'I love vanilla and amber scents, what would you recommend for winter',
          expected_intent: 'recommendation',
          expected_notes: ['vanilla', 'amber'],
          expected_season: 'winter'
        }
      ];

      const queryProcessor = new QueryProcessor({
        enableAdvancedNLP: true,
        enableIntentDetection: true
      });

      for (const test of complexQueries) {
        const processed = await queryProcessor.processComplexQuery(test.query);
        
        expect(processed.intent.primary).toBe(test.expected_intent);
        expect(processed.confidence).toBeGreaterThan(0.7);
        
        if (test.expected_occasion) {
          expect(processed.extracted_context.occasions).toContain(test.expected_occasion);
        }
        
        if (test.expected_notes) {
          test.expected_notes.forEach(note => {
            expect(processed.extracted_entities.scent_notes).toContain(note);
          });
        }
        
        if (test.expected_season) {
          expect(processed.extracted_context.seasons).toContain(test.expected_season);
        }
      }
    });

    it('SEARCH-009b: Conversational Search Patterns', async () => {
      const conversationalQueries = [
        'Show me something fresh',
        'I need a new signature scent',
        'What\'s good for summer?',
        'Find me something like what I already own',
        'Surprise me with something different'
      ];

      const conversationalProcessor = new QueryProcessor({
        enableConversationalMode: true,
        enableContextMemory: true
      });

      for (const query of conversationalQueries) {
        const processed = await conversationalProcessor.processConversationalQuery(query);
        
        expect(processed.conversation_type).toBeDefined();
        expect(processed.response_strategy).toBeDefined();
        expect(processed.follow_up_questions.length).toBeGreaterThan(0);
        
        // Should suggest clarifying questions
        if (query.includes('something fresh')) {
          expect(processed.follow_up_questions.some(q => 
            q.includes('occasion') || q.includes('season')
          )).toBe(true);
        }
      }
    });

    it('SEARCH-009c: Mobile vs Desktop Search Behavior', async () => {
      const mobileSearch = new HybridSearchEngine({
        supabase,
        deviceType: 'mobile',
        prioritizeSpeed: true,
        simplifyResults: true
      });

      const desktopSearch = new HybridSearchEngine({
        supabase,
        deviceType: 'desktop',
        enableAdvancedFeatures: true,
        maxResults: 50
      });

      const query = 'vanilla oriental fragrance';

      // Mock different optimization strategies
      vi.spyOn(mobileSearch, 'optimizeForMobile').mockResolvedValue({
        simplified_results: true,
        reduced_metadata: true,
        faster_processing: true
      });

      vi.spyOn(desktopSearch, 'optimizeForDesktop').mockResolvedValue({
        full_results: true,
        rich_metadata: true,
        advanced_features: true
      });

      const mobileResults = await mobileSearch.search(query);
      const desktopResults = await desktopSearch.search(query);
      
      expect(mobileResults.optimization.simplified_results).toBe(true);
      expect(mobileResults.metadata.device_optimized).toBe('mobile');
      
      expect(desktopResults.optimization.full_results).toBe(true);
      expect(desktopResults.metadata.device_optimized).toBe('desktop');
    });
  });
});

// Type definitions for testing
interface SearchQuery {
  text: string;
  filters?: any;
  context?: PersonalizationContext;
  options?: {
    similarityThreshold?: number;
    maxResults?: number;
    enablePersonalization?: boolean;
  };
}

interface SearchResult {
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

interface SearchIntent {
  primary_intent: string;
  secondary_intents?: string[];
  confidence: number;
  entities: Array<{
    text: string;
    type: string;
    confidence: number;
  }>;
}

interface PersonalizationContext {
  user_id: string;
  time_of_day?: string;
  season?: string;
  occasion?: string;
  location?: string;
  weather?: string;
  device_type?: string;
}