/**
 * User Experience Level Detection Engine
 * 
 * Analyzes user data to determine fragrance knowledge level
 * and adapt AI explanations accordingly
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type UserExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ExperienceAnalysis {
  level: UserExperienceLevel;
  confidence: number; // 0-1
  indicators: {
    hasCompletedQuiz: boolean;
    collectionSize: number;
    daysActive: number;
    engagementScore: number;
    fragranceKnowledgeSignals: string[];
  };
  recommendedExplanationStyle: ExplanationStyle;
}

export interface ExplanationStyle {
  maxWords: number;
  complexity: 'simple' | 'moderate' | 'detailed';
  includeEducation: boolean;
  useProgressiveDisclosure: boolean;
  vocabularyLevel: 'basic' | 'intermediate' | 'advanced';
}

/**
 * Detects user experience level based on behavioral signals
 */
export class UserExperienceDetector {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Analyze user experience level for adaptive explanations
   */
  async analyzeUserExperience(
    userId?: string,
    sessionData?: any
  ): Promise<ExperienceAnalysis> {
    // Default to beginner for anonymous/new users
    if (!userId) {
      return this.getBeginnerProfile(sessionData);
    }

    try {
      // Parallel data collection for efficiency
      const [profile, collections, quizData, interactions] = await Promise.all([
        this.getUserProfile(userId),
        this.getCollectionData(userId),
        this.getQuizData(userId),
        this.getInteractionData(userId),
      ]);

      // Calculate experience indicators
      const indicators = this.calculateExperienceIndicators({
        profile,
        collections,
        quizData,
        interactions,
      });

      // Determine experience level
      const level = this.determineExperienceLevel(indicators);
      
      // Calculate confidence score
      const confidence = this.calculateConfidence(indicators, level);

      return {
        level,
        confidence,
        indicators,
        recommendedExplanationStyle: this.getExplanationStyle(level, indicators),
      };
    } catch (error) {
      console.error('Experience analysis failed, defaulting to beginner:', error);
      return this.getBeginnerProfile();
    }
  }

  /**
   * Get user profile data
   */
  private async getUserProfile(userId: string) {
    const { data } = await this.supabase
      .from('user_profiles')
      .select(`
        onboarding_completed,
        quiz_completed_at,
        quiz_personality_type,
        personality_confidence,
        created_at
      `)
      .eq('id', userId)
      .single();

    return data;
  }

  /**
   * Get user collection data
   */
  private async getCollectionData(userId: string) {
    const { data } = await this.supabase
      .from('user_collections')
      .select(`
        collection_type,
        created_at,
        rating,
        notes
      `)
      .eq('user_id', userId);

    return data || [];
  }

  /**
   * Get quiz completion data
   */
  private async getQuizData(userId: string) {
    const { data } = await this.supabase
      .from('user_fragrance_personalities')
      .select(`
        personality_type,
        confidence_score,
        quiz_version,
        ai_enhanced,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    return data?.[0];
  }

  /**
   * Get interaction data (future: wishlist actions, reviews, etc.)
   */
  private async getInteractionData(userId: string) {
    // Placeholder for future interaction tracking
    // Could include: review writing, detailed searches, filter usage
    return {
      reviewsWritten: 0,
      complexSearches: 0,
      filterUsage: 0,
    };
  }

  /**
   * Calculate experience indicators from user data
   */
  private calculateExperienceIndicators(data: {
    profile: any;
    collections: any[];
    quizData: any;
    interactions: any;
  }) {
    const { profile, collections, quizData, interactions } = data;
    
    // Calculate days active
    const daysActive = profile?.created_at 
      ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Collection analysis
    const collectionSize = collections.length;
    const hasDetailedNotes = collections.some(c => c.notes && c.notes.length > 50);
    const hasRatings = collections.some(c => c.rating);
    
    // Knowledge signals from text analysis
    const fragranceKnowledgeSignals: string[] = [];
    if (hasDetailedNotes) fragranceKnowledgeSignals.push('detailed_notes');
    if (hasRatings) fragranceKnowledgeSignals.push('rating_behavior');
    if (quizData?.ai_enhanced) fragranceKnowledgeSignals.push('quiz_completion');

    // Engagement calculation
    const engagementScore = this.calculateEngagementScore({
      daysActive,
      collectionSize,
      hasCompletedQuiz: !!profile?.quiz_completed_at,
      interactionCount: interactions.reviewsWritten + interactions.complexSearches,
    });

    return {
      hasCompletedQuiz: !!profile?.quiz_completed_at,
      collectionSize,
      daysActive,
      engagementScore,
      fragranceKnowledgeSignals,
    };
  }

  /**
   * Calculate user engagement score (0-1)
   */
  private calculateEngagementScore(factors: {
    daysActive: number;
    collectionSize: number;
    hasCompletedQuiz: boolean;
    interactionCount: number;
  }): number {
    const { daysActive, collectionSize, hasCompletedQuiz, interactionCount } = factors;
    
    let score = 0;
    
    // Time-based engagement (max 0.3)
    score += Math.min(daysActive / 30, 1) * 0.3;
    
    // Collection engagement (max 0.4)
    score += Math.min(collectionSize / 20, 1) * 0.4;
    
    // Quiz completion (0.2)
    score += hasCompletedQuiz ? 0.2 : 0;
    
    // Interaction engagement (max 0.1)
    score += Math.min(interactionCount / 10, 1) * 0.1;
    
    return Math.min(score, 1);
  }

  /**
   * Determine experience level from indicators
   */
  private determineExperienceLevel(indicators: any): UserExperienceLevel {
    const { collectionSize, daysActive, engagementScore, fragranceKnowledgeSignals } = indicators;
    
    // Advanced user criteria
    if (
      collectionSize >= 10 && 
      daysActive >= 30 && 
      engagementScore >= 0.7 &&
      fragranceKnowledgeSignals.length >= 2
    ) {
      return 'advanced';
    }
    
    // Intermediate user criteria  
    if (
      (collectionSize >= 3 && daysActive >= 7) ||
      (engagementScore >= 0.4 && fragranceKnowledgeSignals.length >= 1)
    ) {
      return 'intermediate';
    }
    
    // Default to beginner
    return 'beginner';
  }

  /**
   * Calculate confidence in experience level determination
   */
  private calculateConfidence(indicators: any, level: UserExperienceLevel): number {
    const { collectionSize, daysActive, engagementScore } = indicators;
    
    // More data = higher confidence
    let confidence = 0.5; // Base confidence
    
    if (collectionSize > 0) confidence += 0.15;
    if (daysActive > 0) confidence += 0.15;
    if (engagementScore > 0.3) confidence += 0.2;
    
    return Math.min(confidence, 0.95); // Cap at 95%
  }

  /**
   * Get explanation style based on experience level
   */
  private getExplanationStyle(
    level: UserExperienceLevel, 
    indicators: any
  ): ExplanationStyle {
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
   * Default beginner profile for new/anonymous users
   */
  private getBeginnerProfile(sessionData?: any): ExperienceAnalysis {
    return {
      level: 'beginner',
      confidence: 0.9, // High confidence for new users
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
   * Quick experience level check (cached version for performance)
   */
  async getExperienceLevel(userId?: string): Promise<UserExperienceLevel> {
    if (!userId) return 'beginner';
    
    // Could implement caching here for performance
    const analysis = await this.analyzeUserExperience(userId);
    return analysis.level;
  }
}

// Export singleton instance
export const experienceDetector = (supabase: SupabaseClient) => 
  new UserExperienceDetector(supabase);