/**
 * Direct Recommendation Engine - Task 3.2
 *
 * Simplified recommendation system that skips complex personality profiling
 * and directly generates 3 high-quality fragrance recommendations with AI insights.
 *
 * Replaces the complex MVPPersonalityEngine approach with immediate results.
 */

import { createClientSupabase } from '@/lib/supabase-client';

export interface QuizResponse {
  question_id: string;
  answer_value: string;
  timestamp: string;
  experience_level?: string;
}

export interface FragranceRecommendation {
  id: string;
  name: string;
  brand: string;
  image_url?: string;
  sample_price_usd: number;
  match_percentage: number;
  ai_insight: string;
  reasoning: string;
  confidence_level: 'high' | 'medium' | 'good';
  why_recommended: string;
  sample_available: boolean;
}

export interface RecommendationResult {
  recommendations: FragranceRecommendation[];
  quiz_session_token: string;
  total_processing_time_ms: number;
  recommendation_method: 'direct_matching';
  success: boolean;
}

/**
 * Direct Recommendation Engine
 *
 * Generates immediate fragrance recommendations without complex personality analysis
 */
export class DirectRecommendationEngine {
  private supabase: any;

  constructor() {
    this.supabase = createClientSupabase();
  }

  /**
   * Generate exactly 3 fragrance recommendations directly from quiz responses
   */
  async generateRecommendations(
    responses: QuizResponse[],
    sessionToken: string
  ): Promise<RecommendationResult> {
    const startTime = Date.now();

    try {
      if (responses.length < 3) {
        throw new Error('Insufficient quiz responses for recommendations');
      }

      // Extract user preferences directly from responses
      const preferences = this.extractPreferences(responses);

      // Get fragrance candidates from database
      const candidates = await this.getFragranceCandidates(preferences);

      // Score and select top 3 recommendations
      const scoredRecommendations = this.scoreRecommendations(
        candidates,
        preferences
      );
      const top3 = scoredRecommendations.slice(0, 3);

      // Generate AI insights for each recommendation
      const recommendationsWithInsights = await Promise.all(
        top3.map(rec => this.addAIInsight(rec, preferences))
      );

      return {
        recommendations: recommendationsWithInsights,
        quiz_session_token: sessionToken,
        total_processing_time_ms: Date.now() - startTime,
        recommendation_method: 'direct_matching',
        success: true,
      };
    } catch (error) {
      console.error('Direct recommendation generation failed:', error);

      // Fallback to popular fragrances
      const fallbackRecs = await this.getFallbackRecommendations();

      return {
        recommendations: fallbackRecs,
        quiz_session_token: sessionToken,
        total_processing_time_ms: Date.now() - startTime,
        recommendation_method: 'direct_matching',
        success: false,
      };
    }
  }

  /**
   * Extract user preferences directly from quiz responses (no personality analysis)
   */
  private extractPreferences(responses: QuizResponse[]): any {
    const preferences: any = {
      style_preferences: [],
      occasion_preferences: [],
      intensity_preference: 'moderate',
      scent_families: [],
      budget_approach: 'balanced',
    };

    responses.forEach(response => {
      switch (response.question_id) {
        case 'style':
          preferences.style_preferences.push(response.answer_value);
          break;
        case 'occasions':
          preferences.occasion_preferences.push(response.answer_value);
          break;
        case 'preferences':
          if (response.answer_value.includes('fresh')) {
            preferences.scent_families.push('fresh', 'citrus');
          } else if (response.answer_value.includes('floral')) {
            preferences.scent_families.push('floral');
          } else if (response.answer_value.includes('warm')) {
            preferences.scent_families.push('woody', 'oriental');
          } else if (response.answer_value.includes('complex')) {
            preferences.scent_families.push('oriental', 'woody');
          }
          break;
        case 'intensity':
          preferences.intensity_preference = response.answer_value;
          break;
        case 'budget':
          preferences.budget_approach = response.answer_value;
          break;
      }
    });

    return preferences;
  }

  /**
   * Get fragrance candidates from database based on preferences
   */
  private async getFragranceCandidates(preferences: any): Promise<any[]> {
    try {
      const { data: fragrances } = await this.supabase
        .from('fragrances')
        .select(
          `
          id,
          name,
          brand_id,
          scent_family,
          sample_available,
          sample_price_usd,
          popularity_score,
          rating_average,
          image_url,
          fragrance_brands:brand_id (
            name
          )
        `
        )
        .eq('sample_available', true)
        .not('sample_price_usd', 'is', null)
        .order('popularity_score', { ascending: false })
        .limit(50); // Get more candidates to choose from

      return fragrances || [];
    } catch (error) {
      console.error('Error fetching fragrance candidates:', error);
      return [];
    }
  }

  /**
   * Score recommendations based on preference matching (no personality analysis)
   */
  private scoreRecommendations(candidates: any[], preferences: any): any[] {
    return candidates
      .map(fragrance => {
        let score = 50; // Base score

        // Style preference matching
        if (
          preferences.style_preferences.includes('professional_sophisticated')
        ) {
          if (
            fragrance.scent_family?.includes('woody') ||
            fragrance.scent_family?.includes('chypre')
          ) {
            score += 20;
          }
        }

        if (preferences.style_preferences.includes('romantic_feminine')) {
          if (fragrance.scent_family?.includes('floral')) {
            score += 25;
          }
        }

        if (preferences.style_preferences.includes('casual_natural')) {
          if (
            fragrance.scent_family?.includes('fresh') ||
            fragrance.scent_family?.includes('green')
          ) {
            score += 20;
          }
        }

        if (preferences.style_preferences.includes('bold_confident')) {
          if (
            fragrance.scent_family?.includes('oriental') ||
            fragrance.scent_family?.includes('spicy')
          ) {
            score += 25;
          }
        }

        // Scent family preferences
        preferences.scent_families.forEach((family: string) => {
          if (
            fragrance.scent_family?.toLowerCase().includes(family.toLowerCase())
          ) {
            score += 15;
          }
        });

        // Popularity and rating boost
        if (fragrance.popularity_score > 8) {
          score += 10;
        }

        if (fragrance.rating_average > 4.5) {
          score += 10;
        }

        // Sample pricing considerations
        if (preferences.budget_approach === 'budget_conscious') {
          if (fragrance.sample_price_usd <= 12) {
            score += 15;
          }
        } else if (preferences.budget_approach === 'invest_in_quality') {
          if (fragrance.sample_price_usd >= 15) {
            score += 10;
          }
        }

        return {
          ...fragrance,
          match_score: Math.min(score, 100),
          brand: fragrance.fragrance_brands?.name || 'Unknown Brand',
        };
      })
      .sort((a, b) => b.match_score - a.match_score);
  }

  /**
   * Add AI insight to each recommendation (focused, no personality analysis)
   */
  private async addAIInsight(
    recommendation: any,
    preferences: any
  ): Promise<FragranceRecommendation> {
    // Generate personalized AI insight based on quiz responses
    const insight = this.generatePersonalizedInsight(
      recommendation,
      preferences
    );
    const reasoning = this.generateReasoning(recommendation, preferences);

    return {
      id: recommendation.id,
      name: recommendation.name,
      brand: recommendation.brand,
      image_url: recommendation.image_url,
      sample_price_usd: recommendation.sample_price_usd,
      match_percentage: recommendation.match_score,
      ai_insight: insight,
      reasoning: reasoning,
      confidence_level:
        recommendation.match_score > 85
          ? 'high'
          : recommendation.match_score > 75
            ? 'medium'
            : 'good',
      why_recommended: this.getWhyRecommended(recommendation, preferences),
      sample_available: recommendation.sample_available,
    };
  }

  /**
   * Generate personalized AI insight (simple but effective)
   */
  private generatePersonalizedInsight(
    fragrance: any,
    preferences: any
  ): string {
    const insights = [];

    // Style-based insights
    if (preferences.style_preferences.includes('professional_sophisticated')) {
      insights.push('Perfect for your elegant and sophisticated style.');
    } else if (preferences.style_preferences.includes('romantic_feminine')) {
      insights.push('Beautiful choice for your romantic sensibilities.');
    } else if (preferences.style_preferences.includes('casual_natural')) {
      insights.push('Ideal for your fresh and natural approach.');
    } else if (preferences.style_preferences.includes('bold_confident')) {
      insights.push('Excellent match for your bold and confident personality.');
    }

    // Scent family insights
    if (fragrance.scent_family?.includes('floral')) {
      insights.push(
        'The floral notes will complement your preference perfectly.'
      );
    } else if (fragrance.scent_family?.includes('woody')) {
      insights.push(
        'The woody composition aligns beautifully with your taste.'
      );
    } else if (fragrance.scent_family?.includes('fresh')) {
      insights.push('The fresh quality matches your style wonderfully.');
    } else if (fragrance.scent_family?.includes('oriental')) {
      insights.push('The rich oriental blend suits your preferences ideally.');
    }

    return (
      insights.slice(0, 2).join(' ') ||
      'This fragrance perfectly matches your quiz responses.'
    );
  }

  /**
   * Generate clear reasoning for recommendation
   */
  private generateReasoning(fragrance: any, preferences: any): string {
    const reasons = [];

    if (preferences.style_preferences.length > 0) {
      reasons.push(
        `Your quiz responses indicate a preference for ${preferences.style_preferences[0].replace('_', ' ')} scents.`
      );
    }

    if (fragrance.scent_family) {
      reasons.push(
        `${fragrance.name}'s ${fragrance.scent_family} composition matches this perfectly.`
      );
    }

    if (fragrance.popularity_score > 8) {
      reasons.push(
        'This fragrance is highly rated by users with similar preferences.'
      );
    }

    return (
      reasons.join(' ') ||
      'Based on your answers, this fragrance aligns well with your taste.'
    );
  }

  /**
   * Get simple "why recommended" explanation
   */
  private getWhyRecommended(fragrance: any, preferences: any): string {
    if (preferences.style_preferences.includes('professional_sophisticated')) {
      return 'Matches your sophisticated style';
    } else if (preferences.style_preferences.includes('romantic_feminine')) {
      return 'Perfect for romantic occasions';
    } else if (preferences.style_preferences.includes('casual_natural')) {
      return 'Great for everyday wear';
    } else if (preferences.style_preferences.includes('bold_confident')) {
      return 'Bold and memorable as you wanted';
    }

    return 'Matches your preferences';
  }

  /**
   * Fallback recommendations (popular, safe choices)
   */
  private async getFallbackRecommendations(): Promise<
    FragranceRecommendation[]
  > {
    try {
      const { data: popular } = await this.supabase
        .from('fragrances')
        .select(
          `
          id,
          name,
          brand_id,
          scent_family,
          sample_available,
          sample_price_usd,
          popularity_score,
          image_url,
          fragrance_brands:brand_id (name)
        `
        )
        .eq('sample_available', true)
        .order('popularity_score', { ascending: false })
        .limit(3);

      if (!popular) return [];

      return popular.map((frag, index) => ({
        id: frag.id,
        name: frag.name,
        brand: frag.fragrance_brands?.name || 'Unknown Brand',
        image_url: frag.image_url,
        sample_price_usd: frag.sample_price_usd,
        match_percentage: 80 - index * 5, // 80%, 75%, 70%
        ai_insight:
          'This popular fragrance is loved by many users and makes an excellent starting point for your fragrance journey.',
        reasoning:
          'Selected based on high user ratings and broad appeal to help you discover your preferences.',
        confidence_level: 'good' as const,
        why_recommended: 'Popular and well-reviewed',
        sample_available: frag.sample_available,
      }));
    } catch (error) {
      console.error('Error getting fallback recommendations:', error);
      return [];
    }
  }
}
