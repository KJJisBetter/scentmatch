/**
 * Contextual Bandit System for Personalized Actions
 * 
 * Advanced contextual bandit implementation that adapts recommendations
 * based on user context, environmental factors, and real-time signals.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { EventEmitter } from 'events';

// Core Types and Interfaces
export interface ContextualActionSpace {
  recommendation_algorithms: string[];
  personalization_strategies: string[];
  content_filters: string[];
  ranking_approaches: string[];
}

export interface ContextualState {
  user_context: {
    user_type: 'beginner' | 'intermediate' | 'expert';
    collection_size: number;
    engagement_level: 'low' | 'medium' | 'high';
    preference_confidence: number;
    last_interaction_hours_ago: number;
  };
  
  temporal_context: {
    time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
    day_of_week: string;
    season: 'spring' | 'summer' | 'fall' | 'winter';
    local_timezone: string;
  };
  
  environmental_context: {
    weather?: 'sunny' | 'rainy' | 'cloudy' | 'snowy';
    temperature?: 'cold' | 'cool' | 'warm' | 'hot';
    location_type?: 'home' | 'office' | 'travel' | 'social';
  };
  
  behavioral_context: {
    session_duration_minutes: number;
    pages_visited: number;
    interaction_velocity: number; // interactions per minute
    search_activity: boolean;
    browsing_pattern: 'focused' | 'exploratory' | 'casual';
  };
  
  device_context: {
    device_type: 'mobile' | 'tablet' | 'desktop';
    screen_size: string;
    connection_quality: 'poor' | 'good' | 'excellent';
    battery_level?: number;
  };
}

export interface ContextualAction {
  action_id: string;
  action_type: 'recommendation_generation' | 'content_filtering' | 'ranking_adjustment' | 'personalization_level';
  parameters: Record<string, any>;
  expected_reward: number;
  confidence: number;
  context_relevance: number;
}

export interface ContextualReward {
  action_id: string;
  user_id: string;
  immediate_reward: number;
  delayed_reward?: number;
  context_at_action: ContextualState;
  feedback_quality: number;
  time_to_feedback_seconds: number;
}

// Contextual Feature Extractor
export class ContextualFeatureExtractor {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Extract comprehensive contextual features for bandit decision making
   */
  async extractContextualState(userId: string, requestContext: any = {}): Promise<ContextualState> {
    try {
      // Get user context from database
      const userContext = await this.extractUserContext(userId);
      
      // Extract temporal context
      const temporalContext = this.extractTemporalContext(requestContext);
      
      // Extract environmental context
      const environmentalContext = await this.extractEnvironmentalContext(requestContext);
      
      // Extract behavioral context
      const behavioralContext = await this.extractBehavioralContext(userId, requestContext);
      
      // Extract device context
      const deviceContext = this.extractDeviceContext(requestContext);

      return {
        user_context: userContext,
        temporal_context: temporalContext,
        environmental_context: environmentalContext,
        behavioral_context: behavioralContext,
        device_context: deviceContext
      };

    } catch (error) {
      console.error('Failed to extract contextual state:', error);
      return this.getDefaultContextualState();
    }
  }

  /**
   * Extract user-specific context from database
   */
  private async extractUserContext(userId: string): Promise<ContextualState['user_context']> {
    try {
      // Get user collection and interaction stats
      const { data: userStats, error } = await this.supabase
        .from('user_collections')
        .select('id, rating, created_at')
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to get user stats: ${error.message}`);
      }

      const collectionSize = userStats?.length || 0;
      const ratingsProvided = userStats?.filter(item => item.rating).length || 0;
      const accountAge = userStats?.[0]?.created_at 
        ? (Date.now() - new Date(userStats[0].created_at).getTime()) / (1000 * 60 * 60 * 24)
        : 0;

      // Get recent interaction data
      const { data: recentInteractions } = await this.supabase
        .from('user_interactions')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      const lastInteractionHours = recentInteractions?.[0]?.created_at
        ? (Date.now() - new Date(recentInteractions[0].created_at).getTime()) / (1000 * 60 * 60)
        : 168; // Default to 1 week

      // Determine user type
      let userType: 'beginner' | 'intermediate' | 'expert' = 'beginner';
      if (collectionSize >= 20 && ratingsProvided >= 10 && accountAge >= 30) {
        userType = 'expert';
      } else if (collectionSize >= 5 && ratingsProvided >= 3) {
        userType = 'intermediate';
      }

      // Calculate engagement level
      let engagementLevel: 'low' | 'medium' | 'high' = 'low';
      if (lastInteractionHours < 1) engagementLevel = 'high';
      else if (lastInteractionHours < 24) engagementLevel = 'medium';

      // Calculate preference confidence
      const preferenceConfidence = Math.min(1.0, 
        (collectionSize / 20) * 0.5 + 
        (ratingsProvided / 10) * 0.3 + 
        (Math.min(accountAge, 90) / 90) * 0.2
      );

      return {
        user_type: userType,
        collection_size: collectionSize,
        engagement_level: engagementLevel,
        preference_confidence: preferenceConfidence,
        last_interaction_hours_ago: lastInteractionHours
      };

    } catch (error) {
      console.error('Failed to extract user context:', error);
      return {
        user_type: 'beginner',
        collection_size: 0,
        engagement_level: 'low',
        preference_confidence: 0.3,
        last_interaction_hours_ago: 24
      };
    }
  }

  /**
   * Extract temporal context
   */
  private extractTemporalContext(requestContext: any): ContextualState['temporal_context'] {
    const now = new Date();
    
    const hour = now.getHours();
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';

    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const month = now.getMonth();
    let season: 'spring' | 'summer' | 'fall' | 'winter' = 'spring';
    if (month >= 2 && month <= 4) season = 'spring';
    else if (month >= 5 && month <= 7) season = 'summer';
    else if (month >= 8 && month <= 10) season = 'fall';
    else season = 'winter';

    return {
      time_of_day: timeOfDay,
      day_of_week: dayOfWeek,
      season: season,
      local_timezone: requestContext.timezone || 'UTC'
    };
  }

  /**
   * Extract environmental context (could integrate with weather APIs)
   */
  private async extractEnvironmentalContext(requestContext: any): Promise<ContextualState['environmental_context']> {
    // For now, return basic environmental context
    // In production, could integrate with weather services
    return {
      weather: requestContext.weather || 'sunny',
      temperature: requestContext.temperature || 'warm',
      location_type: requestContext.location_type || 'home'
    };
  }

  /**
   * Extract behavioral context from recent user activity
   */
  private async extractBehavioralContext(userId: string, requestContext: any): Promise<ContextualState['behavioral_context']> {
    try {
      // Get recent session activity
      const sessionId = requestContext.session_id;
      if (!sessionId) {
        return this.getDefaultBehavioralContext();
      }

      const { data: sessionActivity } = await this.supabase
        .from('user_interactions')
        .select('interaction_type, created_at')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (!sessionActivity || sessionActivity.length === 0) {
        return this.getDefaultBehavioralContext();
      }

      // Calculate session metrics
      const sessionStart = new Date(sessionActivity[0].created_at);
      const sessionDuration = (Date.now() - sessionStart.getTime()) / (1000 * 60); // minutes
      const pagesVisited = new Set(sessionActivity.map(a => a.interaction_type)).size;
      const interactionVelocity = sessionActivity.length / Math.max(sessionDuration, 1);

      // Determine browsing pattern
      let browsingPattern: 'focused' | 'exploratory' | 'casual' = 'casual';
      if (interactionVelocity > 3 && pagesVisited > 5) browsingPattern = 'exploratory';
      else if (sessionActivity.filter(a => a.interaction_type === 'rating').length > 2) browsingPattern = 'focused';

      const searchActivity = sessionActivity.some(a => a.interaction_type === 'search');

      return {
        session_duration_minutes: sessionDuration,
        pages_visited: pagesVisited,
        interaction_velocity: interactionVelocity,
        search_activity: searchActivity,
        browsing_pattern: browsingPattern
      };

    } catch (error) {
      console.error('Failed to extract behavioral context:', error);
      return this.getDefaultBehavioralContext();
    }
  }

  /**
   * Extract device context from request headers
   */
  private extractDeviceContext(requestContext: any): ContextualState['device_context'] {
    const userAgent = requestContext.user_agent || '';
    
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (userAgent.includes('Mobile') || userAgent.includes('iPhone')) deviceType = 'mobile';
    else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) deviceType = 'tablet';

    return {
      device_type: deviceType,
      screen_size: requestContext.screen_size || 'unknown',
      connection_quality: requestContext.connection_quality || 'good',
      battery_level: requestContext.battery_level
    };
  }

  /**
   * Get default contextual state for fallback scenarios
   */
  private getDefaultContextualState(): ContextualState {
    return {
      user_context: {
        user_type: 'beginner',
        collection_size: 0,
        engagement_level: 'medium',
        preference_confidence: 0.3,
        last_interaction_hours_ago: 24
      },
      temporal_context: {
        time_of_day: 'afternoon',
        day_of_week: 'monday',
        season: 'spring',
        local_timezone: 'UTC'
      },
      environmental_context: {
        weather: 'sunny',
        temperature: 'warm',
        location_type: 'home'
      },
      behavioral_context: {
        session_duration_minutes: 5,
        pages_visited: 2,
        interaction_velocity: 0.5,
        search_activity: false,
        browsing_pattern: 'casual'
      },
      device_context: {
        device_type: 'desktop',
        screen_size: 'large',
        connection_quality: 'good'
      }
    };
  }

  /**
   * Get default behavioral context
   */
  private getDefaultBehavioralContext(): ContextualState['behavioral_context'] {
    return {
      session_duration_minutes: 5,
      pages_visited: 2,
      interaction_velocity: 0.5,
      search_activity: false,
      browsing_pattern: 'casual'
    };
  }
}

// Contextual Bandit Policy
export class ContextualBanditPolicy {
  private supabase: SupabaseClient;
  private featureExtractor: ContextualFeatureExtractor;
  private config: {
    learning_rate: number;
    exploration_parameter: number;
    context_weight: number;
    confidence_threshold: number;
    enable_feature_selection: boolean;
  };

  constructor(supabase: SupabaseClient, config: Partial<{
    learning_rate: number;
    exploration_parameter: number;
    context_weight: number;
    confidence_threshold: number;
    enable_feature_selection: boolean;
  }> = {}) {
    this.supabase = supabase;
    this.featureExtractor = new ContextualFeatureExtractor(supabase);
    this.config = {
      learning_rate: config.learning_rate || 0.1,
      exploration_parameter: config.exploration_parameter || 0.1,
      context_weight: config.context_weight || 0.3,
      confidence_threshold: config.confidence_threshold || 0.7,
      enable_feature_selection: config.enable_feature_selection ?? true
    };
  }

  /**
   * Select optimal action based on current context using LinUCB algorithm
   */
  async selectContextualAction(
    userId: string,
    actionSpace: ContextualActionSpace,
    requestContext: any = {}
  ): Promise<{
    selected_action: ContextualAction;
    context_features: number[];
    confidence_bounds: { lower: number; upper: number };
    exploration_bonus: number;
    context_hash: string;
  }> {
    try {
      // Extract contextual state
      const contextualState = await this.featureExtractor.extractContextualState(userId, requestContext);
      
      // Convert context to feature vector
      const contextFeatures = this.contextToFeatureVector(contextualState);
      const contextHash = this.generateContextHash(contextualState);
      
      // Get learned parameters for this user-context combination
      const learnedParameters = await this.getLearnedParameters(userId, contextHash);
      
      // Calculate confidence bounds for each action using LinUCB
      const actionScores = await this.calculateActionScores(
        actionSpace,
        contextFeatures,
        learnedParameters
      );
      
      // Select action with highest upper confidence bound
      const selectedAction = actionScores.reduce((best, current) => 
        current.upper_confidence_bound > best.upper_confidence_bound ? current : best
      );

      // Calculate exploration bonus
      const explorationBonus = this.calculateExplorationBonus(
        selectedAction.action_count,
        learnedParameters.total_observations
      );

      return {
        selected_action: {
          action_id: selectedAction.action_id,
          action_type: selectedAction.action_type,
          parameters: selectedAction.parameters,
          expected_reward: selectedAction.expected_reward,
          confidence: selectedAction.confidence,
          context_relevance: selectedAction.context_relevance
        },
        context_features: contextFeatures,
        confidence_bounds: {
          lower: selectedAction.lower_confidence_bound,
          upper: selectedAction.upper_confidence_bound
        },
        exploration_bonus: explorationBonus,
        context_hash: contextHash
      };

    } catch (error) {
      console.error('Contextual action selection failed:', error);
      return this.getFallbackAction(actionSpace);
    }
  }

  /**
   * Update policy parameters based on observed reward
   */
  async updatePolicy(
    userId: string,
    contextualReward: ContextualReward
  ): Promise<{
    parameters_updated: boolean;
    learning_impact: number;
    confidence_change: number;
    model_version: number;
  }> {
    try {
      const contextHash = this.generateContextHash(contextualReward.context_at_action);
      
      // Get current parameters
      const currentParams = await this.getLearnedParameters(userId, contextHash);
      
      // Convert context to feature vector
      const contextFeatures = this.contextToFeatureVector(contextualReward.context_at_action);
      
      // Update parameters using weighted least squares update rule
      const parameterUpdate = this.calculateParameterUpdate(
        currentParams,
        contextFeatures,
        contextualReward.immediate_reward,
        contextualReward.feedback_quality
      );

      // Store updated parameters
      const { error } = await this.supabase
        .from('contextual_preference_patterns')
        .upsert({
          user_id: userId,
          context_hash: contextHash,
          context_factors: contextualReward.context_at_action,
          learned_preferences: parameterUpdate.new_parameters,
          preference_strength: parameterUpdate.new_confidence,
          confidence_level: parameterUpdate.confidence_change,
          interaction_count: currentParams.total_observations + 1,
          last_reinforcement_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(`Failed to update parameters: ${error.message}`);
      }

      return {
        parameters_updated: true,
        learning_impact: parameterUpdate.learning_impact,
        confidence_change: parameterUpdate.confidence_change,
        model_version: parameterUpdate.model_version
      };

    } catch (error) {
      console.error('Policy update failed:', error);
      return {
        parameters_updated: false,
        learning_impact: 0,
        confidence_change: 0,
        model_version: 0
      };
    }
  }

  /**
   * Convert contextual state to numerical feature vector
   */
  private contextToFeatureVector(contextualState: ContextualState): number[] {
    const features: number[] = [];

    // User context features (5 features)
    features.push(
      contextualState.user_context.user_type === 'expert' ? 1 : 0,
      contextualState.user_context.user_type === 'intermediate' ? 1 : 0,
      Math.min(1.0, contextualState.user_context.collection_size / 50),
      contextualState.user_context.engagement_level === 'high' ? 1 : 0,
      contextualState.user_context.preference_confidence
    );

    // Temporal context features (6 features)
    features.push(
      contextualState.temporal_context.time_of_day === 'morning' ? 1 : 0,
      contextualState.temporal_context.time_of_day === 'evening' ? 1 : 0,
      ['saturday', 'sunday'].includes(contextualState.temporal_context.day_of_week) ? 1 : 0,
      contextualState.temporal_context.season === 'winter' ? 1 : 0,
      contextualState.temporal_context.season === 'summer' ? 1 : 0,
      contextualState.temporal_context.season === 'fall' ? 1 : 0
    );

    // Environmental context features (3 features)
    features.push(
      contextualState.environmental_context.weather === 'rainy' ? 1 : 0,
      contextualState.environmental_context.temperature === 'cold' ? 1 : 0,
      contextualState.environmental_context.location_type === 'office' ? 1 : 0
    );

    // Behavioral context features (4 features)
    features.push(
      Math.min(1.0, contextualState.behavioral_context.session_duration_minutes / 60),
      Math.min(1.0, contextualState.behavioral_context.interaction_velocity / 5),
      contextualState.behavioral_context.search_activity ? 1 : 0,
      contextualState.behavioral_context.browsing_pattern === 'focused' ? 1 : 0
    );

    // Device context features (2 features)
    features.push(
      contextualState.device_context.device_type === 'mobile' ? 1 : 0,
      contextualState.device_context.connection_quality === 'poor' ? 1 : 0
    );

    // Add bias term
    features.push(1.0);

    return features;
  }

  /**
   * Generate consistent context hash
   */
  private generateContextHash(contextualState: ContextualState): string {
    const contextString = JSON.stringify(contextualState, Object.keys(contextualState).sort());
    return createHash('sha256').update(contextString).digest('hex').substring(0, 16);
  }

  /**
   * Get learned parameters for user-context combination
   */
  private async getLearnedParameters(userId: string, contextHash: string): Promise<{
    parameters: number[];
    covariance_matrix: number[][];
    total_observations: number;
    confidence: number;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('contextual_preference_patterns')
        .select('learned_preferences, confidence_level, interaction_count')
        .eq('user_id', userId)
        .eq('context_hash', contextHash)
        .single();

      if (error || !data) {
        // Return default parameters for new user-context combination
        const featureCount = 21; // Total features from contextToFeatureVector
        return {
          parameters: new Array(featureCount).fill(0),
          covariance_matrix: this.createIdentityMatrix(featureCount),
          total_observations: 0,
          confidence: 0.5
        };
      }

      const learnedPrefs = data.learned_preferences || {};
      const parameters = learnedPrefs.parameters || new Array(21).fill(0);
      const covarianceMatrix = learnedPrefs.covariance_matrix || this.createIdentityMatrix(21);

      return {
        parameters,
        covariance_matrix: covarianceMatrix,
        total_observations: data.interaction_count || 0,
        confidence: data.confidence_level || 0.5
      };

    } catch (error) {
      console.error('Failed to get learned parameters:', error);
      return {
        parameters: new Array(21).fill(0),
        covariance_matrix: this.createIdentityMatrix(21),
        total_observations: 0,
        confidence: 0.5
      };
    }
  }

  /**
   * Calculate action scores using LinUCB algorithm
   */
  private async calculateActionScores(
    actionSpace: ContextualActionSpace,
    contextFeatures: number[],
    learnedParams: any
  ): Promise<Array<{
    action_id: string;
    action_type: string;
    parameters: any;
    expected_reward: number;
    confidence: number;
    context_relevance: number;
    upper_confidence_bound: number;
    lower_confidence_bound: number;
    action_count: number;
  }>> {
    const allActions = [
      ...actionSpace.recommendation_algorithms.map(alg => ({ type: 'recommendation_generation', name: alg })),
      ...actionSpace.personalization_strategies.map(strat => ({ type: 'personalization_level', name: strat })),
      ...actionSpace.content_filters.map(filter => ({ type: 'content_filtering', name: filter })),
      ...actionSpace.ranking_approaches.map(rank => ({ type: 'ranking_adjustment', name: rank }))
    ];

    return allActions.map((action, index) => {
      // Calculate expected reward (theta^T * x)
      const expectedReward = this.dotProduct(learnedParams.parameters, contextFeatures);
      
      // Calculate confidence interval using covariance matrix
      const confidenceRadius = this.calculateConfidenceRadius(
        contextFeatures,
        learnedParams.covariance_matrix,
        this.config.exploration_parameter
      );

      const upperConfidenceBound = expectedReward + confidenceRadius;
      const lowerConfidenceBound = expectedReward - confidenceRadius;

      return {
        action_id: `${action.type}_${action.name}`,
        action_type: action.type,
        parameters: { algorithm: action.name },
        expected_reward: expectedReward,
        confidence: Math.min(1.0, Math.max(0.0, expectedReward)),
        context_relevance: this.calculateContextRelevance(action, contextFeatures),
        upper_confidence_bound: upperConfidenceBound,
        lower_confidence_bound: lowerConfidenceBound,
        action_count: Math.floor(Math.random() * 10) + 1 // Mock action count
      };
    });
  }

  /**
   * Calculate parameter update using LinUCB update rule
   */
  private calculateParameterUpdate(
    currentParams: any,
    contextFeatures: number[],
    observedReward: number,
    feedbackQuality: number
  ): {
    new_parameters: any;
    new_confidence: number;
    confidence_change: number;
    learning_impact: number;
    model_version: number;
  } {
    // Simplified LinUCB parameter update
    // In production, would use proper matrix operations
    
    const learningRate = this.config.learning_rate * feedbackQuality;
    const predictionError = observedReward - this.dotProduct(currentParams.parameters, contextFeatures);
    
    // Update parameters: theta = theta + alpha * (r - theta^T * x) * x
    const newParameters = currentParams.parameters.map((param: number, i: number) => 
      param + learningRate * predictionError * contextFeatures[i]
    );

    const confidenceChange = learningRate * Math.abs(predictionError);
    const newConfidence = Math.min(1.0, currentParams.confidence + confidenceChange);

    return {
      new_parameters: {
        parameters: newParameters,
        covariance_matrix: currentParams.covariance_matrix, // Simplified - would update in production
        last_updated: new Date().toISOString()
      },
      new_confidence: newConfidence,
      confidence_change: confidenceChange,
      learning_impact: Math.abs(predictionError),
      model_version: (currentParams.model_version || 0) + 1
    };
  }

  /**
   * Calculate confidence radius for LinUCB
   */
  private calculateConfidenceRadius(
    contextFeatures: number[],
    covarianceMatrix: number[][],
    alpha: number
  ): number {
    // Simplified confidence calculation
    // In production: sqrt(x^T * A^(-1) * x) * alpha
    const featureNorm = Math.sqrt(contextFeatures.reduce((sum, f) => sum + f * f, 0));
    return alpha * featureNorm;
  }

  /**
   * Calculate context relevance for action
   */
  private calculateContextRelevance(action: any, contextFeatures: number[]): number {
    // Simplified relevance calculation
    // Actions are more relevant for certain contexts
    let relevance = 0.5;

    if (action.type === 'recommendation_generation') {
      // Recommendation algorithms more relevant for engaged users
      relevance += contextFeatures[3] * 0.3; // High engagement boost
    }

    if (action.type === 'personalization_level') {
      // Personalization more relevant for users with preferences
      relevance += contextFeatures[4] * 0.4; // Preference confidence boost
    }

    return Math.min(1.0, relevance);
  }

  /**
   * Vector dot product utility
   */
  private dotProduct(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
  }

  /**
   * Create identity matrix
   */
  private createIdentityMatrix(size: number): number[][] {
    const matrix = [];
    for (let i = 0; i < size; i++) {
      matrix[i] = new Array(size).fill(0);
      matrix[i][i] = 1;
    }
    return matrix;
  }

  /**
   * Calculate exploration bonus
   */
  private calculateExplorationBonus(actionCount: number, totalObservations: number): number {
    if (totalObservations === 0) return this.config.exploration_parameter;
    
    // UCB-style exploration bonus
    return this.config.exploration_parameter * Math.sqrt(Math.log(totalObservations) / Math.max(actionCount, 1));
  }

  /**
   * Get fallback action when contextual selection fails
   */
  private getFallbackAction(actionSpace: ContextualActionSpace): any {
    return {
      selected_action: {
        action_id: 'fallback_hybrid',
        action_type: 'recommendation_generation',
        parameters: { algorithm: 'hybrid' },
        expected_reward: 0.5,
        confidence: 0.5,
        context_relevance: 0.5
      },
      context_features: new Array(21).fill(0.5),
      confidence_bounds: { lower: 0.3, upper: 0.7 },
      exploration_bonus: this.config.exploration_parameter,
      context_hash: 'fallback'
    };
  }
}

// Contextual Recommendation Engine
export class ContextualRecommendationEngine extends EventEmitter {
  private banditPolicy: ContextualBanditPolicy;
  private supabase: SupabaseClient;
  private actionSpace: ContextualActionSpace;

  constructor(supabase: SupabaseClient, config: any = {}) {
    super();
    this.supabase = supabase;
    this.banditPolicy = new ContextualBanditPolicy(supabase, config.bandit_policy);
    
    // Define action space for fragrance recommendations
    this.actionSpace = {
      recommendation_algorithms: [
        'content_based_similarity',
        'collaborative_filtering',
        'hybrid_ensemble',
        'trending_social_signals',
        'seasonal_contextual',
        'mood_based_matching'
      ],
      personalization_strategies: [
        'high_personalization',
        'medium_personalization',
        'exploration_focused',
        'conservative_safe'
      ],
      content_filters: [
        'sample_available_only',
        'price_range_filter',
        'brand_affinity_filter',
        'scent_family_filter'
      ],
      ranking_approaches: [
        'confidence_based_ranking',
        'diversity_optimized_ranking',
        'popularity_weighted_ranking',
        'novelty_balanced_ranking'
      ]
    };
  }

  /**
   * Generate contextually optimized recommendations
   */
  async generateContextualRecommendations(
    userId: string,
    requestContext: any = {},
    options: {
      max_recommendations: number;
      include_explanations: boolean;
      enable_real_time_adaptation: boolean;
    } = {
      max_recommendations: 10,
      include_explanations: true,
      enable_real_time_adaptation: true
    }
  ): Promise<{
    recommendations: any[];
    contextual_optimization: {
      selected_algorithm: string;
      personalization_level: string;
      context_confidence: number;
      exploration_applied: boolean;
    };
    context_metadata: {
      context_hash: string;
      feature_vector: number[];
      context_factors: any;
    };
    performance_metrics: {
      selection_time_ms: number;
      generation_time_ms: number;
      total_latency_ms: number;
    };
  }> {
    const startTime = Date.now();

    try {
      // Select optimal action using contextual bandit
      const actionSelection = await this.banditPolicy.selectContextualAction(
        userId,
        this.actionSpace,
        requestContext
      );

      const selectionTime = Date.now() - startTime;

      // Generate recommendations using selected algorithm
      const recommendations = await this.executeSelectedAction(
        userId,
        actionSelection.selected_action,
        options
      );

      const generationTime = Date.now() - startTime - selectionTime;

      // Emit contextual selection event for monitoring
      this.emit('contextual_selection', {
        user_id: userId,
        action: actionSelection.selected_action,
        context_hash: actionSelection.context_hash,
        confidence: actionSelection.selected_action.confidence
      });

      return {
        recommendations,
        contextual_optimization: {
          selected_algorithm: actionSelection.selected_action.parameters.algorithm,
          personalization_level: this.determinePersonalizationLevel(actionSelection.context_features),
          context_confidence: actionSelection.selected_action.confidence,
          exploration_applied: actionSelection.exploration_bonus > 0.05
        },
        context_metadata: {
          context_hash: actionSelection.context_hash,
          feature_vector: actionSelection.context_features,
          context_factors: requestContext
        },
        performance_metrics: {
          selection_time_ms: selectionTime,
          generation_time_ms: generationTime,
          total_latency_ms: Date.now() - startTime
        }
      };

    } catch (error) {
      console.error('Contextual recommendation generation failed:', error);
      
      // Fallback to standard recommendations
      return this.generateFallbackRecommendations(userId, options, Date.now() - startTime);
    }
  }

  /**
   * Process feedback and update contextual model
   */
  async processContextualFeedback(
    userId: string,
    feedback: {
      action_id: string;
      reward: number;
      feedback_quality: number;
      context_at_action: any;
      time_to_feedback_seconds: number;
    }
  ): Promise<{
    model_updated: boolean;
    learning_impact: number;
    adaptation_applied: boolean;
  }> {
    try {
      const contextualReward: ContextualReward = {
        action_id: feedback.action_id,
        user_id: userId,
        immediate_reward: feedback.reward,
        context_at_action: feedback.context_at_action,
        feedback_quality: feedback.feedback_quality,
        time_to_feedback_seconds: feedback.time_to_feedback_seconds
      };

      const updateResult = await this.banditPolicy.updatePolicy(userId, contextualReward);

      // Emit learning event
      this.emit('contextual_learning', {
        user_id: userId,
        learning_impact: updateResult.learning_impact,
        confidence_change: updateResult.confidence_change
      });

      return {
        model_updated: updateResult.parameters_updated,
        learning_impact: updateResult.learning_impact,
        adaptation_applied: updateResult.learning_impact > 0.1
      };

    } catch (error) {
      console.error('Contextual feedback processing failed:', error);
      return {
        model_updated: false,
        learning_impact: 0,
        adaptation_applied: false
      };
    }
  }

  /**
   * Execute selected action to generate recommendations
   */
  private async executeSelectedAction(
    userId: string,
    action: ContextualAction,
    options: any
  ): Promise<any[]> {
    // Mock implementation - would call specific recommendation algorithms
    const mockRecommendations = [
      {
        fragrance_id: 'contextual_rec_1',
        name: 'Contextually Optimized Fragrance 1',
        score: 0.92,
        algorithm_used: action.parameters.algorithm,
        context_relevance: action.context_relevance,
        explanation: `Selected using ${action.action_type} for optimal context matching`
      },
      {
        fragrance_id: 'contextual_rec_2',
        name: 'Contextually Optimized Fragrance 2',
        score: 0.87,
        algorithm_used: action.parameters.algorithm,
        context_relevance: action.context_relevance,
        explanation: `Chosen through contextual bandit optimization`
      }
    ];

    return mockRecommendations.slice(0, options.max_recommendations);
  }

  /**
   * Determine personalization level from context features
   */
  private determinePersonalizationLevel(contextFeatures: number[]): string {
    const userExpertise = contextFeatures[0] + contextFeatures[1]; // Expert + intermediate flags
    const preferenceConfidence = contextFeatures[4];
    
    if (userExpertise > 0 && preferenceConfidence > 0.7) {
      return 'high_personalization';
    } else if (preferenceConfidence > 0.4) {
      return 'medium_personalization';
    } else {
      return 'exploration_focused';
    }
  }

  /**
   * Generate fallback recommendations
   */
  private generateFallbackRecommendations(userId: string, options: any, processingTime: number): any {
    return {
      recommendations: [
        {
          fragrance_id: 'fallback_rec_1',
          name: 'Fallback Recommendation',
          score: 0.5,
          algorithm_used: 'fallback',
          explanation: 'Standard recommendation while contextual system recovers'
        }
      ],
      contextual_optimization: {
        selected_algorithm: 'fallback',
        personalization_level: 'medium_personalization',
        context_confidence: 0.5,
        exploration_applied: false
      },
      context_metadata: {
        context_hash: 'fallback',
        feature_vector: [],
        context_factors: {}
      },
      performance_metrics: {
        selection_time_ms: processingTime,
        generation_time_ms: 0,
        total_latency_ms: processingTime
      }
    };
  }
}

// Utility Functions and Factory
export function createContextualRecommendationEngine(supabase: SupabaseClient): ContextualRecommendationEngine {
  return new ContextualRecommendationEngine(supabase, {
    bandit_policy: {
      learning_rate: 0.1,
      exploration_parameter: 0.15,
      context_weight: 0.3,
      confidence_threshold: 0.7,
      enable_feature_selection: true
    }
  });
}

export { ContextualState, ContextualAction, ContextualReward, UserInteractionEvent };