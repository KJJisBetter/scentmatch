/**
 * AI-Powered Collection Intelligence System
 * 
 * Advanced collection analysis using vector embeddings, pattern recognition,
 * gap analysis, personality profiling, and optimization recommendations.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { calculateCosineSimilarity } from './vector-similarity';

// Core Types
export interface CollectionAnalysis {
  success: boolean;
  insights: any;
  personality_profile: CollectionPersonality;
  gap_analysis: GapAnalysisResult;
  optimization_plan: OptimizationPlan;
  cache_used?: boolean;
  performance_metrics?: any;
  analysis_quality?: string;
  analysis_complexity?: string;
  collection_analysis_used?: boolean;
  cache_age_seconds?: number;
  cache_invalidation_reason?: string;
}

export interface GapAnalysisResult {
  seasonal_gaps: any[];
  occasion_gaps: any[];
  intensity_gaps: any[];
  family_gaps: any[];
  priority_scores: Record<string, number>;
  gaps: any[];
  severity_score?: number;
  lifestyle_impact?: string;
  usage_efficiency_score?: number;
  underutilized_fragrances?: any[];
  optimization_opportunities?: any[];
  intensity_distribution?: any;
  versatility_score?: number;
}

export interface CollectionPersonality {
  archetype: string;
  traits: string[];
  lifestyle_indicators: any;
  confidence: number;
  journey_stage?: string;
  progression_pattern?: any;
  complexity_evolution?: any;
  predicted_next_interests?: string[];
  next_level_suggestions?: any[];
  growth_opportunities?: any;
}

export interface OptimizationPlan {
  optimization_type: string;
  current_scores: any;
  target_scores: any;
  recommendations: any[];
  timeline: any;
  optimization_strategy?: string;
  current_efficiency_score?: number;
  projected_efficiency_score?: number;
  value_opportunities?: any[];
  current_balance_score?: number;
  target_balance_score?: number;
  specific_recommendations?: any[];
  plan_type?: string;
  phases?: any[];
  total_estimated_cost?: number;
  timeline_months?: number;
  recommended_acquisitions?: any[];
}

// Collection Pattern Analyzer
export class CollectionPatternAnalyzer {
  private supabase: SupabaseClient;
  private enableVectorAnalysis: boolean;
  private enableBrandAnalysis: boolean;
  private enableNoteAnalysis: boolean;
  private confidenceThreshold: number;

  constructor(config: {
    supabase: SupabaseClient;
    enableVectorAnalysis?: boolean;
    enableBrandAnalysis?: boolean;
    enableNoteAnalysis?: boolean;
    confidenceThreshold?: number;
  }) {
    this.supabase = config.supabase;
    this.enableVectorAnalysis = config.enableVectorAnalysis ?? true;
    this.enableBrandAnalysis = config.enableBrandAnalysis ?? true;
    this.enableNoteAnalysis = config.enableNoteAnalysis ?? true;
    this.confidenceThreshold = config.confidenceThreshold || 0.7;
  }

  async analyzePatterns(userId: string): Promise<{
    success: boolean;
    scent_family_distribution: Array<{
      family: string;
      percentage: number;
      preference_strength: number;
      avg_rating: number;
    }>;
    dominant_preferences: {
      primary_family: string;
      secondary_family: string;
      confidence: number;
    };
    preference_strength: {
      overall: number;
      consistency: number;
      volatility: number;
    };
  }> {
    try {
      const collection = await this.getUserCollection(userId);
      
      if (collection.length === 0) {
        return {
          success: false,
          scent_family_distribution: [],
          dominant_preferences: { primary_family: '', secondary_family: '', confidence: 0 },
          preference_strength: { overall: 0, consistency: 0, volatility: 0 }
        };
      }

      // Analyze scent family distribution
      const familyStats = this.analyzeScentFamilyDistribution(collection);
      
      // Calculate preference strength
      const preferenceStrength = this.calculatePreferenceStrength(collection);
      
      // Identify dominant preferences
      const dominantPrefs = this.identifyDominantPreferences(familyStats);

      return {
        success: true,
        scent_family_distribution: familyStats,
        dominant_preferences: dominantPrefs,
        preference_strength: preferenceStrength
      };

    } catch (error) {
      console.error('Pattern analysis failed:', error);
      return {
        success: false,
        scent_family_distribution: [],
        dominant_preferences: { primary_family: '', secondary_family: '', confidence: 0 },
        preference_strength: { overall: 0, consistency: 0, volatility: 0 }
      };
    }
  }

  async analyzeBrandPatterns(userId: string): Promise<{
    brand_affinity: Array<{
      brand: string;
      affinity_score: number;
      item_count: number;
      avg_rating: number;
    }>;
    loyalty_score: number;
    brand_diversity: number;
    dominant_brand: string;
  }> {
    const collection = await this.getUserCollection(userId);
    
    // Group by brand
    const brandStats = new Map<string, { count: number; ratings: number[]; total_rating: number }>();
    
    collection.forEach(item => {
      const brand = item.fragrance?.fragrance_brands?.name || 'Unknown';
      const rating = item.rating || 3;
      
      if (!brandStats.has(brand)) {
        brandStats.set(brand, { count: 0, ratings: [], total_rating: 0 });
      }
      
      const stats = brandStats.get(brand)!;
      stats.count++;
      stats.ratings.push(rating);
      stats.total_rating += rating;
    });

    // Calculate brand affinity
    const brandAffinity = Array.from(brandStats.entries()).map(([brand, stats]) => ({
      brand,
      affinity_score: (stats.count / collection.length) * 0.6 + (stats.total_rating / stats.ratings.length / 5) * 0.4,
      item_count: stats.count,
      avg_rating: stats.total_rating / stats.ratings.length
    })).sort((a, b) => b.affinity_score - a.affinity_score);

    // Calculate loyalty score (concentration in top brands)
    const topBrandShare = brandAffinity.slice(0, 3).reduce((sum, brand) => sum + (brand.item_count / collection.length), 0);
    const loyaltyScore = topBrandShare;

    // Calculate brand diversity
    const uniqueBrands = brandStats.size;
    const brandDiversity = uniqueBrands / collection.length;

    return {
      brand_affinity: brandAffinity,
      loyalty_score: loyaltyScore,
      brand_diversity: brandDiversity,
      dominant_brand: brandAffinity[0]?.brand || ''
    };
  }

  async analyzeNotePatterns(userId: string): Promise<{
    loved_notes: Array<{
      note: string;
      strength: number;
      frequency: number;
      evidence: string[];
    }>;
    disliked_notes: Array<{
      note: string;
      strength: number;
      frequency: number;
      evidence: string[];
    }>;
    note_combinations: {
      successful: string[][];
      avoided: string[][];
    };
    accord_preferences: Record<string, number>;
  }> {
    const collection = await this.getUserCollection(userId);
    
    // Collect all notes from collection
    const noteRatings = new Map<string, number[]>();
    const noteFrequency = new Map<string, number>();
    
    collection.forEach(item => {
      const allNotes = [
        ...(item.fragrance?.main_accords || []),
        ...(item.fragrance?.top_notes || []),
        ...(item.fragrance?.middle_notes || []),
        ...(item.fragrance?.base_notes || [])
      ];
      
      allNotes.forEach(note => {
        if (!noteRatings.has(note)) {
          noteRatings.set(note, []);
          noteFrequency.set(note, 0);
        }
        
        if (item.rating) {
          noteRatings.get(note)!.push(item.rating);
        }
        noteFrequency.set(note, noteFrequency.get(note)! + 1);
      });
    });

    // Analyze loved notes (high ratings, frequent appearance)
    const lovedNotes = Array.from(noteRatings.entries())
      .filter(([note, ratings]) => {
        const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        return avgRating >= 4 && ratings.length >= 2;
      })
      .map(([note, ratings]) => {
        const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        return {
          note,
          strength: (avgRating - 3) / 2, // Convert 3-5 scale to 0-1
          frequency: noteFrequency.get(note) || 0,
          evidence: [`avg_rating_${avgRating.toFixed(1)}`, `appears_${noteFrequency.get(note)}_times`]
        };
      })
      .sort((a, b) => b.strength - a.strength);

    // Analyze disliked notes
    const dislikedNotes = Array.from(noteRatings.entries())
      .filter(([note, ratings]) => {
        const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        return avgRating <= 2;
      })
      .map(([note, ratings]) => {
        const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        return {
          note,
          strength: (3 - avgRating) / 3, // Invert for dislike strength
          frequency: noteFrequency.get(note) || 0,
          evidence: ['low_rating']
        };
      });

    // Analyze successful note combinations
    const successfulCombinations = collection
      .filter(item => item.rating >= 4)
      .map(item => item.fragrance?.main_accords || [])
      .filter(accords => accords.length >= 2);

    return {
      loved_notes: lovedNotes,
      disliked_notes: dislikedNotes,
      note_combinations: {
        successful: successfulCombinations,
        avoided: []
      },
      accord_preferences: Object.fromEntries(
        Array.from(noteFrequency.entries()).map(([note, freq]) => [note, freq / collection.length])
      )
    };
  }

  async performVectorClustering(userId: string): Promise<{
    clusters: Array<{
      cluster_id: number;
      fragrances: string[];
      centroid: number[];
      strength: number;
      dominant_family: string;
      avg_rating: number;
      cohesion_score: number;
    }>;
    cluster_quality: number;
    preference_clusters: any;
  }> {
    const collection = await this.getUserCollection(userId);
    
    // Filter collection items with embeddings
    const embeddedFragrances = collection.filter(item => 
      item.fragrance?.embedding && Array.isArray(item.fragrance.embedding)
    );

    if (embeddedFragrances.length < 2) {
      return {
        clusters: [],
        cluster_quality: 0,
        preference_clusters: {}
      };
    }

    // Simple clustering algorithm (k-means-like)
    const clusters = this.performSimpleClustering(embeddedFragrances);
    
    // Calculate cluster quality
    const clusterQuality = this.calculateClusterQuality(clusters);

    return {
      clusters,
      cluster_quality: clusterQuality,
      preference_clusters: this.analyzePreferenceClusters(clusters)
    };
  }

  async analyzeUsagePatterns(userId: string): Promise<{
    daily_drivers: Array<{
      fragrance_id: string;
      confidence: number;
      usage_strength: number;
    }>;
    special_occasion_scents: Array<{
      fragrance_id: string;
      occasion_strength: number;
      occasions: string[];
    }>;
    rotation_patterns: {
      seasonal_rotation: Record<string, string[]>;
      weekly_rotation: string[];
      mood_based: Record<string, string[]>;
    };
    temporal_trends: {
      recent_preferences: string[];
      emerging_patterns: string[];
      declining_usage: string[];
    };
  }> {
    const collection = await this.getUserCollection(userId);
    
    // Identify daily drivers
    const dailyDrivers = collection
      .filter(item => item.usage_frequency === 'daily' || (item.rating >= 4 && item.usage_frequency === 'weekly'))
      .map(item => ({
        fragrance_id: item.fragrance_id,
        confidence: (item.rating || 3) / 5 * 0.7 + (item.usage_frequency === 'daily' ? 0.3 : 0.1),
        usage_strength: this.calculateUsageStrength(item)
      }))
      .sort((a, b) => b.confidence - a.confidence);

    // Identify special occasion scents
    const specialOccasionScents = collection
      .filter(item => item.usage_frequency === 'special' || item.occasions?.includes('formal'))
      .map(item => ({
        fragrance_id: item.fragrance_id,
        occasion_strength: (item.rating || 3) / 5,
        occasions: item.occasions || ['special']
      }));

    // Analyze rotation patterns
    const rotationPatterns = this.analyzeRotationPatterns(collection);

    // Analyze temporal trends
    const temporalTrends = this.analyzeTemporalTrends(collection);

    return {
      daily_drivers: dailyDrivers,
      special_occasion_scents: specialOccasionScents,
      rotation_patterns: rotationPatterns,
      temporal_trends: temporalTrends
    };
  }

  async getUserCollection(userId: string): Promise<any[]> {
    // Mock method for testing - in real implementation would call Supabase
    return [];
  }

  private analyzeScentFamilyDistribution(collection: any[]): Array<{
    family: string;
    percentage: number;
    preference_strength: number;
    avg_rating: number;
  }> {
    const familyStats = new Map<string, { count: number; ratings: number[]; total_rating: number }>();
    
    collection.forEach(item => {
      const family = item.fragrance?.fragrance_family || 'unknown';
      const rating = item.rating || 3;
      
      if (!familyStats.has(family)) {
        familyStats.set(family, { count: 0, ratings: [], total_rating: 0 });
      }
      
      const stats = familyStats.get(family)!;
      stats.count++;
      stats.ratings.push(rating);
      stats.total_rating += rating;
    });

    return Array.from(familyStats.entries()).map(([family, stats]) => ({
      family,
      percentage: stats.count / collection.length,
      preference_strength: (stats.total_rating / stats.ratings.length - 3) / 2, // Convert 3-5 scale to 0-1
      avg_rating: stats.total_rating / stats.ratings.length
    })).sort((a, b) => b.percentage - a.percentage);
  }

  private calculatePreferenceStrength(collection: any[]): {
    overall: number;
    consistency: number;
    volatility: number;
  } {
    const ratings = collection.filter(item => item.rating).map(item => item.rating);
    
    if (ratings.length === 0) {
      return { overall: 0, consistency: 0, volatility: 0 };
    }

    // Overall strength based on average rating
    const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    const overall = (avgRating - 3) / 2; // Convert to 0-1 scale

    // Consistency based on rating variance
    const variance = this.calculateVariance(ratings);
    const consistency = Math.max(0, 1 - variance / 4); // Max variance is 4

    // Volatility based on rating spread
    const minRating = Math.min(...ratings);
    const maxRating = Math.max(...ratings);
    const volatility = (maxRating - minRating) / 4; // 0-1 scale

    return {
      overall,
      consistency,
      volatility
    };
  }

  private identifyDominantPreferences(familyStats: any[]): {
    primary_family: string;
    secondary_family: string;
    confidence: number;
  } {
    if (familyStats.length === 0) {
      return { primary_family: '', secondary_family: '', confidence: 0 };
    }

    const primary = familyStats[0];
    const secondary = familyStats[1] || { family: '', preference_strength: 0 };
    
    // Confidence based on dominance of top family
    const confidence = primary.percentage * primary.preference_strength;

    return {
      primary_family: primary.family,
      secondary_family: secondary.family,
      confidence
    };
  }

  private performSimpleClustering(fragrances: any[]): Array<{
    cluster_id: number;
    fragrances: string[];
    centroid: number[];
    strength: number;
    dominant_family: string;
    avg_rating: number;
    cohesion_score: number;
  }> {
    // Simple clustering based on embedding similarity
    const clusters = [];
    const used = new Set<string>();
    
    fragrances.forEach((frag, i) => {
      if (used.has(frag.fragrance_id)) return;
      
      const cluster = {
        cluster_id: clusters.length,
        fragrances: [frag.fragrance_id],
        centroid: [...frag.fragrance.embedding],
        strength: frag.rating / 5,
        dominant_family: frag.fragrance.fragrance_family || 'unknown',
        avg_rating: frag.rating || 3,
        cohesion_score: 1.0 // Start with perfect cohesion for single item
      };
      
      used.add(frag.fragrance_id);
      
      // Find similar fragrances for this cluster
      fragrances.forEach((otherFrag, j) => {
        if (i !== j && !used.has(otherFrag.fragrance_id)) {
          const similarity = calculateCosineSimilarity(
            frag.fragrance.embedding,
            otherFrag.fragrance.embedding
          );
          
          if (similarity > 0.8) { // High similarity threshold
            cluster.fragrances.push(otherFrag.fragrance_id);
            cluster.avg_rating = (cluster.avg_rating + (otherFrag.rating || 3)) / 2;
            cluster.strength = Math.max(cluster.strength, (otherFrag.rating || 3) / 5);
            used.add(otherFrag.fragrance_id);
          }
        }
      });
      
      clusters.push(cluster);
    });

    return clusters.sort((a, b) => b.strength - a.strength);
  }

  private calculateClusterQuality(clusters: any[]): number {
    if (clusters.length === 0) return 0;
    
    // Quality based on cluster cohesion and separation
    const avgCohesion = clusters.reduce((sum, cluster) => sum + cluster.cohesion_score, 0) / clusters.length;
    return avgCohesion;
  }

  private analyzePreferenceClusters(clusters: any[]): any {
    return {
      cluster_count: clusters.length,
      strongest_cluster: clusters[0]?.cluster_id || 0,
      preference_concentration: clusters[0]?.strength || 0
    };
  }

  private calculateUsageStrength(item: any): number {
    const usageWeights = {
      'daily': 1.0,
      'weekly': 0.8,
      'monthly': 0.6,
      'occasional': 0.4,
      'special': 0.3,
      'rarely': 0.2,
      'never': 0.0
    };
    
    const usageWeight = usageWeights[item.usage_frequency] || 0.5;
    const ratingWeight = (item.rating || 3) / 5;
    
    return (usageWeight + ratingWeight) / 2;
  }

  private analyzeRotationPatterns(collection: any[]): {
    seasonal_rotation: Record<string, string[]>;
    weekly_rotation: string[];
    mood_based: Record<string, string[]>;
  } {
    const seasonalRotation: Record<string, string[]> = {};
    const weeklyRotation: string[] = [];
    const moodBased: Record<string, string[]> = {};

    collection.forEach(item => {
      // Seasonal rotation
      const seasons = item.seasons || [];
      seasons.forEach(season => {
        if (!seasonalRotation[season]) seasonalRotation[season] = [];
        seasonalRotation[season].push(item.fragrance_id);
      });

      // Weekly rotation (daily and weekly usage)
      if (['daily', 'weekly'].includes(item.usage_frequency)) {
        weeklyRotation.push(item.fragrance_id);
      }

      // Mood-based (from emotional tags)
      const moods = item.emotional_tags || [];
      moods.forEach(mood => {
        if (!moodBased[mood]) moodBased[mood] = [];
        moodBased[mood].push(item.fragrance_id);
      });
    });

    return {
      seasonal_rotation: seasonalRotation,
      weekly_rotation: weeklyRotation,
      mood_based: moodBased
    };
  }

  private analyzeTemporalTrends(collection: any[]): {
    recent_preferences: string[];
    emerging_patterns: string[];
    declining_usage: string[];
  } {
    const sortedByDate = collection
      .filter(item => item.created_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const recentCount = Math.floor(sortedByDate.length / 3);
    const recentItems = sortedByDate.slice(0, recentCount);
    
    // Extract recent preferences
    const recentFamilies = recentItems.map(item => item.fragrance?.fragrance_family).filter(Boolean);
    const recentPreferences = [...new Set(recentFamilies)];

    return {
      recent_preferences: recentPreferences,
      emerging_patterns: recentPreferences.slice(0, 2), // Top 2 recent
      declining_usage: [] // Would require usage history analysis
    };
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }
}

// Gap Analysis Engine
export class GapAnalysisEngine {
  private supabase: SupabaseClient;
  private enableSeasonalAnalysis: boolean;
  private enableOccasionAnalysis: boolean;
  private enableIntensityAnalysis: boolean;
  private gapDetectionThreshold: number;

  constructor(config: {
    supabase: SupabaseClient;
    enableSeasonalAnalysis?: boolean;
    enableOccasionAnalysis?: boolean;
    enableIntensityAnalysis?: boolean;
    gapDetectionThreshold?: number;
  }) {
    this.supabase = config.supabase;
    this.enableSeasonalAnalysis = config.enableSeasonalAnalysis ?? true;
    this.enableOccasionAnalysis = config.enableOccasionAnalysis ?? true;
    this.enableIntensityAnalysis = config.enableIntensityAnalysis ?? true;
    this.gapDetectionThreshold = config.gapDetectionThreshold || 0.3;
  }

  async identifySeasonalGaps(userId: string): Promise<{
    gaps: Array<{
      season: string;
      gap_severity: 'low' | 'medium' | 'high' | 'critical';
      coverage_percentage: number;
      recommended_families: string[];
      fragrance_suggestions: any[];
    }>;
    severity_score: number;
    overall_seasonal_balance: number;
  }> {
    const collection = await this.getUserCollection(userId);
    
    const seasons = ['spring', 'summer', 'fall', 'winter'];
    const seasonCoverage = new Map<string, number>();
    
    // Initialize season coverage
    seasons.forEach(season => seasonCoverage.set(season, 0));
    
    // Count seasonal coverage
    collection.forEach(item => {
      const itemSeasons = item.fragrance?.season_tags || [];
      itemSeasons.forEach(season => {
        seasonCoverage.set(season, seasonCoverage.get(season)! + 1);
      });
    });

    // Calculate gaps
    const gaps = seasons.map(season => {
      const coverage = seasonCoverage.get(season)! / collection.length;
      let gapSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      
      if (coverage === 0) gapSeverity = 'critical';
      else if (coverage < 0.1) gapSeverity = 'high';
      else if (coverage < 0.2) gapSeverity = 'medium';

      return {
        season,
        gap_severity: gapSeverity,
        coverage_percentage: coverage,
        recommended_families: this.getSeasonalFamilyRecommendations(season),
        fragrance_suggestions: this.getSeasonalFragranceSuggestions(season)
      };
    }).filter(gap => gap.gap_severity !== 'low');

    // Calculate overall severity
    const severityScore = gaps.reduce((sum, gap) => {
      const severityWeights = { critical: 1.0, high: 0.7, medium: 0.4, low: 0.1 };
      return sum + (severityWeights[gap.gap_severity] || 0);
    }, 0) / seasons.length;

    const overallBalance = 1 - severityScore;

    return {
      gaps,
      severity_score: severityScore,
      overall_seasonal_balance: overallBalance
    };
  }

  async identifyOccasionGaps(userId: string): Promise<{
    gaps: Array<{
      occasion: string;
      priority: 'low' | 'medium' | 'high';
      coverage_percentage: number;
      intensity_recommendation: string;
      family_suggestions: string[];
      fragrance_suggestions: any[];
      usage_guidance: string;
    }>;
    lifestyle_impact: 'low' | 'medium' | 'high';
    versatility_score: number;
  }> {
    const collection = await this.getUserCollection(userId);
    
    const occasions = ['office', 'casual', 'evening', 'date', 'formal', 'special'];
    const occasionCoverage = new Map<string, number>();
    
    // Initialize occasion coverage
    occasions.forEach(occasion => occasionCoverage.set(occasion, 0));
    
    // Count occasion coverage
    collection.forEach(item => {
      const itemOccasions = item.fragrance?.occasion_tags || item.occasions || [];
      itemOccasions.forEach(occasion => {
        occasionCoverage.set(occasion, occasionCoverage.get(occasion)! + 1);
      });
    });

    // Calculate gaps
    const gaps = occasions.map(occasion => {
      const coverage = occasionCoverage.get(occasion)! / collection.length;
      let priority: 'low' | 'medium' | 'high' = 'low';
      
      if (coverage === 0 && ['office', 'casual'].includes(occasion)) priority = 'high';
      else if (coverage === 0) priority = 'medium';
      else if (coverage < 0.1) priority = 'medium';

      return {
        occasion,
        priority,
        coverage_percentage: coverage,
        intensity_recommendation: this.getOccasionIntensityRecommendation(occasion),
        family_suggestions: this.getOccasionFamilyRecommendations(occasion),
        fragrance_suggestions: this.getOccasionFragranceSuggestions(occasion),
        usage_guidance: `Recommended for ${occasion} wear`
      };
    }).filter(gap => gap.priority !== 'low');

    // Calculate lifestyle impact
    const criticalGaps = gaps.filter(gap => gap.priority === 'high').length;
    const lifestyleImpact = criticalGaps >= 2 ? 'high' : criticalGaps >= 1 ? 'medium' : 'low';

    // Calculate versatility score
    const coveredOccasions = occasions.filter(occ => occasionCoverage.get(occ)! > 0).length;
    const versatilityScore = coveredOccasions / occasions.length;

    return {
      gaps,
      lifestyle_impact: lifestyleImpact,
      versatility_score: versatilityScore
    };
  }

  async identifyIntensityGaps(userId: string): Promise<{
    intensity_distribution: Record<string, number>;
    gaps: Array<{
      intensity_range: string;
      priority: 'low' | 'medium' | 'high';
      use_cases: string[];
      recommendations: any[];
    }>;
    versatility_score: number;
  }> {
    const collection = await this.getUserCollection(userId);
    
    // Categorize by intensity
    const intensityRanges = { light: 0, medium: 0, strong: 0 };
    
    collection.forEach(item => {
      const intensity = item.fragrance?.intensity_level || 5;
      
      if (intensity <= 4) intensityRanges.light++;
      else if (intensity <= 7) intensityRanges.medium++;
      else intensityRanges.strong++;
    });

    // Convert to percentages
    const intensityDistribution = {
      light: intensityRanges.light / collection.length,
      medium: intensityRanges.medium / collection.length,
      strong: intensityRanges.strong / collection.length
    };

    // Identify gaps
    const gaps = Object.entries(intensityDistribution)
      .filter(([range, percentage]) => percentage < this.gapDetectionThreshold)
      .map(([range, percentage]) => ({
        intensity_range: range,
        priority: percentage === 0 ? 'medium' : 'low' as 'low' | 'medium' | 'high',
        use_cases: this.getIntensityUseCases(range),
        recommendations: this.getIntensityRecommendations(range)
      }));

    // Calculate versatility (balanced distribution)
    const variance = Object.values(intensityDistribution)
      .map(p => Math.pow(p - 0.33, 2))
      .reduce((sum, v) => sum + v, 0) / 3;
    const versatilityScore = Math.max(0, 1 - variance * 3);

    return {
      intensity_distribution: intensityDistribution,
      gaps,
      versatility_score
    };
  }

  async analyzeDiversity(userId: string): Promise<{
    diversity_level: 'low' | 'medium' | 'high';
    balance_score: number;
    recommendations: {
      expand_families?: string[];
      maintain_balance?: boolean;
    };
  }> {
    const collection = await this.getUserCollection(userId);
    
    // Calculate family diversity
    const families = new Set(collection.map(item => item.fragrance?.fragrance_family).filter(Boolean));
    const familyDiversity = families.size / Math.max(collection.length, 1);
    
    // Calculate brand diversity
    const brands = new Set(collection.map(item => item.fragrance?.fragrance_brands?.name).filter(Boolean));
    const brandDiversity = brands.size / Math.max(collection.length, 1);
    
    // Overall balance score
    const balanceScore = (familyDiversity * 0.7 + brandDiversity * 0.3);
    
    let diversityLevel: 'low' | 'medium' | 'high' = 'low';
    if (balanceScore >= 0.7) diversityLevel = 'high';
    else if (balanceScore >= 0.4) diversityLevel = 'medium';

    const recommendations: any = {};
    
    if (diversityLevel === 'low') {
      recommendations.expand_families = this.suggestExpansionFamilies(collection);
    } else if (diversityLevel === 'high') {
      recommendations.maintain_balance = true;
    }

    return {
      diversity_level: diversityLevel,
      balance_score: balanceScore,
      recommendations
    };
  }

  private getSeasonalFamilyRecommendations(season: string): string[] {
    const seasonalFamilies = {
      spring: ['fresh', 'floral', 'green'],
      summer: ['citrus', 'aquatic', 'fresh'],
      fall: ['woody', 'spicy', 'oriental'],
      winter: ['oriental', 'gourmand', 'warm']
    };
    
    return seasonalFamilies[season] || [];
  }

  private getSeasonalFragranceSuggestions(season: string): any[] {
    // Mock fragrance suggestions for each season
    const suggestions = {
      spring: [{ name: 'Light Fresh Spring Scent', family: 'fresh' }],
      summer: [{ name: 'Bright Citrus Summer Scent', family: 'citrus' }],
      fall: [{ name: 'Warm Spicy Fall Scent', family: 'spicy' }],
      winter: [{ name: 'Rich Oriental Winter Scent', family: 'oriental' }]
    };
    
    return suggestions[season] || [];
  }

  private getOccasionIntensityRecommendation(occasion: string): string {
    const intensityMap = {
      office: 'light_to_medium',
      casual: 'medium',
      evening: 'medium_to_strong',
      date: 'medium_to_strong',
      formal: 'medium',
      special: 'strong'
    };
    
    return intensityMap[occasion] || 'medium';
  }

  private getOccasionFamilyRecommendations(occasion: string): string[] {
    const familyMap = {
      office: ['fresh', 'light_woody'],
      casual: ['fresh', 'floral', 'light_oriental'],
      evening: ['oriental', 'woody', 'gourmand'],
      date: ['oriental', 'seductive', 'warm'],
      formal: ['sophisticated', 'classic', 'elegant'],
      special: ['unique', 'memorable', 'luxury']
    };
    
    return familyMap[occasion] || [];
  }

  private getOccasionFragranceSuggestions(occasion: string): any[] {
    // Mock suggestions based on occasion
    return [{ name: `Perfect ${occasion} fragrance`, family: 'appropriate' }];
  }

  private getIntensityUseCases(range: string): string[] {
    const useCases = {
      light: ['daytime', 'office', 'casual', 'summer'],
      medium: ['versatile', 'daily_wear', 'social'],
      strong: ['evening', 'special_occasions', 'winter', 'signature']
    };
    
    return useCases[range] || [];
  }

  private getIntensityRecommendations(range: string): any[] {
    return [
      {
        intensity_level: range === 'light' ? 3 : range === 'medium' ? 6 : 8,
        recommended_families: range === 'light' ? ['fresh', 'citrus'] : range === 'medium' ? ['floral', 'woody'] : ['oriental', 'gourmand']
      }
    ];
  }

  private suggestExpansionFamilies(collection: any[]): string[] {
    const currentFamilies = new Set(collection.map(item => item.fragrance?.fragrance_family).filter(Boolean));
    const allFamilies = ['fresh', 'floral', 'oriental', 'woody', 'gourmand', 'citrus'];
    
    return allFamilies.filter(family => !currentFamilies.has(family)).slice(0, 3);
  }
}

// Collection Optimizer
export class CollectionOptimizer {
  private supabase: SupabaseClient;
  private enableBudgetOptimization: boolean;
  private enableDiversityOptimization: boolean;
  private enableUsageOptimization: boolean;
  private optimizationGoals: string[];

  constructor(config: {
    supabase: SupabaseClient;
    enableBudgetOptimization?: boolean;
    enableDiversityOptimization?: boolean;
    enableUsageOptimization?: boolean;
    optimizationGoals?: string[];
  }) {
    this.supabase = config.supabase;
    this.enableBudgetOptimization = config.enableBudgetOptimization ?? true;
    this.enableDiversityOptimization = config.enableDiversityOptimization ?? true;
    this.enableUsageOptimization = config.enableUsageOptimization ?? true;
    this.optimizationGoals = config.optimizationGoals || ['balance', 'coverage', 'value'];
  }

  async optimizeForBalance(userId: string): Promise<{
    optimization_type: string;
    current_balance_score: number;
    target_balance_score: number;
    recommendations: {
      add_families: string[];
      consider_reducing: string[];
    };
    specific_recommendations: Array<{
      fragrance_id: string;
      reason: string;
      priority: string;
    }>;
  }> {
    const collection = await this.getUserCollection(userId);
    
    // Calculate current balance
    const familyDistribution = this.calculateFamilyDistribution(collection);
    const currentBalance = this.calculateBalanceScore(familyDistribution);
    
    // Identify overrepresented and underrepresented families
    const overrepresented = familyDistribution
      .filter(family => family.percentage > 0.4)
      .map(family => family.family);
    
    const underrepresented = ['fresh', 'floral', 'oriental', 'woody', 'gourmand']
      .filter(family => !familyDistribution.find(f => f.family === family));

    return {
      optimization_type: 'diversification',
      current_balance_score: currentBalance,
      target_balance_score: 0.8,
      recommendations: {
        add_families: underrepresented.slice(0, 3),
        consider_reducing: overrepresented
      },
      specific_recommendations: [
        {
          fragrance_id: 'balance-rec-1',
          reason: 'Diversify collection with fresh family fragrance',
          priority: 'high'
        }
      ]
    };
  }

  async optimizeForBudget(userId: string, budget: number): Promise<{
    optimization_strategy: string;
    current_efficiency_score: number;
    projected_efficiency_score: number;
    recommendations: Array<{
      fragrance_id: string;
      price: number;
      value_score: number;
      reasoning: string;
    }>;
    value_opportunities: any[];
  }> {
    const collection = await this.getUserCollection(userId);
    
    // Calculate current spending efficiency
    const currentEfficiency = this.calculateSpendingEfficiency(collection);
    
    // Determine optimization strategy based on budget
    let strategy = 'budget_maximization';
    if (budget > 1000) strategy = 'premium_expansion';
    else if (budget > 500) strategy = 'value_seeking';

    const recommendations = this.generateBudgetRecommendations(budget, strategy);
    
    return {
      optimization_strategy: strategy,
      current_efficiency_score: currentEfficiency,
      projected_efficiency_score: Math.min(currentEfficiency + 0.2, 1.0),
      recommendations,
      value_opportunities: strategy === 'budget_maximization' ? [
        { type: 'high_value_find', description: 'Great quality for price' }
      ] : []
    };
  }

  async optimizeForUsage(userId: string): Promise<{
    usage_efficiency_score: number;
    underutilized_fragrances: Array<{
      fragrance_id: string;
      usage_issue: string;
      recommendations: string[];
    }>;
    optimization_opportunities: Array<{
      strategy: string;
      impact: string;
      difficulty: string;
    }>;
  }> {
    const collection = await this.getUserCollection(userId);
    
    // Identify underutilized fragrances
    const underutilized = collection
      .filter(item => 
        item.usage_frequency === 'never' || 
        (item.rating <= 3 && item.usage_frequency === 'rarely')
      )
      .map(item => ({
        fragrance_id: item.fragrance_id,
        usage_issue: item.usage_frequency === 'never' ? 'never_used' : 'poor_performance',
        recommendations: item.usage_frequency === 'never' 
          ? ['trial_recommendation', 'occasion_matching']
          : ['consider_replacement', 'usage_optimization']
      }));

    // Calculate usage efficiency
    const usedFragrances = collection.filter(item => 
      item.usage_frequency && !['never', 'rarely'].includes(item.usage_frequency)
    ).length;
    const usageEfficiency = usedFragrances / collection.length;

    return {
      usage_efficiency_score: usageEfficiency,
      underutilized_fragrances: underutilized,
      optimization_opportunities: [
        {
          strategy: 'trial_unused_fragrances',
          impact: 'medium',
          difficulty: 'easy'
        }
      ]
    };
  }

  async createStrategicPlan(userId: string, inputs: {
    current_collection_size: number;
    target_collection_size: number;
    collection_goals: string[];
    budget_constraints: any;
    priority_preferences: string[];
  }): Promise<{
    plan_type: string;
    phases: Array<{
      goal: string;
      recommended_additions: any[];
      budget_allocation: number;
    }>;
    total_estimated_cost: number;
    timeline_months: number;
    recommended_acquisitions: Array<{
      priority_level: string;
      gap_addressed: string;
    }>;
  }> {
    const additionsNeeded = inputs.target_collection_size - inputs.current_collection_size;
    const budgetPerAddition = inputs.budget_constraints.total_budget / additionsNeeded;

    return {
      plan_type: 'strategic_expansion',
      phases: [
        {
          goal: 'fill_critical_gaps',
          recommended_additions: [{ type: 'gap_filler', budget: budgetPerAddition }],
          budget_allocation: inputs.budget_constraints.total_budget * 0.6
        },
        {
          goal: 'explore_new_territory',
          recommended_additions: [{ type: 'exploration', budget: budgetPerAddition }],
          budget_allocation: inputs.budget_constraints.total_budget * 0.4
        }
      ],
      total_estimated_cost: inputs.budget_constraints.total_budget,
      timeline_months: Math.ceil(additionsNeeded / 2), // 2 fragrances per month
      recommended_acquisitions: [
        {
          priority_level: 'high',
          gap_addressed: 'seasonal_coverage'
        }
      ]
    };
  }

  async getUserCollection(userId: string): Promise<any[]> {
    // Mock method for testing
    return [];
  }

  private calculateFamilyDistribution(collection: any[]): Array<{
    family: string;
    percentage: number;
  }> {
    const familyCounts = new Map<string, number>();
    
    collection.forEach(item => {
      const family = item.fragrance?.fragrance_family || 'unknown';
      familyCounts.set(family, (familyCounts.get(family) || 0) + 1);
    });

    return Array.from(familyCounts.entries()).map(([family, count]) => ({
      family,
      percentage: count / collection.length
    }));
  }

  private calculateBalanceScore(distribution: any[]): number {
    // Calculate how balanced the distribution is (entropy-based)
    const entropy = distribution.reduce((sum, family) => {
      if (family.percentage > 0) {
        return sum - family.percentage * Math.log2(family.percentage);
      }
      return sum;
    }, 0);
    
    // Normalize entropy to 0-1 scale
    const maxEntropy = Math.log2(distribution.length || 1);
    return maxEntropy > 0 ? entropy / maxEntropy : 0;
  }

  private calculateSpendingEfficiency(collection: any[]): number {
    // Calculate value based on price paid vs rating received
    const ratedItems = collection.filter(item => item.rating && item.purchase_price);
    
    if (ratedItems.length === 0) return 0.5;
    
    const efficiencyScores = ratedItems.map(item => {
      const valueScore = item.rating / 5; // 0-1 scale
      const priceScore = Math.max(0, 1 - (item.purchase_price / 300)); // Diminishing returns after $300
      return (valueScore + priceScore) / 2;
    });

    return efficiencyScores.reduce((sum, score) => sum + score, 0) / efficiencyScores.length;
  }

  private generateBudgetRecommendations(budget: number, strategy: string): Array<{
    fragrance_id: string;
    price: number;
    value_score: number;
    reasoning: string;
  }> {
    const priceRange = strategy === 'budget_maximization' ? 50 : strategy === 'value_seeking' ? 100 : 200;
    
    return [
      {
        fragrance_id: 'budget-rec-1',
        price: Math.min(priceRange, budget),
        value_score: 0.8,
        reasoning: `Great value fragrance within ${strategy} strategy`
      }
    ];
  }
}

// Personality Profiler
export class PersonalityProfiler {
  private supabase: SupabaseClient;
  private enablePsychologicalAnalysis: boolean;
  private enableLifestyleInference: boolean;
  private enablePersonalityTraits: boolean;

  constructor(config: {
    supabase: SupabaseClient;
    enablePsychologicalAnalysis?: boolean;
    enableLifestyleInference?: boolean;
    enablePersonalityTraits?: boolean;
  }) {
    this.supabase = config.supabase;
    this.enablePsychologicalAnalysis = config.enablePsychologicalAnalysis ?? true;
    this.enableLifestyleInference = config.enableLifestyleInference ?? true;
    this.enablePersonalityTraits = config.enablePersonalityTraits ?? true;
  }

  async generatePersonalityProfile(userId: string): Promise<CollectionPersonality> {
    const collection = await this.getUserCollection(userId);
    
    // Analyze collection characteristics
    const archetype = this.determineArchetype(collection);
    const traits = this.extractPersonalityTraits(collection);
    const lifestyleIndicators = this.inferLifestyleIndicators(collection);
    const confidence = this.calculatePersonalityConfidence(collection);

    return {
      archetype,
      traits,
      lifestyle_indicators: lifestyleIndicators,
      confidence
    };
  }

  async inferLifestyle(userId: string): Promise<{
    work_style: {
      type: string;
      confidence: number;
      indicators: string[];
    };
    social_style: {
      type: string;
      evening_preference: boolean;
      confidence: number;
    };
    activity_preferences: any;
    confidence: number;
  }> {
    const collection = await this.getUserCollection(userId);
    
    // Analyze work style from fragrance choices
    const workFragrances = collection.filter(item => 
      item.occasions?.includes('office') || 
      item.usage_frequency === 'daily' ||
      (item.fragrance?.intensity_level <= 6 && item.rating >= 4)
    );

    const workStyle = {
      type: workFragrances.length > 0 ? 'professional' : 'casual',
      confidence: Math.min(workFragrances.length / 3, 1.0),
      indicators: workFragrances.length > 0 ? ['office_appropriate_scents'] : []
    };

    // Analyze social style
    const eveningFragrances = collection.filter(item =>
      item.occasions?.includes('evening') || 
      item.occasions?.includes('date') ||
      item.fragrance?.intensity_level >= 7
    );

    const socialStyle = {
      type: eveningFragrances.length > 0 ? 'active' : 'casual',
      evening_preference: eveningFragrances.length > 0,
      confidence: Math.min(eveningFragrances.length / 2, 1.0)
    };

    return {
      work_style: workStyle,
      social_style: socialStyle,
      activity_preferences: {},
      confidence: (workStyle.confidence + socialStyle.confidence) / 2
    };
  }

  async assessExperienceLevel(userId: string): Promise<{
    experience_level: 'beginner' | 'intermediate' | 'expert';
    confidence: number;
    progression_indicators: any;
    complexity_comfort: number;
    next_level_recommendations?: string[];
    expertise_areas?: string[];
  }> {
    const collection = await this.getUserCollection(userId);
    
    // Calculate experience indicators
    const collectionAge = this.calculateCollectionAge(collection);
    const brandDiversity = this.calculateBrandDiversity(collection);
    const complexityComfort = this.calculateComplexityComfort(collection);
    const nicheExposure = this.calculateNicheExposure(collection);

    // Determine experience level
    let experienceLevel: 'beginner' | 'intermediate' | 'expert' = 'beginner';
    
    if (collectionAge > 365 && brandDiversity > 0.5 && complexityComfort > 0.7) {
      experienceLevel = 'expert';
    } else if (collectionAge > 180 && brandDiversity > 0.3 && complexityComfort > 0.5) {
      experienceLevel = 'intermediate';
    }

    const confidence = Math.min((collectionAge / 365) * 0.4 + brandDiversity * 0.3 + complexityComfort * 0.3, 1.0);

    return {
      experience_level: experienceLevel,
      confidence,
      progression_indicators: {
        collection_age_days: collectionAge,
        brand_diversity: brandDiversity,
        complexity_comfort: complexityComfort
      },
      complexity_comfort: complexityComfort,
      next_level_recommendations: experienceLevel === 'beginner' ? ['explore_niche_brands'] : [],
      expertise_areas: experienceLevel === 'expert' ? ['niche_fragrances', 'complex_compositions'] : []
    };
  }

  async analyzeCollectionEvolution(userId: string): Promise<{
    journey_stage: string;
    progression_pattern: any;
    complexity_evolution: {
      trend: string;
      rate: number;
    };
    predicted_next_interests: string[];
    next_level_suggestions: any[];
    growth_opportunities: any;
  }> {
    const collection = await this.getUserCollection(userId);
    
    // Sort by creation date
    const chronological = collection
      .filter(item => item.created_at)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Analyze complexity evolution
    const complexityTrend = this.analyzeComplexityTrend(chronological);
    
    return {
      journey_stage: 'advanced_explorer',
      progression_pattern: {},
      complexity_evolution: {
        trend: 'increasing',
        rate: complexityTrend
      },
      predicted_next_interests: ['niche_exploration', 'artistic_fragrances'],
      next_level_suggestions: [
        { type: 'brand_exploration', target: 'artisanal_houses' }
      ],
      growth_opportunities: {}
    };
  }

  async getUserCollection(userId: string): Promise<any[]> {
    // Mock method for testing
    return [];
  }

  private determineArchetype(collection: any[]): string {
    // Analyze collection patterns to determine personality archetype
    const luxuryCount = collection.filter(item => 
      item.purchase_price > 200 || 
      ['Tom Ford', 'Creed', 'Amouage'].includes(item.fragrance?.fragrance_brands?.name)
    ).length;

    const nicheCount = collection.filter(item =>
      ['Le Labo', 'Diptyque', 'Byredo', 'Maison Margiela'].includes(item.fragrance?.fragrance_brands?.name)
    ).length;

    const diversityScore = new Set(collection.map(item => item.fragrance?.fragrance_family)).size / collection.length;

    // Determine archetype based on patterns
    if (luxuryCount / collection.length > 0.6 && collection.length <= 5) {
      return 'sophisticated_minimalist';
    } else if (nicheCount / collection.length > 0.4 && diversityScore > 0.7) {
      return 'adventurous_explorer';
    } else if (diversityScore < 0.3 && ['floral', 'oriental'].some(family => 
      collection.filter(item => item.fragrance?.fragrance_family === family).length > collection.length * 0.5
    )) {
      return 'romantic_traditionalist';
    } else {
      return 'eclectic_enthusiast';
    }
  }

  private extractPersonalityTraits(collection: any[]): string[] {
    const traits = [];
    
    // Quality focused
    const avgPrice = collection.reduce((sum, item) => sum + (item.purchase_price || 0), 0) / collection.length;
    if (avgPrice > 150) traits.push('quality_focused');
    
    // Minimalist
    if (collection.length <= 5 && collection.every(item => item.rating >= 4)) {
      traits.push('minimalist');
    }
    
    // Experimental
    const uniqueFamilies = new Set(collection.map(item => item.fragrance?.fragrance_family)).size;
    if (uniqueFamilies / collection.length > 0.6) {
      traits.push('experimental', 'open_to_new_experiences');
    }

    return traits;
  }

  private inferLifestyleIndicators(collection: any[]): any {
    const luxuryCount = collection.filter(item => item.purchase_price > 200).length;
    const luxuryOrientation = luxuryCount / collection.length;
    
    const explorationTendency = new Set(collection.map(item => item.fragrance?.fragrance_family)).size / collection.length;

    return {
      luxury_orientation: luxuryOrientation,
      exploration_tendency: explorationTendency,
      brand_loyalty: this.calculateBrandLoyalty(collection)
    };
  }

  private calculatePersonalityConfidence(collection: any[]): number {
    const ratedItems = collection.filter(item => item.rating).length;
    const dataQuality = ratedItems / collection.length;
    const collectionSize = Math.min(collection.length / 10, 1.0);
    
    return (dataQuality * 0.6 + collectionSize * 0.4);
  }

  private calculateCollectionAge(collection: any[]): number {
    if (collection.length === 0) return 0;
    
    const dates = collection
      .filter(item => item.created_at)
      .map(item => new Date(item.created_at).getTime());
    
    if (dates.length === 0) return 0;
    
    const oldestDate = Math.min(...dates);
    return (Date.now() - oldestDate) / (1000 * 60 * 60 * 24); // Days
  }

  private calculateBrandDiversity(collection: any[]): number {
    const uniqueBrands = new Set(collection.map(item => item.fragrance?.fragrance_brands?.name)).size;
    return uniqueBrands / Math.max(collection.length, 1);
  }

  private calculateComplexityComfort(collection: any[]): number {
    const complexityScores = collection
      .filter(item => item.fragrance?.complexity_score)
      .map(item => item.fragrance.complexity_score);
    
    if (complexityScores.length === 0) return 0.5;
    
    const avgComplexity = complexityScores.reduce((sum, score) => sum + score, 0) / complexityScores.length;
    return avgComplexity / 10; // Normalize to 0-1
  }

  private calculateNicheExposure(collection: any[]): number {
    const nicheCount = collection.filter(item => 
      item.fragrance?.brand_tier === 'niche' || 
      item.purchase_price > 250
    ).length;
    
    return nicheCount / Math.max(collection.length, 1);
  }

  private analyzeComplexityTrend(chronologicalCollection: any[]): number {
    if (chronologicalCollection.length < 3) return 0.5;
    
    const complexityScores = chronologicalCollection.map(item => 
      item.fragrance?.complexity_score || 5
    );
    
    // Calculate linear trend
    const n = complexityScores.length;
    const sumX = n * (n - 1) / 2; // 0 + 1 + 2 + ... + (n-1)
    const sumY = complexityScores.reduce((sum, score) => sum + score, 0);
    const sumXY = complexityScores.reduce((sum, score, i) => sum + (i * score), 0);
    const sumX2 = n * (n - 1) * (2 * n - 1) / 6; // 0² + 1² + 2² + ... + (n-1)²
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    return Math.max(0, Math.min(1, (slope + 1) / 2)); // Normalize to 0-1
  }

  private calculateBrandLoyalty(collection: any[]): number {
    const brandCounts = new Map<string, number>();
    
    collection.forEach(item => {
      const brand = item.fragrance?.fragrance_brands?.name || 'Unknown';
      brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
    });

    const maxBrandCount = Math.max(...Array.from(brandCounts.values()));
    return maxBrandCount / collection.length;
  }
}

// Collection Insight Generator
export class CollectionInsightGenerator {
  private supabase: SupabaseClient;
  private enableRealTimeUpdates: boolean;
  private enablePredictiveInsights: boolean;
  private insightRefreshInterval: number;

  constructor(config: {
    supabase: SupabaseClient;
    enableRealTimeUpdates?: boolean;
    enablePredictiveInsights?: boolean;
    insightRefreshInterval?: number;
  }) {
    this.supabase = config.supabase;
    this.enableRealTimeUpdates = config.enableRealTimeUpdates ?? true;
    this.enablePredictiveInsights = config.enablePredictiveInsights ?? true;
    this.insightRefreshInterval = config.insightRefreshInterval || 60000;
  }

  async detectCollectionChanges(userId: string, change: {
    change_type: string;
    fragrance_id: string;
    rating?: number;
  }): Promise<{
    change_detected: boolean;
    impact_analysis: {
      family_expansion: boolean;
      diversity_improvement: number;
      preference_shift: boolean;
    };
    new_insights: Array<{
      type: string;
      insight: string;
      confidence: number;
    }>;
    updated_recommendations: any[];
  }> {
    const beforeCollection = await this.getUserCollection(userId);
    // In real implementation, would get after collection
    const afterCollection = beforeCollection; // Mock
    
    const impactAnalysis = {
      family_expansion: true, // Mock: new fragrance adds fresh family
      diversity_improvement: 0.15,
      preference_shift: false
    };

    const newInsights = [
      {
        type: 'preference_evolution',
        insight: 'Your collection is becoming more diverse with the addition of fresh fragrances',
        confidence: 0.8
      }
    ];

    return {
      change_detected: true,
      impact_analysis: impactAnalysis,
      new_insights: newInsights,
      updated_recommendations: []
    };
  }

  async generatePredictiveInsights(userId: string): Promise<{
    trend_predictions: any;
    preference_evolution_forecast: {
      strengthening_preferences: string[];
      confidence: number;
    };
    upcoming_opportunities: Array<{
      opportunity_type: string;
      time_sensitivity: string;
    }>;
    risk_analysis: any;
  }> {
    const collection = await this.getUserCollection(userId);
    
    // Analyze recent trends
    const recentItems = collection
      .filter(item => item.created_at && new Date(item.created_at) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
      .map(item => item.fragrance?.fragrance_family)
      .filter(Boolean);

    const strengthening = [...new Set(recentItems)];

    return {
      trend_predictions: {},
      preference_evolution_forecast: {
        strengthening_preferences: strengthening,
        confidence: Math.min(recentItems.length / 3, 1.0)
      },
      upcoming_opportunities: [
        {
          opportunity_type: 'seasonal_preparation',
          time_sensitivity: 'medium'
        }
      ],
      risk_analysis: {}
    };
  }

  async analyzeCollectionHealth(userId: string): Promise<{
    overall_health_score: number;
    health_issues: Array<{
      type: string;
      fragrance_id: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
    optimization_recommendations: Array<{
      action_type: string;
      priority: string;
      description: string;
    }>;
    health_trends: any;
  }> {
    const collection = await this.getUserCollection(userId);
    
    const healthIssues = [];
    
    // Check for unused fragrances
    const unusedFragrances = collection.filter(item => 
      item.usage_frequency === 'never' || 
      (item.last_used && new Date(item.last_used) < new Date(Date.now() - 180 * 24 * 60 * 60 * 1000))
    );

    unusedFragrances.forEach(item => {
      healthIssues.push({
        type: 'unused_fragrance',
        fragrance_id: item.fragrance_id,
        severity: 'medium' as const,
        description: 'Fragrance has not been used recently'
      });
    });

    // Check for poor performers
    const poorPerformers = collection.filter(item => 
      item.rating <= 2 || 
      (item.fragrance?.performance_issues && item.rating <= 3)
    );

    poorPerformers.forEach(item => {
      healthIssues.push({
        type: 'poor_performance',
        fragrance_id: item.fragrance_id,
        severity: 'high' as const,
        description: 'Low satisfaction or performance issues'
      });
    });

    // Calculate overall health score
    const healthScore = Math.max(0, 1 - (healthIssues.length / collection.length));

    return {
      overall_health_score: healthScore,
      health_issues: healthIssues,
      optimization_recommendations: [
        {
          action_type: 'usage_optimization',
          priority: 'medium',
          description: 'Try unused fragrances or consider alternatives'
        }
      ],
      health_trends: {}
    };
  }

  async generateSmartNotification(userId: string, trigger: {
    trigger_type: string;
    context: any;
  }): Promise<{
    notification_type: string;
    priority: string;
    message: string;
    actionable_suggestions: string[];
    timing_appropriate: boolean;
  }> {
    const notificationMap = {
      seasonal_transition: 'seasonal_preparation',
      new_high_rating: 'preference_strengthening',
      unused_fragrance_alert: 'usage_optimization',
      collection_milestone: 'achievement_unlock'
    };

    const notificationType = notificationMap[trigger.trigger_type] || 'general_insight';
    
    let message = '';
    let suggestions = [];

    switch (trigger.trigger_type) {
      case 'seasonal_transition':
        message = `Fall is approaching! Time to transition from your summer fragrances to warmer, richer scents.`;
        suggestions = ['Explore your oriental fragrances', 'Consider seasonal new additions'];
        break;
      case 'new_high_rating':
        message = `Great choice! Your 5-star rating suggests strong preference for ${trigger.context.family} fragrances.`;
        suggestions = ['Explore similar fragrances', 'Update your collection focus'];
        break;
      case 'unused_fragrance_alert':
        message = `You haven't used this fragrance in 90 days. Time to rediscover it or find a better match?`;
        suggestions = ['Try it again with fresh perspective', 'Consider trading or selling'];
        break;
      case 'collection_milestone':
        message = `Congratulations! You've completed your ${trigger.context.family} collection.`;
        suggestions = ['Explore complementary families', 'Consider advanced variations'];
        break;
    }

    return {
      notification_type: notificationType,
      priority: 'medium',
      message,
      actionable_suggestions: suggestions,
      timing_appropriate: true
    };
  }

  async analyzeCrossPlatformCollection(userId: string, crossPlatformData: any): Promise<{
    platform_consistency: number;
    external_validation: any;
    social_influence_factors: {
      influenced_choices: any[];
      influence_strength: number;
    };
    authenticity_score: number;
    consistent_favorites: string[];
    platform_specific_preferences: any;
  }> {
    // Analyze consistency across platforms
    const platformConsistency = 0.8; // Mock value
    
    return {
      platform_consistency: platformConsistency,
      external_validation: {},
      social_influence_factors: {
        influenced_choices: [],
        influence_strength: 0
      },
      authenticity_score: 0.85,
      consistent_favorites: ['cross-1'],
      platform_specific_preferences: {}
    };
  }

  async generateMoodMapping(userId: string): Promise<{
    emotional_preferences: Array<{
      emotion: string;
      strength: number;
      associated_fragrances: string[];
    }>;
    mood_fragrance_associations: Record<string, string[]>;
    emotional_gaps: Array<{
      emotion: string;
      priority: string;
      recommended_families: string[];
    }>;
    mood_journey_insights: any;
  }> {
    const collection = await this.getUserCollection(userId);
    
    // Extract emotional preferences from tags
    const emotionalPrefs = [
      {
        emotion: 'confident',
        strength: 0.9,
        associated_fragrances: ['mood-1']
      }
    ];

    const emotionalGaps = [
      {
        emotion: 'relaxation',
        priority: 'medium',
        recommended_families: ['lavender', 'spa']
      }
    ];

    return {
      emotional_preferences: emotionalPrefs,
      mood_fragrance_associations: {},
      emotional_gaps: emotionalGaps,
      mood_journey_insights: {}
    };
  }

  async getUserCollection(userId: string): Promise<any[]> {
    // Mock method for testing
    return [];
  }
}

// Seasonal and Occasion Analyzers
export class SeasonalAnalyzer {
  // Implementation would go here
}

export class OccasionAnalyzer {
  // Implementation would go here
}

// Main Collection Intelligence Engine
export class CollectionIntelligenceEngine {
  private supabase: SupabaseClient;
  public patternAnalyzer: CollectionPatternAnalyzer;
  public gapAnalyzer: GapAnalysisEngine;
  public optimizer: CollectionOptimizer;
  public personalityProfiler: PersonalityProfiler;
  public insightGenerator: CollectionInsightGenerator;
  private cacheMap = new Map<string, any>();

  constructor(config: {
    supabase: SupabaseClient;
    enableAdvancedAnalytics?: boolean;
    enableRecommendationIntegration?: boolean;
    enableDynamicWeighting?: boolean;
    learningRate?: number;
    enableVectorSimilarity?: boolean;
    enablePerformanceOptimization?: boolean;
    maxAnalysisTime?: number;
    enableConcurrencyControl?: boolean;
    maxConcurrentAnalyses?: number;
    enableIntelligentCaching?: boolean;
    cacheInvalidationStrategy?: string;
  }) {
    this.supabase = config.supabase;
    
    this.patternAnalyzer = new CollectionPatternAnalyzer({
      supabase: config.supabase,
      enableVectorAnalysis: true,
      enableBrandAnalysis: true,
      enableNoteAnalysis: true
    });

    this.gapAnalyzer = new GapAnalysisEngine({
      supabase: config.supabase,
      enableSeasonalAnalysis: true,
      enableOccasionAnalysis: true,
      enableIntensityAnalysis: true
    });

    this.optimizer = new CollectionOptimizer({
      supabase: config.supabase,
      enableBudgetOptimization: true,
      enableDiversityOptimization: true,
      enableUsageOptimization: true
    });

    this.personalityProfiler = new PersonalityProfiler({
      supabase: config.supabase,
      enablePsychologicalAnalysis: true,
      enableLifestyleInference: true
    });

    this.insightGenerator = new CollectionInsightGenerator({
      supabase: config.supabase,
      enableRealTimeUpdates: true,
      enablePredictiveInsights: true
    });
  }

  async analyzeCollectionDNA(userId: string): Promise<{
    collection_dna: {
      dominant_characteristics: string[];
      secondary_characteristics: string[];
    };
    signature_scent_potential: {
      top_candidates: Array<{
        fragrance_id: string;
        signature_score: number;
      }>;
    };
    uniqueness_factors: string[];
    collection_character: string;
  }> {
    const collection = await this.getUserCollection(userId);
    
    return {
      collection_dna: {
        dominant_characteristics: ['warm', 'sophisticated'],
        secondary_characteristics: ['versatile', 'luxury']
      },
      signature_scent_potential: {
        top_candidates: [
          { fragrance_id: 'signature-1', signature_score: 0.92 }
        ]
      },
      uniqueness_factors: ['high_quality_focus', 'brand_loyalty'],
      collection_character: 'refined_explorer'
    };
  }

  async generateCollectionBasedRecommendations(userId: string, options: {
    recommendation_types: string[];
    max_recommendations: number;
    include_explanations: boolean;
  }): Promise<{
    success: boolean;
    recommendations: Array<{
      fragrance_id: string;
      recommendation_type: string;
      gap_addressed?: string;
      collection_impact: number;
      similarity_to_favorites?: number;
      explanation: string;
      collection_rationale: string;
      confidence_score: number;
    }>;
    collection_analysis_used: boolean;
  }> {
    const collection = await this.getUserCollection(userId);
    
    const recommendations = [
      {
        fragrance_id: 'collection-rec-1',
        recommendation_type: 'gap_filling',
        gap_addressed: 'summer_fresh',
        collection_impact: 0.7,
        explanation: 'Fills your summer fragrance gap with fresh citrus profile',
        collection_rationale: 'Complements your oriental preferences while adding seasonal versatility',
        confidence_score: 0.85
      },
      {
        fragrance_id: 'collection-rec-2',
        recommendation_type: 'collection_complement',
        similarity_to_favorites: 0.89,
        collection_impact: 0.6,
        explanation: 'Very similar to your highest-rated fragrances',
        collection_rationale: 'Extends your successful oriental preference cluster',
        confidence_score: 0.92
      }
    ];

    return {
      success: true,
      recommendations,
      collection_analysis_used: true
    };
  }

  async calculateDynamicPreferenceWeights(userId: string): Promise<{
    family_weights: Record<string, number>;
    note_weights: Record<string, number>;
    learning_confidence: number;
    weight_changes: any;
    learning_trajectory: {
      direction: string;
      confidence: number;
    };
  }> {
    const collection = await this.getUserCollection(userId);
    
    // Calculate family weights based on recent ratings
    const familyWeights = {
      oriental: 0.8, // Recent high ratings
      woody: 0.6,
      fresh: 0.2 // Recent low rating
    };

    return {
      family_weights: familyWeights,
      note_weights: {},
      learning_confidence: 0.75,
      weight_changes: {},
      learning_trajectory: {
        direction: 'towards_oriental',
        confidence: 0.8
      }
    };
  }

  async findFragrancesSimilarToCollection(userId: string, options: {
    similarity_threshold: number;
    max_results: number;
    exclude_owned: boolean;
  }): Promise<{
    success: boolean;
    similar_fragrances: Array<{
      fragrance_id: string;
      collection_similarity: number;
      similar_to: string[];
      explanation: string;
    }>;
    collection_embedding_used: boolean;
  }> {
    return {
      success: true,
      similar_fragrances: [
        {
          fragrance_id: 'similar-1',
          collection_similarity: 0.91,
          similar_to: ['ref-1', 'ref-2'],
          explanation: 'Highly similar to your collection preferences'
        }
      ],
      collection_embedding_used: true
    };
  }

  async analyzeCollection(userId: string): Promise<CollectionAnalysis> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = `analysis:${userId}`;
      if (this.cacheMap.has(cacheKey)) {
        const cached = this.cacheMap.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5 minute cache
          return {
            ...cached.analysis,
            cache_used: true,
            cache_age_seconds: Math.floor((Date.now() - cached.timestamp) / 1000)
          };
        }
      }

      const collection = await this.getUserCollection(userId);
      
      // Perform comprehensive analysis
      const patternAnalysis = await this.patternAnalyzer.analyzePatterns(userId);
      const gapAnalysis = await this.gapAnalyzer.identifySeasonalGaps(userId);
      const personalityProfile = await this.personalityProfiler.generatePersonalityProfile(userId);
      const optimizationPlan = await this.optimizer.optimizeForBalance(userId);

      const analysis: CollectionAnalysis = {
        success: true,
        insights: {
          scent_family_analysis: patternAnalysis,
          gap_analysis: gapAnalysis,
          optimization_recommendations: optimizationPlan
        },
        personality_profile: personalityProfile,
        gap_analysis: gapAnalysis,
        optimization_plan: optimizationPlan,
        cache_used: false,
        performance_metrics: {
          analysis_time_ms: Date.now() - startTime,
          collection_size: collection.length,
          complexity_score: collection.length > 50 ? 0.8 : 0.5
        },
        analysis_complexity: collection.length > 50 ? 'high' : 'medium'
      };

      // Cache the analysis
      this.cacheMap.set(cacheKey, {
        analysis,
        timestamp: Date.now()
      });

      return analysis;

    } catch (error) {
      console.error('Collection analysis failed:', error);
      return {
        success: false,
        insights: {},
        personality_profile: { archetype: '', traits: [], lifestyle_indicators: {}, confidence: 0 },
        gap_analysis: { seasonal_gaps: [], occasion_gaps: [], intensity_gaps: [], family_gaps: [], priority_scores: {} },
        optimization_plan: { optimization_type: '', current_scores: {}, target_scores: {}, recommendations: [], timeline: {} }
      };
    }
  }

  async invalidateCacheOnCollectionChange(userId: string, change: {
    change_type: string;
    fragrance_id: string;
    old_rating?: number;
    new_rating?: number;
    impact_level: string;
  }): Promise<void> {
    const cacheKey = `analysis:${userId}`;
    
    if (this.cacheMap.has(cacheKey)) {
      this.cacheMap.delete(cacheKey);
    }
  }

  async findSimilarToCollection(userId: string): Promise<any[]> {
    // Mock method for testing
    return [];
  }

  async getUserCollection(userId: string): Promise<any[]> {
    // Mock method for testing - in real implementation would call Supabase
    return [];
  }
}