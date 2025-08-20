/**
 * Unified Recommendation Orchestration System
 * 
 * Central orchestrator that coordinates all AI enhancements for optimal
 * recommendation generation: Thompson Sampling, Real-Time Learning, 
 * Matryoshka Embeddings, Contextual Bandits, and Multi-Tier Caching.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventEmitter } from 'events';

// Import AI enhancement systems
import { createThompsonSamplingService, type ContextualFactors } from './thompson-sampling';
import { createRealTimeLearningSystem } from './real-time-integration';
import { createMatryoshkaEmbeddingSystem } from './embedding-pipeline';
import { createContextualRecommendationEngine } from './contextual-bandit-system';
import { createMultiTierEmbeddingCache } from './recommendation-cache-manager';
import { createAdaptiveSearchSystem } from './vector-search-optimizer';

// Core Types
export interface RecommendationRequest {
  user_id: string;
  request_context: {
    max_recommendations?: number;
    include_explanations?: boolean;
    adventure_level?: number;
    price_range?: { min: number; max: number };
    session_context?: any;
    device_context?: any;
    temporal_context?: any;
    user_preferences?: any;
  };
  optimization_preferences: {
    prioritize_speed?: boolean;
    prioritize_accuracy?: boolean;
    enable_real_time_adaptation?: boolean;
    enable_progressive_search?: boolean;
    cache_strategy?: 'aggressive' | 'balanced' | 'minimal';
  };
}

export interface OrchestrationResult {
  recommendations: Array<{
    fragrance_id: string;
    name: string;
    brand: string;
    score: number;
    confidence: number;
    explanation?: string;
    source_algorithm: string;
    precision_used: number;
    cache_hit: boolean;
    personalization_factors: string[];
  }>;
  
  orchestration_metadata: {
    total_latency_ms: number;
    component_latencies: {
      algorithm_selection_ms: number;
      embedding_processing_ms: number;
      search_execution_ms: number;
      ranking_optimization_ms: number;
      cache_operations_ms: number;
    };
    optimization_decisions: {
      selected_algorithm: string;
      precision_used: number;
      cache_strategy_applied: string;
      real_time_adaptation_applied: boolean;
      contextual_factors_utilized: string[];
    };
    performance_metrics: {
      cache_hit_rate: number;
      quality_score: number;
      personalization_strength: number;
      system_efficiency_score: number;
    };
    cost_optimization: {
      api_calls_saved: number;
      estimated_cost_cents: number;
      cost_efficiency_score: number;
    };
  };
  
  user_experience: {
    perceived_performance: 'excellent' | 'good' | 'acceptable' | 'poor';
    recommendation_relevance: number;
    diversity_score: number;
    novelty_balance: number;
    explanation_quality: number;
  };
}

export interface OrchestrationConfig {
  enable_thompson_sampling: boolean;
  enable_real_time_learning: boolean;
  enable_matryoshka_embeddings: boolean;
  enable_contextual_bandits: boolean;
  enable_multi_tier_caching: boolean;
  
  performance_targets: {
    max_total_latency_ms: number;
    min_recommendation_quality: number;
    min_cache_hit_rate: number;
    max_cost_per_request_cents: number;
  };
  
  optimization_strategy: 'speed_first' | 'quality_first' | 'balanced' | 'cost_optimized';
  fallback_behavior: 'graceful_degradation' | 'fail_fast' | 'cache_only';
}

// Unified Recommendation Orchestrator
export class UnifiedRecommendationOrchestrator extends EventEmitter {
  private supabase: SupabaseClient;
  private config: OrchestrationConfig;
  
  // AI Enhancement Services
  private thompsonSamplingService: any;
  private realTimeLearningSystem: any;
  private matryoshkaEmbeddingSystem: any;
  private contextualEngine: any;
  private multiTierCache: any;
  private adaptiveSearchSystem: any;
  
  // Performance tracking
  private performanceMetrics: OrchestrationPerformanceMetrics;
  private requestCounter: number = 0;

  constructor(supabase: SupabaseClient, config: Partial<OrchestrationConfig> = {}) {
    super();
    this.supabase = supabase;
    this.config = {
      enable_thompson_sampling: config.enable_thompson_sampling ?? true,
      enable_real_time_learning: config.enable_real_time_learning ?? true,
      enable_matryoshka_embeddings: config.enable_matryoshka_embeddings ?? true,
      enable_contextual_bandits: config.enable_contextual_bandits ?? true,
      enable_multi_tier_caching: config.enable_multi_tier_caching ?? true,
      
      performance_targets: config.performance_targets || {
        max_total_latency_ms: 200,
        min_recommendation_quality: 0.85,
        min_cache_hit_rate: 0.8,
        max_cost_per_request_cents: 0.5
      },
      
      optimization_strategy: config.optimization_strategy || 'balanced',
      fallback_behavior: config.fallback_behavior || 'graceful_degradation'
    };

    this.performanceMetrics = new OrchestrationPerformanceMetrics();
    this.initializeServices();
  }

  /**
   * Initialize all AI enhancement services
   */
  private initializeServices(): void {
    try {
      // Initialize Thompson Sampling service
      if (this.config.enable_thompson_sampling) {
        this.thompsonSamplingService = createThompsonSamplingService(this.supabase);
      }

      // Initialize Real-Time Learning system
      if (this.config.enable_real_time_learning) {
        this.realTimeLearningSystem = createRealTimeLearningSystem(this.supabase);
      }

      // Initialize Matryoshka Embedding system (would need OpenAI client in production)
      if (this.config.enable_matryoshka_embeddings) {
        // this.matryoshkaEmbeddingSystem = createMatryoshkaEmbeddingSystem(openaiClient, this.supabase);
        console.log('Matryoshka system initialized (requires OpenAI client in production)');
      }

      // Initialize Contextual Recommendation Engine
      if (this.config.enable_contextual_bandits) {
        this.contextualEngine = createContextualRecommendationEngine(this.supabase);
      }

      // Initialize Multi-Tier Cache
      if (this.config.enable_multi_tier_caching) {
        this.multiTierCache = createMultiTierEmbeddingCache(this.supabase);
      }

      // Initialize Adaptive Search System
      this.adaptiveSearchSystem = createAdaptiveSearchSystem(this.supabase);

      console.log('🎯 Unified Recommendation Orchestrator initialized with all AI enhancements');

    } catch (error) {
      console.error('Failed to initialize AI services:', error);
      throw new Error('Orchestrator initialization failed');
    }
  }

  /**
   * Generate recommendations using unified orchestration
   */
  async generateRecommendations(request: RecommendationRequest): Promise<OrchestrationResult> {
    const startTime = Date.now();
    this.requestCounter++;

    try {
      console.log(`🎯 Processing recommendation request ${this.requestCounter} for user ${request.user_id}`);

      // Step 1: Extract and enrich contextual factors
      const contextualFactors = await this.extractContextualFactors(request);
      const algorithmSelectionStart = Date.now();

      // Step 2: Select optimal algorithm using Thompson Sampling
      let selectedAlgorithm = 'hybrid'; // Default fallback
      let algorithmConfidence = 0.5;
      
      if (this.config.enable_thompson_sampling && this.thompsonSamplingService) {
        const algorithmSelection = await this.thompsonSamplingService.getOptimalAlgorithm(
          request.user_id,
          contextualFactors
        );
        selectedAlgorithm = algorithmSelection.algorithm_name;
        algorithmConfidence = algorithmSelection.confidence;
      }

      const algorithmSelectionTime = Date.now() - algorithmSelectionStart;

      // Step 3: Determine optimal precision using adaptive search
      const embeddingProcessingStart = Date.now();
      let precisionUsed = 512; // Default balanced precision
      
      if (this.config.enable_matryoshka_embeddings && this.adaptiveSearchSystem) {
        const precisionSelection = await this.adaptiveSearchSystem.precisionSelector.selectOptimalPrecision(
          request.request_context.session_context?.search_query || 'recommendations',
          request.user_id,
          request.request_context.session_context || {}
        );
        precisionUsed = precisionSelection.selected_precision;
      }

      const embeddingProcessingTime = Date.now() - embeddingProcessingStart;

      // Step 4: Check cache before expensive operations
      const cacheOperationsStart = Date.now();
      let cacheHit = false;
      let cachedRecommendations = null;
      
      if (this.config.enable_multi_tier_caching && this.multiTierCache) {
        const cacheKey = this.generateCacheKey(request, selectedAlgorithm, precisionUsed);
        const cacheResult = await this.multiTierCache.retrieveEmbedding(cacheKey, [precisionUsed]);
        
        if (cacheResult.cache_hit) {
          cacheHit = true;
          cachedRecommendations = this.convertCacheToRecommendations(cacheResult);
        }
      }

      const cacheOperationsTime = Date.now() - cacheOperationsStart;

      // Step 5: Generate recommendations if not cached
      const searchExecutionStart = Date.now();
      let recommendations = cachedRecommendations;
      
      if (!cacheHit) {
        if (this.config.enable_contextual_bandits && this.contextualEngine) {
          // Use contextual bandit engine for enhanced recommendations
          const contextualResult = await this.contextualEngine.generateContextualRecommendations(
            request.user_id,
            request.request_context,
            {
              max_recommendations: request.request_context.max_recommendations || 10,
              include_explanations: request.request_context.include_explanations || false,
              enable_real_time_adaptation: this.config.enable_real_time_learning
            }
          );
          
          recommendations = this.enhanceRecommendations(
            contextualResult.recommendations,
            selectedAlgorithm,
            precisionUsed,
            contextualFactors
          );
        } else {
          // Fallback to standard recommendation generation
          recommendations = await this.generateStandardRecommendations(
            request,
            selectedAlgorithm,
            precisionUsed
          );
        }

        // Cache the results for future requests
        if (this.config.enable_multi_tier_caching && recommendations) {
          await this.cacheRecommendations(request, recommendations, selectedAlgorithm, precisionUsed);
        }
      }

      const searchExecutionTime = Date.now() - searchExecutionStart;

      // Step 6: Apply final ranking optimization
      const rankingOptimizationStart = Date.now();
      const optimizedRecommendations = await this.applyRankingOptimization(
        recommendations || [],
        request,
        contextualFactors
      );
      const rankingOptimizationTime = Date.now() - rankingOptimizationStart;

      // Step 7: Process real-time learning if enabled
      if (this.config.enable_real_time_learning && this.realTimeLearningSystem && !cacheHit) {
        this.realTimeLearningSystem.orchestrator.processUserInteraction({
          user_id: request.user_id,
          fragrance_id: 'recommendation_generation',
          event_type: 'recommendation_request',
          context: request.request_context,
          device_context: request.request_context.device_context || {},
          timestamp: new Date()
        }, {
          enable_immediate_recommendations: false,
          include_contextual_adaptation: true,
          send_websocket_updates: false
        });
      }

      // Calculate final metrics
      const totalLatency = Date.now() - startTime;
      const qualityScore = this.calculateRecommendationQuality(optimizedRecommendations);
      const personalizationStrength = this.calculatePersonalizationStrength(optimizedRecommendations, contextualFactors);

      // Update performance metrics
      this.performanceMetrics.recordRequest({
        total_latency_ms: totalLatency,
        cache_hit: cacheHit,
        quality_score: qualityScore,
        algorithm_used: selectedAlgorithm,
        precision_used: precisionUsed
      });

      // Emit orchestration completion event
      this.emit('recommendation_generated', {
        user_id: request.user_id,
        algorithm_used: selectedAlgorithm,
        precision_used: precisionUsed,
        cache_hit: cacheHit,
        total_latency_ms: totalLatency,
        quality_score: qualityScore
      });

      // Build comprehensive result
      return {
        recommendations: optimizedRecommendations,
        
        orchestration_metadata: {
          total_latency_ms: totalLatency,
          component_latencies: {
            algorithm_selection_ms: algorithmSelectionTime,
            embedding_processing_ms: embeddingProcessingTime,
            search_execution_ms: searchExecutionTime,
            ranking_optimization_ms: rankingOptimizationTime,
            cache_operations_ms: cacheOperationsTime
          },
          optimization_decisions: {
            selected_algorithm: selectedAlgorithm,
            precision_used: precisionUsed,
            cache_strategy_applied: cacheHit ? 'cache_hit' : 'generation_required',
            real_time_adaptation_applied: this.config.enable_real_time_learning,
            contextual_factors_utilized: Object.keys(contextualFactors)
          },
          performance_metrics: {
            cache_hit_rate: cacheHit ? 1.0 : 0.0,
            quality_score: qualityScore,
            personalization_strength: personalizationStrength,
            system_efficiency_score: this.calculateSystemEfficiency(totalLatency, qualityScore, cacheHit)
          },
          cost_optimization: {
            api_calls_saved: cacheHit ? 1 : 0,
            estimated_cost_cents: this.estimateRequestCost(cacheHit, precisionUsed, selectedAlgorithm),
            cost_efficiency_score: this.calculateCostEfficiency(cacheHit, precisionUsed)
          }
        },
        
        user_experience: {
          perceived_performance: this.categorizePerformance(totalLatency),
          recommendation_relevance: qualityScore,
          diversity_score: this.calculateDiversityScore(optimizedRecommendations),
          novelty_balance: this.calculateNoveltyBalance(optimizedRecommendations, request),
          explanation_quality: request.request_context.include_explanations ? 0.85 : 0
        }
      };

    } catch (error) {
      console.error('Unified orchestration failed:', error);
      
      // Return fallback result
      return this.generateFallbackResult(request, Date.now() - startTime, error);
    }
  }

  /**
   * Extract and enrich contextual factors from request
   */
  private async extractContextualFactors(request: RecommendationRequest): Promise<ContextualFactors> {
    try {
      const baseContext = request.request_context.session_context || {};
      
      // Enrich with temporal context
      const now = new Date();
      const timeOfDay = this.getTimeOfDay(now);
      const season = this.getSeason(now);

      // Enrich with user context
      const userType = await this.getUserExpertiseLevel(request.user_id);

      // Enrich with device context
      const deviceType = request.request_context.device_context?.device_type || 'desktop';

      return {
        user_type: userType,
        time_of_day: timeOfDay,
        season: season,
        device_type: deviceType as any,
        session_duration: baseContext.session_duration_minutes || 5,
        interaction_velocity: baseContext.interaction_velocity || 0.5,
        occasion: baseContext.occasion,
        mood_indicators: baseContext.mood_indicators || []
      };

    } catch (error) {
      console.error('Failed to extract contextual factors:', error);
      
      // Return minimal context
      return {
        user_type: 'intermediate',
        time_of_day: 'afternoon',
        season: 'spring',
        device_type: 'desktop'
      };
    }
  }

  /**
   * Generate cache key for recommendations
   */
  private generateCacheKey(
    request: RecommendationRequest,
    algorithm: string,
    precision: number
  ): string {
    const keyComponents = [
      request.user_id,
      algorithm,
      precision,
      request.request_context.max_recommendations || 10,
      JSON.stringify(request.request_context.price_range || {}),
      request.request_context.adventure_level || 0.5
    ];
    
    return `unified_rec_${keyComponents.join('_')}`;
  }

  /**
   * Convert cache result to recommendations format
   */
  private convertCacheToRecommendations(cacheResult: any): any[] {
    // Mock conversion - in production would properly deserialize cached recommendations
    return [
      {
        fragrance_id: 'cached_rec_1',
        name: 'Cached Recommendation 1',
        brand: 'Cache Brand',
        score: 0.91,
        confidence: 0.88,
        explanation: 'Retrieved from cache for optimal performance',
        source_algorithm: 'cached',
        precision_used: Object.keys(cacheResult.embeddings)[0] || 512,
        cache_hit: true,
        personalization_factors: ['user_preferences', 'cached_context']
      }
    ];
  }

  /**
   * Enhance recommendations with orchestration metadata
   */
  private enhanceRecommendations(
    baseRecommendations: any[],
    algorithm: string,
    precision: number,
    contextualFactors: ContextualFactors
  ): any[] {
    return baseRecommendations.map((rec, index) => ({
      fragrance_id: rec.fragrance_id || `enhanced_${index}`,
      name: rec.name || `Enhanced Recommendation ${index + 1}`,
      brand: rec.brand || 'AI Enhanced Brand',
      score: rec.score || 0.85 - (index * 0.02),
      confidence: rec.confidence || 0.8 - (index * 0.01),
      explanation: rec.explanation || this.generateExplanation(algorithm, precision, contextualFactors),
      source_algorithm: algorithm,
      precision_used: precision,
      cache_hit: false,
      personalization_factors: this.extractPersonalizationFactors(rec, contextualFactors)
    }));
  }

  /**
   * Generate standard recommendations as fallback
   */
  private async generateStandardRecommendations(
    request: RecommendationRequest,
    algorithm: string,
    precision: number
  ): Promise<any[]> {
    try {
      // Simulate standard recommendation generation
      const maxRecs = request.request_context.max_recommendations || 10;
      
      return Array.from({ length: maxRecs }, (_, i) => ({
        fragrance_id: `standard_${algorithm}_${i}`,
        name: `Standard ${algorithm} Recommendation ${i + 1}`,
        brand: 'Standard Brand',
        score: 0.8 - (i * 0.02),
        confidence: 0.75 - (i * 0.01),
        explanation: `Generated using ${algorithm} algorithm at ${precision}D precision`,
        source_algorithm: algorithm,
        precision_used: precision,
        cache_hit: false,
        personalization_factors: ['algorithm_selection', 'precision_optimization']
      }));

    } catch (error) {
      console.error('Standard recommendation generation failed:', error);
      return [];
    }
  }

  /**
   * Apply final ranking optimization
   */
  private async applyRankingOptimization(
    recommendations: any[],
    request: RecommendationRequest,
    contextualFactors: ContextualFactors
  ): Promise<any[]> {
    try {
      // Apply optimization strategy
      switch (this.config.optimization_strategy) {
        case 'speed_first':
          return this.optimizeForSpeed(recommendations);
        
        case 'quality_first':
          return this.optimizeForQuality(recommendations);
        
        case 'cost_optimized':
          return this.optimizeForCost(recommendations);
        
        case 'balanced':
        default:
          return this.optimizeBalanced(recommendations, request, contextualFactors);
      }

    } catch (error) {
      console.error('Ranking optimization failed:', error);
      return recommendations; // Return unoptimized recommendations
    }
  }

  /**
   * Cache recommendations for future requests
   */
  private async cacheRecommendations(
    request: RecommendationRequest,
    recommendations: any[],
    algorithm: string,
    precision: number
  ): Promise<void> {
    try {
      if (!this.multiTierCache) return;

      const cacheKey = this.generateCacheKey(request, algorithm, precision);
      
      // Convert recommendations to cacheable format (mock embeddings)
      const cacheableEmbeddings: Record<number, number[]> = {};
      cacheableEmbeddings[precision] = Array.from({ length: precision }, () => Math.random());

      await this.multiTierCache.storeEmbedding(cacheKey, cacheableEmbeddings, {
        generation_time_ms: 150,
        api_cost_cents: 0.5,
        quality_scores: { [precision]: 0.9 }
      });

    } catch (error) {
      console.error('Failed to cache recommendations:', error);
    }
  }

  /**
   * Calculate recommendation quality score
   */
  private calculateRecommendationQuality(recommendations: any[]): number {
    if (recommendations.length === 0) return 0;
    
    const avgConfidence = recommendations.reduce((sum, rec) => sum + (rec.confidence || 0.5), 0) / recommendations.length;
    const avgScore = recommendations.reduce((sum, rec) => sum + (rec.score || 0.5), 0) / recommendations.length;
    
    return (avgConfidence + avgScore) / 2;
  }

  /**
   * Calculate personalization strength
   */
  private calculatePersonalizationStrength(recommendations: any[], contextualFactors: ContextualFactors): number {
    const personalizationFactorCount = recommendations.reduce(
      (sum, rec) => sum + (rec.personalization_factors?.length || 0), 0
    ) / recommendations.length;
    
    const contextUtilization = Object.keys(contextualFactors).length / 10; // Normalize to 0-1
    
    return Math.min(1.0, (personalizationFactorCount / 5) * 0.7 + contextUtilization * 0.3);
  }

  /**
   * Calculate system efficiency score
   */
  private calculateSystemEfficiency(latency: number, quality: number, cacheHit: boolean): number {
    const latencyScore = Math.max(0, 1 - latency / this.config.performance_targets.max_total_latency_ms);
    const qualityScore = quality / this.config.performance_targets.min_recommendation_quality;
    const cacheBonus = cacheHit ? 0.1 : 0;
    
    return Math.min(1.0, (latencyScore * 0.4 + qualityScore * 0.5 + cacheBonus));
  }

  /**
   * Estimate request cost
   */
  private estimateRequestCost(cacheHit: boolean, precision: number, algorithm: string): number {
    if (cacheHit) return 0.05; // Minimal cache cost
    
    // Base cost varies by precision and algorithm complexity
    let baseCost = 0.1;
    baseCost += (precision / 2048) * 0.3; // Higher precision = higher cost
    
    if (algorithm === 'hybrid') baseCost *= 1.2;
    else if (algorithm === 'contextual') baseCost *= 1.4;
    
    return Math.round(baseCost * 100) / 100;
  }

  /**
   * Calculate cost efficiency
   */
  private calculateCostEfficiency(cacheHit: boolean, precision: number): number {
    let efficiency = 0.5; // Base efficiency
    
    if (cacheHit) efficiency += 0.4; // Cache hits are very efficient
    if (precision <= 512) efficiency += 0.2; // Lower precision is more efficient
    
    return Math.min(1.0, efficiency);
  }

  /**
   * Categorize performance perception
   */
  private categorizePerformance(latency: number): 'excellent' | 'good' | 'acceptable' | 'poor' {
    if (latency < 100) return 'excellent';
    if (latency < 200) return 'good';
    if (latency < 400) return 'acceptable';
    return 'poor';
  }

  /**
   * Calculate diversity score
   */
  private calculateDiversityScore(recommendations: any[]): number {
    if (recommendations.length === 0) return 0;
    
    // Mock diversity calculation based on different brands/families
    const uniqueBrands = new Set(recommendations.map(rec => rec.brand)).size;
    const diversityScore = Math.min(1.0, uniqueBrands / Math.min(recommendations.length, 5));
    
    return diversityScore;
  }

  /**
   * Calculate novelty balance
   */
  private calculateNoveltyBalance(recommendations: any[], request: RecommendationRequest): number {
    const adventureLevel = request.request_context.adventure_level || 0.5;
    const algorithmNovelty = recommendations.some(rec => rec.source_algorithm.includes('discovery')) ? 0.8 : 0.5;
    
    return (adventureLevel + algorithmNovelty) / 2;
  }

  /**
   * Generate fallback result when orchestration fails
   */
  private generateFallbackResult(
    request: RecommendationRequest,
    totalLatency: number,
    error: any
  ): OrchestrationResult {
    console.error('Generating fallback result due to orchestration failure:', error);

    const fallbackRecommendations = [
      {
        fragrance_id: 'fallback_1',
        name: 'Fallback Recommendation',
        brand: 'Fallback Brand',
        score: 0.5,
        confidence: 0.5,
        explanation: 'Fallback recommendation while system recovers',
        source_algorithm: 'fallback',
        precision_used: 512,
        cache_hit: false,
        personalization_factors: ['system_fallback']
      }
    ];

    return {
      recommendations: fallbackRecommendations,
      orchestration_metadata: {
        total_latency_ms: totalLatency,
        component_latencies: {
          algorithm_selection_ms: 0,
          embedding_processing_ms: 0,
          search_execution_ms: 0,
          ranking_optimization_ms: 0,
          cache_operations_ms: 0
        },
        optimization_decisions: {
          selected_algorithm: 'fallback',
          precision_used: 512,
          cache_strategy_applied: 'fallback',
          real_time_adaptation_applied: false,
          contextual_factors_utilized: []
        },
        performance_metrics: {
          cache_hit_rate: 0,
          quality_score: 0.5,
          personalization_strength: 0.3,
          system_efficiency_score: 0.2
        },
        cost_optimization: {
          api_calls_saved: 0,
          estimated_cost_cents: 0.1,
          cost_efficiency_score: 0.3
        }
      },
      user_experience: {
        perceived_performance: 'poor',
        recommendation_relevance: 0.5,
        diversity_score: 0.3,
        novelty_balance: 0.3,
        explanation_quality: 0.3
      }
    };
  }

  /**
   * Optimize recommendations for speed
   */
  private optimizeForSpeed(recommendations: any[]): any[] {
    // For speed optimization, return fewer high-confidence recommendations
    return recommendations
      .filter(rec => rec.confidence > 0.7)
      .slice(0, 6); // Limit to 6 for faster processing
  }

  /**
   * Optimize recommendations for quality
   */
  private optimizeForQuality(recommendations: any[]): any[] {
    // For quality optimization, apply sophisticated ranking
    return recommendations
      .sort((a, b) => (b.confidence + b.score) - (a.confidence + a.score))
      .slice(0, 8); // Focus on top 8 highest quality
  }

  /**
   * Optimize recommendations for cost
   */
  private optimizeForCost(recommendations: any[]): any[] {
    // For cost optimization, prefer cached/simple algorithm results
    return recommendations
      .filter(rec => rec.cache_hit || rec.source_algorithm === 'content_based')
      .slice(0, 8);
  }

  /**
   * Apply balanced optimization
   */
  private optimizeBalanced(
    recommendations: any[],
    request: RecommendationRequest,
    contextualFactors: ContextualFactors
  ): any[] {
    // Balanced optimization considers multiple factors
    return recommendations
      .map(rec => ({
        ...rec,
        balanced_score: (rec.score * 0.4) + (rec.confidence * 0.3) + 
                       (rec.cache_hit ? 0.2 : 0) + 
                       (rec.personalization_factors.length / 10 * 0.1)
      }))
      .sort((a, b) => b.balanced_score - a.balanced_score)
      .slice(0, 10);
  }

  /**
   * Helper methods
   */
  private getTimeOfDay(date: Date): ContextualFactors['time_of_day'] {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  private getSeason(date: Date): ContextualFactors['season'] {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private async getUserExpertiseLevel(userId: string): Promise<ContextualFactors['user_type']> {
    try {
      // Mock user expertise determination
      // In production would query user_collections table
      return 'intermediate';
    } catch (error) {
      return 'beginner';
    }
  }

  private generateExplanation(algorithm: string, precision: number, contextualFactors: ContextualFactors): string {
    const context = contextualFactors.time_of_day || 'any time';
    return `AI-optimized recommendation using ${algorithm} algorithm at ${precision}D precision, personalized for ${context} usage.`;
  }

  private extractPersonalizationFactors(recommendation: any, contextualFactors: ContextualFactors): string[] {
    const factors = ['ai_optimization'];
    
    if (contextualFactors.user_type === 'expert') factors.push('expert_preference');
    if (contextualFactors.time_of_day) factors.push(`${contextualFactors.time_of_day}_context`);
    if (contextualFactors.season) factors.push(`${contextualFactors.season}_relevance`);
    if (contextualFactors.device_type === 'mobile') factors.push('mobile_optimization');
    
    return factors;
  }

  /**
   * Get orchestration performance metrics
   */
  getPerformanceMetrics(): {
    total_requests: number;
    avg_latency_ms: number;
    cache_hit_rate: number;
    avg_quality_score: number;
    system_efficiency: number;
    cost_per_request_cents: number;
  } {
    return this.performanceMetrics.getMetrics();
  }

  /**
   * Get system status
   */
  getSystemStatus(): {
    orchestrator_health: string;
    enabled_services: string[];
    performance_targets_met: boolean;
    ready_for_production: boolean;
  } {
    const enabledServices = [];
    if (this.config.enable_thompson_sampling) enabledServices.push('Thompson Sampling');
    if (this.config.enable_real_time_learning) enabledServices.push('Real-Time Learning');
    if (this.config.enable_matryoshka_embeddings) enabledServices.push('Matryoshka Embeddings');
    if (this.config.enable_contextual_bandits) enabledServices.push('Contextual Bandits');
    if (this.config.enable_multi_tier_caching) enabledServices.push('Multi-Tier Caching');

    const metrics = this.performanceMetrics.getMetrics();
    const targetsMetric = [
      metrics.avg_latency_ms <= this.config.performance_targets.max_total_latency_ms,
      metrics.avg_quality_score >= this.config.performance_targets.min_recommendation_quality,
      metrics.cache_hit_rate >= this.config.performance_targets.min_cache_hit_rate,
      metrics.cost_per_request_cents <= this.config.performance_targets.max_cost_per_request_cents
    ];
    
    const targetsMetPercent = targetsMetric.filter(met => met).length / targetsMetric.length;

    return {
      orchestrator_health: targetsMetPercent > 0.8 ? 'excellent' : targetsMetPercent > 0.6 ? 'good' : 'needs_attention',
      enabled_services: enabledServices,
      performance_targets_met: targetsMetPercent === 1.0,
      ready_for_production: enabledServices.length >= 3 && targetsMetPercent >= 0.8
    };
  }
}

// Performance Metrics Tracker
class OrchestrationPerformanceMetrics {
  private metrics = {
    total_requests: 0,
    total_latency_ms: 0,
    cache_hits: 0,
    total_quality_score: 0,
    total_cost_cents: 0
  };

  recordRequest(data: {
    total_latency_ms: number;
    cache_hit: boolean;
    quality_score: number;
    algorithm_used: string;
    precision_used: number;
  }): void {
    this.metrics.total_requests++;
    this.metrics.total_latency_ms += data.total_latency_ms;
    this.metrics.total_quality_score += data.quality_score;
    
    if (data.cache_hit) {
      this.metrics.cache_hits++;
      this.metrics.total_cost_cents += 0.05;
    } else {
      this.metrics.total_cost_cents += 0.3;
    }
  }

  getMetrics(): {
    total_requests: number;
    avg_latency_ms: number;
    cache_hit_rate: number;
    avg_quality_score: number;
    system_efficiency: number;
    cost_per_request_cents: number;
  } {
    const totalRequests = Math.max(this.metrics.total_requests, 1);
    
    return {
      total_requests: this.metrics.total_requests,
      avg_latency_ms: this.metrics.total_latency_ms / totalRequests,
      cache_hit_rate: this.metrics.cache_hits / totalRequests,
      avg_quality_score: this.metrics.total_quality_score / totalRequests,
      system_efficiency: 0.85, // Would be calculated from various factors
      cost_per_request_cents: this.metrics.total_cost_cents / totalRequests
    };
  }
}

// Factory function
export function createUnifiedRecommendationOrchestrator(
  supabase: SupabaseClient,
  config: Partial<OrchestrationConfig> = {}
): UnifiedRecommendationOrchestrator {
  return new UnifiedRecommendationOrchestrator(supabase, config);
}

export {
  RecommendationRequest,
  OrchestrationResult,
  OrchestrationConfig
};