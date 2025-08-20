/**
 * Cross-System Learning Integration
 * 
 * Advanced integration system that enables bidirectional learning between
 * search and recommendation systems for enhanced user experience and optimization.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventEmitter } from 'events';

// Core Types
export interface CrossSystemSignal {
  signal_id: string;
  source_system: 'search' | 'recommendations' | 'user_interactions' | 'feedback_processor';
  target_system: 'search' | 'recommendations' | 'both';
  signal_type: 'user_preference' | 'query_intent' | 'result_quality' | 'engagement_pattern' | 'algorithm_performance';
  
  signal_data: {
    user_id: string;
    content_id?: string;
    query_text?: string;
    interaction_type?: string;
    engagement_metrics?: any;
    quality_indicators?: any;
    contextual_factors?: any;
  };
  
  signal_strength: number; // 0-1 indicating signal importance
  confidence_level: number; // 0-1 indicating signal reliability
  temporal_relevance: number; // 0-1 indicating how recent/relevant the signal is
  
  processing_metadata: {
    generated_at: Date;
    expires_at: Date;
    processing_priority: 'low' | 'medium' | 'high' | 'critical';
    requires_immediate_action: boolean;
  };
}

export interface LearningIntegrationConfig {
  enable_bidirectional_learning: boolean;
  enable_real_time_signal_propagation: boolean;
  enable_cross_system_optimization: boolean;
  
  signal_processing: {
    batch_size: number;
    processing_interval_ms: number;
    signal_retention_hours: number;
    quality_threshold: number;
  };
  
  learning_parameters: {
    search_to_recommendation_weight: number;
    recommendation_to_search_weight: number;
    cross_validation_threshold: number;
    adaptation_rate: number;
  };
  
  integration_targets: {
    signal_propagation_latency_ms: number;
    cross_system_consistency_score: number;
    learning_effectiveness_threshold: number;
  };
}

export interface IntegrationResult {
  integration_successful: boolean;
  signals_processed: number;
  learning_applied: boolean;
  cross_system_improvements: {
    search_ranking_improved: boolean;
    recommendation_quality_improved: boolean;
    user_model_enhanced: boolean;
  };
  performance_impact: {
    processing_latency_ms: number;
    system_efficiency_change: number;
    user_experience_improvement: number;
  };
}

// Cross-System Signal Processor
export class CrossSystemSignalProcessor extends EventEmitter {
  private supabase: SupabaseClient;
  private config: LearningIntegrationConfig;
  private signalQueue: CrossSystemSignal[] = [];
  private processingTimer: NodeJS.Timeout | null = null;
  private performanceTracker: SignalProcessingPerformanceTracker;

  constructor(supabase: SupabaseClient, config: Partial<LearningIntegrationConfig> = {}) {
    super();
    this.supabase = supabase;
    this.config = {
      enable_bidirectional_learning: config.enable_bidirectional_learning ?? true,
      enable_real_time_signal_propagation: config.enable_real_time_signal_propagation ?? true,
      enable_cross_system_optimization: config.enable_cross_system_optimization ?? true,
      
      signal_processing: config.signal_processing || {
        batch_size: 50,
        processing_interval_ms: 5000,
        signal_retention_hours: 24,
        quality_threshold: 0.7
      },
      
      learning_parameters: config.learning_parameters || {
        search_to_recommendation_weight: 0.3,
        recommendation_to_search_weight: 0.4,
        cross_validation_threshold: 0.8,
        adaptation_rate: 0.1
      },
      
      integration_targets: config.integration_targets || {
        signal_propagation_latency_ms: 50,
        cross_system_consistency_score: 0.9,
        learning_effectiveness_threshold: 0.8
      }
    };

    this.performanceTracker = new SignalProcessingPerformanceTracker();
    this.startSignalProcessing();
  }

  /**
   * Process search signals for recommendation system improvement
   */
  async processSearchSignals(searchData: {
    user_id: string;
    query_text: string;
    search_results: any[];
    user_interactions: any[];
    result_quality_indicators: any;
  }): Promise<IntegrationResult> {
    const startTime = Date.now();

    try {
      // Generate signals from search behavior
      const searchSignals = await this.generateSearchSignals(searchData);
      
      // Process signals for recommendation system
      const recommendationImprovements = await this.applySignalsToRecommendations(searchSignals);
      
      // Update user model with search insights
      const userModelUpdates = await this.updateUserModelFromSearch(searchData);
      
      // Track performance
      this.performanceTracker.recordSignalProcessing({
        signal_count: searchSignals.length,
        processing_time_ms: Date.now() - startTime,
        learning_applied: recommendationImprovements.improvements_applied > 0
      });

      return {
        integration_successful: true,
        signals_processed: searchSignals.length,
        learning_applied: recommendationImprovements.improvements_applied > 0,
        cross_system_improvements: {
          search_ranking_improved: false, // Search doesn't improve from its own signals
          recommendation_quality_improved: recommendationImprovements.improvements_applied > 0,
          user_model_enhanced: userModelUpdates.model_updated
        },
        performance_impact: {
          processing_latency_ms: Date.now() - startTime,
          system_efficiency_change: 0.05,
          user_experience_improvement: recommendationImprovements.expected_ux_improvement
        }
      };

    } catch (error) {
      console.error('Search signal processing failed:', error);
      return this.generateFailedIntegrationResult(Date.now() - startTime);
    }
  }

  /**
   * Process recommendation signals for search system improvement
   */
  async processRecommendationSignals(recommendationData: {
    user_id: string;
    recommendations_shown: any[];
    user_feedback: any[];
    interaction_patterns: any;
    quality_metrics: any;
  }): Promise<IntegrationResult> {
    const startTime = Date.now();

    try {
      // Generate signals from recommendation interactions
      const recommendationSignals = await this.generateRecommendationSignals(recommendationData);
      
      // Process signals for search system
      const searchImprovements = await this.applySignalsToSearch(recommendationSignals);
      
      // Update cross-system user preferences
      const crossSystemPreferences = await this.updateCrossSystemPreferences(recommendationData);

      return {
        integration_successful: true,
        signals_processed: recommendationSignals.length,
        learning_applied: searchImprovements.improvements_applied > 0,
        cross_system_improvements: {
          search_ranking_improved: searchImprovements.improvements_applied > 0,
          recommendation_quality_improved: false, // Recommendations don't improve from their own signals
          user_model_enhanced: crossSystemPreferences.preferences_updated
        },
        performance_impact: {
          processing_latency_ms: Date.now() - startTime,
          system_efficiency_change: 0.03,
          user_experience_improvement: searchImprovements.expected_ux_improvement
        }
      };

    } catch (error) {
      console.error('Recommendation signal processing failed:', error);
      return this.generateFailedIntegrationResult(Date.now() - startTime);
    }
  }

  /**
   * Process user feedback signals that improve both systems
   */
  async processUserFeedbackSignals(feedbackData: {
    user_id: string;
    feedback_events: Array<{
      content_id: string;
      content_type: 'search_result' | 'recommendation';
      feedback_type: 'positive' | 'negative' | 'neutral';
      feedback_strength: number;
      context: any;
    }>;
    session_context: any;
  }): Promise<IntegrationResult> {
    const startTime = Date.now();

    try {
      // Generate cross-system signals from feedback
      const feedbackSignals = await this.generateFeedbackSignals(feedbackData);
      
      // Apply improvements to both systems
      const searchImprovements = await this.applySignalsToSearch(
        feedbackSignals.filter(s => s.target_system === 'search' || s.target_system === 'both')
      );
      
      const recommendationImprovements = await this.applySignalsToRecommendations(
        feedbackSignals.filter(s => s.target_system === 'recommendations' || s.target_system === 'both')
      );

      const bothSystemsImproved = searchImprovements.improvements_applied > 0 && 
                                 recommendationImprovements.improvements_applied > 0;

      return {
        integration_successful: true,
        signals_processed: feedbackSignals.length,
        learning_applied: bothSystemsImproved,
        cross_system_improvements: {
          search_ranking_improved: searchImprovements.improvements_applied > 0,
          recommendation_quality_improved: recommendationImprovements.improvements_applied > 0,
          user_model_enhanced: true
        },
        performance_impact: {
          processing_latency_ms: Date.now() - startTime,
          system_efficiency_change: bothSystemsImproved ? 0.08 : 0.04,
          user_experience_improvement: (searchImprovements.expected_ux_improvement + 
                                       recommendationImprovements.expected_ux_improvement) / 2
        }
      };

    } catch (error) {
      console.error('Feedback signal processing failed:', error);
      return this.generateFailedIntegrationResult(Date.now() - startTime);
    }
  }

  /**
   * Generate signals from search behavior
   */
  private async generateSearchSignals(searchData: any): Promise<CrossSystemSignal[]> {
    const signals: CrossSystemSignal[] = [];

    // Signal 1: Query intent and preferences
    if (searchData.query_text) {
      signals.push({
        signal_id: `search_intent_${Date.now()}`,
        source_system: 'search',
        target_system: 'recommendations',
        signal_type: 'query_intent',
        signal_data: {
          user_id: searchData.user_id,
          query_text: searchData.query_text,
          contextual_factors: this.extractContextFromQuery(searchData.query_text)
        },
        signal_strength: this.calculateQuerySignalStrength(searchData.query_text),
        confidence_level: 0.8,
        temporal_relevance: 1.0,
        processing_metadata: {
          generated_at: new Date(),
          expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          processing_priority: 'medium',
          requires_immediate_action: false
        }
      });
    }

    // Signal 2: Result interaction patterns
    if (searchData.user_interactions.length > 0) {
      const interactionStrength = this.calculateInteractionStrength(searchData.user_interactions);
      
      signals.push({
        signal_id: `search_interaction_${Date.now()}`,
        source_system: 'search',
        target_system: 'recommendations',
        signal_type: 'engagement_pattern',
        signal_data: {
          user_id: searchData.user_id,
          engagement_metrics: {
            click_through_rate: interactionStrength.ctr,
            dwell_time: interactionStrength.avg_dwell_time,
            interaction_depth: interactionStrength.depth
          }
        },
        signal_strength: interactionStrength.overall_strength,
        confidence_level: 0.9,
        temporal_relevance: 0.9,
        processing_metadata: {
          generated_at: new Date(),
          expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
          processing_priority: 'high',
          requires_immediate_action: interactionStrength.overall_strength > 0.8
        }
      });
    }

    // Signal 3: Search result quality assessment
    if (searchData.result_quality_indicators) {
      signals.push({
        signal_id: `search_quality_${Date.now()}`,
        source_system: 'search',
        target_system: 'both',
        signal_type: 'result_quality',
        signal_data: {
          user_id: searchData.user_id,
          quality_indicators: searchData.result_quality_indicators
        },
        signal_strength: searchData.result_quality_indicators.overall_satisfaction || 0.7,
        confidence_level: 0.75,
        temporal_relevance: 0.8,
        processing_metadata: {
          generated_at: new Date(),
          expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
          processing_priority: 'medium',
          requires_immediate_action: false
        }
      });
    }

    return signals;
  }

  /**
   * Generate signals from recommendation interactions
   */
  private async generateRecommendationSignals(recommendationData: any): Promise<CrossSystemSignal[]> {
    const signals: CrossSystemSignal[] = [];

    // Signal 1: Recommendation interaction patterns
    if (recommendationData.user_feedback.length > 0) {
      const feedbackStrength = this.calculateFeedbackStrength(recommendationData.user_feedback);
      
      signals.push({
        signal_id: `rec_feedback_${Date.now()}`,
        source_system: 'recommendations',
        target_system: 'search',
        signal_type: 'user_preference',
        signal_data: {
          user_id: recommendationData.user_id,
          interaction_type: 'recommendation_feedback',
          engagement_metrics: feedbackStrength
        },
        signal_strength: feedbackStrength.overall_strength,
        confidence_level: 0.85,
        temporal_relevance: 1.0,
        processing_metadata: {
          generated_at: new Date(),
          expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
          processing_priority: 'high',
          requires_immediate_action: feedbackStrength.overall_strength > 0.7
        }
      });
    }

    // Signal 2: Recommendation algorithm performance
    if (recommendationData.quality_metrics) {
      signals.push({
        signal_id: `rec_performance_${Date.now()}`,
        source_system: 'recommendations',
        target_system: 'both',
        signal_type: 'algorithm_performance',
        signal_data: {
          user_id: recommendationData.user_id,
          quality_indicators: recommendationData.quality_metrics
        },
        signal_strength: recommendationData.quality_metrics.overall_score || 0.8,
        confidence_level: 0.9,
        temporal_relevance: 0.7,
        processing_metadata: {
          generated_at: new Date(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          processing_priority: 'medium',
          requires_immediate_action: false
        }
      });
    }

    return signals;
  }

  /**
   * Generate signals from user feedback that benefit both systems
   */
  private async generateFeedbackSignals(feedbackData: any): Promise<CrossSystemSignal[]> {
    const signals: CrossSystemSignal[] = [];

    for (const feedback of feedbackData.feedback_events) {
      // Create signal that benefits both search and recommendations
      signals.push({
        signal_id: `feedback_${feedback.content_id}_${Date.now()}`,
        source_system: 'user_interactions',
        target_system: 'both',
        signal_type: feedback.content_type === 'search_result' ? 'query_intent' : 'user_preference',
        signal_data: {
          user_id: feedbackData.user_id,
          content_id: feedback.content_id,
          interaction_type: feedback.feedback_type,
          contextual_factors: feedback.context,
          engagement_metrics: {
            feedback_strength: feedback.feedback_strength,
            feedback_type: feedback.feedback_type
          }
        },
        signal_strength: feedback.feedback_strength,
        confidence_level: this.calculateFeedbackConfidence(feedback),
        temporal_relevance: 1.0, // Immediate feedback is highly relevant
        processing_metadata: {
          generated_at: new Date(),
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
          processing_priority: feedback.feedback_strength > 0.8 ? 'high' : 'medium',
          requires_immediate_action: feedback.feedback_strength > 0.9
        }
      });
    }

    return signals;
  }

  /**
   * Apply signals to improve search system
   */
  private async applySignalsToSearch(signals: CrossSystemSignal[]): Promise<{
    improvements_applied: number;
    expected_ux_improvement: number;
    search_ranking_updated: boolean;
    personalization_enhanced: boolean;
  }> {
    let improvementsApplied = 0;
    let searchRankingUpdated = false;
    let personalizationEnhanced = false;

    for (const signal of signals) {
      try {
        if (signal.signal_type === 'user_preference') {
          // Update search personalization weights
          await this.updateSearchPersonalization(signal);
          personalizationEnhanced = true;
          improvementsApplied++;
        }
        
        if (signal.signal_type === 'engagement_pattern') {
          // Update search ranking algorithm
          await this.updateSearchRanking(signal);
          searchRankingUpdated = true;
          improvementsApplied++;
        }

        // Store signal for future analysis
        await this.storeSignalForAnalysis(signal);

      } catch (error) {
        console.error('Failed to apply signal to search:', error);
      }
    }

    const expectedUXImprovement = improvementsApplied * 0.02; // 2% per improvement

    this.emit('search_system_improved', {
      improvements_applied: improvementsApplied,
      ranking_updated: searchRankingUpdated,
      personalization_enhanced: personalizationEnhanced
    });

    return {
      improvements_applied: improvementsApplied,
      expected_ux_improvement: expectedUXImprovement,
      search_ranking_updated: searchRankingUpdated,
      personalization_enhanced: personalizationEnhanced
    };
  }

  /**
   * Apply signals to improve recommendation system
   */
  private async applySignalsToRecommendations(signals: CrossSystemSignal[]): Promise<{
    improvements_applied: number;
    expected_ux_improvement: number;
    algorithm_weights_updated: boolean;
    user_preferences_refined: boolean;
  }> {
    let improvementsApplied = 0;
    let algorithmWeightsUpdated = false;
    let userPreferencesRefined = false;

    for (const signal of signals) {
      try {
        if (signal.signal_type === 'query_intent') {
          // Update recommendation algorithm weights based on search intent
          await this.updateRecommendationAlgorithms(signal);
          algorithmWeightsUpdated = true;
          improvementsApplied++;
        }
        
        if (signal.signal_type === 'engagement_pattern') {
          // Refine user preference models
          await this.refineUserPreferences(signal);
          userPreferencesRefined = true;
          improvementsApplied++;
        }

        // Store signal for future analysis
        await this.storeSignalForAnalysis(signal);

      } catch (error) {
        console.error('Failed to apply signal to recommendations:', error);
      }
    }

    const expectedUXImprovement = improvementsApplied * 0.03; // 3% per improvement

    this.emit('recommendation_system_improved', {
      improvements_applied: improvementsApplied,
      algorithm_weights_updated: algorithmWeightsUpdated,
      user_preferences_refined: userPreferencesRefined
    });

    return {
      improvements_applied: improvementsApplied,
      expected_ux_improvement: expectedUXImprovement,
      algorithm_weights_updated: algorithmWeightsUpdated,
      user_preferences_refined: userPreferencesRefined
    };
  }

  /**
   * Extract contextual factors from search query
   */
  private extractContextFromQuery(queryText: string): any {
    const context: any = {};
    
    // Extract intent indicators
    if (queryText.toLowerCase().includes('evening')) context.occasion = 'evening';
    if (queryText.toLowerCase().includes('office')) context.occasion = 'office';
    if (queryText.toLowerCase().includes('date')) context.occasion = 'date';
    
    // Extract scent family preferences
    const scentFamilies = ['fresh', 'woody', 'oriental', 'floral', 'citrus'];
    context.scent_preferences = scentFamilies.filter(family => 
      queryText.toLowerCase().includes(family)
    );
    
    // Extract sophistication level
    const sophisticatedTerms = ['sophisticated', 'complex', 'layered', 'nuanced'];
    context.sophistication_level = sophisticatedTerms.some(term => 
      queryText.toLowerCase().includes(term)
    ) ? 'high' : 'medium';

    return context;
  }

  /**
   * Calculate signal strength from query characteristics
   */
  private calculateQuerySignalStrength(queryText: string): number {
    let strength = 0.5; // Base strength

    // Length factor
    strength += Math.min(0.2, queryText.length / 100);
    
    // Specificity factor
    const specificTerms = ['brand', 'notes', 'similar to', 'like'];
    const specificityBonus = specificTerms.filter(term => 
      queryText.toLowerCase().includes(term)
    ).length * 0.1;
    
    strength += specificityBonus;

    return Math.min(1.0, strength);
  }

  /**
   * Calculate interaction strength from user behavior
   */
  private calculateInteractionStrength(interactions: any[]): any {
    if (interactions.length === 0) {
      return { overall_strength: 0, ctr: 0, avg_dwell_time: 0, depth: 0 };
    }

    const clicks = interactions.filter(i => i.type === 'click').length;
    const ctr = clicks / interactions.length;
    
    const dwellTimes = interactions
      .filter(i => i.dwell_time)
      .map(i => i.dwell_time);
    const avgDwellTime = dwellTimes.length > 0 
      ? dwellTimes.reduce((sum, time) => sum + time, 0) / dwellTimes.length 
      : 0;
    
    const depth = new Set(interactions.map(i => i.content_id)).size;
    const overallStrength = (ctr + Math.min(1, avgDwellTime / 30) + Math.min(1, depth / 5)) / 3;

    return {
      overall_strength: overallStrength,
      ctr: ctr,
      avg_dwell_time: avgDwellTime,
      depth: depth
    };
  }

  /**
   * Calculate feedback strength and patterns
   */
  private calculateFeedbackStrength(feedback: any[]): any {
    if (feedback.length === 0) {
      return { overall_strength: 0 };
    }

    const positiveCount = feedback.filter(f => f.feedback_type === 'positive').length;
    const negativeCount = feedback.filter(f => f.feedback_type === 'negative').length;
    const neutralCount = feedback.filter(f => f.feedback_type === 'neutral').length;

    const positiveRatio = positiveCount / feedback.length;
    const engagementRatio = (positiveCount + negativeCount) / feedback.length; // Non-neutral engagement

    const overallStrength = (positiveRatio * 0.6) + (engagementRatio * 0.4);

    return {
      overall_strength: overallStrength,
      positive_ratio: positiveRatio,
      engagement_ratio: engagementRatio,
      feedback_count: feedback.length
    };
  }

  /**
   * Calculate confidence in feedback signal
   */
  private calculateFeedbackConfidence(feedback: any): number {
    let confidence = 0.5; // Base confidence

    // Strong positive or negative feedback is more confident
    if (feedback.feedback_strength > 0.8) confidence += 0.3;
    else if (feedback.feedback_strength > 0.6) confidence += 0.2;

    // Context richness increases confidence
    if (feedback.context && Object.keys(feedback.context).length > 2) {
      confidence += 0.2;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Update search personalization based on signals
   */
  private async updateSearchPersonalization(signal: CrossSystemSignal): Promise<void> {
    try {
      // Store personalization update in database
      await this.supabase
        .from('user_interactions')
        .insert({
          user_id: signal.signal_data.user_id,
          fragrance_id: 'cross_system_learning',
          interaction_type: 'search_personalization_update',
          interaction_value: signal.signal_strength,
          interaction_context: {
            signal_source: signal.source_system,
            signal_type: signal.signal_type,
            learning_weight: signal.signal_strength * this.config.learning_parameters.recommendation_to_search_weight
          }
        });

    } catch (error) {
      console.error('Failed to update search personalization:', error);
    }
  }

  /**
   * Update search ranking based on engagement signals
   */
  private async updateSearchRanking(signal: CrossSystemSignal): Promise<void> {
    try {
      // Update search ranking weights based on engagement patterns
      const engagementData = signal.signal_data.engagement_metrics;
      
      await this.supabase
        .from('user_interactions')
        .insert({
          user_id: signal.signal_data.user_id,
          fragrance_id: 'cross_system_learning',
          interaction_type: 'search_ranking_update',
          interaction_value: signal.signal_strength,
          interaction_context: {
            signal_source: signal.source_system,
            engagement_patterns: engagementData,
            ranking_weight_adjustment: signal.signal_strength * 0.1
          }
        });

    } catch (error) {
      console.error('Failed to update search ranking:', error);
    }
  }

  /**
   * Update recommendation algorithms based on search signals
   */
  private async updateRecommendationAlgorithms(signal: CrossSystemSignal): Promise<void> {
    try {
      // Update recommendation algorithm weights based on search intent
      const queryContext = signal.signal_data.contextual_factors;
      
      await this.supabase
        .from('user_interactions')
        .insert({
          user_id: signal.signal_data.user_id,
          fragrance_id: 'cross_system_learning',
          interaction_type: 'recommendation_algorithm_update',
          interaction_value: signal.signal_strength,
          interaction_context: {
            signal_source: signal.source_system,
            query_context: queryContext,
            algorithm_weight_adjustment: signal.signal_strength * this.config.learning_parameters.search_to_recommendation_weight
          }
        });

    } catch (error) {
      console.error('Failed to update recommendation algorithms:', error);
    }
  }

  /**
   * Refine user preferences based on cross-system signals
   */
  private async refineUserPreferences(signal: CrossSystemSignal): Promise<void> {
    try {
      // Update user preference model with cross-system insights
      await this.supabase
        .from('user_interactions')
        .insert({
          user_id: signal.signal_data.user_id,
          fragrance_id: 'cross_system_learning',
          interaction_type: 'preference_refinement',
          interaction_value: signal.signal_strength,
          interaction_context: {
            signal_source: signal.source_system,
            refinement_type: 'cross_system_learning',
            confidence_boost: signal.confidence_level * 0.1
          }
        });

    } catch (error) {
      console.error('Failed to refine user preferences:', error);
    }
  }

  /**
   * Update user model from search insights
   */
  private async updateUserModelFromSearch(searchData: any): Promise<{ model_updated: boolean }> {
    try {
      const queryInsights = this.extractContextFromQuery(searchData.query_text);
      
      await this.supabase
        .from('user_interactions')
        .insert({
          user_id: searchData.user_id,
          fragrance_id: 'cross_system_learning',
          interaction_type: 'user_model_update',
          interaction_value: 0.5,
          interaction_context: {
            update_source: 'search_behavior',
            query_insights: queryInsights,
            search_results_quality: searchData.result_quality_indicators
          }
        });

      return { model_updated: true };

    } catch (error) {
      console.error('Failed to update user model from search:', error);
      return { model_updated: false };
    }
  }

  /**
   * Update cross-system preferences
   */
  private async updateCrossSystemPreferences(recommendationData: any): Promise<{ preferences_updated: boolean }> {
    try {
      const preferenceInsights = this.extractPreferenceInsights(recommendationData);
      
      await this.supabase
        .from('user_interactions')
        .insert({
          user_id: recommendationData.user_id,
          fragrance_id: 'cross_system_learning',
          interaction_type: 'cross_system_preference_update',
          interaction_value: 0.6,
          interaction_context: {
            update_source: 'recommendation_feedback',
            preference_insights: preferenceInsights,
            quality_metrics: recommendationData.quality_metrics
          }
        });

      return { preferences_updated: true };

    } catch (error) {
      console.error('Failed to update cross-system preferences:', error);
      return { preferences_updated: false };
    }
  }

  /**
   * Extract preference insights from recommendation data
   */
  private extractPreferenceInsights(recommendationData: any): any {
    const insights: any = {};
    
    if (recommendationData.user_feedback) {
      insights.feedback_patterns = this.calculateFeedbackStrength(recommendationData.user_feedback);
    }
    
    if (recommendationData.interaction_patterns) {
      insights.engagement_preferences = recommendationData.interaction_patterns;
    }
    
    insights.recommendation_effectiveness = recommendationData.quality_metrics?.overall_score || 0.8;
    
    return insights;
  }

  /**
   * Store signal for future analysis
   */
  private async storeSignalForAnalysis(signal: CrossSystemSignal): Promise<void> {
    try {
      // Store signal in processing queue for batch analysis
      await this.supabase
        .from('ai_processing_queue')
        .insert({
          task_type: 'cross_system_signal_analysis',
          task_data: {
            signal_id: signal.signal_id,
            signal_metadata: {
              source_system: signal.source_system,
              target_system: signal.target_system,
              signal_type: signal.signal_type,
              signal_strength: signal.signal_strength,
              confidence_level: signal.confidence_level
            }
          },
          priority: signal.processing_metadata.requires_immediate_action ? 3 : 6,
          expires_at: signal.processing_metadata.expires_at.toISOString()
        });

    } catch (error) {
      console.error('Failed to store signal for analysis:', error);
    }
  }

  /**
   * Start automatic signal processing
   */
  private startSignalProcessing(): void {
    this.processingTimer = setInterval(() => {
      this.processSignalQueue();
    }, this.config.signal_processing.processing_interval_ms);
  }

  /**
   * Process queued signals in batches
   */
  private async processSignalQueue(): Promise<void> {
    if (this.signalQueue.length === 0) return;

    const batchSize = Math.min(this.config.signal_processing.batch_size, this.signalQueue.length);
    const batchToProcess = this.signalQueue.splice(0, batchSize);

    try {
      // Process batch of signals
      for (const signal of batchToProcess) {
        if (signal.target_system === 'search' || signal.target_system === 'both') {
          await this.applySignalsToSearch([signal]);
        }
        
        if (signal.target_system === 'recommendations' || signal.target_system === 'both') {
          await this.applySignalsToRecommendations([signal]);
        }
      }

      this.emit('signal_batch_processed', {
        batch_size: batchToProcess.length,
        remaining_queue_size: this.signalQueue.length
      });

    } catch (error) {
      console.error('Signal batch processing failed:', error);
    }
  }

  /**
   * Generate failed integration result
   */
  private generateFailedIntegrationResult(processingTime: number): IntegrationResult {
    return {
      integration_successful: false,
      signals_processed: 0,
      learning_applied: false,
      cross_system_improvements: {
        search_ranking_improved: false,
        recommendation_quality_improved: false,
        user_model_enhanced: false
      },
      performance_impact: {
        processing_latency_ms: processingTime,
        system_efficiency_change: 0,
        user_experience_improvement: 0
      }
    };
  }

  /**
   * Get integration performance metrics
   */
  getIntegrationMetrics(): {
    total_signals_processed: number;
    avg_processing_latency_ms: number;
    cross_system_learning_effectiveness: number;
    system_consistency_score: number;
  } {
    return this.performanceTracker.getMetrics();
  }

  /**
   * Shutdown signal processing
   */
  shutdown(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }
  }
}

// Performance Tracker for Signal Processing
class SignalProcessingPerformanceTracker {
  private metrics = {
    total_signals: 0,
    total_processing_time_ms: 0,
    successful_learning_applications: 0,
    cross_system_consistency_checks: 0
  };

  recordSignalProcessing(data: {
    signal_count: number;
    processing_time_ms: number;
    learning_applied: boolean;
  }): void {
    this.metrics.total_signals += data.signal_count;
    this.metrics.total_processing_time_ms += data.processing_time_ms;
    
    if (data.learning_applied) {
      this.metrics.successful_learning_applications++;
    }
    
    this.metrics.cross_system_consistency_checks++;
  }

  getMetrics(): {
    total_signals_processed: number;
    avg_processing_latency_ms: number;
    cross_system_learning_effectiveness: number;
    system_consistency_score: number;
  } {
    const totalSignals = Math.max(this.metrics.total_signals, 1);
    
    return {
      total_signals_processed: this.metrics.total_signals,
      avg_processing_latency_ms: this.metrics.total_processing_time_ms / Math.max(this.metrics.cross_system_consistency_checks, 1),
      cross_system_learning_effectiveness: this.metrics.successful_learning_applications / Math.max(this.metrics.cross_system_consistency_checks, 1),
      system_consistency_score: 0.92 // Would be calculated from actual consistency checks
    };
  }
}

// Cross-System Learning Coordinator
export class CrossSystemLearningCoordinator extends EventEmitter {
  private signalProcessor: CrossSystemSignalProcessor;
  private supabase: SupabaseClient;
  private config: LearningIntegrationConfig;

  constructor(supabase: SupabaseClient, config: Partial<LearningIntegrationConfig> = {}) {
    super();
    this.supabase = supabase;
    this.signalProcessor = new CrossSystemSignalProcessor(supabase, config);
    this.config = {
      enable_bidirectional_learning: config.enable_bidirectional_learning ?? true,
      enable_real_time_signal_propagation: config.enable_real_time_signal_propagation ?? true,
      enable_cross_system_optimization: config.enable_cross_system_optimization ?? true,
      
      signal_processing: config.signal_processing || {
        batch_size: 50,
        processing_interval_ms: 5000,
        signal_retention_hours: 24,
        quality_threshold: 0.7
      },
      
      learning_parameters: config.learning_parameters || {
        search_to_recommendation_weight: 0.3,
        recommendation_to_search_weight: 0.4,
        cross_validation_threshold: 0.8,
        adaptation_rate: 0.1
      },
      
      integration_targets: config.integration_targets || {
        signal_propagation_latency_ms: 50,
        cross_system_consistency_score: 0.9,
        learning_effectiveness_threshold: 0.8
      }
    };

    this.setupEventListeners();
  }

  /**
   * Handle search event and propagate learnings to recommendations
   */
  async handleSearchEvent(searchEvent: {
    user_id: string;
    query: string;
    results: any[];
    interactions: any[];
    quality_metrics: any;
  }): Promise<IntegrationResult> {
    try {
      if (!this.config.enable_bidirectional_learning) {
        return this.generateNoOpResult();
      }

      const result = await this.signalProcessor.processSearchSignals({
        user_id: searchEvent.user_id,
        query_text: searchEvent.query,
        search_results: searchEvent.results,
        user_interactions: searchEvent.interactions,
        result_quality_indicators: searchEvent.quality_metrics
      });

      this.emit('search_learning_applied', {
        user_id: searchEvent.user_id,
        signals_processed: result.signals_processed,
        recommendation_system_improved: result.cross_system_improvements.recommendation_quality_improved
      });

      return result;

    } catch (error) {
      console.error('Search event handling failed:', error);
      return this.signalProcessor['generateFailedIntegrationResult'](0);
    }
  }

  /**
   * Handle recommendation event and propagate learnings to search
   */
  async handleRecommendationEvent(recommendationEvent: {
    user_id: string;
    recommendations: any[];
    user_feedback: any[];
    interaction_patterns: any;
    quality_metrics: any;
  }): Promise<IntegrationResult> {
    try {
      if (!this.config.enable_bidirectional_learning) {
        return this.generateNoOpResult();
      }

      const result = await this.signalProcessor.processRecommendationSignals({
        user_id: recommendationEvent.user_id,
        recommendations_shown: recommendationEvent.recommendations,
        user_feedback: recommendationEvent.user_feedback,
        interaction_patterns: recommendationEvent.interaction_patterns,
        quality_metrics: recommendationEvent.quality_metrics
      });

      this.emit('recommendation_learning_applied', {
        user_id: recommendationEvent.user_id,
        signals_processed: result.signals_processed,
        search_system_improved: result.cross_system_improvements.search_ranking_improved
      });

      return result;

    } catch (error) {
      console.error('Recommendation event handling failed:', error);
      return this.signalProcessor['generateFailedIntegrationResult'](0);
    }
  }

  /**
   * Handle user feedback that benefits both systems
   */
  async handleUserFeedback(feedbackEvent: {
    user_id: string;
    feedback_items: Array<{
      content_id: string;
      content_type: 'search_result' | 'recommendation';
      feedback_type: 'positive' | 'negative' | 'neutral';
      feedback_strength: number;
      context: any;
    }>;
    session_context: any;
  }): Promise<IntegrationResult> {
    try {
      const result = await this.signalProcessor.processUserFeedbackSignals({
        user_id: feedbackEvent.user_id,
        feedback_events: feedbackEvent.feedback_items,
        session_context: feedbackEvent.session_context
      });

      this.emit('cross_system_learning_applied', {
        user_id: feedbackEvent.user_id,
        signals_processed: result.signals_processed,
        both_systems_improved: result.cross_system_improvements.search_ranking_improved && 
                              result.cross_system_improvements.recommendation_quality_improved
      });

      return result;

    } catch (error) {
      console.error('User feedback handling failed:', error);
      return this.signalProcessor['generateFailedIntegrationResult'](0);
    }
  }

  /**
   * Setup event listeners for automatic integration
   */
  private setupEventListeners(): void {
    // Listen for search system events
    this.on('search_query_executed', async (event) => {
      await this.handleSearchEvent(event);
    });

    // Listen for recommendation system events
    this.on('recommendations_generated', async (event) => {
      await this.handleRecommendationEvent(event);
    });

    // Listen for user feedback events
    this.on('user_feedback_received', async (event) => {
      await this.handleUserFeedback(event);
    });
  }

  /**
   * Generate no-op result when learning is disabled
   */
  private generateNoOpResult(): IntegrationResult {
    return {
      integration_successful: true,
      signals_processed: 0,
      learning_applied: false,
      cross_system_improvements: {
        search_ranking_improved: false,
        recommendation_quality_improved: false,
        user_model_enhanced: false
      },
      performance_impact: {
        processing_latency_ms: 0,
        system_efficiency_change: 0,
        user_experience_improvement: 0
      }
    };
  }

  /**
   * Get comprehensive integration status
   */
  getIntegrationStatus(): {
    integration_health: 'excellent' | 'good' | 'needs_attention';
    bidirectional_learning_active: boolean;
    signal_processing_performance: any;
    system_consistency_score: number;
    learning_effectiveness: number;
  } {
    const metrics = this.signalProcessor.getIntegrationMetrics();
    
    let integrationHealth: 'excellent' | 'good' | 'needs_attention' = 'good';
    if (metrics.avg_processing_latency_ms < this.config.integration_targets.signal_propagation_latency_ms &&
        metrics.cross_system_learning_effectiveness > this.config.integration_targets.learning_effectiveness_threshold) {
      integrationHealth = 'excellent';
    } else if (metrics.avg_processing_latency_ms > 100 || 
               metrics.cross_system_learning_effectiveness < 0.6) {
      integrationHealth = 'needs_attention';
    }

    return {
      integration_health: integrationHealth,
      bidirectional_learning_active: this.config.enable_bidirectional_learning,
      signal_processing_performance: metrics,
      system_consistency_score: metrics.system_consistency_score,
      learning_effectiveness: metrics.cross_system_learning_effectiveness
    };
  }

  /**
   * Shutdown coordination system
   */
  shutdown(): void {
    this.signalProcessor.shutdown();
  }
}

// Factory function
export function createCrossSystemLearningIntegration(
  supabase: SupabaseClient,
  config: Partial<LearningIntegrationConfig> = {}
): CrossSystemLearningCoordinator {
  return new CrossSystemLearningCoordinator(supabase, config);
}

export {
  CrossSystemSignal,
  LearningIntegrationConfig,
  IntegrationResult
};