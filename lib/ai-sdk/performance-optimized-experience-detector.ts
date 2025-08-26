/**
 * Performance-Optimized User Experience Detector
 * 
 * Heavily optimized version with caching, batched queries, and minimal database calls
 * Designed for sub-200ms experience level detection with adaptive explanations
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { educationCache } from '@/lib/education/cache-manager';
import type { UserExperienceLevel, ExperienceAnalysis, ExplanationStyle } from './user-experience-detector';

export interface OptimizedExperienceAnalysis extends ExperienceAnalysis {
  cachingUsed: boolean;
  processingTimeMs: number;
  queryCount: number;
}

export interface BatchExperienceRequest {
  userId: string;
  sessionData?: any;
}

/**
 * High-performance experience detector with aggressive caching
 */
export class PerformanceOptimizedExperienceDetector {
  private supabase: SupabaseClient;
  private batchRequestQueue: BatchExperienceRequest[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Analyze user experience with aggressive caching and optimization
   */
  async analyzeUserExperience(
    userId?: string,
    sessionData?: any
  ): Promise<OptimizedExperienceAnalysis> {
    const startTime = performance.now();
    let queryCount = 0;
    const cachingUsed = false;

    // Return cached beginner profile for anonymous users instantly
    if (!userId) {
      return {
        ...this.getBeginnerProfile(sessionData),
        cachingUsed: false,
        processingTimeMs: performance.now() - startTime,
        queryCount: 0,
      };
    }

    // Check cache first for authenticated users
    const cacheKey = `experience_${userId}`;
    const cached = educationCache.get<ExperienceAnalysis>(cacheKey);
    
    if (cached) {
      return {
        ...cached,
        cachingUsed: true,
        processingTimeMs: performance.now() - startTime,
        queryCount: 0,
      };
    }

    try {
      // Single optimized query combining all needed data
      const { data: userData, error } = await this.supabase
        .from('user_profiles')
        .select(`
          id,
          onboarding_completed,
          quiz_completed_at,
          quiz_personality_type,
          personality_confidence,
          created_at,
          user_collections!inner(collection_type, created_at, rating, notes),
          user_fragrance_personalities!inner(
            personality_type,
            confidence_score,
            quiz_version,
            ai_enhanced,
            created_at
          )
        `)
        .eq('id', userId)
        .single();

      queryCount = 1;

      if (error || !userData) {
        // Fallback to beginner with caching
        const result = this.getBeginnerProfile();
        educationCache.set(cacheKey, result, 300000); // 5 min cache
        
        return {
          ...result,
          cachingUsed: false,
          processingTimeMs: performance.now() - startTime,
          queryCount,
        };
      }

      // Process data efficiently
      const indicators = this.calculateExperienceIndicatorsOptimized(userData);
      const level = this.determineExperienceLevel(indicators);
      const confidence = this.calculateConfidence(indicators, level);

      const result: ExperienceAnalysis = {
        level,
        confidence,
        indicators,
        recommendedExplanationStyle: this.getExplanationStyle(level, indicators),
      };

      // Cache result for 30 minutes
      educationCache.set(cacheKey, result, 1800000);
      
      return {
        ...result,
        cachingUsed: false,
        processingTimeMs: performance.now() - startTime,
        queryCount,
      };

    } catch (error) {
      console.error('Optimized experience analysis failed:', error);
      const result = this.getBeginnerProfile();
      
      return {
        ...result,
        cachingUsed: false,
        processingTimeMs: performance.now() - startTime,
        queryCount,
      };
    }
  }

  /**
   * Batch analyze multiple users for efficiency
   */
  async batchAnalyzeUsers(requests: BatchExperienceRequest[]): Promise<Map<string, OptimizedExperienceAnalysis>> {
    const results = new Map<string, OptimizedExperienceAnalysis>();
    const startTime = performance.now();

    // Check cache for all users first
    const uncachedRequests: BatchExperienceRequest[] = [];
    
    for (const request of requests) {
      const cacheKey = `experience_${request.userId}`;
      const cached = educationCache.get<ExperienceAnalysis>(cacheKey);
      
      if (cached) {
        results.set(request.userId, {
          ...cached,
          cachingUsed: true,
          processingTimeMs: 0,
          queryCount: 0,
        });
      } else {
        uncachedRequests.push(request);
      }
    }

    if (uncachedRequests.length === 0) {
      return results;
    }

    // Single batch query for all uncached users
    const userIds = uncachedRequests.map(r => r.userId);
    
    try {
      const { data: usersData, error } = await this.supabase
        .from('user_profiles')
        .select(`
          id,
          onboarding_completed,
          quiz_completed_at,
          quiz_personality_type,
          personality_confidence,
          created_at,
          user_collections!inner(collection_type, created_at, rating, notes),
          user_fragrance_personalities!inner(
            personality_type,
            confidence_score,
            quiz_version,
            ai_enhanced,
            created_at
          )
        `)
        .in('id', userIds);

      if (!error && usersData) {
        // Process each user's data
        for (const userData of usersData) {
          const indicators = this.calculateExperienceIndicatorsOptimized(userData);
          const level = this.determineExperienceLevel(indicators);
          const confidence = this.calculateConfidence(indicators, level);

          const result: ExperienceAnalysis = {
            level,
            confidence,
            indicators,
            recommendedExplanationStyle: this.getExplanationStyle(level, indicators),
          };

          // Cache result
          const cacheKey = `experience_${userData.id}`;
          educationCache.set(cacheKey, result, 1800000);

          results.set(userData.id, {
            ...result,
            cachingUsed: false,
            processingTimeMs: performance.now() - startTime,
            queryCount: 1,
          });
        }
      }

      // Add beginner profiles for any missing users
      for (const request of uncachedRequests) {
        if (!results.has(request.userId)) {
          const beginnerResult = this.getBeginnerProfile(request.sessionData);
          results.set(request.userId, {
            ...beginnerResult,
            cachingUsed: false,
            processingTimeMs: performance.now() - startTime,
            queryCount: 1,
          });
        }
      }

    } catch (error) {
      console.error('Batch experience analysis failed:', error);
      
      // Fallback to beginner for all failed requests
      for (const request of uncachedRequests) {
        if (!results.has(request.userId)) {
          const beginnerResult = this.getBeginnerProfile(request.sessionData);
          results.set(request.userId, {
            ...beginnerResult,
            cachingUsed: false,
            processingTimeMs: performance.now() - startTime,
            queryCount: 0,
          });
        }
      }
    }

    return results;
  }

  /**
   * Super fast experience level check with caching
   */
  async getExperienceLevelFast(userId?: string): Promise<UserExperienceLevel> {
    if (!userId) return 'beginner';
    
    const cacheKey = `level_${userId}`;
    const cached = educationCache.get<UserExperienceLevel>(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Quick query for just experience indicators
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select(`
          quiz_completed_at,
          created_at,
          user_collections!inner(count)
        `)
        .eq('id', userId)
        .single();

      if (error || !data) {
        return 'beginner';
      }

      // Fast determination based on minimal data
      const daysActive = data.created_at 
        ? Math.floor((Date.now() - new Date(data.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      const collectionSize = data.user_collections?.length || 0;
      const hasCompletedQuiz = !!data.quiz_completed_at;

      let level: UserExperienceLevel = 'beginner';
      
      if (collectionSize >= 10 && daysActive >= 30 && hasCompletedQuiz) {
        level = 'advanced';
      } else if (collectionSize >= 3 && daysActive >= 7) {
        level = 'intermediate';
      }

      // Cache for 1 hour
      educationCache.set(cacheKey, level, 3600000);
      
      return level;

    } catch (error) {
      console.error('Fast experience level check failed:', error);
      return 'beginner';
    }
  }

  /**
   * Optimized indicator calculation from joined data
   */
  private calculateExperienceIndicatorsOptimized(userData: any) {
    const daysActive = userData.created_at 
      ? Math.floor((Date.now() - new Date(userData.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const collections = userData.user_collections || [];
    const collectionSize = collections.length;
    const hasDetailedNotes = collections.some((c: any) => c.notes && c.notes.length > 50);
    const hasRatings = collections.some((c: any) => c.rating);
    
    const fragranceKnowledgeSignals: string[] = [];
    if (hasDetailedNotes) fragranceKnowledgeSignals.push('detailed_notes');
    if (hasRatings) fragranceKnowledgeSignals.push('rating_behavior');
    if (userData.quiz_completed_at) fragranceKnowledgeSignals.push('quiz_completion');

    const engagementScore = this.calculateEngagementScore({
      daysActive,
      collectionSize,
      hasCompletedQuiz: !!userData.quiz_completed_at,
      interactionCount: 0, // Could be enhanced with more data
    });

    return {
      hasCompletedQuiz: !!userData.quiz_completed_at,
      collectionSize,
      daysActive,
      engagementScore,
      fragranceKnowledgeSignals,
    };
  }

  /**
   * Calculate engagement score (reused from original)
   */
  private calculateEngagementScore(factors: {
    daysActive: number;
    collectionSize: number;
    hasCompletedQuiz: boolean;
    interactionCount: number;
  }): number {
    const { daysActive, collectionSize, hasCompletedQuiz, interactionCount } = factors;
    
    let score = 0;
    score += Math.min(daysActive / 30, 1) * 0.3;
    score += Math.min(collectionSize / 20, 1) * 0.4;
    score += hasCompletedQuiz ? 0.2 : 0;
    score += Math.min(interactionCount / 10, 1) * 0.1;
    
    return Math.min(score, 1);
  }

  /**
   * Determine experience level (reused from original)
   */
  private determineExperienceLevel(indicators: any): UserExperienceLevel {
    const { collectionSize, daysActive, engagementScore, fragranceKnowledgeSignals } = indicators;
    
    if (
      collectionSize >= 10 && 
      daysActive >= 30 && 
      engagementScore >= 0.7 &&
      fragranceKnowledgeSignals.length >= 2
    ) {
      return 'advanced';
    }
    
    if (
      (collectionSize >= 3 && daysActive >= 7) ||
      (engagementScore >= 0.4 && fragranceKnowledgeSignals.length >= 1)
    ) {
      return 'intermediate';
    }
    
    return 'beginner';
  }

  /**
   * Calculate confidence (reused from original)
   */
  private calculateConfidence(indicators: any, level: UserExperienceLevel): number {
    const { collectionSize, daysActive, engagementScore } = indicators;
    
    let confidence = 0.5;
    if (collectionSize > 0) confidence += 0.15;
    if (daysActive > 0) confidence += 0.15;
    if (engagementScore > 0.3) confidence += 0.2;
    
    return Math.min(confidence, 0.95);
  }

  /**
   * Get explanation style (reused from original)
   */
  private getExplanationStyle(level: UserExperienceLevel, indicators: any): ExplanationStyle {
    switch (level) {
      case 'beginner':
        return {
          maxWords: 35,
          complexity: 'simple',
          includeEducation: true,
          useProgressiveDisclosure: true,
          vocabularyLevel: 'basic',
        };
      
      case 'intermediate':
        return {
          maxWords: 60,
          complexity: 'moderate',
          includeEducation: false,
          useProgressiveDisclosure: true,
          vocabularyLevel: 'intermediate',
        };
      
      case 'advanced':
        return {
          maxWords: 100,
          complexity: 'detailed',
          includeEducation: false,
          useProgressiveDisclosure: false,
          vocabularyLevel: 'advanced',
        };
    }
  }

  /**
   * Default beginner profile
   */
  private getBeginnerProfile(sessionData?: any): ExperienceAnalysis {
    return {
      level: 'beginner',
      confidence: 0.9,
      indicators: {
        hasCompletedQuiz: false,
        collectionSize: 0,
        daysActive: 0,
        engagementScore: 0,
        fragranceKnowledgeSignals: [],
      },
      recommendedExplanationStyle: {
        maxWords: 35,
        complexity: 'simple',
        includeEducation: true,
        useProgressiveDisclosure: true,
        vocabularyLevel: 'basic',
      },
    };
  }

  /**
   * Get cache performance metrics for monitoring
   */
  getCacheMetrics() {
    return educationCache.getMetrics();
  }
}

// Export singleton factory
export const createOptimizedExperienceDetector = (supabase: SupabaseClient) => 
  new PerformanceOptimizedExperienceDetector(supabase);