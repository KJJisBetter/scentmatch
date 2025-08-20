/**
 * Thompson Sampling Implementation for Multi-Armed Bandit Optimization
 * 
 * Implements Thompson Sampling algorithm for dynamic recommendation strategy selection,
 * contextual bandits for personalized optimization, and real-time learning from user feedback.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

// Core Types and Interfaces
export interface BanditAlgorithmState {
  algorithm_name: string;
  alpha: number;
  beta: number;
  total_selections: number;
  total_rewards: number;
  success_rate: number;
  confidence_interval: { lower: number; upper: number };
  last_updated: Date;
}

export interface ContextualFactors {
  user_type?: 'beginner' | 'intermediate' | 'expert';
  time_of_day?: 'morning' | 'afternoon' | 'evening' | 'night';
  season?: 'spring' | 'summer' | 'fall' | 'winter';
  device_type?: 'mobile' | 'tablet' | 'desktop';
  session_duration?: number;
  interaction_velocity?: number;
  mood_indicators?: string[];
  occasion?: string;
  location_type?: string;
}

export interface AlgorithmSelection {
  algorithm_name: string;
  confidence: number;
  sampling_score: number;
  context_hash: string;
  is_exploration: boolean;
  selection_timestamp: Date;
  contextual_factors?: ContextualFactors;
}

export interface FeedbackEvent {
  user_id: string;
  fragrance_id: string;
  algorithm_used: string;
  action: 'view' | 'click' | 'add_to_collection' | 'rating' | 'purchase_intent' | 'sample_purchase' | 'ignore';
  action_value?: number; // Rating value, time spent, etc.
  immediate_reward: number;
  delayed_reward?: number;
  contextual_factors: ContextualFactors;
  session_id: string;
  time_to_action_seconds?: number;
}

// Beta Distribution Sampler
export class BetaDistributionSampler {
  /**
   * Sample from Beta(alpha, beta) distribution using ratio of gamma variates
   * More accurate than approximation methods for production use
   */
  sample(alpha: number, beta: number): number {
    if (alpha <= 0 || beta <= 0) {
      throw new Error('Alpha and beta parameters must be positive');
    }

    // Special cases for computational efficiency
    if (alpha === 1 && beta === 1) {
      return Math.random(); // Uniform distribution
    }

    if (alpha === 1) {
      return 1 - Math.pow(Math.random(), 1 / beta);
    }

    if (beta === 1) {
      return Math.pow(Math.random(), 1 / alpha);
    }

    // General case: sample from gamma distributions
    const gamma1 = this.sampleGamma(alpha, 1);
    const gamma2 = this.sampleGamma(beta, 1);
    
    return gamma1 / (gamma1 + gamma2);
  }

  /**
   * Sample from Gamma(shape, scale) distribution using Marsaglia and Tsang's method
   */
  private sampleGamma(shape: number, scale: number): number {
    if (shape < 1) {
      // Handle shape < 1 using Weibull transformation
      return this.sampleGamma(shape + 1, scale) * Math.pow(Math.random(), 1 / shape);
    }

    // Marsaglia and Tsang's method for shape >= 1
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x: number;
      let v: number;

      do {
        x = this.sampleNormal(0, 1);
        v = 1 + c * x;
      } while (v <= 0);

      v = v * v * v;
      const u = Math.random();

      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v * scale;
      }

      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v * scale;
      }
    }
  }

  /**
   * Sample from normal distribution using Box-Muller transform
   */
  private sampleNormal(mean: number, std: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * std + mean;
  }

  /**
   * Calculate confidence interval for beta distribution
   */
  calculateConfidenceInterval(alpha: number, beta: number, confidence: number = 0.95): { lower: number; upper: number } {
    const mean = alpha / (alpha + beta);
    const variance = (alpha * beta) / ((alpha + beta) * (alpha + beta) * (alpha + beta + 1));
    const std = Math.sqrt(variance);
    
    // Approximate with normal distribution for large alpha + beta
    const z = 1.96; // 95% confidence
    
    return {
      lower: Math.max(0, mean - z * std),
      upper: Math.min(1, mean + z * std)
    };
  }
}

// Thompson Sampling Algorithm Selector
export class ThompsonSamplingSelector {
  private sampler: BetaDistributionSampler;
  private supabase: SupabaseClient;
  private config: {
    enable_fallback: boolean;
    fallback_algorithm: string;
    exploration_bonus: number;
    minimum_selections: number;
    debug_logging: boolean;
  };

  constructor(supabase: SupabaseClient, config: Partial<{
    enable_fallback: boolean;
    fallback_algorithm: string;
    exploration_bonus: number;
    minimum_selections: number;
    debug_logging: boolean;
  }> = {}) {
    this.supabase = supabase;
    this.sampler = new BetaDistributionSampler();
    this.config = {
      enable_fallback: config.enable_fallback ?? true,
      fallback_algorithm: config.fallback_algorithm ?? 'hybrid',
      exploration_bonus: config.exploration_bonus ?? 0.1,
      minimum_selections: config.minimum_selections ?? 5,
      debug_logging: config.debug_logging ?? false
    };
  }

  /**
   * Select the best algorithm using Thompson Sampling
   */
  async selectAlgorithm(
    userId: string, 
    contextualFactors: ContextualFactors = {}
  ): Promise<AlgorithmSelection> {
    try {
      const contextHash = this.generateContextHash(contextualFactors);
      
      // Get algorithm states for this user and context
      const algorithmStates = await this.getAlgorithmStates(userId, contextHash);
      
      // Initialize algorithms if none exist
      if (algorithmStates.length === 0) {
        await this.initializeAlgorithms(userId, contextHash);
        return this.selectAlgorithm(userId, contextualFactors); // Retry after initialization
      }

      // Sample from each algorithm's posterior distribution
      const selections = algorithmStates.map(state => {
        const samplingScore = this.sampler.sample(state.alpha, state.beta);
        
        // Add exploration bonus for algorithms with few selections
        const explorationBonus = state.total_selections < this.config.minimum_selections 
          ? this.config.exploration_bonus 
          : 0;
        
        return {
          algorithm_name: state.algorithm_name,
          sampling_score: samplingScore + explorationBonus,
          confidence: state.alpha / (state.alpha + state.beta),
          total_selections: state.total_selections,
          is_exploration: state.total_selections < this.config.minimum_selections
        };
      });

      // Select algorithm with highest sample
      const selectedAlgorithm = selections.reduce((best, current) => 
        current.sampling_score > best.sampling_score ? current : best
      );

      // Update selection count
      await this.updateSelectionCount(userId, selectedAlgorithm.algorithm_name, contextHash);

      if (this.config.debug_logging) {
        console.log('Thompson Sampling Selection:', {
          userId,
          selected: selectedAlgorithm.algorithm_name,
          score: selectedAlgorithm.sampling_score,
          confidence: selectedAlgorithm.confidence,
          context: contextualFactors
        });
      }

      return {
        algorithm_name: selectedAlgorithm.algorithm_name,
        confidence: selectedAlgorithm.confidence,
        sampling_score: selectedAlgorithm.sampling_score,
        context_hash: contextHash,
        is_exploration: selectedAlgorithm.is_exploration,
        selection_timestamp: new Date(),
        contextual_factors: contextualFactors
      };

    } catch (error) {
      console.error('Thompson Sampling selection failed:', error);
      
      if (this.config.enable_fallback) {
        return this.getFallbackSelection(contextualFactors);
      }
      
      throw error;
    }
  }

  /**
   * Get algorithm states from database
   */
  private async getAlgorithmStates(userId: string, contextHash: string): Promise<BanditAlgorithmState[]> {
    const { data, error } = await this.supabase
      .from('bandit_algorithms')
      .select('*')
      .eq('user_id', userId)
      .eq('context_hash', contextHash);

    if (error) {
      throw new Error(`Failed to get algorithm states: ${error.message}`);
    }

    return (data || []).map(row => ({
      algorithm_name: row.algorithm_name,
      alpha: row.alpha,
      beta: row.beta,
      total_selections: row.total_selections,
      total_rewards: row.total_rewards,
      success_rate: row.success_rate,
      confidence_interval: {
        lower: row.confidence_interval_lower,
        upper: row.confidence_interval_upper
      },
      last_updated: new Date(row.last_updated)
    }));
  }

  /**
   * Initialize default algorithms for new user/context combination
   */
  private async initializeAlgorithms(userId: string, contextHash: string): Promise<void> {
    const defaultAlgorithms = [
      'content_based',
      'collaborative', 
      'hybrid',
      'trending',
      'seasonal',
      'adventurous'
    ];

    const initializations = defaultAlgorithms.map(algorithm => ({
      user_id: userId,
      algorithm_name: algorithm,
      context_hash: contextHash,
      alpha: 1.0,
      beta: 1.0,
      total_selections: 0,
      total_rewards: 0.0,
      success_rate: 0.5 // Neutral prior
    }));

    const { error } = await this.supabase
      .from('bandit_algorithms')
      .insert(initializations);

    if (error) {
      throw new Error(`Failed to initialize algorithms: ${error.message}`);
    }
  }

  /**
   * Update selection count after algorithm is chosen
   */
  private async updateSelectionCount(userId: string, algorithmName: string, contextHash: string): Promise<void> {
    const { error } = await this.supabase
      .from('bandit_algorithms')
      .update({ 
        total_selections: this.supabase.sql`total_selections + 1`,
        last_updated: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('algorithm_name', algorithmName)
      .eq('context_hash', contextHash);

    if (error) {
      console.error('Failed to update selection count:', error);
    }
  }

  /**
   * Generate consistent context hash for contextual bandit
   */
  private generateContextHash(contextualFactors: ContextualFactors): string {
    // Sort keys for consistent hashing regardless of input order
    const sortedEntries = Object.entries(contextualFactors)
      .filter(([_, value]) => value !== null)
      .sort(([a], [b]) => a.localeCompare(b));

    const contextString = sortedEntries
      .map(([key, value]) => `${key}:${value}`)
      .join('|');

    // Generate SHA-256 hash and take first 16 characters
    return createHash('sha256')
      .update(contextString || 'default')
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Fallback selection when Thompson Sampling fails
   */
  private getFallbackSelection(contextualFactors: ContextualFactors): AlgorithmSelection {
    return {
      algorithm_name: this.config.fallback_algorithm,
      confidence: 0.5,
      sampling_score: 0.5,
      context_hash: this.generateContextHash(contextualFactors),
      is_exploration: true,
      selection_timestamp: new Date(),
      contextual_factors: contextualFactors
    };
  }
}

// Contextual Bandit Selector
export class ContextualBanditSelector extends ThompsonSamplingSelector {
  private contextWeights: Map<string, number> = new Map([
    ['user_type', 0.3],
    ['time_of_day', 0.2],
    ['season', 0.2],
    ['device_type', 0.1],
    ['session_duration', 0.1],
    ['mood_indicators', 0.1]
  ]);

  /**
   * Select algorithm with enhanced contextual awareness
   */
  async selectAlgorithmWithContext(
    userId: string, 
    contextualFactors: ContextualFactors
  ): Promise<AlgorithmSelection> {
    // Enrich context with computed factors
    const enrichedContext = await this.enrichContextualFactors(userId, contextualFactors);
    
    // Use parent Thompson Sampling with enriched context
    const selection = await this.selectAlgorithm(userId, enrichedContext);
    
    // Calculate contextual confidence
    const contextualConfidence = this.calculateContextualConfidence(enrichedContext);
    
    return {
      ...selection,
      confidence: selection.confidence * contextualConfidence,
      contextual_factors: enrichedContext
    };
  }

  /**
   * Enrich contextual factors with computed values
   */
  private async enrichContextualFactors(
    userId: string, 
    baseContext: ContextualFactors
  ): Promise<ContextualFactors> {
    const enriched = { ...baseContext };

    // Infer time of day if not provided
    if (!enriched.time_of_day) {
      enriched.time_of_day = this.inferTimeOfDay();
    }

    // Infer season if not provided
    if (!enriched.season) {
      enriched.season = this.inferSeason();
    }

    // Get user interaction velocity from recent activity
    if (!enriched.interaction_velocity) {
      enriched.interaction_velocity = await this.getUserInteractionVelocity(userId);
    }

    return enriched;
  }

  /**
   * Calculate confidence based on contextual factor completeness
   */
  private calculateContextualConfidence(contextualFactors: ContextualFactors): number {
    let totalWeight = 0;
    let providedWeight = 0;

    for (const [factor, weight] of this.contextWeights.entries()) {
      totalWeight += weight;
      if (contextualFactors[factor as keyof ContextualFactors]) {
        providedWeight += weight;
      }
    }

    return 0.5 + (providedWeight / totalWeight) * 0.5; // Range: 0.5 to 1.0
  }

  /**
   * Infer time of day from current time
   */
  private inferTimeOfDay(): ContextualFactors['time_of_day'] {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  /**
   * Infer season from current date
   */
  private inferSeason(): ContextualFactors['season'] {
    const month = new Date().getMonth();
    
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  /**
   * Get user interaction velocity from recent activity
   */
  private async getUserInteractionVelocity(userId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('user_interactions')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return 0.5; // Default moderate velocity
      }

      // Calculate interactions per hour
      return Math.min(1.0, data.length / 24);
    } catch (error) {
      console.error('Failed to get user interaction velocity:', error);
      return 0.5;
    }
  }
}

// Feedback Processor for Thompson Sampling
export class ThompsonSamplingFeedbackProcessor {
  private supabase: SupabaseClient;
  private rewardCalculator: RewardCalculator;
  private config: {
    enable_delayed_rewards: boolean;
    delayed_reward_window_hours: number;
    batch_processing: boolean;
    real_time_updates: boolean;
  };

  constructor(supabase: SupabaseClient, config: Partial<{
    enable_delayed_rewards: boolean;
    delayed_reward_window_hours: number;
    batch_processing: boolean;
    real_time_updates: boolean;
  }> = {}) {
    this.supabase = supabase;
    this.rewardCalculator = new RewardCalculator();
    this.config = {
      enable_delayed_rewards: config.enable_delayed_rewards ?? true,
      delayed_reward_window_hours: config.delayed_reward_window_hours ?? 24,
      batch_processing: config.batch_processing ?? false,
      real_time_updates: config.real_time_updates ?? true
    };
  }

  /**
   * Process user feedback and update algorithm parameters
   */
  async processFeedback(feedback: FeedbackEvent): Promise<{
    processed: boolean;
    algorithm_updated: boolean;
    new_success_rate: number;
    learning_impact: number;
    processing_time_ms: number;
  }> {
    const startTime = Date.now();

    try {
      // Calculate immediate reward
      const immediateReward = this.rewardCalculator.calculateReward(
        feedback.action,
        feedback.action_value,
        feedback.time_to_action_seconds,
        feedback.contextual_factors
      );

      // Store feedback event
      const { error: feedbackError } = await this.supabase
        .from('recommendation_feedback')
        .insert({
          user_id: feedback.user_id,
          fragrance_id: feedback.fragrance_id,
          algorithm_used: feedback.algorithm_used,
          action: feedback.action,
          session_id: feedback.session_id,
          immediate_reward: immediateReward,
          combined_reward: immediateReward, // Will be updated with delayed reward later
          context: feedback.contextual_factors || {},
          contextual_factors: feedback.contextual_factors || {},
          recommendation_timestamp: new Date().toISOString(),
          action_timestamp: new Date().toISOString(),
          time_to_action_seconds: feedback.time_to_action_seconds
        });

      if (feedbackError) {
        throw new Error(`Failed to store feedback: ${feedbackError.message}`);
      }

      // Update algorithm parameters using database function
      const contextHash = this.generateContextHash(feedback.contextual_factors);
      const { data: updateResult, error: updateError } = await this.supabase
        .rpc('process_bandit_feedback', {
          target_user_id: feedback.user_id,
          algorithm_name_param: feedback.algorithm_used,
          reward_value: immediateReward,
          context_factors: feedback.contextual_factors || {}
        });

      if (updateError) {
        throw new Error(`Failed to update bandit parameters: ${updateError.message}`);
      }

      const result = updateResult?.[0];
      const processingTime = Date.now() - startTime;

      // Schedule delayed reward processing if enabled
      if (this.config.enable_delayed_rewards) {
        this.scheduleDelayedRewardProcessing(feedback, immediateReward);
      }

      return {
        processed: result?.success ?? false,
        algorithm_updated: result?.success ?? false,
        new_success_rate: result?.updated_success_rate ?? 0,
        learning_impact: Math.abs(immediateReward - 0.5), // Distance from neutral
        processing_time_ms: processingTime
      };

    } catch (error) {
      console.error('Failed to process feedback:', error);
      return {
        processed: false,
        algorithm_updated: false,
        new_success_rate: 0,
        learning_impact: 0,
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  /**
   * Process batch feedback for performance optimization
   */
  async processBatchFeedback(feedbacks: FeedbackEvent[]): Promise<{
    processed_count: number;
    failed_count: number;
    total_processing_time_ms: number;
    batch_efficiency: number;
  }> {
    const startTime = Date.now();
    let processed = 0;
    let failed = 0;

    if (this.config.batch_processing) {
      // Process all feedbacks in parallel
      const results = await Promise.allSettled(
        feedbacks.map(feedback => this.processFeedback(feedback))
      );

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.processed) {
          processed++;
        } else {
          failed++;
        }
      });
    } else {
      // Process sequentially
      for (const feedback of feedbacks) {
        try {
          const result = await this.processFeedback(feedback);
          if (result.processed) {
            processed++;
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
        }
      }
    }

    const totalTime = Date.now() - startTime;
    const efficiency = processed / Math.max(feedbacks.length, 1);

    return {
      processed_count: processed,
      failed_count: failed,
      total_processing_time_ms: totalTime,
      batch_efficiency: efficiency
    };
  }

  /**
   * Schedule delayed reward processing
   */
  private async scheduleDelayedRewardProcessing(
    feedback: FeedbackEvent, 
    immediateReward: number
  ): Promise<void> {
    // Add to AI processing queue for delayed processing
    await this.supabase
      .from('ai_processing_queue')
      .insert({
        task_type: 'delayed_reward_processing',
        task_data: {
          user_id: feedback.user_id,
          fragrance_id: feedback.fragrance_id,
          algorithm_used: feedback.algorithm_used,
          immediate_reward: immediateReward,
          process_after: new Date(Date.now() + this.config.delayed_reward_window_hours * 60 * 60 * 1000).toISOString()
        },
        priority: 6,
        expires_at: new Date(Date.now() + (this.config.delayed_reward_window_hours + 48) * 60 * 60 * 1000).toISOString()
      });
  }

  /**
   * Generate context hash (same as in ThompsonSamplingSelector)
   */
  private generateContextHash(contextualFactors: ContextualFactors): string {
    const sortedEntries = Object.entries(contextualFactors)
      .filter(([_, value]) => value !== null)
      .sort(([a], [b]) => a.localeCompare(b));

    const contextString = sortedEntries
      .map(([key, value]) => `${key}:${value}`)
      .join('|');

    return createHash('sha256')
      .update(contextString || 'default')
      .digest('hex')
      .substring(0, 16);
  }
}

// Reward Calculator
export class RewardCalculator {
  private actionRewards = new Map([
    ['view', 0.1],
    ['click', 0.3],
    ['add_to_collection', 0.7],
    ['rating', 0.6], // Default, overridden by actual rating
    ['purchase_intent', 0.8],
    ['sample_purchase', 1.0],
    ['ignore', 0.0]
  ]);

  /**
   * Calculate reward based on user action and context
   */
  calculateReward(
    action: string,
    actionValue?: number,
    timeToActionSeconds?: number,
    contextualFactors: ContextualFactors = {}
  ): number {
    let baseReward = this.actionRewards.get(action) ?? 0.0;

    // Adjust for action value (e.g., rating score)
    if (action === 'rating' && actionValue !== undefined) {
      baseReward = actionValue / 5.0; // Normalize 1-5 rating to 0-1
    }

    // Time-based bonus (faster engagement = higher reward)
    if (timeToActionSeconds !== undefined && timeToActionSeconds > 0) {
      const timeBonus = Math.min(0.2, 30.0 / Math.max(timeToActionSeconds, 1));
      baseReward += baseReward * timeBonus;
    }

    // Context-based adjustments
    let contextMultiplier = 1.0;

    // Evening engagement might be more intentional
    if (contextualFactors.time_of_day === 'evening') {
      contextMultiplier *= 1.1;
    }

    // Mobile interactions might be more casual
    if (contextualFactors.device_type === 'mobile') {
      contextMultiplier *= 0.9;
    }

    // High interaction velocity suggests engaged user
    if (contextualFactors.interaction_velocity && contextualFactors.interaction_velocity > 0.8) {
      contextMultiplier *= 1.15;
    }

    const finalReward = baseReward * contextMultiplier;
    
    // Ensure reward stays in [0, 1] range
    return Math.max(0, Math.min(1, finalReward));
  }

  /**
   * Calculate delayed reward based on subsequent user behavior
   */
  calculateDelayedReward(
    originalAction: string,
    subsequentActions: Array<{ action: string; value?: number; timestamp: Date }>,
    timeWindowHours: number = 24
  ): number {
    let delayedReward = 0;
    const cutoffTime = Date.now() - (timeWindowHours * 60 * 60 * 1000);

    for (const subsequent of subsequentActions) {
      if (subsequent.timestamp.getTime() > cutoffTime) {
        // Weight by recency and action value
        const recencyWeight = Math.exp(-(Date.now() - subsequent.timestamp.getTime()) / (6 * 60 * 60 * 1000)); // 6-hour half-life
        const actionReward = this.actionRewards.get(subsequent.action) ?? 0;
        
        delayedReward += actionReward * recencyWeight;
      }
    }

    // Normalize and cap delayed reward
    return Math.min(0.5, delayedReward); // Max 50% additional reward from delayed actions
  }
}

// Algorithm Performance Tracker
export class AlgorithmPerformanceTracker {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Get performance trend for specific algorithm
   */
  async getPerformanceTrend(
    algorithmName: string, 
    days: number = 7,
    contextHash: string = 'default'
  ): Promise<{
    algorithm_name: string;
    trend_direction: 'improving' | 'declining' | 'stable';
    improvement_rate: number;
    confidence_interval: { lower: number; upper: number };
    statistical_significance: number;
    sample_size: number;
  }> {
    const { data, error } = await this.supabase
      .from('algorithm_performance_metrics')
      .select('*')
      .eq('algorithm_name', algorithmName)
      .eq('context_hash', contextHash)
      .gte('metric_period_start', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('metric_period_start', { ascending: true });

    if (error) {
      throw new Error(`Failed to get performance trend: ${error.message}`);
    }

    if (!data || data.length < 2) {
      return {
        algorithm_name: algorithmName,
        trend_direction: 'stable',
        improvement_rate: 0,
        confidence_interval: { lower: 0, upper: 1 },
        statistical_significance: 0,
        sample_size: 0
      };
    }

    // Calculate trend using linear regression
    const performanceValues = data.map(d => d.success_rate);
    const timePoints = data.map((d, i) => i);
    
    const { slope, significance } = this.calculateLinearTrend(timePoints, performanceValues);
    
    let trendDirection: 'improving' | 'declining' | 'stable' = 'stable';
    if (Math.abs(slope) > 0.01) {
      trendDirection = slope > 0 ? 'improving' : 'declining';
    }

    const latestMetrics = data[data.length - 1];
    const totalSampleSize = data.reduce((sum, d) => sum + d.total_recommendations, 0);

    return {
      algorithm_name: algorithmName,
      trend_direction: trendDirection,
      improvement_rate: slope,
      confidence_interval: {
        lower: latestMetrics.confidence_interval_lower,
        upper: latestMetrics.confidence_interval_upper
      },
      statistical_significance: significance,
      sample_size: totalSampleSize
    };
  }

  /**
   * Calculate linear trend using least squares regression
   */
  private calculateLinearTrend(x: number[], y: number[]): { slope: number; significance: number } {
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Simple significance approximation
    const significance = Math.min(0.99, Math.abs(slope) * n / 10);

    return { slope, significance };
  }

  /**
   * Get comprehensive algorithm performance analysis
   */
  async getAlgorithmAnalysis(userId: string): Promise<{
    algorithms: Array<{
      name: string;
      performance: number;
      confidence: number;
      total_selections: number;
      recent_trend: string;
    }>;
    best_algorithm: string;
    exploration_opportunities: string[];
    optimization_suggestions: string[];
  }> {
    const { data, error } = await this.supabase
      .from('bandit_algorithms')
      .select('*')
      .eq('user_id', userId)
      .order('success_rate', { ascending: false });

    if (error) {
      throw new Error(`Failed to get algorithm analysis: ${error.message}`);
    }

    const algorithms = (data || []).map(alg => ({
      name: alg.algorithm_name,
      performance: alg.success_rate,
      confidence: alg.alpha / (alg.alpha + alg.beta),
      total_selections: alg.total_selections,
      recent_trend: this.calculateRecentTrend(alg)
    }));

    const bestAlgorithm = algorithms[0]?.name || 'hybrid';
    
    const explorationOpportunities = algorithms
      .filter(alg => alg.total_selections < 10)
      .map(alg => alg.name);

    const optimizationSuggestions = this.generateOptimizationSuggestions(algorithms);

    return {
      algorithms,
      best_algorithm: bestAlgorithm,
      exploration_opportunities: explorationOpportunities,
      optimization_suggestions: optimizationSuggestions
    };
  }

  /**
   * Calculate recent trend for algorithm
   */
  private calculateRecentTrend(algorithmData: any): string {
    // Simple trend calculation based on confidence interval
    const mean = algorithmData.success_rate;
    const lower = algorithmData.confidence_interval_lower;
    const upper = algorithmData.confidence_interval_upper;
    
    if (lower > 0.6) return 'strong_positive';
    if (upper < 0.4) return 'strong_negative';
    if (mean > 0.5) return 'positive';
    if (mean < 0.5) return 'negative';
    return 'neutral';
  }

  /**
   * Generate optimization suggestions based on performance data
   */
  private generateOptimizationSuggestions(algorithms: any[]): string[] {
    const suggestions = [];

    const underexploredAlgorithms = algorithms.filter(a => a.total_selections < 5);
    if (underexploredAlgorithms.length > 0) {
      suggestions.push(`Explore underutilized algorithms: ${underexploredAlgorithms.map(a => a.name).join(', ')}`);
    }

    const lowPerformingAlgorithms = algorithms.filter(a => a.performance < 0.3 && a.total_selections > 20);
    if (lowPerformingAlgorithms.length > 0) {
      suggestions.push(`Consider retiring poor performers: ${lowPerformingAlgorithms.map(a => a.name).join(', ')}`);
    }

    const highVarianceAlgorithms = algorithms.filter(a => a.confidence < 0.5 && a.total_selections > 10);
    if (highVarianceAlgorithms.length > 0) {
      suggestions.push(`Investigate high variance algorithms: ${highVarianceAlgorithms.map(a => a.name).join(', ')}`);
    }

    return suggestions;
  }

  /**
   * Generate context hash (consistent with other classes)
   */
  private generateContextHash(contextualFactors: ContextualFactors): string {
    const sortedEntries = Object.entries(contextualFactors)
      .filter(([_, value]) => value !== null)
      .sort(([a], [b]) => a.localeCompare(b));

    const contextString = sortedEntries
      .map(([key, value]) => `${key}:${value}`)
      .join('|');

    return createHash('sha256')
      .update(contextString || 'default')
      .digest('hex')
      .substring(0, 16);
  }
}

// Main Thompson Sampling Service
export class ThompsonSamplingService {
  private selector: ContextualBanditSelector;
  private feedbackProcessor: ThompsonSamplingFeedbackProcessor;
  private performanceTracker: AlgorithmPerformanceTracker;

  constructor(supabase: SupabaseClient, config: any = {}) {
    this.selector = new ContextualBanditSelector(supabase, config);
    this.feedbackProcessor = new ThompsonSamplingFeedbackProcessor(supabase, config);
    this.performanceTracker = new AlgorithmPerformanceTracker(supabase);
  }

  /**
   * Get optimal algorithm recommendation with full context
   */
  async getOptimalAlgorithm(
    userId: string,
    contextualFactors: ContextualFactors = {}
  ): Promise<AlgorithmSelection> {
    return await this.selector.selectAlgorithmWithContext(userId, contextualFactors);
  }

  /**
   * Process user feedback to improve algorithm selection
   */
  async processFeedback(feedback: FeedbackEvent) {
    return await this.feedbackProcessor.processFeedback(feedback);
  }

  /**
   * Get comprehensive performance analysis
   */
  async getPerformanceAnalysis(userId: string) {
    return await this.performanceTracker.getAlgorithmAnalysis(userId);
  }

  /**
   * Get system-wide bandit performance metrics
   */
  async getSystemMetrics(): Promise<{
    total_active_users: number;
    algorithms_performance: any[];
    optimization_effectiveness: number;
    system_health: string;
  }> {
    const { data, error } = await this.selector.supabase
      .from('bandit_performance_summary')
      .select('*');

    if (error) {
      throw new Error(`Failed to get system metrics: ${error.message}`);
    }

    const totalUsers = data?.reduce((sum, alg) => sum + alg.active_users, 0) || 0;
    const avgPerformance = data?.reduce((sum, alg) => sum + alg.avg_success_rate, 0) / Math.max(data?.length || 1, 1);
    
    let systemHealth = 'good';
    if (avgPerformance > 0.8) systemHealth = 'excellent';
    else if (avgPerformance < 0.5) systemHealth = 'needs_attention';

    return {
      total_active_users: totalUsers,
      algorithms_performance: data || [],
      optimization_effectiveness: avgPerformance,
      system_health: systemHealth
    };
  }
}

// Utility functions for external integration
export function createThompsonSamplingService(supabase: SupabaseClient): ThompsonSamplingService {
  return new ThompsonSamplingService(supabase, {
    enable_fallback: true,
    fallback_algorithm: 'hybrid',
    debug_logging: process.env.NODE_ENV === 'development'
  });
}

export { ContextualFactors, AlgorithmSelection, FeedbackEvent };