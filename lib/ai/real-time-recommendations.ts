/**
 * Real-time Recommendation Updates Based on User Behavior
 * 
 * Dynamically updates recommendations as users interact with the platform,
 * learning from implicit feedback and behavioral patterns.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { UserActivity, ImplicitFeedback } from './user-activity-tracker';
import { AIClient } from './ai-client';
import { calculateCosineSimilarity, normalizeVector } from './ai-search';

// Types for real-time recommendations
export interface RealtimeRecommendation {
  id: string;
  fragrance_id: string;
  user_id: string;
  confidence_score: number;
  reasoning: string[];
  real_time_factors: RealtimeFactors;
  contextual_score?: number;
  freshness_score: number;
  created_at: number;
  expires_at: number;
  metadata: RecommendationMetadata;
}

export interface RealtimeFactors {
  recent_activity_boost: number;
  implicit_feedback_weight: number;
  behavioral_pattern_match: number;
  seasonal_relevance: number;
  time_of_day_relevance: number;
  similar_user_signal: number;
  trending_factor: number;
  diversity_factor: number;
}

export interface RecommendationMetadata {
  generated_by: 'real_time_engine' | 'hybrid_model' | 'collaborative_filter';
  trigger_events: string[];
  user_context: UserContext;
  fragrance_attributes: FragranceAttributes;
  explanation_components: ExplanationComponent[];
}

export interface UserContext {
  session_duration: number;
  pages_viewed: number;
  fragrances_viewed: number;
  recent_ratings: number[];
  current_mood_indicators: string[];
  time_context: TimeContext;
  device_context: DeviceContext;
  preference_signals: PreferenceSignal[];
}

export interface TimeContext {
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
  day_of_week: string;
  season: 'spring' | 'summer' | 'fall' | 'winter';
  is_weekend: boolean;
  timezone: string;
}

export interface DeviceContext {
  type: 'desktop' | 'mobile' | 'tablet';
  screen_size: string;
  is_touch_device: boolean;
  connection_speed: 'slow' | 'medium' | 'fast';
}

export interface PreferenceSignal {
  signal_type: 'scent_family' | 'brand' | 'price_range' | 'occasion' | 'season';
  value: string;
  confidence: number;
  recency: number;
  source: 'explicit' | 'implicit' | 'inferred';
}

export interface FragranceAttributes {
  scent_families: string[];
  dominant_notes: string[];
  occasions: string[];
  seasons: string[];
  longevity: string;
  sillage: string;
  price_tier: 'budget' | 'mid_range' | 'luxury';
  brand_prestige: number;
  popularity_score: number;
  uniqueness_score: number;
}

export interface ExplanationComponent {
  type: 'similarity' | 'trending' | 'seasonal' | 'mood_match' | 'discovery' | 'social_proof';
  message: string;
  confidence: number;
  data?: any;
}

export interface BehaviorPattern {
  pattern_id: string;
  pattern_type: 'viewing_sequence' | 'rating_trend' | 'time_preference' | 'seasonal_shift';
  description: string;
  confidence: number;
  detected_at: number;
  triggers: string[];
  implications: PatternImplication[];
}

export interface PatternImplication {
  type: 'preference_shift' | 'exploration_mode' | 'purchase_intent' | 'seasonal_transition';
  confidence: number;
  recommended_actions: string[];
}

/**
 * Real-time Recommendation Engine
 * Core engine that generates and updates recommendations based on user behavior
 */
export class RealtimeRecommendationEngine {
  private supabase: ReturnType<typeof createClient<Database>>;
  private aiClient: AIClient;
  private activeRecommendations: Map<string, RealtimeRecommendation[]> = new Map();
  private userContexts: Map<string, UserContext> = new Map();
  private behaviorPatterns: Map<string, BehaviorPattern[]> = new Map();
  private recommendationCache: Map<string, any> = new Map();

  // Configuration
  private config = {
    maxRecommendationsPerUser: 20,
    recommendationTTL: 3600000, // 1 hour
    minimumConfidenceThreshold: 0.3,
    diversityThreshold: 0.7,
    realtimeUpdateInterval: 30000, // 30 seconds
    behaviorPatternWindow: 86400000, // 24 hours
    contextualBoostFactor: 0.2,
    freshnessDecayRate: 0.1
  };

  constructor(
    supabaseUrl?: string,
    supabaseKey?: string,
    aiClient?: AIClient
  ) {
    this.supabase = createClient<Database>(
      supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    this.aiClient = aiClient || new AIClient();

    this.startRealtimeUpdates();
  }

  /**
   * Process user activity and update recommendations in real-time
   */
  async processActivityUpdate(activity: UserActivity): Promise<RealtimeRecommendation[]> {
    try {
      // Update user context
      await this.updateUserContext(activity);
      
      // Detect behavior patterns
      await this.detectBehaviorPatterns(activity);
      
      // Generate/update recommendations based on activity
      const recommendations = await this.generateRealtimeRecommendations(
        activity.user_id,
        activity
      );
      
      // Update active recommendations
      this.activeRecommendations.set(activity.user_id, recommendations);
      
      // Store recommendations for persistence
      await this.storeRecommendations(recommendations);
      
      return recommendations;
      
    } catch (error) {
      console.error('Failed to process activity update:', error);
      return [];
    }
  }

  /**
   * Update user context based on recent activity
   */
  private async updateUserContext(activity: UserActivity): Promise<void> {
    const userId = activity.user_id;
    let context = this.userContexts.get(userId) || this.createDefaultUserContext();

    // Update session metrics
    if (activity.activity_type === 'page_view') {
      context.pages_viewed++;
    } else if (activity.activity_type === 'fragrance_view') {
      context.fragrances_viewed++;
    } else if (activity.activity_type === 'fragrance_rating' && activity.data.rating) {
      context.recent_ratings.push(activity.data.rating);
      if (context.recent_ratings.length > 10) {
        context.recent_ratings = context.recent_ratings.slice(-10);
      }
    }

    // Update time context
    context.time_context = {
      time_of_day: this.getTimeOfDay(),
      day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      season: this.getCurrentSeason(),
      is_weekend: this.isWeekend(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    // Extract mood indicators from activity
    context.current_mood_indicators = this.extractMoodIndicators(activity);

    // Update preference signals
    await this.updatePreferenceSignals(context, activity);

    // Calculate session duration
    const sessionStart = this.getSessionStartTime(userId);
    context.session_duration = Date.now() - sessionStart;

    this.userContexts.set(userId, context);
  }

  private createDefaultUserContext(): UserContext {
    return {
      session_duration: 0,
      pages_viewed: 0,
      fragrances_viewed: 0,
      recent_ratings: [],
      current_mood_indicators: [],
      time_context: {
        time_of_day: this.getTimeOfDay(),
        day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        season: this.getCurrentSeason(),
        is_weekend: this.isWeekend(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      device_context: {
        type: 'desktop',
        screen_size: '1920x1080',
        is_touch_device: false,
        connection_speed: 'fast'
      },
      preference_signals: []
    };
  }

  private async updatePreferenceSignals(context: UserContext, activity: UserActivity): Promise<void> {
    const signals: PreferenceSignal[] = [];

    if (activity.fragrance_id && activity.data) {
      // Extract preference signals from fragrance interaction
      if (activity.data.scent_family) {
        signals.push({
          signal_type: 'scent_family',
          value: activity.data.scent_family,
          confidence: this.calculateSignalConfidence(activity),
          recency: 1.0,
          source: activity.activity_type === 'fragrance_rating' ? 'explicit' : 'implicit'
        });
      }

      if (activity.data.brand) {
        signals.push({
          signal_type: 'brand',
          value: activity.data.brand,
          confidence: this.calculateSignalConfidence(activity),
          recency: 1.0,
          source: activity.activity_type === 'fragrance_rating' ? 'explicit' : 'implicit'
        });
      }
    }

    // Merge new signals with existing ones
    context.preference_signals = this.mergePreferenceSignals(context.preference_signals, signals);
  }

  private calculateSignalConfidence(activity: UserActivity): number {
    const baseConfidence = {
      'fragrance_rating': 0.9,
      'collection_add': 0.8,
      'wishlist_add': 0.7,
      'fragrance_view': 0.3,
      'search_query': 0.4
    };

    let confidence = baseConfidence[activity.activity_type as keyof typeof baseConfidence] || 0.2;

    // Boost confidence based on engagement indicators
    if (activity.data.duration && activity.data.duration > 30000) {
      confidence += 0.1; // Long view time
    }

    if (activity.data.rating && activity.data.rating >= 4) {
      confidence += 0.2; // High rating
    }

    return Math.min(confidence, 1.0);
  }

  private mergePreferenceSignals(existing: PreferenceSignal[], newSignals: PreferenceSignal[]): PreferenceSignal[] {
    const merged = [...existing];

    for (const newSignal of newSignals) {
      const existingIndex = merged.findIndex(
        s => s.signal_type === newSignal.signal_type && s.value === newSignal.value
      );

      if (existingIndex >= 0) {
        // Update existing signal
        const existing = merged[existingIndex];
        merged[existingIndex] = {
          ...existing,
          confidence: Math.min((existing.confidence + newSignal.confidence) / 2, 1.0),
          recency: Math.max(existing.recency, newSignal.recency),
          source: newSignal.source === 'explicit' ? 'explicit' : existing.source
        };
      } else {
        // Add new signal
        merged.push(newSignal);
      }
    }

    // Decay older signals
    return merged
      .map(signal => ({
        ...signal,
        recency: signal.recency * 0.98 // Gradual decay
      }))
      .filter(signal => signal.recency > 0.1); // Remove very old signals
  }

  /**
   * Detect behavior patterns from user activity
   */
  private async detectBehaviorPatterns(activity: UserActivity): Promise<void> {
    const userId = activity.user_id;
    
    // Get recent activities for pattern detection
    const recentActivities = await this.getRecentUserActivities(userId);
    recentActivities.push(activity);

    const patterns: BehaviorPattern[] = [];

    // Detect viewing sequence patterns
    const viewingPattern = this.detectViewingSequencePattern(recentActivities);
    if (viewingPattern) patterns.push(viewingPattern);

    // Detect rating trend patterns
    const ratingPattern = this.detectRatingTrendPattern(recentActivities);
    if (ratingPattern) patterns.push(ratingPattern);

    // Detect time preference patterns
    const timePattern = this.detectTimePreferencePattern(recentActivities);
    if (timePattern) patterns.push(timePattern);

    // Detect seasonal shift patterns
    const seasonalPattern = this.detectSeasonalShiftPattern(recentActivities);
    if (seasonalPattern) patterns.push(seasonalPattern);

    if (patterns.length > 0) {
      this.behaviorPatterns.set(userId, patterns);
    }
  }

  private detectViewingSequencePattern(activities: UserActivity[]): BehaviorPattern | null {
    const viewActivities = activities.filter(a => a.activity_type === 'fragrance_view');
    if (viewActivities.length < 3) return null;

    // Analyze scent family sequences
    const scentFamilies = viewActivities
      .map(a => a.data.scent_family)
      .filter(Boolean)
      .slice(-5); // Last 5 views

    if (scentFamilies.length < 3) return null;

    // Check for consistent scent family preference
    const familyCounts = scentFamilies.reduce((acc, family) => {
      acc[family] = (acc[family] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantFamily = Object.entries(familyCounts)
      .sort(([,a], [,b]) => b - a)[0];

    if (dominantFamily[1] >= 3) {
      return {
        pattern_id: `viewing_sequence_${Date.now()}`,
        pattern_type: 'viewing_sequence',
        description: `Consistent interest in ${dominantFamily[0]} fragrances`,
        confidence: dominantFamily[1] / scentFamilies.length,
        detected_at: Date.now(),
        triggers: ['fragrance_view'],
        implications: [{
          type: 'preference_shift',
          confidence: 0.7,
          recommended_actions: [`Recommend more ${dominantFamily[0]} fragrances`]
        }]
      };
    }

    return null;
  }

  private detectRatingTrendPattern(activities: UserActivity[]): BehaviorPattern | null {
    const ratingActivities = activities
      .filter(a => a.activity_type === 'fragrance_rating' && a.data.rating)
      .slice(-5);

    if (ratingActivities.length < 3) return null;

    const ratings = ratingActivities.map(a => a.data.rating);
    const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;

    // Detect trend
    let trend = 'stable';
    if (avgRating > 4) trend = 'high_satisfaction';
    else if (avgRating < 3) trend = 'low_satisfaction';

    if (trend !== 'stable') {
      return {
        pattern_id: `rating_trend_${Date.now()}`,
        pattern_type: 'rating_trend',
        description: `${trend} in recent ratings (avg: ${avgRating.toFixed(1)})`,
        confidence: 0.8,
        detected_at: Date.now(),
        triggers: ['fragrance_rating'],
        implications: [{
          type: trend === 'high_satisfaction' ? 'exploration_mode' : 'preference_shift',
          confidence: 0.7,
          recommended_actions: trend === 'high_satisfaction' 
            ? ['Suggest similar high-quality fragrances']
            : ['Suggest different scent families']
        }]
      };
    }

    return null;
  }

  private detectTimePreferencePattern(activities: UserActivity[]): BehaviorPattern | null {
    // Simple time pattern detection - could be more sophisticated
    const timePreferences = activities
      .map(a => a.data.time_of_day)
      .filter(Boolean);

    const timeCounts = timePreferences.reduce((acc, time) => {
      acc[time] = (acc[time] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantTime = Object.entries(timeCounts)
      .sort(([,a], [,b]) => b - a)[0];

    if (dominantTime && dominantTime[1] >= 3) {
      return {
        pattern_id: `time_preference_${Date.now()}`,
        pattern_type: 'time_preference',
        description: `Prefers browsing during ${dominantTime[0]}`,
        confidence: 0.6,
        detected_at: Date.now(),
        triggers: ['page_view', 'fragrance_view'],
        implications: [{
          type: 'preference_shift',
          confidence: 0.5,
          recommended_actions: [`Optimize recommendations for ${dominantTime[0]} occasions`]
        }]
      };
    }

    return null;
  }

  private detectSeasonalShiftPattern(activities: UserActivity[]): BehaviorPattern | null {
    // This would analyze seasonal preferences - simplified for now
    return null;
  }

  /**
   * Generate real-time recommendations based on current context and behavior
   */
  private async generateRealtimeRecommendations(
    userId: string,
    triggerActivity: UserActivity
  ): Promise<RealtimeRecommendation[]> {
    try {
      const context = this.userContexts.get(userId);
      const behaviorPatterns = this.behaviorPatterns.get(userId) || [];

      // Get candidate fragrances
      const candidates = await this.getCandidateFragrances(userId, context, triggerActivity);

      // Score and rank candidates
      const scoredRecommendations = await Promise.all(
        candidates.map(fragrance => this.scoreFragranceForUser(
          fragrance,
          userId,
          context,
          behaviorPatterns,
          triggerActivity
        ))
      );

      // Filter and sort recommendations
      const recommendations = scoredRecommendations
        .filter(rec => rec.confidence_score >= this.config.minimumConfidenceThreshold)
        .sort((a, b) => b.confidence_score - a.confidence_score)
        .slice(0, this.config.maxRecommendationsPerUser);

      // Ensure diversity
      return this.ensureDiversity(recommendations);

    } catch (error) {
      console.error('Failed to generate realtime recommendations:', error);
      return [];
    }
  }

  private async getCandidateFragrances(
    userId: string,
    context?: UserContext,
    activity?: UserActivity
  ): Promise<any[]> {
    try {
      // Get fragrances that match current context and preferences
      const { data: fragrances, error } = await this.supabase
        .from('fragrances')
        .select(`
          *,
          embedding,
          fragrance_notes (
            note_type,
            notes!inner (
              name,
              category
            )
          )
        `)
        .limit(100);

      if (error) throw error;

      return fragrances || [];
    } catch (error) {
      console.error('Failed to get candidate fragrances:', error);
      return [];
    }
  }

  private async scoreFragranceForUser(
    fragrance: any,
    userId: string,
    context?: UserContext,
    patterns: BehaviorPattern[] = [],
    triggerActivity?: UserActivity
  ): Promise<RealtimeRecommendation> {
    const factors: RealtimeFactors = {
      recent_activity_boost: 0,
      implicit_feedback_weight: 0,
      behavioral_pattern_match: 0,
      seasonal_relevance: 0,
      time_of_day_relevance: 0,
      similar_user_signal: 0,
      trending_factor: 0,
      diversity_factor: 0
    };

    const reasoning: string[] = [];
    
    // Calculate recent activity boost
    if (triggerActivity && this.isRelevantToActivity(fragrance, triggerActivity)) {
      factors.recent_activity_boost = 0.3;
      reasoning.push('Matches your recent browsing activity');
    }

    // Calculate behavioral pattern match
    for (const pattern of patterns) {
      const patternMatch = this.calculatePatternMatch(fragrance, pattern);
      factors.behavioral_pattern_match = Math.max(factors.behavioral_pattern_match, patternMatch);
      if (patternMatch > 0.5) {
        reasoning.push(`Fits your ${pattern.description.toLowerCase()}`);
      }
    }

    // Calculate seasonal relevance
    if (context) {
      factors.seasonal_relevance = this.calculateSeasonalRelevance(fragrance, context.time_context.season);
      factors.time_of_day_relevance = this.calculateTimeRelevance(fragrance, context.time_context.time_of_day);
      
      if (factors.seasonal_relevance > 0.7) {
        reasoning.push(`Perfect for ${context.time_context.season}`);
      }
    }

    // Calculate implicit feedback weight
    factors.implicit_feedback_weight = await this.getImplicitFeedbackScore(userId, fragrance.id);
    
    // Calculate trending factor
    factors.trending_factor = this.calculateTrendingScore(fragrance);

    // Calculate overall confidence score
    const confidenceScore = this.calculateOverallConfidence(factors);

    // Generate explanation components
    const explanationComponents = this.generateExplanationComponents(factors, reasoning);

    return {
      id: `rec_${userId}_${fragrance.id}_${Date.now()}`,
      fragrance_id: fragrance.id,
      user_id: userId,
      confidence_score: confidenceScore,
      reasoning,
      real_time_factors: factors,
      freshness_score: 1.0, // New recommendation
      created_at: Date.now(),
      expires_at: Date.now() + this.config.recommendationTTL,
      metadata: {
        generated_by: 'real_time_engine',
        trigger_events: triggerActivity ? [triggerActivity.activity_type] : [],
        user_context: context || this.createDefaultUserContext(),
        fragrance_attributes: this.extractFragranceAttributes(fragrance),
        explanation_components: explanationComponents
      }
    };
  }

  private isRelevantToActivity(fragrance: any, activity: UserActivity): boolean {
    // Check if fragrance is relevant to the trigger activity
    if (activity.activity_type === 'search_query' && activity.data.query) {
      const query = activity.data.query.toLowerCase();
      const fragranceName = fragrance.name.toLowerCase();
      const brandName = fragrance.brand?.toLowerCase() || '';
      
      return fragranceName.includes(query) || brandName.includes(query);
    }

    if (activity.fragrance_id && activity.data.scent_family) {
      return fragrance.scent_family?.includes(activity.data.scent_family);
    }

    return false;
  }

  private calculatePatternMatch(fragrance: any, pattern: BehaviorPattern): number {
    // Simplified pattern matching - would be more sophisticated in practice
    if (pattern.pattern_type === 'viewing_sequence' && pattern.description.includes('fragrances')) {
      const familyMatch = pattern.description.match(/(\w+) fragrances/);
      if (familyMatch && fragrance.scent_family?.includes(familyMatch[1])) {
        return pattern.confidence;
      }
    }

    return 0;
  }

  private calculateSeasonalRelevance(fragrance: any, season: string): number {
    const seasonalMap: Record<string, string[]> = {
      spring: ['fresh', 'floral', 'green'],
      summer: ['fresh', 'citrus', 'aquatic', 'light'],
      fall: ['warm', 'spicy', 'woody', 'amber'],
      winter: ['oriental', 'woody', 'warm', 'heavy']
    };

    const seasonalNotes = seasonalMap[season] || [];
    const fragranceNotes = fragrance.notes?.map((n: any) => n.name.toLowerCase()) || [];
    
    const matches = seasonalNotes.filter(note => 
      fragranceNotes.some(fn => fn.includes(note))
    );

    return matches.length / seasonalNotes.length;
  }

  private calculateTimeRelevance(fragrance: any, timeOfDay: string): number {
    const timeMap: Record<string, string[]> = {
      morning: ['fresh', 'light', 'citrus', 'green'],
      afternoon: ['versatile', 'moderate', 'floral'],
      evening: ['warm', 'oriental', 'woody', 'spicy'],
      night: ['heavy', 'sensual', 'amber', 'musk']
    };

    const timeNotes = timeMap[timeOfDay] || [];
    const fragranceNotes = fragrance.notes?.map((n: any) => n.name.toLowerCase()) || [];
    
    const matches = timeNotes.filter(note => 
      fragranceNotes.some(fn => fn.includes(note))
    );

    return matches.length / timeNotes.length;
  }

  private async getImplicitFeedbackScore(userId: string, fragranceId: string): Promise<number> {
    try {
      const { data: feedback, error } = await this.supabase
        .from('implicit_feedback')
        .select('*')
        .eq('user_id', userId)
        .eq('fragrance_id', fragranceId)
        .single();

      if (error || !feedback) return 0;

      return feedback.feedback_type === 'positive' ? feedback.confidence : 
             feedback.feedback_type === 'negative' ? -feedback.confidence : 0;
    } catch (error) {
      return 0;
    }
  }

  private calculateTrendingScore(fragrance: any): number {
    // Simplified trending calculation - would use real analytics
    return Math.random() * 0.3; // 0-0.3 range for trending boost
  }

  private calculateOverallConfidence(factors: RealtimeFactors): number {
    const weights = {
      recent_activity_boost: 0.25,
      implicit_feedback_weight: 0.20,
      behavioral_pattern_match: 0.20,
      seasonal_relevance: 0.15,
      time_of_day_relevance: 0.10,
      similar_user_signal: 0.05,
      trending_factor: 0.03,
      diversity_factor: 0.02
    };

    let score = 0;
    for (const [factor, value] of Object.entries(factors)) {
      const weight = weights[factor as keyof typeof weights] || 0;
      score += value * weight;
    }

    return Math.min(Math.max(score, 0), 1);
  }

  private generateExplanationComponents(factors: RealtimeFactors, reasoning: string[]): ExplanationComponent[] {
    const components: ExplanationComponent[] = [];

    if (factors.recent_activity_boost > 0.2) {
      components.push({
        type: 'similarity',
        message: 'Based on what you\'re currently viewing',
        confidence: factors.recent_activity_boost
      });
    }

    if (factors.seasonal_relevance > 0.6) {
      components.push({
        type: 'seasonal',
        message: 'Perfect for the current season',
        confidence: factors.seasonal_relevance
      });
    }

    if (factors.behavioral_pattern_match > 0.5) {
      components.push({
        type: 'mood_match',
        message: 'Matches your recent preferences',
        confidence: factors.behavioral_pattern_match
      });
    }

    if (factors.trending_factor > 0.2) {
      components.push({
        type: 'trending',
        message: 'Popular right now',
        confidence: factors.trending_factor
      });
    }

    return components;
  }

  private extractFragranceAttributes(fragrance: any): FragranceAttributes {
    return {
      scent_families: fragrance.scent_family || [],
      dominant_notes: fragrance.notes?.slice(0, 3).map((n: any) => n.name) || [],
      occasions: fragrance.occasions || [],
      seasons: fragrance.seasons || [],
      longevity: fragrance.longevity || 'moderate',
      sillage: fragrance.sillage || 'moderate',
      price_tier: this.categorizePriceTier(fragrance.price),
      brand_prestige: this.calculateBrandPrestige(fragrance.brand),
      popularity_score: fragrance.popularity_score || 0,
      uniqueness_score: fragrance.uniqueness_score || 0
    };
  }

  private categorizePriceTier(price?: number): 'budget' | 'mid_range' | 'luxury' {
    if (!price) return 'mid_range';
    if (price < 50) return 'budget';
    if (price < 150) return 'mid_range';
    return 'luxury';
  }

  private calculateBrandPrestige(brand?: string): number {
    // Simplified brand prestige calculation
    const prestigeBrands = ['Creed', 'Tom Ford', 'Maison Margiela', 'By Kilian'];
    return prestigeBrands.includes(brand || '') ? 0.9 : 0.5;
  }

  private ensureDiversity(recommendations: RealtimeRecommendation[]): RealtimeRecommendation[] {
    // Simple diversity algorithm - ensure variety in scent families
    const diverse: RealtimeRecommendation[] = [];
    const usedFamilies = new Set();

    for (const rec of recommendations) {
      const families = rec.metadata.fragrance_attributes.scent_families;
      const isNovel = families.some(family => !usedFamilies.has(family));
      
      if (isNovel || diverse.length < 5) {
        diverse.push(rec);
        families.forEach(family => usedFamilies.add(family));
      }
      
      if (diverse.length >= this.config.maxRecommendationsPerUser) break;
    }

    return diverse;
  }

  private async storeRecommendations(recommendations: RealtimeRecommendation[]): Promise<void> {
    try {
      const recommendationData = recommendations.map(rec => ({
        id: rec.id,
        user_id: rec.user_id,
        fragrance_id: rec.fragrance_id,
        confidence_score: rec.confidence_score,
        reasoning: rec.reasoning,
        real_time_factors: rec.real_time_factors,
        created_at: new Date(rec.created_at).toISOString(),
        expires_at: new Date(rec.expires_at).toISOString(),
        metadata: rec.metadata
      }));

      const { error } = await this.supabase
        .from('realtime_recommendations')
        .upsert(recommendationData);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to store recommendations:', error);
    }
  }

  // Utility methods
  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    if (hour < 22) return 'evening';
    return 'night';
  }

  private getCurrentSeason(): 'spring' | 'summer' | 'fall' | 'winter' {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private isWeekend(): boolean {
    const day = new Date().getDay();
    return day === 0 || day === 6;
  }

  private getSessionStartTime(userId: string): number {
    // Simplified - would track actual session start times
    return Date.now() - 600000; // Assume 10 minutes ago
  }

  private extractMoodIndicators(activity: UserActivity): string[] {
    // Extract mood indicators from activity data
    const indicators: string[] = [];
    
    if (activity.data.query) {
      const query = activity.data.query.toLowerCase();
      if (query.includes('romantic')) indicators.push('romantic');
      if (query.includes('fresh')) indicators.push('energetic');
      if (query.includes('warm')) indicators.push('cozy');
    }

    return indicators;
  }

  private async getRecentUserActivities(userId: string): Promise<UserActivity[]> {
    try {
      const { data: activities, error } = await this.supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', Date.now() - this.config.behaviorPatternWindow)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      return activities || [];
    } catch (error) {
      console.error('Failed to get recent user activities:', error);
      return [];
    }
  }

  private startRealtimeUpdates(): void {
    setInterval(() => {
      this.cleanupExpiredRecommendations();
      this.decayRecommendationFreshness();
    }, this.config.realtimeUpdateInterval);
  }

  private cleanupExpiredRecommendations(): void {
    const now = Date.now();
    for (const [userId, recommendations] of this.activeRecommendations) {
      const active = recommendations.filter(rec => rec.expires_at > now);
      if (active.length !== recommendations.length) {
        this.activeRecommendations.set(userId, active);
      }
    }
  }

  private decayRecommendationFreshness(): void {
    for (const [userId, recommendations] of this.activeRecommendations) {
      const updated = recommendations.map(rec => ({
        ...rec,
        freshness_score: Math.max(
          rec.freshness_score - this.config.freshnessDecayRate,
          0
        )
      }));
      this.activeRecommendations.set(userId, updated);
    }
  }

  // Public API
  async getRecommendationsForUser(userId: string): Promise<RealtimeRecommendation[]> {
    return this.activeRecommendations.get(userId) || [];
  }

  async invalidateUserRecommendations(userId: string): Promise<void> {
    this.activeRecommendations.delete(userId);
    this.userContexts.delete(userId);
    this.behaviorPatterns.delete(userId);
  }

  async getUserBehaviorPatterns(userId: string): Promise<BehaviorPattern[]> {
    return this.behaviorPatterns.get(userId) || [];
  }
}

// Export factory function
export const createRealtimeRecommendationEngine = (
  supabaseUrl?: string,
  supabaseKey?: string,
  aiClient?: AIClient
) => {
  return new RealtimeRecommendationEngine(supabaseUrl, supabaseKey, aiClient);
};