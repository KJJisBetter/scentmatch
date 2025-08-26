'use server';

import { unstable_rethrow } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { collectionInsightsEngine } from '@/lib/services/collection-insights-engine';
import { analyticsCache, cacheUtils } from '@/lib/utils/analytics-cache';
import type { 
  CollectionInsights, 
  CollectionInsightsResponse,
  InsightType 
} from '@/lib/types/collection-analytics';

/**
 * Collection Insights Server Actions - Task 2.3 (Phase 1B)
 * 
 * Server Actions for advanced collection insights with caching and performance optimization.
 * Provides deep analytics about user preferences, discovery patterns, and social context.
 */

/**
 * Get comprehensive collection insights with advanced analytics
 */
export async function getAdvancedCollectionInsights(
  forceRefresh = false
): Promise<CollectionInsightsResponse> {
  try {
    const supabase = await createServerSupabase();
    
    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Use advanced caching with background refresh
    const cacheKey = cacheUtils.createKey(user.id, 'comprehensive_insights');
    const cacheOptions = {
      force_refresh: forceRefresh,
      ttl: 1800, // 30 minutes for comprehensive insights
      background_refresh: true
    };

    const result = await analyticsCache.getOrGenerate(
      cacheKey,
      () => collectionInsightsEngine.generateComprehensiveInsights(user.id),
      cacheOptions
    );

    // Schedule background refresh if cache was used
    if (result.cached && !forceRefresh) {
      analyticsCache.scheduleBackgroundRefresh(
        cacheKey,
        () => collectionInsightsEngine.generateComprehensiveInsights(user.id),
        { ttl: 1800 }
      );
    }

    return {
      success: true,
      data: result.data,
      cached: result.cached,
      generated_at: new Date().toISOString(),
      performance: result.performance
    };

  } catch (error) {
    console.error('Advanced collection insights error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      error: 'Failed to generate advanced collection insights'
    };
  }
}

/**
 * Get specific insight type for targeted analysis
 */
export async function getSpecificInsight(
  insightType: InsightType,
  forceRefresh = false
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  cached?: boolean;
}> {
  try {
    const supabase = await createServerSupabase();
    
    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    const cacheKey = cacheUtils.createKey(user.id, insightType);
    const cacheOptions = {
      force_refresh: forceRefresh,
      ttl: cacheUtils.calculateTTL(insightType)
    };

    let generator;
    
    // Select appropriate generator based on insight type
    switch (insightType) {
      case 'scent_profile_analysis':
        generator = async () => {
          const insights = await collectionInsightsEngine.generateComprehensiveInsights(user.id);
          return insights.scent_profile_analysis;
        };
        break;
        
      case 'social_context':
        generator = async () => {
          const insights = await collectionInsightsEngine.generateComprehensiveInsights(user.id);
          return insights.social_context;
        };
        break;
        
      case 'discovery_patterns':
        generator = async () => {
          const insights = await collectionInsightsEngine.generateComprehensiveInsights(user.id);
          return insights.discovery_stats;
        };
        break;
        
      default:
        // For other types, generate full insights and extract the requested part
        generator = async () => {
          const insights = await collectionInsightsEngine.generateComprehensiveInsights(user.id);
          return insights;
        };
    }

    const result = await analyticsCache.getOrGenerate(cacheKey, generator, cacheOptions);

    return {
      success: true,
      data: result.data,
      cached: result.cached
    };

  } catch (error) {
    console.error('Specific insight error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      error: 'Failed to generate specific insight'
    };
  }
}

/**
 * Refresh all insights for a user (admin/maintenance function)
 */
export async function refreshAllInsights(): Promise<{
  success: boolean;
  insights_refreshed?: string[];
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();
    
    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Clear cache for all insight types
    await analyticsCache.clearUserCache(user.id);

    // Trigger regeneration of key insights
    const insightTypes: InsightType[] = [
      'comprehensive_insights',
      'scent_profile_analysis',
      'social_context',
      'discovery_patterns'
    ];

    // Generate fresh insights in background
    const refreshPromises = insightTypes.map(async (type) => {
      try {
        await getSpecificInsight(type, true);
        return type;
      } catch (error) {
        console.warn(`Failed to refresh ${type}:`, error);
        return null;
      }
    });

    const refreshedInsights = (await Promise.all(refreshPromises))
      .filter(Boolean) as string[];

    return {
      success: true,
      insights_refreshed: refreshedInsights
    };

  } catch (error) {
    console.error('Refresh all insights error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      error: 'Failed to refresh insights'
    };
  }
}

/**
 * Get insights performance metrics for monitoring
 */
export async function getInsightsPerformanceMetrics(): Promise<{
  success: boolean;
  metrics?: {
    cache_stats: any;
    recent_generation_times: number[];
    cache_hit_ratio: number;
    total_cached_insights: number;
  };
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();
    
    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    const cacheStats = await analyticsCache.getCacheStats(user.id);

    // Get recent performance data
    const { data: recentInsights } = await supabase
      .from('collection_insights_cache')
      .select('generation_time_ms, generated_at')
      .eq('user_id', user.id)
      .gte('generated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('generated_at', { ascending: false });

    const recentGenerationTimes = recentInsights?.map(i => i.generation_time_ms) || [];
    const cacheHitRatio = cacheStats.total_entries > 0 
      ? ((cacheStats.total_entries - cacheStats.expired_entries) / cacheStats.total_entries)
      : 0;

    return {
      success: true,
      metrics: {
        cache_stats: cacheStats,
        recent_generation_times: recentGenerationTimes,
        cache_hit_ratio: Math.round(cacheHitRatio * 100),
        total_cached_insights: cacheStats.total_entries
      }
    };

  } catch (error) {
    console.error('Insights performance metrics error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      error: 'Failed to get performance metrics'
    };
  }
}

/**
 * Predict user preferences for new fragrances
 */
export async function predictFragranceCompatibility(
  fragranceIds: string[]
): Promise<{
  success: boolean;
  predictions?: Array<{
    fragrance_id: string;
    compatibility_score: number;
    confidence_level: 'high' | 'medium' | 'low';
    reasoning: string[];
  }>;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();
    
    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Get user's collection insights
    const insightsResult = await getAdvancedCollectionInsights();
    
    if (!insightsResult.success || !insightsResult.data) {
      return {
        success: false,
        error: 'Could not analyze user preferences'
      };
    }

    const insights = insightsResult.data;

    // Get target fragrances data
    const { data: targetFragrances, error: fragranceError } = await supabase
      .from('fragrances')
      .select(`
        id,
        name,
        scent_family,
        main_accords,
        season_tags,
        personality_tags,
        rating_value,
        fragrance_brands!inner(name)
      `)
      .in('id', fragranceIds);

    if (fragranceError || !targetFragrances) {
      return {
        success: false,
        error: 'Could not fetch fragrance data'
      };
    }

    // Calculate compatibility scores
    const predictions = targetFragrances.map(fragrance => {
      const compatibility = this.calculateCompatibilityScore(fragrance, insights);
      
      return {
        fragrance_id: fragrance.id,
        compatibility_score: compatibility.score,
        confidence_level: compatibility.confidence,
        reasoning: compatibility.reasoning
      };
    });

    return {
      success: true,
      predictions
    };

  } catch (error) {
    console.error('Fragrance compatibility prediction error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      error: 'Failed to predict fragrance compatibility'
    };
  }
}

/**
 * Calculate compatibility score between fragrance and user preferences
 */
function calculateCompatibilityScore(
  fragrance: any, 
  insights: CollectionInsights
): {
  score: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string[];
} {
  let score = 50; // Base score
  const reasoning: string[] = [];
  let confidenceFactors = 0;

  // Scent family compatibility
  const userFamilies = insights.scent_profile_analysis.dominant_families;
  if (userFamilies.includes(fragrance.scent_family)) {
    score += 20;
    reasoning.push(`Matches your favorite ${fragrance.scent_family} family`);
    confidenceFactors++;
  }

  // Accord compatibility
  const userAccords = insights.scent_profile_analysis.accord_preferences || [];
  const fragranceAccords = fragrance.main_accords || [];
  const accordMatches = fragranceAccords.filter((accord: string) =>
    userAccords.some(userAccord => userAccord.accord === accord)
  );
  
  if (accordMatches.length > 0) {
    score += accordMatches.length * 5;
    reasoning.push(`Contains ${accordMatches.length} of your preferred accords`);
    confidenceFactors++;
  }

  // Seasonal compatibility
  const userSeasons = insights.scent_profile_analysis.seasonal_patterns
    .filter(p => p.preference_strength > 0.3)
    .map(p => p.season);
  const fragranceSeasons = fragrance.season_tags || [];
  const seasonMatches = fragranceSeasons.filter((season: string) => userSeasons.includes(season));
  
  if (seasonMatches.length > 0) {
    score += 10;
    reasoning.push(`Suitable for your preferred ${seasonMatches[0]} season`);
    confidenceFactors++;
  }

  // Rating compatibility (compare to similar fragrances in collection)
  if (fragrance.rating_value && fragrance.rating_value >= 4.0) {
    score += 10;
    reasoning.push('Highly rated by the community');
    confidenceFactors++;
  }

  // Complexity preference
  const fragranceComplexity = (fragrance.main_accords || []).length;
  const userComplexityPref = insights.scent_profile_analysis.complexity_preference;
  
  const complexityMatch = 
    (userComplexityPref === 'simple' && fragranceComplexity <= 3) ||
    (userComplexityPref === 'complex' && fragranceComplexity >= 6) ||
    (userComplexityPref === 'varied');
    
  if (complexityMatch) {
    score += 5;
    reasoning.push(`Matches your ${userComplexityPref} complexity preference`);
  }

  // Cap score at 100
  score = Math.min(100, score);

  // Determine confidence level
  const confidence = 
    confidenceFactors >= 3 ? 'high' :
    confidenceFactors >= 2 ? 'medium' :
    'low';

  return { score, confidence, reasoning };
}