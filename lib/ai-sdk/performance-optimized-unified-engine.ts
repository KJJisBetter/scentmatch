/**
 * Performance-Optimized Unified Recommendation Engine
 * 
 * Enhanced version of the unified engine with performance optimizations
 * Integrates caching, optimized experience detection, and performance monitoring
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { optimizedAIClient } from './performance-optimized-client';
import { createOptimizedExperienceDetector } from './performance-optimized-experience-detector';
import { performanceMonitor } from '@/lib/performance/adaptive-ai-monitor';
import { educationCache } from '@/lib/education/cache-manager';
import type {
  UnifiedRecommendationRequest,
  UnifiedRecommendationResult,
  RecommendationItem,
  RecommendationStrategy,
} from './unified-recommendation-engine';
import type { UserExperienceLevel } from './user-experience-detector';

export interface OptimizedRecommendationResult extends UnifiedRecommendationResult {
  performance: {
    totalProcessingTime: number;
    experienceDetectionTime: number;
    aiProcessingTime: number;
    cacheHitsUsed: number;
    fallbacksUsed: number;
    queryOptimizations: string[];
  };
  caching: {
    educationalContentCached: boolean;
    experienceAnalysisCached: boolean;
    recommendationsCached: boolean;
    cacheHitRate: number;
  };
}

/**
 * High-performance unified recommendation engine
 */
export class PerformanceOptimizedUnifiedEngine {
  private supabase: SupabaseClient;
  private defaultStrategy: RecommendationStrategy;
  private experienceDetector;

  constructor(
    supabase: SupabaseClient,
    defaultStrategy: RecommendationStrategy = 'hybrid'
  ) {
    this.supabase = supabase;
    this.defaultStrategy = defaultStrategy;
    this.experienceDetector = createOptimizedExperienceDetector(supabase);
  }

  /**
   * Generate recommendations with comprehensive performance optimization
   */
  async generateOptimizedRecommendations(
    request: UnifiedRecommendationRequest
  ): Promise<OptimizedRecommendationResult> {
    const overallStartTime = performance.now();
    const strategy = request.strategy || this.defaultStrategy;
    const limit = Math.min(request.limit || 10, 50);

    const performanceMetrics = {
      totalProcessingTime: 0,
      experienceDetectionTime: 0,
      aiProcessingTime: 0,
      cacheHitsUsed: 0,
      fallbacksUsed: 0,
      queryOptimizations: [] as string[],
    };

    const cachingMetrics = {
      educationalContentCached: false,
      experienceAnalysisCached: false,
      recommendationsCached: false,
      cacheHitRate: 0,
    };

    try {
      // Generate session token if not provided
      const sessionToken = request.sessionToken || this.generateSessionToken();

      // Check for cached recommendations first
      const cacheKey = this.createRecommendationCacheKey(request);
      const cachedResult = educationCache.get<OptimizedRecommendationResult>(cacheKey);
      
      if (cachedResult) {
        cachingMetrics.recommendationsCached = true;
        cachingMetrics.cacheHitRate = 100;
        performanceMetrics.cacheHitsUsed = 1;

        performanceMonitor.recordAIMetric('explanationGeneration', 
          performance.now() - overallStartTime, true);

        return {
          ...cachedResult,
          performance: {
            ...performanceMetrics,
            totalProcessingTime: performance.now() - overallStartTime,
          },
          caching: cachingMetrics,
        };
      }

      // Get recommendations based on strategy with optimizations
      let recommendations: RecommendationItem[];
      let personalityAnalysis: any;
      let methodUsed: string;

      switch (strategy) {
        case 'database':
          const dbResult = await this.getOptimizedDatabaseRecommendations(request, limit);
          recommendations = dbResult.recommendations;
          performanceMetrics.queryOptimizations = dbResult.optimizations;
          methodUsed = 'optimized_database_rpc';
          break;

        case 'ai':
          const aiResult = await this.getOptimizedAIRecommendations(request, limit);
          recommendations = aiResult.recommendations;
          personalityAnalysis = aiResult.personality;
          performanceMetrics.aiProcessingTime = aiResult.processingTime;
          performanceMetrics.cacheHitsUsed += aiResult.cacheHits;
          methodUsed = 'optimized_ai_sdk';
          break;

        case 'hybrid':
        default:
          const hybridResult = await this.getOptimizedHybridRecommendations(request, limit);
          recommendations = hybridResult.recommendations;
          personalityAnalysis = hybridResult.personality;
          performanceMetrics.aiProcessingTime = hybridResult.aiProcessingTime;
          performanceMetrics.cacheHitsUsed += hybridResult.cacheHits;
          performanceMetrics.queryOptimizations = hybridResult.optimizations;
          methodUsed = 'optimized_hybrid_ai_database';
          break;
      }

      // Calculate overall confidence
      const avgConfidence =
        recommendations.reduce((sum, rec) => sum + rec.score, 0) /
          recommendations.length || 0;

      const result: OptimizedRecommendationResult = {
        success: true,
        recommendations,
        personality_analysis: personalityAnalysis,
        quiz_session_token: sessionToken,
        processing_time_ms: performance.now() - overallStartTime,
        recommendation_method: methodUsed,
        confidence_score: avgConfidence,
        metadata: {
          strategy_used: strategy,
          total_candidates: recommendations.length,
          algorithm_version: 'optimized_unified_v2.0',
        },
        performance: {
          ...performanceMetrics,
          totalProcessingTime: performance.now() - overallStartTime,
        },
        caching: {
          ...cachingMetrics,
          cacheHitRate: educationCache.getMetrics().hitRate,
        },
      };

      // Cache successful results
      if (result.success && recommendations.length > 0) {
        educationCache.set(cacheKey, result, 900000); // 15 minutes
      }

      // Record performance metrics
      performanceMonitor.recordAIMetric('explanationGeneration', 
        result.performance.totalProcessingTime, false);

      return result;

    } catch (error) {
      console.error('Optimized unified recommendation engine error:', error);
      performanceMetrics.fallbacksUsed = 1;

      const fallbackResult: OptimizedRecommendationResult = {
        success: false,
        recommendations: [],
        quiz_session_token: request.sessionToken || this.generateSessionToken(),
        processing_time_ms: performance.now() - overallStartTime,
        recommendation_method: 'optimized_error_fallback',
        confidence_score: 0,
        metadata: {
          strategy_used: strategy,
          total_candidates: 0,
          algorithm_version: 'optimized_unified_v2.0',
        },
        performance: {
          ...performanceMetrics,
          totalProcessingTime: performance.now() - overallStartTime,
        },
        caching: cachingMetrics,
      };

      return fallbackResult;
    }
  }

  /**
   * Optimized database recommendations with query optimization
   */
  private async getOptimizedDatabaseRecommendations(
    request: UnifiedRecommendationRequest,
    limit: number
  ): Promise<{ recommendations: RecommendationItem[]; optimizations: string[] }> {
    const optimizations: string[] = [];

    // Try optimized RPC function with batched queries
    if (request.quizResponses) {
      try {
        optimizations.push('using_optimized_rpc_function');
        
        const rpcResult = await this.supabase.rpc('get_quiz_recommendations_optimized', {
          quiz_responses: request.quizResponses,
          max_results: limit,
          include_educational_terms: request.adaptiveExplanations !== false,
        });

        if (rpcResult && !rpcResult.error && rpcResult.data?.length > 0) {
          optimizations.push('rpc_cache_hit');
          
          return {
            recommendations: rpcResult.data.map((item: any) => ({
              fragrance_id: item.fragrance_id,
              name: item.name,
              brand: item.brand,
              score: item.match_percentage / 100,
              explanation: item.ai_insight || 'Database-matched based on preferences',
              confidence_level: item.match_percentage > 80 ? 'high' as const :
                             item.match_percentage > 60 ? 'medium' as const : 'low' as const,
              sample_available: item.sample_available ?? true,
              sample_price_usd: item.sample_price_usd || 15,
              image_url: item.image_url,
              scent_family: item.scent_family,
              why_recommended: item.reasoning || 'Matches your quiz preferences',
            })),
            optimizations,
          };
        }
      } catch (rpcError) {
        console.warn('Optimized RPC function not available, using fallback:', rpcError);
        optimizations.push('rpc_fallback_used');
      }
    }

    // Fallback to optimized popular fragrances query
    optimizations.push('using_popular_fragrances_fallback');
    const recommendations = await this.getOptimizedPopularFragrances(limit);
    
    return { recommendations, optimizations };
  }

  /**
   * Optimized AI recommendations with batching and caching
   */
  private async getOptimizedAIRecommendations(
    request: UnifiedRecommendationRequest,
    limit: number
  ): Promise<{
    recommendations: RecommendationItem[];
    personality?: any;
    processingTime: number;
    cacheHits: number;
  }> {
    const startTime = performance.now();
    let cacheHits = 0;
    let personality: any;

    // Analyze personality with optimized detector
    if (request.quizResponses?.length) {
      const personalityResult = await optimizedAIClient.explainForBeginnerOptimized(
        'personality-analysis',
        this.buildUserContext(request),
        'User personality analysis'
      );
      
      if (personalityResult.performance.cacheHit) cacheHits++;
      // Mock personality for now - could be enhanced
      personality = { personality_type: 'balanced', confidence: 0.8, traits: ['curious', 'practical'] };
    }

    // Get available fragrances with optimized query
    const { data: fragrances } = await this.supabase
      .from('fragrances')
      .select(`
        id, name, scent_family,
        fragrance_brands!inner(name),
        sample_available, sample_price_usd, image_url
      `)
      .limit(50) // Smaller batch for faster processing
      .order('popularity_score', { ascending: false });

    if (!fragrances?.length) {
      return { recommendations: [], processingTime: performance.now() - startTime, cacheHits };
    }

    // Use batch AI processing for efficiency
    const userContext = this.buildUserContext(request, personality);
    const batchRequests = fragrances.slice(0, limit).map(f => ({
      fragranceId: f.id,
      userContext,
      fragranceDetails: `${f.name} by ${f.fragrance_brands?.name} (${f.scent_family})`,
      experienceLevel: 'beginner' as UserExperienceLevel,
      explanationStyle: {
        maxWords: 35,
        complexity: 'simple' as const,
        includeEducation: true,
        useProgressiveDisclosure: true,
        vocabularyLevel: 'basic' as const,
      },
    }));

    const batchResults = await optimizedAIClient.batchExplainRecommendations(batchRequests);
    
    const recommendations: RecommendationItem[] = [];
    batchResults.forEach((result, fragranceId) => {
      const fragrance = fragrances.find(f => f.id === fragranceId);
      if (fragrance && result) {
        if (result.performance.cacheHit) cacheHits++;
        
        recommendations.push({
          fragrance_id: fragranceId,
          name: fragrance.name,
          brand: fragrance.fragrance_brands?.name || 'Unknown',
          score: 0.8, // Mock score - could be AI-generated
          explanation: result.explanation,
          confidence_level: 'medium',
          sample_available: fragrance.sample_available ?? true,
          sample_price_usd: fragrance.sample_price_usd || 15,
          image_url: fragrance.image_url,
          scent_family: fragrance.scent_family,
          why_recommended: result.explanation,
          adaptive_explanation: {
            user_experience_level: 'beginner',
            summary: result.summary,
            expanded_content: result.expandedContent,
            educational_terms: result.educationalTerms,
            confidence_boost: result.confidenceBoost,
          },
        });
      }
    });

    return {
      recommendations,
      personality,
      processingTime: performance.now() - startTime,
      cacheHits,
    };
  }

  /**
   * Optimized hybrid recommendations
   */
  private async getOptimizedHybridRecommendations(
    request: UnifiedRecommendationRequest,
    limit: number
  ): Promise<{
    recommendations: RecommendationItem[];
    personality?: any;
    aiProcessingTime: number;
    cacheHits: number;
    optimizations: string[];
  }> {
    const startTime = performance.now();
    let cacheHits = 0;
    const optimizations: string[] = [];

    // Get base recommendations from database (fast)
    const dbResult = await this.getOptimizedDatabaseRecommendations(request, limit * 2);
    optimizations.push(...dbResult.optimizations);

    // Enhance with optimized experience detection and AI explanations
    if (request.userId) {
      const experienceStart = performance.now();
      const experienceAnalysis = await this.experienceDetector.analyzeUserExperience(
        request.userId,
        { quizResponses: request.quizResponses, userCollection: request.userCollection }
      );
      
      performanceMonitor.recordAIMetric(
        'experienceDetection',
        performance.now() - experienceStart,
        experienceAnalysis.cachingUsed
      );

      if (experienceAnalysis.cachingUsed) cacheHits++;

      // Use AI to enhance top recommendations based on experience level
      const enhancedRecommendations = await this.enhanceRecommendationsWithOptimizedAI(
        dbResult.recommendations.slice(0, limit),
        request,
        experienceAnalysis
      );

      return {
        recommendations: enhancedRecommendations.recommendations,
        personality: enhancedRecommendations.personality,
        aiProcessingTime: performance.now() - startTime,
        cacheHits: cacheHits + enhancedRecommendations.cacheHits,
        optimizations,
      };
    }

    return {
      recommendations: dbResult.recommendations.slice(0, limit),
      aiProcessingTime: performance.now() - startTime,
      cacheHits,
      optimizations,
    };
  }

  /**
   * Enhanced recommendations with optimized AI processing
   */
  private async enhanceRecommendationsWithOptimizedAI(
    recommendations: RecommendationItem[],
    request: UnifiedRecommendationRequest,
    experienceAnalysis: any
  ): Promise<{
    recommendations: RecommendationItem[];
    personality?: any;
    cacheHits: number;
  }> {
    let cacheHits = 0;
    const userContext = this.buildUserContext(request);

    // Batch process AI enhancements
    const enhancementPromises = recommendations.map(async (rec) => {
      const fragranceDetails = `${rec.name} by ${rec.brand} (${rec.scent_family})`;
      
      try {
        let result;
        if (experienceAnalysis.level === 'beginner') {
          result = await optimizedAIClient.explainForBeginnerOptimized(
            rec.fragrance_id,
            userContext,
            fragranceDetails
          );
        } else {
          result = await optimizedAIClient.explainRecommendationOptimized(
            rec.fragrance_id,
            userContext,
            fragranceDetails,
            experienceAnalysis.level,
            experienceAnalysis.recommendedExplanationStyle
          );
        }

        if (result.performance.cacheHit) cacheHits++;

        return {
          ...rec,
          explanation: result.explanation,
          why_recommended: result.summary || result.explanation,
          adaptive_explanation: {
            user_experience_level: experienceAnalysis.level,
            summary: result.summary,
            expanded_content: result.expandedContent,
            educational_terms: result.educationalTerms,
            confidence_boost: result.confidenceBoost,
          },
        };
      } catch (error) {
        console.error('AI enhancement failed for recommendation:', error);
        return rec; // Return original recommendation if enhancement fails
      }
    });

    const enhanced = await Promise.all(enhancementPromises);

    return {
      recommendations: enhanced,
      cacheHits,
    };
  }

  /**
   * Optimized popular fragrances fallback
   */
  private async getOptimizedPopularFragrances(limit: number): Promise<RecommendationItem[]> {
    try {
      const { data: popular, error } = await this.supabase
        .from('fragrances')
        .select(`
          id, name, gender, popularity_score, rating_value, rating_count,
          sample_available, sample_price_usd, image_url,
          fragrance_brands!inner(name)
        `)
        .order('popularity_score', { ascending: false })
        .limit(limit);

      if (error || !popular) return [];

      return popular.map((f: any) => ({
        fragrance_id: f.id,
        name: f.name,
        brand: f.fragrance_brands?.name || 'Unknown',
        score: Math.min((f.popularity_score || 50) / 100, 0.8),
        explanation: `Popular choice with ${f.rating_value || 4.0}/5 rating`,
        confidence_level: 'medium' as const,
        sample_available: f.sample_available ?? true,
        sample_price_usd: f.sample_price_usd || 15,
        image_url: f.image_url,
        scent_family: f.gender || 'fragrance',
        why_recommended: `Highly rated (${f.rating_value || 4.0}/5) by the community`,
      }));
    } catch (error) {
      console.error('Error fetching optimized popular fragrances:', error);
      return [];
    }
  }

  /**
   * Create cache key for recommendation requests
   */
  private createRecommendationCacheKey(request: UnifiedRecommendationRequest): string {
    const key = [
      request.strategy,
      request.userId || 'anonymous',
      JSON.stringify(request.quizResponses || []),
      JSON.stringify(request.userPreferences || {}),
      request.limit || 10,
    ].join('_');
    
    return `rec_${this.hashString(key)}`;
  }

  /**
   * Build user context string for AI
   */
  private buildUserContext(request: UnifiedRecommendationRequest, personality?: any): string {
    const context: string[] = [];

    if (personality) {
      context.push(`Personality: ${personality.personality_type}`);
      context.push(`Traits: ${personality.traits.join(', ')}`);
    }

    if (request.userPreferences) {
      const prefs = request.userPreferences;
      if (prefs.scent_families) context.push(`Preferred families: ${prefs.scent_families.join(', ')}`);
      if (prefs.occasions) context.push(`Occasions: ${prefs.occasions.join(', ')}`);
      if (prefs.gender) context.push(`Gender preference: ${prefs.gender}`);
    }

    if (request.userCollection?.length) {
      const owned = request.userCollection.filter(c => c.collection_type === 'owned');
      if (owned.length > 0) context.push(`Owns ${owned.length} fragrances`);
    }

    return context.join('. ') || 'New user seeking fragrance recommendations';
  }

  /**
   * Generate session token
   */
  private generateSessionToken(): string {
    return `optimized-quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Simple hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      cache: educationCache.getMetrics(),
      experience: this.experienceDetector.getCacheMetrics(),
      ai: optimizedAIClient.getPerformanceMetrics(),
      monitor: performanceMonitor.getPerformanceReport(),
    };
  }
}

// Export factory function
export function createOptimizedUnifiedEngine(
  supabase: SupabaseClient,
  strategy: RecommendationStrategy = 'hybrid'
): PerformanceOptimizedUnifiedEngine {
  return new PerformanceOptimizedUnifiedEngine(supabase, strategy);
}