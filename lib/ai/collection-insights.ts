/**
 * Real-time Collection Insights and Preference Change Notifications
 * 
 * Analyzes user fragrance collections in real-time and provides intelligent
 * insights about collection patterns, gaps, and preference evolution.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { UserActivity } from './user-activity-tracker';
import { AIClient } from './ai-client';

// Types for collection insights
export interface CollectionInsight {
  id: string;
  user_id: string;
  insight_type: InsightType;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  confidence: number;
  actionable: boolean;
  suggested_actions: SuggestedAction[];
  supporting_data: InsightData;
  created_at: number;
  expires_at?: number;
  acknowledged?: boolean;
  acted_upon?: boolean;
}

export type InsightType = 
  | 'collection_gap'
  | 'redundancy_detected'
  | 'preference_shift'
  | 'seasonal_opportunity'
  | 'brand_exploration'
  | 'price_point_analysis'
  | 'occasion_coverage'
  | 'scent_family_balance'
  | 'collection_maturity'
  | 'discovery_opportunity'
  | 'trending_alignment'
  | 'personality_evolution';

export interface SuggestedAction {
  action_type: 'explore' | 'add' | 'remove' | 'organize' | 'learn';
  description: string;
  urgency: 'low' | 'medium' | 'high';
  estimated_impact: 'minor' | 'moderate' | 'significant';
  specific_recommendations?: string[];
  learn_more_url?: string;
}

export interface InsightData {
  metrics: CollectionMetrics;
  trends: TrendData[];
  comparisons: ComparisonData[];
  predictions: PredictionData[];
  evidence: EvidenceItem[];
}

export interface CollectionMetrics {
  total_fragrances: number;
  scent_family_distribution: Record<string, number>;
  brand_diversity: number;
  price_range_coverage: PriceRangeCoverage;
  seasonal_coverage: SeasonalCoverage;
  occasion_coverage: OccasionCoverage;
  uniqueness_score: number;
  complexity_score: number;
  maturity_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface PriceRangeCoverage {
  budget: number;      // 0-1 percentage
  mid_range: number;   // 0-1 percentage  
  luxury: number;      // 0-1 percentage
  ultra_luxury: number; // 0-1 percentage
  average_price: number;
  price_spread: number;
}

export interface SeasonalCoverage {
  spring: number;
  summer: number;
  fall: number;
  winter: number;
  year_round: number;
  current_season_strength: number;
}

export interface OccasionCoverage {
  daily: number;
  work: number;
  evening: number;
  special: number;
  intimate: number;
  sport: number;
  travel: number;
}

export interface TrendData {
  trend_type: 'scent_preference' | 'brand_preference' | 'price_tolerance' | 'occasion_focus';
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  confidence: number;
  time_period: string;
  data_points: TrendPoint[];
}

export interface TrendPoint {
  timestamp: number;
  value: number;
  context?: string;
}

export interface ComparisonData {
  comparison_type: 'peer_comparison' | 'archetype_comparison' | 'expert_comparison';
  baseline: string;
  user_score: number;
  baseline_score: number;
  percentile: number;
  insights: string[];
}

export interface PredictionData {
  prediction_type: 'next_addition' | 'preference_evolution' | 'collection_completion';
  prediction: string;
  confidence: number;
  time_horizon: 'short_term' | 'medium_term' | 'long_term';
  factors: string[];
}

export interface EvidenceItem {
  evidence_type: 'activity_pattern' | 'rating_history' | 'search_behavior' | 'timing_pattern';
  description: string;
  strength: 'weak' | 'moderate' | 'strong';
  recency: number; // 0-1, how recent
}

export interface PreferenceChangeNotification {
  id: string;
  user_id: string;
  change_type: 'shift' | 'expansion' | 'refinement' | 'exploration';
  detected_change: DetectedChange;
  confidence: number;
  supporting_evidence: EvidenceItem[];
  recommended_actions: SuggestedAction[];
  created_at: number;
  notification_sent: boolean;
  user_feedback?: 'accurate' | 'inaccurate' | 'partially_accurate';
}

export interface DetectedChange {
  category: 'scent_family' | 'brand' | 'price_sensitivity' | 'occasion' | 'complexity' | 'mood';
  previous_preference: string | number;
  new_preference: string | number;
  change_magnitude: number; // 0-1
  time_to_detect: number; // milliseconds
  stability: number; // how stable the change appears to be
}

/**
 * Collection Intelligence Engine
 * Analyzes collections and generates insights in real-time
 */
export class CollectionIntelligenceEngine {
  private supabase: ReturnType<typeof createClient<Database>>;
  private aiClient: AIClient;
  private userCollectionCache: Map<string, any[]> = new Map();
  private insightCache: Map<string, CollectionInsight[]> = new Map();
  private preferenceProfiles: Map<string, any> = new Map();
  private notificationQueue: Map<string, PreferenceChangeNotification[]> = new Map();

  // Configuration
  private config = {
    insightGenerationInterval: 300000, // 5 minutes
    preferenceChangeThreshold: 0.3,
    minimumCollectionSize: 3,
    maxInsightsPerUser: 15,
    insightTTL: 86400000, // 24 hours
    notificationCooldown: 3600000, // 1 hour between similar notifications
    analysisDepth: 'comprehensive' as 'basic' | 'standard' | 'comprehensive'
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

    this.startPeriodicAnalysis();
  }

  /**
   * Analyze collection changes and generate real-time insights
   */
  async analyzeCollectionUpdate(
    userId: string,
    changeType: 'add' | 'remove' | 'rating_update',
    fragranceData: any
  ): Promise<CollectionInsight[]> {
    try {
      // Update collection cache
      await this.updateCollectionCache(userId);
      
      // Generate immediate insights for this change
      const immediateInsights = await this.generateImmediateInsights(
        userId,
        changeType,
        fragranceData
      );
      
      // Check for preference changes
      await this.detectPreferenceChanges(userId, changeType, fragranceData);
      
      // Generate comprehensive collection analysis
      const comprehensiveInsights = await this.generateComprehensiveInsights(userId);
      
      // Combine and prioritize insights
      const allInsights = [...immediateInsights, ...comprehensiveInsights];
      const prioritizedInsights = this.prioritizeInsights(allInsights);
      
      // Cache insights
      this.insightCache.set(userId, prioritizedInsights);
      
      // Store insights
      await this.storeInsights(prioritizedInsights);
      
      return prioritizedInsights;
      
    } catch (error) {
      console.error('Failed to analyze collection update:', error);
      return [];
    }
  }

  /**
   * Generate immediate insights based on a specific collection change
   */
  private async generateImmediateInsights(
    userId: string,
    changeType: 'add' | 'remove' | 'rating_update',
    fragranceData: any
  ): Promise<CollectionInsight[]> {
    const insights: CollectionInsight[] = [];
    const userCollection = this.userCollectionCache.get(userId) || [];

    if (changeType === 'add') {
      // Check for redundancy
      const redundancyInsight = await this.checkForRedundancy(userId, fragranceData, userCollection);
      if (redundancyInsight) insights.push(redundancyInsight);

      // Check collection balance impact
      const balanceInsight = await this.analyzeBalanceImpact(userId, fragranceData, userCollection);
      if (balanceInsight) insights.push(balanceInsight);

      // Check for new discovery opportunities
      const discoveryInsight = await this.identifyDiscoveryOpportunities(userId, fragranceData);
      if (discoveryInsight) insights.push(discoveryInsight);
    }

    if (changeType === 'rating_update') {
      // Analyze rating in context of collection
      const ratingInsight = await this.analyzeRatingContext(userId, fragranceData);
      if (ratingInsight) insights.push(ratingInsight);
    }

    return insights;
  }

  private async checkForRedundancy(
    userId: string,
    newFragrance: any,
    collection: any[]
  ): Promise<CollectionInsight | null> {
    const similarFragrances = collection.filter(fragrance => 
      this.calculateSimilarity(newFragrance, fragrance) > 0.8
    );

    if (similarFragrances.length > 0) {
      return {
        id: `redundancy_${userId}_${Date.now()}`,
        user_id: userId,
        insight_type: 'redundancy_detected',
        title: 'Similar Fragrance Detected',
        description: `${newFragrance.name} is very similar to ${similarFragrances[0].name} in your collection.`,
        priority: 'medium',
        confidence: 0.8,
        actionable: true,
        suggested_actions: [{
          action_type: 'organize',
          description: 'Consider if you need both similar fragrances',
          urgency: 'low',
          estimated_impact: 'minor',
          specific_recommendations: [
            'Compare the fragrances side by side',
            'Consider different occasions for each',
            'Focus on subtle differences'
          ]
        }],
        supporting_data: {
          metrics: await this.calculateCollectionMetrics(userId, collection),
          trends: [],
          comparisons: [],
          predictions: [],
          evidence: [{
            evidence_type: 'activity_pattern',
            description: `High similarity (${(this.calculateSimilarity(newFragrance, similarFragrances[0]) * 100).toFixed(0)}%) detected`,
            strength: 'strong',
            recency: 1.0
          }]
        },
        created_at: Date.now()
      };
    }

    return null;
  }

  private async analyzeBalanceImpact(
    userId: string,
    newFragrance: any,
    collection: any[]
  ): Promise<CollectionInsight | null> {
    const updatedCollection = [...collection, newFragrance];
    const oldMetrics = await this.calculateCollectionMetrics(userId, collection);
    const newMetrics = await this.calculateCollectionMetrics(userId, updatedCollection);

    // Check if this addition significantly improves balance
    const balanceImprovement = this.calculateBalanceImprovement(oldMetrics, newMetrics);
    
    if (balanceImprovement > 0.1) {
      return {
        id: `balance_${userId}_${Date.now()}`,
        user_id: userId,
        insight_type: 'scent_family_balance',
        title: 'Excellent Collection Balance',
        description: `Adding ${newFragrance.name} significantly improves your collection's balance.`,
        priority: 'medium',
        confidence: 0.7,
        actionable: true,
        suggested_actions: [{
          action_type: 'explore',
          description: 'Continue building in this direction',
          urgency: 'low',
          estimated_impact: 'moderate',
          specific_recommendations: [
            `Look for more ${newFragrance.scent_family} fragrances`,
            'Consider similar quality brands',
            'Explore different seasons in this family'
          ]
        }],
        supporting_data: {
          metrics: newMetrics,
          trends: [],
          comparisons: [{
            comparison_type: 'peer_comparison',
            baseline: 'Before addition',
            user_score: newMetrics.uniqueness_score,
            baseline_score: oldMetrics.uniqueness_score,
            percentile: 0.75,
            insights: ['Collection balance improved', 'Diversity increased']
          }],
          predictions: [],
          evidence: []
        },
        created_at: Date.now()
      };
    }

    return null;
  }

  private async identifyDiscoveryOpportunities(
    userId: string,
    newFragrance: any
  ): Promise<CollectionInsight | null> {
    // Analyze if this fragrance opens up new discovery paths
    const relatedCategories = this.getRelatedCategories(newFragrance);
    const userCollection = this.userCollectionCache.get(userId) || [];
    
    const uncoveredCategories = relatedCategories.filter(category =>
      !userCollection.some(fragrance => 
        fragrance.scent_family?.includes(category) ||
        fragrance.notes?.some((note: any) => note.name.toLowerCase().includes(category.toLowerCase()))
      )
    );

    if (uncoveredCategories.length > 0) {
      return {
        id: `discovery_${userId}_${Date.now()}`,
        user_id: userId,
        insight_type: 'discovery_opportunity',
        title: 'New Discovery Paths Opened',
        description: `${newFragrance.name} opens up ${uncoveredCategories.length} new areas to explore.`,
        priority: 'low',
        confidence: 0.6,
        actionable: true,
        suggested_actions: [{
          action_type: 'explore',
          description: 'Explore related fragrance categories',
          urgency: 'low',
          estimated_impact: 'moderate',
          specific_recommendations: uncoveredCategories.map(cat => `Explore ${cat} fragrances`)
        }],
        supporting_data: {
          metrics: await this.calculateCollectionMetrics(userId, userCollection),
          trends: [],
          comparisons: [],
          predictions: [{
            prediction_type: 'next_addition',
            prediction: `You might enjoy ${uncoveredCategories[0]} fragrances`,
            confidence: 0.6,
            time_horizon: 'medium_term',
            factors: [`Interest in ${newFragrance.scent_family}`, 'Collection gap identified']
          }],
          evidence: []
        },
        created_at: Date.now()
      };
    }

    return null;
  }

  private async analyzeRatingContext(
    userId: string,
    fragranceData: any
  ): Promise<CollectionInsight | null> {
    const userCollection = this.userCollectionCache.get(userId) || [];
    const rating = fragranceData.rating;
    
    if (rating >= 4) {
      // High rating - analyze what this says about preferences
      const similarHighRated = userCollection.filter(f => 
        f.rating >= 4 && this.calculateSimilarity(f, fragranceData) > 0.6
      );

      if (similarHighRated.length >= 2) {
        const dominantCharacteristics = this.extractDominantCharacteristics(
          [...similarHighRated, fragranceData]
        );

        return {
          id: `preference_${userId}_${Date.now()}`,
          user_id: userId,
          insight_type: 'preference_shift',
          title: 'Strong Preference Pattern Detected',
          description: `Your high ratings consistently favor ${dominantCharacteristics.join(', ')} characteristics.`,
          priority: 'medium',
          confidence: 0.8,
          actionable: true,
          suggested_actions: [{
            action_type: 'explore',
            description: 'Explore more fragrances with these characteristics',
            urgency: 'medium',
            estimated_impact: 'significant',
            specific_recommendations: dominantCharacteristics.map(char => 
              `Look for more ${char} fragrances`
            )
          }],
          supporting_data: {
            metrics: await this.calculateCollectionMetrics(userId, userCollection),
            trends: [],
            comparisons: [],
            predictions: [],
            evidence: [{
              evidence_type: 'rating_history',
              description: `${similarHighRated.length + 1} high ratings for similar characteristics`,
              strength: 'strong',
              recency: 1.0
            }]
          },
          created_at: Date.now()
        };
      }
    }

    return null;
  }

  /**
   * Generate comprehensive collection insights
   */
  private async generateComprehensiveInsights(userId: string): Promise<CollectionInsight[]> {
    const insights: CollectionInsight[] = [];
    const collection = this.userCollectionCache.get(userId) || [];
    
    if (collection.length < this.config.minimumCollectionSize) {
      return insights;
    }

    const metrics = await this.calculateCollectionMetrics(userId, collection);

    // Analyze gaps
    const gapInsights = await this.analyzeCollectionGaps(userId, metrics, collection);
    insights.push(...gapInsights);

    // Analyze seasonal coverage
    const seasonalInsight = await this.analyzeSeasonalCoverage(userId, metrics);
    if (seasonalInsight) insights.push(seasonalInsight);

    // Analyze brand diversity
    const brandInsight = await this.analyzeBrandDiversity(userId, metrics, collection);
    if (brandInsight) insights.push(brandInsight);

    // Analyze price distribution
    const priceInsight = await this.analyzePriceDistribution(userId, metrics);
    if (priceInsight) insights.push(priceInsight);

    // Analyze collection maturity
    const maturityInsight = await this.analyzeCollectionMaturity(userId, metrics, collection);
    if (maturityInsight) insights.push(maturityInsight);

    return insights;
  }

  private async analyzeCollectionGaps(
    userId: string,
    metrics: CollectionMetrics,
    collection: any[]
  ): Promise<CollectionInsight[]> {
    const insights: CollectionInsight[] = [];
    
    // Check for missing scent families
    const allScentFamilies = ['fresh', 'floral', 'oriental', 'woody', 'citrus', 'aquatic', 'green'];
    const missingScentFamilies = allScentFamilies.filter(family => 
      !Object.keys(metrics.scent_family_distribution).includes(family) ||
      metrics.scent_family_distribution[family] === 0
    );

    if (missingScentFamilies.length > 0) {
      const currentSeason = this.getCurrentSeason();
      const seasonalMissing = missingScentFamilies.filter(family =>
        this.isSeasonallyRelevant(family, currentSeason)
      );

      if (seasonalMissing.length > 0) {
        insights.push({
          id: `gap_seasonal_${userId}_${Date.now()}`,
          user_id: userId,
          insight_type: 'collection_gap',
          title: `Missing ${currentSeason} Fragrance Categories`,
          description: `Your collection could benefit from ${seasonalMissing.join(', ')} fragrances for ${currentSeason}.`,
          priority: 'medium',
          confidence: 0.7,
          actionable: true,
          suggested_actions: [{
            action_type: 'add',
            description: `Add ${currentSeason}-appropriate fragrances`,
            urgency: 'medium',
            estimated_impact: 'moderate',
            specific_recommendations: seasonalMissing.map(family => 
              `Explore ${family} fragrances for ${currentSeason}`
            )
          }],
          supporting_data: {
            metrics,
            trends: [],
            comparisons: [],
            predictions: [],
            evidence: [{
              evidence_type: 'activity_pattern',
              description: `${seasonalMissing.length} seasonal categories missing`,
              strength: 'moderate',
              recency: 1.0
            }]
          },
          created_at: Date.now()
        });
      }
    }

    return insights;
  }

  private async analyzeSeasonalCoverage(
    userId: string,
    metrics: CollectionMetrics
  ): Promise<CollectionInsight | null> {
    const currentSeason = this.getCurrentSeason();
    const currentSeasonCoverage = metrics.seasonal_coverage[currentSeason as keyof SeasonalCoverage];
    
    if (currentSeasonCoverage < 0.3) { // Less than 30% coverage for current season
      return {
        id: `seasonal_${userId}_${Date.now()}`,
        user_id: userId,
        insight_type: 'seasonal_opportunity',
        title: `Low ${currentSeason} Collection Coverage`,
        description: `Only ${(currentSeasonCoverage * 100).toFixed(0)}% of your collection is suitable for ${currentSeason}.`,
        priority: 'high',
        confidence: 0.8,
        actionable: true,
        suggested_actions: [{
          action_type: 'add',
          description: `Build your ${currentSeason} fragrance collection`,
          urgency: 'high',
          estimated_impact: 'significant',
          specific_recommendations: [
            `Look for ${currentSeason}-appropriate fragrances`,
            'Focus on weather-suitable options',
            'Consider lighter/heavier options as needed'
          ]
        }],
        supporting_data: {
          metrics,
          trends: [],
          comparisons: [],
          predictions: [],
          evidence: [{
            evidence_type: 'activity_pattern',
            description: `${currentSeason} coverage below optimal threshold`,
            strength: 'strong',
            recency: 1.0
          }]
        },
        created_at: Date.now()
      };
    }

    return null;
  }

  private async analyzeBrandDiversity(
    userId: string,
    metrics: CollectionMetrics,
    collection: any[]
  ): Promise<CollectionInsight | null> {
    if (metrics.brand_diversity < 0.5 && collection.length >= 5) {
      const dominantBrands = this.getDominantBrands(collection);
      
      return {
        id: `brand_diversity_${userId}_${Date.now()}`,
        user_id: userId,
        insight_type: 'brand_exploration',
        title: 'Limited Brand Diversity',
        description: `Your collection is heavily focused on ${dominantBrands.join(', ')}. Exploring new brands could enhance your fragrance journey.`,
        priority: 'low',
        confidence: 0.6,
        actionable: true,
        suggested_actions: [{
          action_type: 'explore',
          description: 'Discover new fragrance brands',
          urgency: 'low',
          estimated_impact: 'moderate',
          specific_recommendations: [
            'Try niche fragrance houses',
            'Explore indie perfumers',
            'Consider international brands'
          ]
        }],
        supporting_data: {
          metrics,
          trends: [],
          comparisons: [],
          predictions: [],
          evidence: []
        },
        created_at: Date.now()
      };
    }

    return null;
  }

  private async analyzePriceDistribution(
    userId: string,
    metrics: CollectionMetrics
  ): Promise<CollectionInsight | null> {
    const coverage = metrics.price_range_coverage;
    
    // Check if user is missing budget options (good for daily wear)
    if (coverage.budget < 0.2 && coverage.luxury > 0.5) {
      return {
        id: `price_balance_${userId}_${Date.now()}`,
        user_id: userId,
        insight_type: 'price_point_analysis',
        title: 'Consider Budget-Friendly Daily Options',
        description: 'Adding some affordable fragrances could give you more options for everyday wear.',
        priority: 'low',
        confidence: 0.5,
        actionable: true,
        suggested_actions: [{
          action_type: 'explore',
          description: 'Find quality budget options for daily wear',
          urgency: 'low',
          estimated_impact: 'moderate',
          specific_recommendations: [
            'Look for drugstore gems',
            'Explore designer flankers',
            'Consider decants of expensive fragrances'
          ]
        }],
        supporting_data: {
          metrics,
          trends: [],
          comparisons: [],
          predictions: [],
          evidence: []
        },
        created_at: Date.now()
      };
    }

    return null;
  }

  private async analyzeCollectionMaturity(
    userId: string,
    metrics: CollectionMetrics,
    collection: any[]
  ): Promise<CollectionInsight | null> {
    if (metrics.maturity_level === 'beginner' && collection.length >= 10) {
      return {
        id: `maturity_${userId}_${Date.now()}`,
        user_id: userId,
        insight_type: 'collection_maturity',
        title: 'Ready for More Complex Fragrances',
        description: 'Your collection shows you\'re ready to explore more sophisticated and complex fragrances.',
        priority: 'medium',
        confidence: 0.7,
        actionable: true,
        suggested_actions: [{
          action_type: 'explore',
          description: 'Explore more complex and niche fragrances',
          urgency: 'medium',
          estimated_impact: 'significant',
          specific_recommendations: [
            'Try niche house offerings',
            'Explore complex compositions',
            'Consider challenging but rewarding scents'
          ]
        }],
        supporting_data: {
          metrics,
          trends: [],
          comparisons: [],
          predictions: [],
          evidence: []
        },
        created_at: Date.now()
      };
    }

    return null;
  }

  /**
   * Detect preference changes based on collection updates
   */
  private async detectPreferenceChanges(
    userId: string,
    changeType: 'add' | 'remove' | 'rating_update',
    fragranceData: any
  ): Promise<void> {
    try {
      const currentProfile = await this.getCurrentPreferenceProfile(userId);
      const updatedProfile = await this.calculateUpdatedPreferenceProfile(
        userId,
        changeType,
        fragranceData
      );

      const changes = this.comparePreferenceProfiles(currentProfile, updatedProfile);
      
      for (const change of changes) {
        if (change.change_magnitude >= this.config.preferenceChangeThreshold) {
          const notification = this.createPreferenceChangeNotification(
            userId,
            change,
            fragranceData
          );
          
          await this.queueNotification(notification);
        }
      }

      // Update cached profile
      this.preferenceProfiles.set(userId, updatedProfile);
      
    } catch (error) {
      console.error('Failed to detect preference changes:', error);
    }
  }

  private async getCurrentPreferenceProfile(userId: string): Promise<any> {
    if (this.preferenceProfiles.has(userId)) {
      return this.preferenceProfiles.get(userId);
    }

    // Load from database or calculate fresh
    const collection = this.userCollectionCache.get(userId) || [];
    const profile = await this.calculatePreferenceProfile(userId, collection);
    
    this.preferenceProfiles.set(userId, profile);
    return profile;
  }

  private async calculatePreferenceProfile(userId: string, collection: any[]): Promise<any> {
    if (collection.length === 0) {
      return this.getDefaultPreferenceProfile();
    }

    // Calculate preference strengths for different categories
    const scentFamilyPreferences = this.calculateScentFamilyPreferences(collection);
    const brandPreferences = this.calculateBrandPreferences(collection);
    const pricePreferences = this.calculatePricePreferences(collection);
    const seasonalPreferences = this.calculateSeasonalPreferences(collection);
    const occasionPreferences = this.calculateOccasionPreferences(collection);

    return {
      scent_families: scentFamilyPreferences,
      brands: brandPreferences,
      price_sensitivity: pricePreferences,
      seasonal: seasonalPreferences,
      occasions: occasionPreferences,
      complexity_preference: this.calculateComplexityPreference(collection),
      uniqueness_preference: this.calculateUniquenessPreference(collection),
      last_updated: Date.now()
    };
  }

  private calculateScentFamilyPreferences(collection: any[]): Record<string, number> {
    const preferences: Record<string, number> = {};
    const ratedFragrances = collection.filter(f => f.rating);
    
    for (const fragrance of ratedFragrances) {
      const families = fragrance.scent_family || [];
      const weight = fragrance.rating / 5; // Normalize to 0-1
      
      for (const family of families) {
        preferences[family] = (preferences[family] || 0) + weight;
      }
    }

    // Normalize preferences
    const maxValue = Math.max(...Object.values(preferences));
    if (maxValue > 0) {
      for (const family in preferences) {
        preferences[family] /= maxValue;
      }
    }

    return preferences;
  }

  private calculateBrandPreferences(collection: any[]): Record<string, number> {
    const preferences: Record<string, number> = {};
    const ratedFragrances = collection.filter(f => f.rating && f.brand);
    
    for (const fragrance of ratedFragrances) {
      const weight = fragrance.rating / 5;
      preferences[fragrance.brand] = (preferences[fragrance.brand] || 0) + weight;
    }

    // Normalize
    const maxValue = Math.max(...Object.values(preferences));
    if (maxValue > 0) {
      for (const brand in preferences) {
        preferences[brand] /= maxValue;
      }
    }

    return preferences;
  }

  private calculatePricePreferences(collection: any[]): any {
    const prices = collection.filter(f => f.price).map(f => f.price);
    if (prices.length === 0) return { tolerance: 'medium', average: 0 };

    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const max = Math.max(...prices);
    const min = Math.min(...prices);

    let tolerance = 'medium';
    if (max - min > average) {
      tolerance = 'high';
    } else if (max - min < average * 0.5) {
      tolerance = 'low';
    }

    return {
      tolerance,
      average,
      range: { min, max },
      variance: this.calculateVariance(prices)
    };
  }

  private calculateSeasonalPreferences(collection: any[]): Record<string, number> {
    // Simplified seasonal preference calculation
    return {
      spring: 0.25,
      summer: 0.25,
      fall: 0.25,
      winter: 0.25
    };
  }

  private calculateOccasionPreferences(collection: any[]): Record<string, number> {
    // Simplified occasion preference calculation
    return {
      daily: 0.4,
      work: 0.2,
      evening: 0.2,
      special: 0.2
    };
  }

  private calculateComplexityPreference(collection: any[]): number {
    // Analyze collection for complexity preference
    return 0.5; // Simplified
  }

  private calculateUniquenessPreference(collection: any[]): number {
    // Analyze collection for uniqueness preference
    return 0.5; // Simplified
  }

  private getDefaultPreferenceProfile(): any {
    return {
      scent_families: {},
      brands: {},
      price_sensitivity: { tolerance: 'medium', average: 0 },
      seasonal: { spring: 0.25, summer: 0.25, fall: 0.25, winter: 0.25 },
      occasions: { daily: 0.4, work: 0.2, evening: 0.2, special: 0.2 },
      complexity_preference: 0.5,
      uniqueness_preference: 0.5,
      last_updated: Date.now()
    };
  }

  private async calculateUpdatedPreferenceProfile(
    userId: string,
    changeType: 'add' | 'remove' | 'rating_update',
    fragranceData: any
  ): Promise<any> {
    const collection = this.userCollectionCache.get(userId) || [];
    
    if (changeType === 'add') {
      collection.push(fragranceData);
    } else if (changeType === 'remove') {
      const index = collection.findIndex(f => f.id === fragranceData.id);
      if (index >= 0) collection.splice(index, 1);
    } else if (changeType === 'rating_update') {
      const index = collection.findIndex(f => f.id === fragranceData.id);
      if (index >= 0) {
        collection[index] = { ...collection[index], ...fragranceData };
      }
    }

    return await this.calculatePreferenceProfile(userId, collection);
  }

  private comparePreferenceProfiles(oldProfile: any, newProfile: any): DetectedChange[] {
    const changes: DetectedChange[] = [];

    // Compare scent family preferences
    const scentFamilyChanges = this.compareObjectValues(
      oldProfile.scent_families,
      newProfile.scent_families,
      'scent_family'
    );
    changes.push(...scentFamilyChanges);

    // Compare brand preferences
    const brandChanges = this.compareObjectValues(
      oldProfile.brands,
      newProfile.brands,
      'brand'
    );
    changes.push(...brandChanges);

    // Compare price sensitivity
    if (Math.abs(oldProfile.price_sensitivity.average - newProfile.price_sensitivity.average) > 20) {
      changes.push({
        category: 'price_sensitivity',
        previous_preference: oldProfile.price_sensitivity.average,
        new_preference: newProfile.price_sensitivity.average,
        change_magnitude: Math.abs(oldProfile.price_sensitivity.average - newProfile.price_sensitivity.average) / Math.max(oldProfile.price_sensitivity.average, newProfile.price_sensitivity.average),
        time_to_detect: Date.now() - oldProfile.last_updated,
        stability: 0.7
      });
    }

    return changes;
  }

  private compareObjectValues(
    oldValues: Record<string, number>,
    newValues: Record<string, number>,
    category: string
  ): DetectedChange[] {
    const changes: DetectedChange[] = [];
    const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

    for (const key of allKeys) {
      const oldValue = oldValues[key] || 0;
      const newValue = newValues[key] || 0;
      const change = Math.abs(newValue - oldValue);

      if (change > 0.2) { // 20% change threshold
        changes.push({
          category: category as any,
          previous_preference: oldValue,
          new_preference: newValue,
          change_magnitude: change,
          time_to_detect: Date.now(),
          stability: 0.6
        });
      }
    }

    return changes;
  }

  private createPreferenceChangeNotification(
    userId: string,
    change: DetectedChange,
    fragranceData: any
  ): PreferenceChangeNotification {
    const changeType = change.new_preference > change.previous_preference ? 'expansion' : 'shift';
    
    return {
      id: `pref_change_${userId}_${Date.now()}`,
      user_id: userId,
      change_type: changeType,
      detected_change: change,
      confidence: 0.7,
      supporting_evidence: [{
        evidence_type: 'activity_pattern',
        description: `Recent ${changeType} in ${change.category} preferences`,
        strength: 'moderate',
        recency: 1.0
      }],
      recommended_actions: [{
        action_type: 'explore',
        description: `Explore more ${change.category} options`,
        urgency: 'medium',
        estimated_impact: 'moderate'
      }],
      created_at: Date.now(),
      notification_sent: false
    };
  }

  private async queueNotification(notification: PreferenceChangeNotification): Promise<void> {
    const userId = notification.user_id;
    const queue = this.notificationQueue.get(userId) || [];
    
    // Check for duplicate notifications
    const isDuplicate = queue.some(n => 
      n.detected_change.category === notification.detected_change.category &&
      Date.now() - n.created_at < this.config.notificationCooldown
    );

    if (!isDuplicate) {
      queue.push(notification);
      this.notificationQueue.set(userId, queue);
      
      // Store notification
      await this.storeNotification(notification);
    }
  }

  // Utility methods
  private calculateSimilarity(fragrance1: any, fragrance2: any): number {
    // Simplified similarity calculation
    let similarity = 0;
    
    // Compare scent families
    const families1 = fragrance1.scent_family || [];
    const families2 = fragrance2.scent_family || [];
    const familyOverlap = families1.filter((f: string) => families2.includes(f)).length;
    const familySimilarity = familyOverlap / Math.max(families1.length, families2.length, 1);
    
    similarity += familySimilarity * 0.4;
    
    // Compare brands
    if (fragrance1.brand === fragrance2.brand) {
      similarity += 0.2;
    }
    
    // Compare price ranges
    if (fragrance1.price && fragrance2.price) {
      const priceDiff = Math.abs(fragrance1.price - fragrance2.price);
      const avgPrice = (fragrance1.price + fragrance2.price) / 2;
      const priceSimilarity = 1 - (priceDiff / avgPrice);
      similarity += priceSimilarity * 0.2;
    }
    
    return Math.min(similarity, 1);
  }

  private async calculateCollectionMetrics(
    userId: string,
    collection: any[]
  ): Promise<CollectionMetrics> {
    const scentFamilyDist = this.calculateScentFamilyDistribution(collection);
    const brandDiversity = this.calculateBrandDiversity(collection);
    const priceRangeCoverage = this.calculatePriceRangeCoverage(collection);
    const seasonalCoverage = this.calculateSeasonalCoverageMetrics(collection);
    const occasionCoverage = this.calculateOccasionCoverageMetrics(collection);

    return {
      total_fragrances: collection.length,
      scent_family_distribution: scentFamilyDist,
      brand_diversity: brandDiversity,
      price_range_coverage: priceRangeCoverage,
      seasonal_coverage: seasonalCoverage,
      occasion_coverage: occasionCoverage,
      uniqueness_score: this.calculateUniquenessScore(collection),
      complexity_score: this.calculateComplexityScore(collection),
      maturity_level: this.determineMaturityLevel(collection)
    };
  }

  private calculateScentFamilyDistribution(collection: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const fragrance of collection) {
      const families = fragrance.scent_family || [];
      for (const family of families) {
        distribution[family] = (distribution[family] || 0) + 1;
      }
    }

    // Convert to percentages
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    for (const family in distribution) {
      distribution[family] /= total;
    }

    return distribution;
  }

  private calculateBrandDiversity(collection: any[]): number {
    if (collection.length === 0) return 0;
    
    const brands = new Set(collection.map(f => f.brand).filter(Boolean));
    return brands.size / collection.length;
  }

  private calculatePriceRangeCoverage(collection: any[]): PriceRangeCoverage {
    const prices = collection.filter(f => f.price).map(f => f.price);
    if (prices.length === 0) {
      return {
        budget: 0,
        mid_range: 0,
        luxury: 0,
        ultra_luxury: 0,
        average_price: 0,
        price_spread: 0
      };
    }

    const budget = prices.filter(p => p < 50).length / prices.length;
    const midRange = prices.filter(p => p >= 50 && p < 150).length / prices.length;
    const luxury = prices.filter(p => p >= 150 && p < 300).length / prices.length;
    const ultraLuxury = prices.filter(p => p >= 300).length / prices.length;

    return {
      budget,
      mid_range: midRange,
      luxury,
      ultra_luxury: ultraLuxury,
      average_price: prices.reduce((sum, p) => sum + p, 0) / prices.length,
      price_spread: Math.max(...prices) - Math.min(...prices)
    };
  }

  private calculateSeasonalCoverageMetrics(collection: any[]): SeasonalCoverage {
    // Simplified seasonal coverage calculation
    return {
      spring: 0.25,
      summer: 0.25,
      fall: 0.25,
      winter: 0.25,
      year_round: 0,
      current_season_strength: 0.5
    };
  }

  private calculateOccasionCoverageMetrics(collection: any[]): OccasionCoverage {
    // Simplified occasion coverage calculation
    return {
      daily: 0.4,
      work: 0.2,
      evening: 0.2,
      special: 0.1,
      intimate: 0.05,
      sport: 0.03,
      travel: 0.02
    };
  }

  private calculateUniquenessScore(collection: any[]): number {
    // Calculate how unique/niche the collection is
    return 0.5; // Simplified
  }

  private calculateComplexityScore(collection: any[]): number {
    // Calculate the complexity level of fragrances in collection
    return 0.5; // Simplified
  }

  private determineMaturityLevel(collection: any[]): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    if (collection.length < 5) return 'beginner';
    if (collection.length < 15) return 'intermediate';
    if (collection.length < 30) return 'advanced';
    return 'expert';
  }

  private calculateBalanceImprovement(oldMetrics: CollectionMetrics, newMetrics: CollectionMetrics): number {
    // Calculate how much the new addition improves overall balance
    const oldBalance = this.calculateOverallBalance(oldMetrics);
    const newBalance = this.calculateOverallBalance(newMetrics);
    return newBalance - oldBalance;
  }

  private calculateOverallBalance(metrics: CollectionMetrics): number {
    // Calculate overall collection balance score
    const scentFamilyBalance = this.calculateScentFamilyBalance(metrics.scent_family_distribution);
    const priceBalance = this.calculatePriceBalance(metrics.price_range_coverage);
    const seasonalBalance = this.calculateSeasonalBalance(metrics.seasonal_coverage);
    
    return (scentFamilyBalance + priceBalance + seasonalBalance) / 3;
  }

  private calculateScentFamilyBalance(distribution: Record<string, number>): number {
    const values = Object.values(distribution);
    if (values.length === 0) return 0;
    
    const ideal = 1 / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - ideal, 2), 0) / values.length;
    return 1 - variance; // Lower variance = better balance
  }

  private calculatePriceBalance(coverage: PriceRangeCoverage): number {
    // Ideal might be some distribution across price ranges
    const idealDistribution = [0.3, 0.4, 0.2, 0.1]; // budget, mid, luxury, ultra
    const actualDistribution = [coverage.budget, coverage.mid_range, coverage.luxury, coverage.ultra_luxury];
    
    const variance = idealDistribution.reduce((sum, ideal, i) => 
      sum + Math.pow(actualDistribution[i] - ideal, 2), 0
    ) / idealDistribution.length;
    
    return 1 - variance;
  }

  private calculateSeasonalBalance(coverage: SeasonalCoverage): number {
    const values = [coverage.spring, coverage.summer, coverage.fall, coverage.winter];
    const ideal = 0.25;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - ideal, 2), 0) / values.length;
    return 1 - variance;
  }

  private getRelatedCategories(fragrance: any): string[] {
    // Get categories related to this fragrance that user might explore
    const related: string[] = [];
    
    if (fragrance.scent_family) {
      for (const family of fragrance.scent_family) {
        if (family === 'fresh') {
          related.push('aquatic', 'green', 'citrus');
        } else if (family === 'woody') {
          related.push('oriental', 'amber', 'spicy');
        }
        // Add more mappings...
      }
    }
    
    return [...new Set(related)];
  }

  private extractDominantCharacteristics(fragrances: any[]): string[] {
    const characteristics: Record<string, number> = {};
    
    for (const fragrance of fragrances) {
      if (fragrance.scent_family) {
        for (const family of fragrance.scent_family) {
          characteristics[family] = (characteristics[family] || 0) + 1;
        }
      }
    }
    
    return Object.entries(characteristics)
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([char]) => char);
  }

  private prioritizeInsights(insights: CollectionInsight[]): CollectionInsight[] {
    return insights
      .sort((a, b) => {
        // Sort by priority first, then confidence
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      })
      .slice(0, this.config.maxInsightsPerUser);
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private isSeasonallyRelevant(scentFamily: string, season: string): boolean {
    const seasonalMap: Record<string, string[]> = {
      spring: ['fresh', 'floral', 'green'],
      summer: ['fresh', 'citrus', 'aquatic'],
      fall: ['woody', 'spicy', 'oriental'],
      winter: ['oriental', 'woody', 'amber']
    };
    
    return seasonalMap[season]?.includes(scentFamily) || false;
  }

  private getDominantBrands(collection: any[]): string[] {
    const brandCounts: Record<string, number> = {};
    
    for (const fragrance of collection) {
      if (fragrance.brand) {
        brandCounts[fragrance.brand] = (brandCounts[fragrance.brand] || 0) + 1;
      }
    }
    
    return Object.entries(brandCounts)
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([brand]) => brand);
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  private async updateCollectionCache(userId: string): Promise<void> {
    try {
      const { data: collection, error } = await this.supabase
        .from('user_collection')
        .select(`
          *,
          fragrances (
            *,
            fragrance_notes (
              note_type,
              notes (name, category)
            )
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      
      this.userCollectionCache.set(userId, collection || []);
    } catch (error) {
      console.error('Failed to update collection cache:', error);
    }
  }

  private async storeInsights(insights: CollectionInsight[]): Promise<void> {
    try {
      const insightData = insights.map(insight => ({
        id: insight.id,
        user_id: insight.user_id,
        insight_type: insight.insight_type,
        title: insight.title,
        description: insight.description,
        priority: insight.priority,
        confidence: insight.confidence,
        actionable: insight.actionable,
        suggested_actions: insight.suggested_actions,
        supporting_data: insight.supporting_data,
        created_at: new Date(insight.created_at).toISOString(),
        expires_at: insight.expires_at ? new Date(insight.expires_at).toISOString() : null
      }));

      const { error } = await this.supabase
        .from('collection_insights')
        .upsert(insightData);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to store insights:', error);
    }
  }

  private async storeNotification(notification: PreferenceChangeNotification): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('preference_change_notifications')
        .insert({
          id: notification.id,
          user_id: notification.user_id,
          change_type: notification.change_type,
          detected_change: notification.detected_change,
          confidence: notification.confidence,
          supporting_evidence: notification.supporting_evidence,
          recommended_actions: notification.recommended_actions,
          created_at: new Date(notification.created_at).toISOString(),
          notification_sent: notification.notification_sent
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to store notification:', error);
    }
  }

  private startPeriodicAnalysis(): void {
    setInterval(async () => {
      // Periodic cleanup and analysis
      this.cleanupExpiredInsights();
      await this.processQueuedNotifications();
    }, this.config.insightGenerationInterval);
  }

  private cleanupExpiredInsights(): void {
    const now = Date.now();
    for (const [userId, insights] of this.insightCache) {
      const validInsights = insights.filter(insight => 
        !insight.expires_at || insight.expires_at > now
      );
      if (validInsights.length !== insights.length) {
        this.insightCache.set(userId, validInsights);
      }
    }
  }

  private async processQueuedNotifications(): Promise<void> {
    for (const [userId, notifications] of this.notificationQueue) {
      const unsentNotifications = notifications.filter(n => !n.notification_sent);
      
      for (const notification of unsentNotifications) {
        // Here you would send the actual notification (email, push, etc.)
        notification.notification_sent = true;
        
        // Update in database
        await this.updateNotificationStatus(notification);
      }
    }
  }

  private async updateNotificationStatus(notification: PreferenceChangeNotification): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('preference_change_notifications')
        .update({ notification_sent: true })
        .eq('id', notification.id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update notification status:', error);
    }
  }

  // Public API
  async getInsightsForUser(userId: string): Promise<CollectionInsight[]> {
    return this.insightCache.get(userId) || [];
  }

  async getNotificationsForUser(userId: string): Promise<PreferenceChangeNotification[]> {
    return this.notificationQueue.get(userId) || [];
  }

  async acknowledgeInsight(insightId: string): Promise<void> {
    // Mark insight as acknowledged
    for (const insights of this.insightCache.values()) {
      const insight = insights.find(i => i.id === insightId);
      if (insight) {
        insight.acknowledged = true;
        break;
      }
    }
  }

  async markInsightActedUpon(insightId: string): Promise<void> {
    // Mark insight as acted upon
    for (const insights of this.insightCache.values()) {
      const insight = insights.find(i => i.id === insightId);
      if (insight) {
        insight.acted_upon = true;
        break;
      }
    }
  }
}

// Export factory function
export const createCollectionIntelligenceEngine = (
  supabaseUrl?: string,
  supabaseKey?: string,
  aiClient?: AIClient
) => {
  return new CollectionIntelligenceEngine(supabaseUrl, supabaseKey, aiClient);
};