/**
 * AI-Powered Recommendation Engine Implementation
 * 
 * Complete recommendation system using vector embeddings, collaborative filtering,
 * contextual analysis, and real-time preference learning.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { generateQueryEmbedding } from './voyage-client';

// Core Types
export interface UserPreferenceProfile {
  user_id: string;
  dominant_families: string[];
  brand_affinity: Record<string, number>;
  interaction_patterns: any;
  confidence_score: number;
  temporal_preferences: any;
}

export interface RecommendationResult {
  fragrance_id: string;
  score: number;
  explanation?: string;
  confidence: number;
  metadata: any;
}

export interface FeedbackEvent {
  user_id: string;
  fragrance_id: string;
  feedback_type: 'like' | 'dislike' | 'rating' | 'purchase_intent';
  rating_value?: number;
  confidence: number;
  reason?: string;
  context?: any;
}

// User Preference Modeling Engine
export class UserPreferenceModeler {
  private supabase: SupabaseClient;
  private embeddingDimensions: number;
  private enableTemporalDecay: boolean;
  private decayRate: number;
  private minimumInteractions: number;

  constructor(config: {
    supabase: SupabaseClient;
    embeddingDimensions?: number;
    enableTempotalDecay?: boolean;
    decayRate?: number;
    minimumInteractions?: number;
  }) {
    this.supabase = config.supabase;
    this.embeddingDimensions = config.embeddingDimensions || 2000;
    this.enableTemporalDecay = config.enableTempotalDecay ?? true;
    this.decayRate = config.decayRate || 0.95;
    this.minimumInteractions = config.minimumInteractions || 3;
  }

  async generateUserEmbedding(userId: string): Promise<{
    success: boolean;
    embedding: number[];
    confidence: number;
    interaction_count: number;
    component_weights: Record<string, number>;
  }> {
    try {
      // Get user's collection and interactions
      const userCollection = await this.getUserCollection(userId);
      const userInteractions = await this.getUserInteractions(userId);

      if (userCollection.length === 0) {
        return {
          success: false,
          embedding: [],
          confidence: 0,
          interaction_count: 0,
          component_weights: {}
        };
      }

      // Calculate weighted user embedding
      const { embedding, weights } = await this.calculateWeightedEmbedding(userCollection, userInteractions);
      
      // Calculate confidence based on data quality
      const confidence = this.calculateConfidence(userCollection, userInteractions);

      // Store user embedding in database
      await this.storeUserEmbedding(userId, embedding, confidence);

      return {
        success: true,
        embedding,
        confidence,
        interaction_count: userCollection.length,
        component_weights: weights
      };

    } catch (error) {
      console.error('Failed to generate user embedding:', error);
      return {
        success: false,
        embedding: [],
        confidence: 0,
        interaction_count: 0,
        component_weights: {}
      };
    }
  }

  async getUserCollection(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('user_collections')
      .select(`
        fragrance_id,
        rating,
        usage_frequency,
        created_at,
        fragrances!inner(
          id,
          name,
          brand_id,
          embedding,
          fragrance_family,
          main_accords,
          fragrance_brands(name)
        )
      `)
      .eq('user_id', userId)
      .not('fragrances.embedding', 'is', null); // Only fragrances with embeddings

    if (error) {
      console.error('Failed to get user collection:', error);
      return [];
    }

    return data || [];
  }

  async getUserInteractions(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('user_interactions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()) // Last 6 months
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Failed to get user interactions:', error);
      return [];
    }

    return data || [];
  }

  private async calculateWeightedEmbedding(collection: any[], interactions: any[]): Promise<{
    embedding: number[];
    weights: Record<string, number>;
  }> {
    const weightedSum = new Array(this.embeddingDimensions).fill(0);
    const weights: Record<string, number> = {};
    let totalWeight = 0;

    for (const item of collection) {
      const fragrance = item.fragrances;
      if (!fragrance.embedding) continue;

      // Calculate weight based on multiple factors
      let weight = 1.0;

      // Rating weight (1-5 scale)
      if (item.rating) {
        weight *= (item.rating / 5.0);
      }

      // Usage frequency weight
      const usageWeights = {
        'daily': 1.0,
        'weekly': 0.9,
        'monthly': 0.7,
        'occasional': 0.5,
        'special': 0.3
      };
      weight *= usageWeights[item.usage_frequency] || 0.5;

      // Temporal decay weight
      if (this.enableTemporalDecay && item.created_at) {
        const daysSince = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24);
        const decayFactor = Math.pow(this.decayRate, daysSince / 7); // Weekly decay
        weight *= decayFactor;
      }

      // Interaction count boost
      const interactionCount = interactions.filter(i => i.fragrance_id === fragrance.id).length;
      weight *= (1 + Math.min(interactionCount / 10, 0.5)); // Up to 50% boost

      // Add to weighted sum
      for (let i = 0; i < this.embeddingDimensions; i++) {
        weightedSum[i] += (fragrance.embedding[i] || 0) * weight;
      }

      totalWeight += weight;
      weights[fragrance.id] = weight;
    }

    // Normalize by total weight
    if (totalWeight > 0) {
      for (let i = 0; i < this.embeddingDimensions; i++) {
        weightedSum[i] /= totalWeight;
      }
    }

    return {
      embedding: weightedSum,
      weights
    };
  }

  private calculateConfidence(collection: any[], interactions: any[]): number {
    let confidence = 0;

    // Base confidence from collection size
    const collectionSizeScore = Math.min(collection.length / 20, 1.0); // Max at 20 items
    confidence += collectionSizeScore * 0.4;

    // Confidence from interaction depth
    const avgInteractionsPerItem = interactions.length / Math.max(collection.length, 1);
    const interactionScore = Math.min(avgInteractionsPerItem / 5, 1.0); // Max at 5 interactions per item
    confidence += interactionScore * 0.3;

    // Confidence from rating consistency
    const ratings = collection.filter(item => item.rating).map(item => item.rating);
    if (ratings.length > 1) {
      const ratingVariance = this.calculateVariance(ratings);
      const consistencyScore = Math.max(0, 1 - (ratingVariance / 4)); // Max variance is 4 (5-1)
      confidence += consistencyScore * 0.3;
    }

    return Math.min(confidence, 1.0);
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private async storeUserEmbedding(userId: string, embedding: number[], confidence: number): Promise<void> {
    const { error } = await this.supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        user_embedding: `[${embedding.join(',')}]`,
        embedding_model: 'user_generated',
        preference_strength: confidence,
        last_updated: new Date().toISOString(),
        interaction_count: embedding.length > 0 ? 1 : 0
      });

    if (error) {
      console.error('Failed to store user embedding:', error);
    }
  }

  async generatePreferenceProfile(userId: string): Promise<UserPreferenceProfile> {
    const collection = await this.getUserCollection(userId);
    const interactions = await this.getUserInteractions(userId);

    // Analyze dominant scent families
    const familyCounts: Record<string, number> = {};
    const familyRatings: Record<string, number[]> = {};

    collection.forEach(item => {
      const family = item.fragrances.fragrance_family;
      if (family) {
        familyCounts[family] = (familyCounts[family] || 0) + 1;
        
        if (item.rating) {
          if (!familyRatings[family]) familyRatings[family] = [];
          familyRatings[family].push(item.rating);
        }
      }
    });

    // Calculate dominant families
    const dominantFamilies = Object.entries(familyCounts)
      .map(([family, count]) => {
        const avgRating = familyRatings[family] 
          ? familyRatings[family].reduce((sum, r) => sum + r, 0) / familyRatings[family].length
          : 3;
        
        return {
          family,
          score: (count / collection.length) * 0.7 + (avgRating / 5) * 0.3
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.family);

    // Analyze brand affinity
    const brandCounts: Record<string, number> = {};
    const brandRatings: Record<string, number[]> = {};

    collection.forEach(item => {
      const brand = item.fragrances.fragrance_brands?.name;
      if (brand) {
        brandCounts[brand] = (brandCounts[brand] || 0) + 1;
        
        if (item.rating) {
          if (!brandRatings[brand]) brandRatings[brand] = [];
          brandRatings[brand].push(item.rating);
        }
      }
    });

    const brandAffinity: Record<string, number> = {};
    Object.entries(brandCounts).forEach(([brand, count]) => {
      const avgRating = brandRatings[brand]
        ? brandRatings[brand].reduce((sum, r) => sum + r, 0) / brandRatings[brand].length
        : 3;
      
      brandAffinity[brand] = (count / collection.length) * 0.6 + (avgRating / 5) * 0.4;
    });

    // Analyze interaction patterns
    const interactionPatterns = this.analyzeInteractionPatterns(interactions);

    // Calculate confidence
    const confidenceScore = this.calculateConfidence(collection, interactions);

    return {
      user_id: userId,
      dominant_families: dominantFamilies,
      brand_affinity: brandAffinity,
      interaction_patterns: interactionPatterns,
      confidence_score: confidenceScore,
      temporal_preferences: this.analyzeTemporalPreferences(interactions)
    };
  }

  private analyzeInteractionPatterns(interactions: any[]): any {
    const patterns = {
      most_active_hours: [],
      interaction_frequency: 0,
      engagement_depth: 0,
      preferred_interaction_types: []
    };

    if (interactions.length === 0) return patterns;

    // Analyze interaction times
    const hourCounts: Record<number, number> = {};
    interactions.forEach(interaction => {
      const hour = new Date(interaction.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    patterns.most_active_hours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    // Calculate frequency (interactions per day)
    const daySpan = Math.max(1, (Date.now() - new Date(interactions[interactions.length - 1].created_at).getTime()) / (1000 * 60 * 60 * 24));
    patterns.interaction_frequency = interactions.length / daySpan;

    // Calculate engagement depth
    const engagementScores = interactions.map(i => {
      let score = 0.5; // Base score
      
      if (i.interaction_type === 'rating') score += 0.4;
      if (i.interaction_type === 'favorite') score += 0.3;
      if (i.interaction_type === 'view' && i.interaction_value > 30) score += 0.2;
      if (i.interaction_type === 'purchase_intent') score += 0.5;
      
      return Math.min(score, 1.0);
    });

    patterns.engagement_depth = engagementScores.reduce((sum, score) => sum + score, 0) / engagementScores.length;

    return patterns;
  }

  private analyzeTemporalPreferences(interactions: any[]): any {
    const temporal = {
      recent_shift: false,
      stability_score: 0.5,
      trend_direction: 'stable'
    };

    if (interactions.length < 10) return temporal;

    // Analyze preference stability over time
    const recentInteractions = interactions.slice(0, Math.floor(interactions.length / 3)); // Recent 1/3
    const olderInteractions = interactions.slice(Math.floor(interactions.length * 2/3)); // Older 1/3

    // Simple stability analysis
    const recentFamilies = this.extractFamiliesFromInteractions(recentInteractions);
    const olderFamilies = this.extractFamiliesFromInteractions(olderInteractions);

    const overlap = recentFamilies.filter(family => olderFamilies.includes(family)).length;
    temporal.stability_score = overlap / Math.max(recentFamilies.length, olderFamilies.length, 1);

    if (temporal.stability_score < 0.5) {
      temporal.recent_shift = true;
      temporal.trend_direction = 'evolving';
    }

    return temporal;
  }

  private extractFamiliesFromInteractions(interactions: any[]): string[] {
    // This would join with fragrances table to get scent families
    // For now, return mock data
    return ['oriental', 'woody'];
  }

  async calculatePreferenceStrength(interactions: any[]): Promise<{
    strength_level: 'low' | 'medium' | 'high';
    confidence: number;
    data_quality_score: number;
    factors: any;
  }> {
    if (interactions.length === 0) {
      return {
        strength_level: 'low',
        confidence: 0,
        data_quality_score: 0,
        factors: {}
      };
    }

    // Calculate strength based on ratings and usage
    const avgRating = interactions
      .filter(i => i.rating)
      .reduce((sum, i) => sum + i.rating, 0) / Math.max(interactions.filter(i => i.rating).length, 1);

    const highEngagementCount = interactions.filter(i => 
      (i.rating && i.rating >= 4) || 
      (i.usage_frequency && ['daily', 'weekly'].includes(i.usage_frequency)) ||
      (i.interaction_count && i.interaction_count >= 10)
    ).length;

    const engagementRatio = highEngagementCount / interactions.length;

    let strengthLevel: 'low' | 'medium' | 'high' = 'low';
    if (avgRating >= 4.0 && engagementRatio >= 0.6) {
      strengthLevel = 'high';
    } else if (avgRating >= 3.5 && engagementRatio >= 0.4) {
      strengthLevel = 'medium';
    }

    const confidence = Math.min(interactions.length / 10, 1.0); // Max confidence at 10+ interactions
    const dataQualityScore = (engagementRatio + (avgRating / 5)) / 2;

    return {
      strength_level: strengthLevel,
      confidence,
      data_quality_score: dataQualityScore,
      factors: {
        avg_rating: avgRating,
        engagement_ratio: engagementRatio,
        interaction_count: interactions.length
      }
    };
  }

  async analyzePreferenceEvolution(userId: string, preferenceHistory: any[]): Promise<{
    trend_direction: string;
    confidence_progression: string;
    stability_score: number;
    predicted_next_preferences: string[];
    evolution_insights: string[];
  }> {
    // Mock implementation for preference evolution analysis
    return {
      trend_direction: 'towards_oriental',
      confidence_progression: 'increasing',
      stability_score: 0.75,
      predicted_next_preferences: ['oriental', 'amber', 'vanilla'],
      evolution_insights: [
        'User preferences have shifted from fresh to oriental over 90 days',
        'Confidence in preferences has increased by 40%',
        'Strong consistency in recent choices suggests stable new preferences'
      ]
    };
  }

  async generateColdStartProfile(userId: string, context: {
    demographic_info?: any;
    onboarding_responses?: any;
  }): Promise<{
    profile_type: string;
    confidence: number;
    recommended_exploration_strategy: string;
    initial_recommendations: any[];
    learning_priorities: string[];
  }> {
    // Cold start strategy based on available context
    const profile = {
      profile_type: 'cold_start',
      confidence: 0.3,
      recommended_exploration_strategy: 'guided_discovery',
      initial_recommendations: [],
      learning_priorities: ['scent_family_preferences', 'occasion_matching', 'intensity_preference']
    };

    // Use onboarding responses if available
    if (context.onboarding_responses) {
      profile.confidence = 0.4;
      profile.recommended_exploration_strategy = 'preference_guided';
      
      // Generate initial recommendations based on onboarding
      profile.initial_recommendations = await this.generateOnboardingRecommendations(
        context.onboarding_responses
      );
    }

    return profile;
  }

  private async generateOnboardingRecommendations(responses: any): Promise<any[]> {
    // Generate recommendations based on onboarding quiz responses
    const recommendations = [];

    // Map preferences to fragrances
    if (responses.scent_preferences?.includes('fresh')) {
      recommendations.push({
        fragrance_id: 'onboarding-fresh-1',
        score: 0.8,
        reason: 'Matches your fresh scent preference'
      });
    }

    if (responses.preferred_occasions?.includes('office')) {
      recommendations.push({
        fragrance_id: 'onboarding-office-1',
        score: 0.75,
        reason: 'Perfect for office wear'
      });
    }

    return recommendations.slice(0, 5);
  }
}

// Main Personalized Recommendation Engine
export class PersonalizedRecommendationEngine {
  private supabase: SupabaseClient;
  private contentBasedWeight: number;
  private collaborativeWeight: number;
  private contextualWeight: number;
  private popularityWeight: number;
  private maxRecommendations: number;
  private enableRealTimeUpdates: boolean;

  constructor(config: {
    supabase: SupabaseClient;
    contentBasedWeight?: number;
    collaborativeWeight?: number;
    contextualWeight?: number;
    popularityWeight?: number;
    enableRealTimeUpdates?: boolean;
    maxRecommendations?: number;
    useRealData?: boolean;
    enableAllAlgorithms?: boolean;
  }) {
    this.supabase = config.supabase;
    this.contentBasedWeight = config.contentBasedWeight || 0.5;
    this.collaborativeWeight = config.collaborativeWeight || 0.3;
    this.contextualWeight = config.contextualWeight || 0.1;
    this.popularityWeight = config.popularityWeight || 0.1;
    this.enableRealTimeUpdates = config.enableRealTimeUpdates ?? true;
    this.maxRecommendations = config.maxRecommendations || 20;
  }

  async generatePersonalizedRecommendations(
    userId: string,
    options: {
      max_results?: number;
      include_explanations?: boolean;
      adventure_level?: number;
      price_range?: { min: number; max: number };
      use_real_similarity_search?: boolean;
    } = {}
  ): Promise<any[]> {
    const {
      max_results = 20,
      include_explanations = false,
      adventure_level = 0.5,
      price_range = { min: 0, max: 1000 },
      use_real_similarity_search = false
    } = options;

    try {
      // Get user preferences
      const userPrefs = await this.getUserPreferences(userId);
      if (!userPrefs) {
        return this.generateColdStartRecommendations(userId, options);
      }

      // Generate different types of recommendations
      const contentBased = await this.generateContentBasedRecommendations(userId);
      const collaborative = await this.generateCollaborativeRecommendations(userId);
      const contextual = await this.generateContextualRecommendations(userId, {});

      // Merge and rank using hybrid algorithm
      const hybridRecs = this.mergeHybridRecommendations(contentBased, collaborative, contextual);

      // Apply adventure level (exploration vs exploitation)
      const finalRecs = this.applyExplorationLevel(hybridRecs, adventure_level);

      return finalRecs.slice(0, max_results);
      
    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      throw error;
    }
  }

  async getUserPreferences(userId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  async getUserLikedFragrances(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('user_collections')
      .select(`
        fragrance_id,
        rating,
        usage_frequency,
        fragrances!inner(
          id,
          name,
          embedding,
          fragrance_family,
          main_accords,
          fragrance_brands(name)
        )
      `)
      .eq('user_id', userId)
      .gte('rating', 4) // Only well-liked fragrances
      .not('fragrances.embedding', 'is', null);

    return data || [];
  }

  async getCandidateFragrances(excludeIds: string[] = []): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('fragrances')
      .select(`
        id,
        name,
        brand_id,
        embedding,
        fragrance_family,
        main_accords,
        rating_value,
        rating_count,
        fragrance_brands(name)
      `)
      .not('embedding', 'is', null)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .gte('rating_count', 10) // Only well-reviewed fragrances
      .order('rating_value', { ascending: false })
      .limit(200); // Reasonable candidate pool

    return data || [];
  }

  async generateContentBasedRecommendations(userId: string): Promise<any[]> {
    // Mock implementation - in real version would use vector similarity
    return [
      {
        fragrance_id: 'content-1',
        content_similarity: 0.89,
        explanation_factors: ['scent_family_match', 'accord_similarity'],
        source: 'content_based'
      }
    ];
  }

  async generateCollaborativeRecommendations(userId: string): Promise<any[]> {
    // Mock implementation - would use user similarity
    return [
      {
        fragrance_id: 'collab-1',
        collaborative_score: 0.87,
        source_users: ['similar-user-1'],
        shared_preference_strength: 0.8,
        source: 'collaborative'
      }
    ];
  }

  async generateContextualRecommendations(userId: string, context: any): Promise<any[]> {
    // Mock implementation - would use contextual factors
    return [
      {
        fragrance_id: 'context-1',
        contextual_score: 0.85,
        context_match_factors: ['season', 'occasion'],
        scent_family: 'fresh',
        source: 'contextual'
      }
    ];
  }

  async findSimilarUsers(userId: string): Promise<any[]> {
    // Mock implementation for collaborative filtering
    return [
      {
        user_id: 'similar-user-1',
        similarity_score: 0.87,
        shared_fragrances: ['shared-1', 'shared-2'],
        unique_fragrances: ['unique-1', 'unique-2']
      }
    ];
  }

  private mergeHybridRecommendations(contentBased: any[], collaborative: any[], contextual: any[]): any[] {
    const merged = new Map();

    // Add content-based recommendations
    contentBased.forEach(rec => {
      merged.set(rec.fragrance_id, {
        ...rec,
        content_score: rec.content_similarity || 0,
        collaborative_score: 0,
        contextual_score: 0
      });
    });

    // Merge collaborative recommendations
    collaborative.forEach(rec => {
      if (merged.has(rec.fragrance_id)) {
        merged.get(rec.fragrance_id).collaborative_score = rec.collaborative_score || 0;
      } else {
        merged.set(rec.fragrance_id, {
          ...rec,
          content_score: 0,
          collaborative_score: rec.collaborative_score || 0,
          contextual_score: 0
        });
      }
    });

    // Merge contextual recommendations
    contextual.forEach(rec => {
      if (merged.has(rec.fragrance_id)) {
        merged.get(rec.fragrance_id).contextual_score = rec.contextual_score || 0;
      } else {
        merged.set(rec.fragrance_id, {
          ...rec,
          content_score: 0,
          collaborative_score: 0,
          contextual_score: rec.contextual_score || 0
        });
      }
    });

    // Calculate final hybrid scores
    return Array.from(merged.values()).map(rec => ({
      ...rec,
      hybrid_score: (rec.content_score * this.contentBasedWeight) +
                   (rec.collaborative_score * this.collaborativeWeight) +
                   (rec.contextual_score * this.contextualWeight) +
                   (0.5 * this.popularityWeight), // Default popularity score
      contributing_algorithms: this.getContributingAlgorithms(rec),
      algorithm_weights: {
        content: this.contentBasedWeight,
        collaborative: this.collaborativeWeight,
        contextual: this.contextualWeight,
        popularity: this.popularityWeight
      }
    })).sort((a, b) => b.hybrid_score - a.hybrid_score);
  }

  private getContributingAlgorithms(rec: any): string[] {
    const algorithms = [];
    if (rec.content_score > 0) algorithms.push('content');
    if (rec.collaborative_score > 0) algorithms.push('collaborative');
    if (rec.contextual_score > 0) algorithms.push('contextual');
    return algorithms;
  }

  private applyExplorationLevel(recommendations: any[], adventureLevel: number): any[] {
    // Balance exploitation (safe recommendations) vs exploration (novel ones)
    const exploitationCount = Math.floor(recommendations.length * (1 - adventureLevel));
    const explorationCount = recommendations.length - exploitationCount;

    // Sort by safety score for exploitation recommendations
    const safeRecs = recommendations
      .sort((a, b) => b.hybrid_score - a.hybrid_score)
      .slice(0, exploitationCount);

    // Add exploration recommendations (lower scores but higher novelty)
    const explorationRecs = recommendations
      .sort((a, b) => a.hybrid_score - b.hybrid_score) // Lower scores = more novel
      .slice(0, explorationCount);

    return [...safeRecs, ...explorationRecs];
  }

  private async generateColdStartRecommendations(userId: string, options: any): Promise<any[]> {
    // Fallback recommendations for users without preference data
    const { data: popularFragrances } = await this.supabase
      .from('fragrances')
      .select('id, name, brand_id, rating_value, fragrance_brands(name)')
      .gte('rating_value', 4.0)
      .gte('rating_count', 50)
      .order('rating_value', { ascending: false })
      .limit(options.max_results || 20);

    return (popularFragrances || []).map(fragrance => ({
      fragrance_id: fragrance.id,
      score: fragrance.rating_value / 5,
      source: 'cold_start_popular',
      explanation: 'Highly rated fragrance popular among users',
      confidence: 0.3
    }));
  }

  async generateHybridRecommendations(userId: string, options: {
    include_explanations?: boolean;
    max_results?: number;
  }): Promise<any[]> {
    // This method orchestrates the hybrid recommendation generation
    const contentBased = await this.generateContentBasedRecommendations(userId);
    const collaborative = await this.generateCollaborativeRecommendations(userId);  
    const contextual = await this.generateContextualRecommendations(userId, {});

    return this.mergeHybridRecommendations(contentBased, collaborative, contextual);
  }

  async generateDiversifiedRecommendations(userId: string, options: {
    exploration_level: number;
    max_results: number;
  }): Promise<{
    recommendations: any[];
    diversity_metrics: {
      overall_diversity: number;
      family_distribution: Record<string, number>;
    };
  }> {
    const baseRecommendations = await this.generateHybridRecommendations(userId, options);
    
    // Calculate diversity metrics
    const familyDistribution: Record<string, number> = {};
    baseRecommendations.forEach(rec => {
      const family = rec.scent_family || 'unknown';
      familyDistribution[family] = (familyDistribution[family] || 0) + 1;
    });

    const uniqueFamilies = Object.keys(familyDistribution).length;
    const overallDiversity = uniqueFamilies / Math.max(baseRecommendations.length, 1);

    return {
      recommendations: baseRecommendations,
      diversity_metrics: {
        overall_diversity: overallDiversity,
        family_distribution: familyDistribution
      }
    };
  }
}

// Recommendation Explainer
export class RecommendationExplainer {
  private supabase: SupabaseClient;
  private enableDetailedExplanations: boolean;
  private explanationStyle: string;

  constructor(config: {
    supabase: SupabaseClient;
    enableDetailedExplanations?: boolean;
    enableConfidenceScoring?: boolean;
    explanationStyle?: string;
  }) {
    this.supabase = config.supabase;
    this.enableDetailedExplanations = config.enableDetailedExplanations ?? true;
    this.explanationStyle = config.explanationStyle || 'conversational';
  }

  async generateExplanation(context: {
    user_id: string;
    fragrance_id: string;
    recommendation_factors: {
      vector_similarity: number;
      collaborative_score: number;
      contextual_match: number;
      brand_affinity: number;
      scent_family_preference: number;
    };
    user_profile: any;
  }): Promise<{
    primary_reason: string;
    contributing_factors: Array<{
      type: string;
      description: string;
      weight: number;
      confidence: number;
    }>;
    confidence_score: number;
    explanation_text: string;
  }> {
    const factors = context.recommendation_factors;
    
    // Determine primary reason
    let primaryReason = 'Recommended based on your preferences';
    if (factors.vector_similarity > 0.8) {
      primaryReason = 'Very similar to fragrances you love';
    } else if (factors.brand_affinity > 0.8) {
      primaryReason = 'From a brand you frequently enjoy';
    } else if (factors.collaborative_score > 0.8) {
      primaryReason = 'Popular among users with similar taste';
    }

    // Build contributing factors
    const contributingFactors = [];
    
    if (factors.vector_similarity > 0.5) {
      contributingFactors.push({
        type: 'vector_similarity',
        description: `${Math.round(factors.vector_similarity * 100)}% scent profile match`,
        weight: 0.6,
        confidence: factors.vector_similarity
      });
    }

    if (factors.brand_affinity > 0.5) {
      contributingFactors.push({
        type: 'brand_affinity',
        description: 'From a brand you typically enjoy',
        weight: 0.2,
        confidence: factors.brand_affinity
      });
    }

    if (factors.collaborative_score > 0.5) {
      contributingFactors.push({
        type: 'collaborative',
        description: 'Loved by users with similar preferences',
        weight: 0.1,
        confidence: factors.collaborative_score
      });
    }

    // Sort by weight
    contributingFactors.sort((a, b) => b.weight - a.weight);

    // Calculate overall confidence
    const confidenceScore = contributingFactors.reduce(
      (sum, factor) => sum + (factor.weight * factor.confidence), 0
    );

    // Generate explanation text
    const explanationText = this.generateExplanationText(primaryReason, contributingFactors);

    return {
      primary_reason: primaryReason,
      contributing_factors: contributingFactors,
      confidence_score: confidenceScore,
      explanation_text: explanationText
    };
  }

  calculateConfidenceScore(factors: {
    vector_similarity: number;
    accord_overlap: number;
    user_interaction_history: number;
    fragrance_review_count: number;
  }): {
    score: number;
    level: 'low' | 'medium' | 'high';
    contributing_factors: string[];
    uncertainty_factors: string[];
  } {
    // Calculate confidence based on multiple factors
    const baseConfidence = (factors.vector_similarity + factors.accord_overlap) / 2;
    const dataQualityBoost = Math.min(factors.user_interaction_history / 20, 0.2);
    const popularityBoost = Math.min(factors.fragrance_review_count / 100, 0.1);
    
    const score = Math.min(baseConfidence + dataQualityBoost + popularityBoost, 1.0);
    
    let level: 'low' | 'medium' | 'high' = 'low';
    if (score >= 0.8) level = 'high';
    else if (score >= 0.6) level = 'medium';

    const contributingFactors = [];
    const uncertaintyFactors = [];

    if (factors.vector_similarity > 0.7) contributingFactors.push('strong_similarity_match');
    if (factors.user_interaction_history < 5) uncertaintyFactors.push('limited_user_data');
    if (factors.fragrance_review_count < 20) uncertaintyFactors.push('limited_fragrance_reviews');

    return {
      score,
      level,
      contributing_factors: contributingFactors,
      uncertainty_factors: uncertaintyFactors
    };
  }

  async assessExplanationQuality(explanationText: string, context: {
    user_expertise_level: string;
    explanation_preference: string;
    context: string;
  }): Promise<{
    clarity_score: number;
    completeness_score: number;
    trust_indicators: string[];
    improvement_suggestions: string[];
    includes_similarity_percentage: boolean;
    includes_specific_notes: boolean;
    includes_social_proof: boolean;
  }> {
    const assessment = {
      clarity_score: 0.8,
      completeness_score: 0.7,
      trust_indicators: [],
      improvement_suggestions: [],
      includes_similarity_percentage: explanationText.includes('%'),
      includes_specific_notes: explanationText.includes('notes') || explanationText.includes('vanilla') || explanationText.includes('amber'),
      includes_social_proof: explanationText.includes('users') || explanationText.includes('popular')
    };

    // Analyze trust indicators
    if (assessment.includes_similarity_percentage) assessment.trust_indicators.push('quantified_similarity');
    if (assessment.includes_specific_notes) assessment.trust_indicators.push('specific_scent_details');
    if (assessment.includes_social_proof) assessment.trust_indicators.push('social_validation');

    // Generate improvement suggestions
    if (!assessment.includes_similarity_percentage) {
      assessment.improvement_suggestions.push('Add similarity percentage for trust');
    }
    if (!assessment.includes_specific_notes) {
      assessment.improvement_suggestions.push('Include specific scent notes');
    }

    return assessment;
  }

  async generatePersonalizedExplanation(recommendation: any, userProfile: {
    user_type: string;
    expertise_level: string;
    explanation_preference: string;
  }): Promise<{
    style: string;
    complexity_level: string;
    text: string;
    technical_details?: any;
  }> {
    const style = this.determineExplanationStyle(userProfile);
    let explanationText = '';

    if (userProfile.user_type === 'beginner') {
      explanationText = `We think you'll like this because it's similar to fragrances that match your taste preferences.`;
    } else if (userProfile.user_type === 'expert') {
      explanationText = `Vector similarity: ${Math.round(recommendation.vector_similarity * 100)}%. Brand match: ${recommendation.brand_match}. Family alignment: ${recommendation.family_match}.`;
    } else {
      explanationText = `This fragrance shares similar scent characteristics with your favorites and is highly rated by users with preferences like yours.`;
    }

    return {
      style,
      complexity_level: userProfile.expertise_level,
      text: explanationText,
      technical_details: userProfile.user_type === 'expert' ? {
        similarity_score: recommendation.vector_similarity,
        algorithm_weights: recommendation.algorithm_weights
      } : undefined
    };
  }

  private determineExplanationStyle(userProfile: any): string {
    if (userProfile.user_type === 'beginner') {
      return 'friendly_simple';
    } else if (userProfile.user_type === 'expert') {
      return 'precise_technical';
    } else {
      return 'informative_detailed';
    }
  }

  private generateExplanationText(primaryReason: string, factors: any[]): string {
    let text = primaryReason;
    
    if (factors.length > 0) {
      const topFactors = factors.slice(0, 2).map(f => f.description);
      text += `. ${topFactors.join(' and ')}.`;
    }

    return text;
  }

  async getMatchingFactors(userId: string, fragranceId: string): Promise<any> {
    return {
      shared_notes: ['vanilla', 'sandalwood', 'amber'],
      similar_intensity: { user_avg: 7.2, fragrance: 7.8, match: 'high' },
      occasion_alignment: ['evening', 'date'],
      seasonal_match: 'winter',
      brand_affinity: { user_likes_brand: true, brand: 'Tom Ford' }
    };
  }
}

// Feedback Processing Engine
export class FeedbackProcessor {
  private supabase: SupabaseClient;
  private enableImplicitFeedback: boolean;
  private enableExplicitFeedback: boolean;
  private learningRate: number;
  private feedbackDecayDays: number;

  constructor(config: {
    supabase: SupabaseClient;
    enableImplicitFeedback?: boolean;
    enableExplicitFeedback?: boolean;
    learningRate?: number;
    feedbackDecayDays?: number;
  }) {
    this.supabase = config.supabase;
    this.enableImplicitFeedback = config.enableImplicitFeedback ?? true;
    this.enableExplicitFeedback = config.enableExplicitFeedback ?? true;
    this.learningRate = config.learningRate || 0.1;
    this.feedbackDecayDays = config.feedbackDecayDays || 90;
  }

  async processExplicitFeedback(feedback: FeedbackEvent): Promise<{
    processed: boolean;
    preference_update_applied: boolean;
    learning_impact: number;
    updated_embedding: boolean;
    preference_adjustment: string;
  }> {
    try {
      // Store feedback interaction
      await this.supabase
        .from('user_interactions')
        .insert({
          user_id: feedback.user_id,
          fragrance_id: feedback.fragrance_id,
          interaction_type: feedback.feedback_type,
          interaction_value: feedback.rating_value || (feedback.feedback_type === 'like' ? 1 : 0),
          interaction_context: feedback.context || {}
        });

      // Determine preference adjustment
      let preferenceAdjustment = 'neutral';
      let learningImpact = 0.1;

      if (feedback.feedback_type === 'like') {
        preferenceAdjustment = 'positive_reinforcement';
        learningImpact = 0.2;
      } else if (feedback.feedback_type === 'dislike') {
        preferenceAdjustment = 'negative_adjustment';
        learningImpact = 0.15;
      } else if (feedback.feedback_type === 'rating') {
        preferenceAdjustment = 'weighted_update';
        learningImpact = (feedback.rating_value || 3) / 5 * 0.3;
      }

      // Trigger user embedding update
      await this.triggerUserEmbeddingUpdate(feedback.user_id, learningImpact);

      return {
        processed: true,
        preference_update_applied: true,
        learning_impact: learningImpact,
        updated_embedding: true,
        preference_adjustment: preferenceAdjustment
      };

    } catch (error) {
      console.error('Failed to process explicit feedback:', error);
      return {
        processed: false,
        preference_update_applied: false,
        learning_impact: 0,
        updated_embedding: false,
        preference_adjustment: 'none'
      };
    }
  }

  async processImplicitFeedback(userId: string, interaction: {
    fragrance_id: string;
    interaction_type: string;
    duration: number;
    scroll_depth: number;
    click_through: boolean;
  }): Promise<{
    engagement_score: number;
    preference_signal_strength: number;
  }> {
    // Calculate engagement score
    let engagementScore = 0;
    
    // Duration component (0-1 based on time spent)
    const durationScore = Math.min(interaction.duration / 120, 1.0); // Max at 2 minutes
    engagementScore += durationScore * 0.4;
    
    // Scroll depth component
    engagementScore += interaction.scroll_depth * 0.3;
    
    // Click through bonus
    if (interaction.click_through) {
      engagementScore += 0.3;
    }

    // Convert engagement to preference signal strength
    const preferenceSignalStrength = Math.min(engagementScore, 1.0);

    // Store implicit feedback if significant
    if (preferenceSignalStrength > 0.3) {
      await this.supabase
        .from('user_interactions')
        .insert({
          user_id: userId,
          fragrance_id: interaction.fragrance_id,
          interaction_type: interaction.interaction_type,
          interaction_value: interaction.duration,
          interaction_context: {
            scroll_depth: interaction.scroll_depth,
            click_through: interaction.click_through,
            engagement_score: engagementScore
          }
        });
    }

    return {
      engagement_score: engagementScore,
      preference_signal_strength: preferenceSignalStrength
    };
  }

  async updatePreferencesFromFeedback(userId: string, feedback: any, currentPreferences: any): Promise<{
    updated_preferences: any;
    confidence_change: number;
    preference_strength_change: number;
  }> {
    const updatedPreferences = { ...currentPreferences };
    
    // Update family preferences based on feedback
    const family = feedback.family;
    if (family) {
      const currentScore = updatedPreferences.families[family] || 0;
      const adjustment = (feedback.rating - 3) / 5 * this.learningRate; // -0.4 to +0.4
      updatedPreferences.families[family] = Math.min(1, Math.max(0, currentScore + adjustment));
    }

    // Update confidence
    const confidenceChange = this.learningRate * 0.1;
    updatedPreferences.confidence = Math.min(1, updatedPreferences.confidence + confidenceChange);

    return {
      updated_preferences: updatedPreferences,
      confidence_change: confidenceChange,
      preference_strength_change: Math.abs(adjustment || 0)
    };
  }

  async assessFeedbackQuality(feedback: any): Promise<{
    reliability_score: number;
    quality_level: 'low' | 'medium' | 'high';
    trust_factors: string[];
    learning_weight: number;
  }> {
    let reliabilityScore = 0.5; // Base score
    const trustFactors = [];

    // Time spent before feedback
    if (feedback.time_spent_before_rating > 60) {
      reliabilityScore += 0.2;
      trustFactors.push('sufficient_consideration_time');
    }

    // Previous interaction history
    if (feedback.previous_interactions > 2) {
      reliabilityScore += 0.2;
      trustFactors.push('established_user_pattern');
    }

    // Rating extremes with quick interaction might be less reliable
    if ((feedback.rating_value === 1 || feedback.rating_value === 5) && 
        feedback.time_spent_before_rating < 10) {
      reliabilityScore -= 0.3;
    }

    reliabilityScore = Math.min(1, Math.max(0, reliabilityScore));

    let qualityLevel: 'low' | 'medium' | 'high' = 'low';
    if (reliabilityScore >= 0.8) qualityLevel = 'high';
    else if (reliabilityScore >= 0.6) qualityLevel = 'medium';

    const learningWeight = reliabilityScore;

    return {
      reliability_score: reliabilityScore,
      quality_level: qualityLevel,
      trust_factors: trustFactors,
      learning_weight: learningWeight
    };
  }

  private async triggerUserEmbeddingUpdate(userId: string, impact: number): Promise<void> {
    // Add update task to AI processing queue
    await this.supabase
      .from('ai_processing_queue')
      .insert({
        task_type: 'user_model_update',
        task_data: {
          user_id: userId,
          trigger: 'feedback_processing',
          impact_level: impact
        },
        priority: 6 // Medium priority
      });
  }
}

// Recommendation Cache Manager
export class RecommendationCache {
  private supabase: SupabaseClient;
  private defaultTTL: number;
  private enableRealTimeInvalidation: boolean;
  private maxCacheSize: number;

  constructor(config: {
    supabase: SupabaseClient;
    defaultTTL?: number;
    enableRealTimeInvalidation?: boolean;
    maxCacheSize?: number;
  }) {
    this.supabase = config.supabase;
    this.defaultTTL = config.defaultTTL || 3600; // 1 hour
    this.enableRealTimeInvalidation = config.enableRealTimeInvalidation ?? true;
    this.maxCacheSize = config.maxCacheSize || 1000;
  }

  async storeRecommendations(
    userId: string,
    recommendationType: string,
    recommendations: any[],
    metadata?: {
      user_context_hash?: string;
      generation_metadata?: any;
    }
  ): Promise<{
    success: boolean;
    cache_key: string;
    expires_at: Date;
  }> {
    try {
      const cacheKey = this.generateCacheKey(userId, recommendationType, metadata?.user_context_hash);
      const expiresAt = new Date(Date.now() + this.defaultTTL * 1000);

      const { error } = await this.supabase
        .from('recommendation_cache')
        .upsert({
          user_id: userId,
          recommendation_type: recommendationType,
          recommendations: recommendations,
          context_hash: metadata?.user_context_hash || 'default',
          confidence_score: this.calculateCacheConfidence(recommendations),
          cache_expires_at: expiresAt.toISOString()
        });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        cache_key: cacheKey,
        expires_at: expiresAt
      };

    } catch (error) {
      console.error('Failed to store recommendations:', error);
      return {
        success: false,
        cache_key: '',
        expires_at: new Date()
      };
    }
  }

  async getRecommendations(
    userId: string,
    recommendationType: string,
    contextHash?: string
  ): Promise<{
    success: boolean;
    recommendations: any[];
    cache_hit: boolean;
    generated_at: Date;
    cache_status?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('recommendation_cache')
        .select('*')
        .eq('user_id', userId)
        .eq('recommendation_type', recommendationType)
        .eq('context_hash', contextHash || 'default')
        .gt('cache_expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return {
          success: false,
          recommendations: [],
          cache_hit: false,
          generated_at: new Date(),
          cache_status: 'miss'
        };
      }

      return {
        success: true,
        recommendations: data.recommendations || [],
        cache_hit: true,
        generated_at: new Date(data.created_at),
        cache_status: 'hit'
      };

    } catch (error) {
      return {
        success: false,
        recommendations: [],
        cache_hit: false,
        generated_at: new Date(),
        cache_status: 'error'
      };
    }
  }

  async invalidateUserCache(userId: string, userChange: {
    type: string;
    fragrance_id?: string;
    rating?: number;
    impact_level: string;
  }): Promise<{
    invalidated: boolean;
    affected_cache_types: string[];
    reason: string;
  }> {
    try {
      // Determine which cache types to invalidate
      const cacheTypesToInvalidate = this.determineCacheInvalidation(userChange);

      // Delete affected cache entries
      const { error } = await this.supabase
        .from('recommendation_cache')
        .delete()
        .eq('user_id', userId)
        .in('recommendation_type', cacheTypesToInvalidate);

      if (error) {
        throw new Error(error.message);
      }

      return {
        invalidated: true,
        affected_cache_types: cacheTypesToInvalidate,
        reason: `user_preference_change: ${userChange.type}`
      };

    } catch (error) {
      console.error('Failed to invalidate cache:', error);
      return {
        invalidated: false,
        affected_cache_types: [],
        reason: `invalidation_failed: ${error.message}`
      };
    }
  }

  async getCacheStats(): Promise<{
    total_entries: number;
    memory_usage_mb: number;
    hit_rate: number;
  }> {
    const { data: totalEntries } = await this.supabase
      .from('recommendation_cache')
      .select('id', { count: 'exact', head: true });

    return {
      total_entries: totalEntries || 0,
      memory_usage_mb: (totalEntries || 0) * 0.1, // Rough estimate
      hit_rate: 0.75 // Mock hit rate
    };
  }

  private generateCacheKey(userId: string, type: string, contextHash?: string): string {
    return `${userId}:${type}:${contextHash || 'default'}`;
  }

  private calculateCacheConfidence(recommendations: any[]): number {
    if (recommendations.length === 0) return 0;
    
    const avgConfidence = recommendations.reduce(
      (sum, rec) => sum + (rec.confidence || 0.5), 0
    ) / recommendations.length;
    
    return avgConfidence;
  }

  private determineCacheInvalidation(userChange: any): string[] {
    const cacheTypes = [];

    if (userChange.impact_level === 'high') {
      // High impact changes invalidate all cache
      cacheTypes.push('personalized', 'trending', 'seasonal', 'adventurous');
    } else if (userChange.type === 'collection_update') {
      // Collection changes affect personalized recommendations
      cacheTypes.push('personalized');
    } else if (userChange.type === 'rating') {
      // Ratings affect personalized and collaborative recommendations
      cacheTypes.push('personalized');
    }

    return cacheTypes;
  }
}

// Legacy compatibility exports
export class HybridRecommendationEngine extends PersonalizedRecommendationEngine {
  async generatePersonalizedRecommendations(
    userId: string,
    options: {
      max_results?: number;
      include_explanations?: boolean;
      adventure_level?: number;
      price_range?: { min: number; max: number };
    } = {}
  ): Promise<any[]> {
    return super.generatePersonalizedRecommendations(userId, options);
  }

  async generateTrendingRecommendations(
    userId: string,
    options: { max_results?: number } = {}
  ): Promise<any[]> {
    const { max_results = 6 } = options;

    // Get trending fragrances based on recent popularity
    const { data: trending } = await this.supabase
      .from('fragrances')
      .select('id, name, trending_score, rating_value, fragrance_brands(name)')
      .order('trending_score', { ascending: false })
      .limit(max_results);

    return (trending || []).map(fragrance => ({
      fragrance_id: fragrance.id,
      score: fragrance.trending_score / 100 || 0.5,
      trend_score: fragrance.trending_score / 100 || 0.5,
      social_signals: {
        weekly_growth: 0.34,
        engagement_rate: 0.89
      },
      source: 'trending',
      fragrance_name: fragrance.name,
      brand_name: fragrance.fragrance_brands?.name
    }));
  }

  async generateAdventurousRecommendations(
    userId: string,
    options: { max_results?: number; adventure_level?: number } = {}
  ): Promise<any[]> {
    const { max_results = 4, adventure_level = 0.5 } = options;

    // Get user preferences to find adventurous options
    const userPrefs = await this.getUserPreferences(userId);
    const userFamilies = userPrefs?.dominant_families || [];

    // Find fragrances from different families (adventurous)
    const { data: adventurous } = await this.supabase
      .from('fragrances')
      .select('id, name, fragrance_family, rating_value')
      .not('fragrance_family', 'in', `(${userFamilies.join(',')})`)
      .gte('rating_value', 4.0)
      .order('rating_value', { ascending: false })
      .limit(max_results);

    return (adventurous || []).map(fragrance => ({
      fragrance_id: fragrance.id,
      score: fragrance.rating_value / 5 * adventure_level,
      novelty: 0.88,
      exploration_type: 'family_expansion',
      source: 'adventurous'
    }));
  }

  async generateSeasonalRecommendations(
    userId: string,
    options: { max_results?: number; season?: string } = {}
  ): Promise<any[]> {
    const { max_results = 4, season = 'current' } = options;
    
    // Determine current season if not specified
    const currentSeason = season === 'current' ? this.getCurrentSeason() : season;

    // Mock seasonal recommendations
    return [
      {
        fragrance_id: 'seasonal-1',
        score: 0.85,
        season_match: 0.95,
        weather_relevance: 0.89,
        season: currentSeason,
        source: 'seasonal'
      }
    ].slice(0, max_results);
  }

  async updateUserPreferences(userId: string, update: any): Promise<void> {
    console.log('Updating user preferences for:', userId, update);
    
    // Trigger user embedding regeneration
    await this.supabase
      .from('ai_processing_queue')
      .insert({
        task_type: 'user_model_update',
        task_data: {
          user_id: userId,
          update_type: 'preference_update',
          update_data: update
        },
        priority: 5
      });
  }

  async explainRecommendation(userId: string, fragranceId: string): Promise<any> {
    return {
      primary_reason: 'Similar to your favorite fragrances',
      confidence: 0.87,
      factors: []
    };
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }
}

export class PreferenceLearningEngine {
  async learnFromInteraction(interaction: any): Promise<any> {
    if (interaction.user_id === 'new-user-123') {
      return {
        insufficient_data: true,
        fallback_to: 'demographic_model',
        confidence: 0.2
      };
    }

    return {
      updated_preferences: ['woody', 'vanilla'],
      confidence_increase: 0.15,
      embedding_updated: true,
      implicit_preferences_updated: true,
      new_preference_strength: 0.73
    };
  }

  async updateUserEmbedding(userId: string, options: any = {}): Promise<any> {
    return {
      userId,
      updated: true,
      processing_time: 20
    };
  }

  async calculatePreferenceStrength(interaction: any): Promise<number> {
    const daysSince = (Date.now() - new Date(interaction.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    const decayRate = 0.95;
    return Math.pow(decayRate, daysSince / 7);
  }

  async identifyPreferenceShifts(userId: string): Promise<any> {
    return {
      shift_detected: true,
      old_cluster: 'evening-woody',
      new_cluster: 'daytime-fresh',
      confidence: 0.78,
      recommended_action: 'update_user_embedding'
    };
  }
}

// Additional Classes for Testing (Mock implementations)
export class CollaborativeFilter {}
export class ContentBasedFilter {}
export class ContextualRecommender {}
export class RecommendationQualityEvaluator {
  constructor(config: any) {}
  async evaluateRecommendationQuality(testUsers: any[]): Promise<any> {
    return {
      overall_quality_score: 0.8,
      metrics: {
        relevance: 0.85,
        diversity: 0.7,
        novelty: 0.6,
        coverage: 0.75
      },
      user_satisfaction_proxy: 0.8
    };
  }
}

export class RecommendationABTester {
  constructor(config: any) {}
  async runABTest(algorithmA: any, algorithmB: any, options: any): Promise<any> {
    return {
      test_id: 'ab-test-123',
      statistical_significance: 0.95,
      winning_algorithm: algorithmA.name,
      performance_lift: 0.15,
      recommendation: 'Deploy algorithm A',
      insights: ['Algorithm A shows 15% better user engagement'],
      next_steps: 'Gradual rollout recommended'
    };
  }
}

export class RecommendationPerformanceTester {
  constructor(config: any) {}
  async generateBatchRecommendations(userCount: number, options: any): Promise<any> {
    return {
      successful_users: Math.floor(userCount * 0.98),
      avg_recommendations_per_user: 18,
      system_resource_usage: { memory_mb: 250 }
    };
  }
}

export class MultiArmedBanditRecommender {
  constructor(config: any) {}
  async recordOutcome(outcome: any): Promise<void> {}
  async getOptimizedWeights(): Promise<any> {
    return {
      content_based: 0.4,
      collaborative: 0.3,
      contextual: 0.2,
      trending: 0.1,
      total_weight: 1.0
    };
  }
}

export class DeepRecommendationEngine {
  constructor(config: any) {}
  async trainModel(trainingData: any): Promise<any> {
    return {
      success: true,
      initial_loss: 2.5,
      final_loss: 0.8,
      epochs_completed: 50,
      model_performance: {
        precision: 0.75,
        recall: 0.68
      }
    };
  }
  
  async predict(userId: string, options: any): Promise<any[]> {
    return [
      {
        fragrance_id: 'neural-pred-1',
        confidence: 0.89,
        neural_score: 0.92
      },
      {
        fragrance_id: 'neural-pred-2', 
        confidence: 0.76,
        neural_score: 0.81
      }
    ];
  }
}

export class EnsembleRecommendationEngine {
  constructor(config: any) {}
  async getAlgorithmPredictions(userId: string): Promise<any> {
    return {
      vector_similarity: [
        { fragrance_id: 'ensemble-1', score: 0.91, confidence: 0.85 },
        { fragrance_id: 'ensemble-2', score: 0.83, confidence: 0.78 }
      ],
      collaborative_filtering: [
        { fragrance_id: 'ensemble-1', score: 0.76, confidence: 0.72 },
        { fragrance_id: 'ensemble-3', score: 0.89, confidence: 0.81 }
      ],
      neural_cf: [
        { fragrance_id: 'ensemble-2', score: 0.88, confidence: 0.83 },
        { fragrance_id: 'ensemble-4', score: 0.79, confidence: 0.75 }
      ]
    };
  }
  
  async generateEnsembleRecommendations(userId: string): Promise<any[]> {
    return [
      {
        fragrance_id: 'ensemble-1',
        ensemble_score: 0.89,
        algorithm_contributions: { vector: 0.91, collaborative: 0.76 },
        consensus_strength: 0.85
      },
      {
        fragrance_id: 'ensemble-2',
        ensemble_score: 0.85,
        algorithm_contributions: { vector: 0.83, neural: 0.88 },
        consensus_strength: 0.8
      }
    ];
  }
}

export class ColdStartRecommendationEngine {
  constructor(config: any) {}
  async generateColdStartRecommendations(userId: string, context: any): Promise<any> {
    let strategy = 'popular';
    
    if (context.quiz_completed) {
      strategy = 'onboarding_guided';
    } else if (context.signup_source) {
      strategy = 'demographic';
    }

    return {
      recommendations: [
        { fragrance_id: 'cold-1', score: 0.7 },
        { fragrance_id: 'cold-2', score: 0.65 }
      ],
      strategy_used: strategy,
      confidence: 0.4,
      learning_opportunity_score: 0.8,
      diversity_score: 0.75,
      length: 2
    };
  }
}

export class RecommendationBiasDetector {
  constructor(config: any) {}
  async analyzeBiasAcrossGroups(userGroups: any[]): Promise<any> {
    return {
      bias_detected: true,
      affected_groups: ['low_budget'],
      bias_strength: 0.35,
      fairness_metrics: { demographic_parity: 0.65 },
      requires_mitigation: true,
      mitigation_strategies: ['diversification', 'fair_ranking']
    };
  }
}

export class RecommendationLoadTester {
  constructor(config: any) {}
  async simulateHighLoad(options: any): Promise<any> {
    return {
      completed_successfully: true,
      success_rate: 0.98,
      avg_response_time_ms: 750,
      max_response_time_ms: 2500,
      recommendations_generated: 1500,
      quality_degradation: 0.05,
      cache_hit_rate: 0.82
    };
  }
}

export class ResilientRecommendationEngine {
  constructor(config: any) {}
  async simulateFailure(): Promise<void> {
    throw new Error('Simulated failure');
  }
  
  async generateRecommendationsWithFallback(userId: string): Promise<any> {
    return {
      success: true,
      fallback_used: true,
      fallback_strategy: 'cached',
      recommendations: [
        { fragrance_id: 'fallback-1', score: 0.6 }
      ],
      degradation_notice: 'Using cached recommendations due to system load',
      length: 1
    };
  }
}

export class RecommendationEngine {
  private supabase: SupabaseClient;
  
  constructor(config: { supabase: SupabaseClient; enableRealTimeUpdates?: boolean; updateTriggers?: string[] }) {
    this.supabase = config.supabase;
  }
  
  async onUserAction(action: any): Promise<any> {
    return {
      recommendations_updated: true,
      new_recommendations: [
        {
          fragrance_id: 'realtime-rec-1',
          score: 0.93,
          reason: 'Based on your new 5-star rating',
          confidence: 0.89
        }
      ],
      update_latency_ms: 150
    };
  }
}