/**
 * Working Recommendation Engine - Task 4.4
 *
 * Fixed recommendation system that works with the existing JSON fragrance data
 * and returns exactly 3 recommendations with AI insights.
 */

import fragranceData from '@/data/fragrances.json';

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
  recommendation_method: 'json_matching';
  success: boolean;
}

/**
 * Working Recommendation Engine that uses JSON data
 */
export class WorkingRecommendationEngine {
  /**
   * Generate exactly 3 fragrance recommendations from JSON data
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

      // Clean the fragrance data first
      const cleanedFragrances = this.cleanFragranceData(fragranceData);

      // Extract user preferences from responses
      const preferences = this.extractPreferences(responses);

      // Filter suitable fragrances (have samples available)
      const suitableFragrances = cleanedFragrances.filter(
        frag => frag.sample_available && frag.sample_price_usd > 0
      );

      // Score and select top 3 recommendations
      const scoredRecommendations = this.scoreRecommendations(
        suitableFragrances,
        preferences
      );
      const top3 = scoredRecommendations.slice(0, 3);

      // Generate AI insights for each recommendation
      const recommendationsWithInsights = top3.map(rec =>
        this.addAIInsight(rec, preferences)
      );

      return {
        recommendations: recommendationsWithInsights,
        quiz_session_token: sessionToken,
        total_processing_time_ms: Date.now() - startTime,
        recommendation_method: 'json_matching',
        success: true,
      };
    } catch (error) {
      console.error('Recommendation generation failed:', error);

      // Fallback to popular fragrances
      const fallbackRecs = this.getFallbackRecommendations();

      return {
        recommendations: fallbackRecs,
        quiz_session_token: sessionToken,
        total_processing_time_ms: Date.now() - startTime,
        recommendation_method: 'json_matching',
        success: false,
      };
    }
  }

  /**
   * Clean fragrance data - remove "for Men/Women" suffixes and standardize
   */
  private cleanFragranceData(rawData: any[]): any[] {
    return rawData.map(frag => {
      const cleaned = this.cleanFragranceName(frag.name);

      return {
        id: frag.id,
        name: cleaned.name,
        brand: this.standardizeBrandName(frag.brandName),
        gender_target: cleaned.gender_target,
        scent_family: frag.accords?.[0] || 'miscellaneous',
        sample_available: true, // Assume available for MVP
        sample_price_usd: this.calculateSamplePrice(frag),
        popularity_score: frag.score || 0,
        rating_average: frag.ratingValue || 0,
        rating_count: frag.ratingCount || 0,
        accords: frag.accords || [],
      };
    });
  }

  /**
   * Clean fragrance names - remove "for Men/Women" suffixes
   */
  private cleanFragranceName(originalName: string): {
    name: string;
    gender_target: string;
  } {
    let cleanName = originalName;
    let gender = 'unisex';

    // Fix spacing issues first
    cleanName = cleanName.replace(/([a-z])for (women|men)/gi, '$1 for $2');

    // Remove "for Women" suffix
    if (cleanName.endsWith(' for Women') || cleanName.endsWith(' for women')) {
      cleanName = cleanName.replace(/ for [Ww]omen$/, '');
      gender = 'women';
    }

    // Remove "for Men" suffix
    if (cleanName.endsWith(' for Men') || cleanName.endsWith(' for men')) {
      cleanName = cleanName.replace(/ for [Mm]en$/, '');
      gender = 'men';
    }

    return {
      name: cleanName.trim(),
      gender_target: gender,
    };
  }

  /**
   * Standardize brand names
   */
  private standardizeBrandName(originalBrand: string): string {
    if (!originalBrand) return 'Unknown Brand';

    // Handle special cases
    const specialCases: { [key: string]: string } = {
      'tom ford': 'Tom Ford',
      'le labo': 'Le Labo',
      'jo malone london': 'Jo Malone London',
      'yves saint laurent': 'Yves Saint Laurent',
      'maison francis kurkdjian': 'Maison Francis Kurkdjian',
      'maison margiela': 'Maison Margiela',
    };

    const lowerBrand = originalBrand.toLowerCase();
    if (specialCases[lowerBrand]) {
      return specialCases[lowerBrand];
    }

    // Default: title case
    return originalBrand
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Calculate sample price from fragrance data
   */
  private calculateSamplePrice(fragrance: any): number {
    // Base sample price on popularity and rating
    const basePrice = 10;
    const popularityBonus = fragrance.score > 15 ? 3 : 0;
    const ratingBonus = fragrance.ratingValue > 4.5 ? 2 : 0;

    return Math.min(basePrice + popularityBonus + ratingBonus, 20);
  }

  /**
   * Extract user preferences from quiz responses
   */
  private extractPreferences(responses: QuizResponse[]): any {
    const preferences: any = {
      gender_preference: 'unisex',
      experience_level: 'enthusiast',
      style_preferences: [],
      occasion_preferences: [],
      scent_families: [],
      personality_style: '',
    };

    responses.forEach(response => {
      switch (response.question_id) {
        case 'gender_preference':
          preferences.gender_preference = response.answer_value;
          break;
        case 'experience_level':
          preferences.experience_level = response.answer_value;
          break;
        case 'scent_preferences_beginner':
        case 'scent_preferences_enthusiast':
        case 'scent_preferences_experienced':
          const scents = response.answer_value.split(',');
          preferences.scent_families.push(...scents);
          break;
        case 'personality_style':
          preferences.personality_style = response.answer_value;
          break;
        case 'occasions_beginner':
        case 'occasions_enthusiast':
        case 'occasions_experienced':
          const occasions = response.answer_value.split(',');
          preferences.occasion_preferences.push(...occasions);
          break;
      }
    });

    return preferences;
  }

  /**
   * Score recommendations based on preference matching
   */
  private scoreRecommendations(candidates: any[], preferences: any): any[] {
    return candidates
      .map(fragrance => {
        let score = 50; // Base score

        // Gender preference matching
        if (
          preferences.gender_preference === 'women' &&
          fragrance.gender_target === 'women'
        ) {
          score += 15;
        } else if (
          preferences.gender_preference === 'men' &&
          fragrance.gender_target === 'men'
        ) {
          score += 15;
        } else if (fragrance.gender_target === 'unisex') {
          score += 10; // Unisex works for everyone
        }

        // Scent family matching
        preferences.scent_families.forEach((family: string) => {
          if (
            fragrance.accords.some(
              (accord: string) =>
                accord.toLowerCase().includes(family.toLowerCase()) ||
                family.toLowerCase().includes(accord.toLowerCase())
            )
          ) {
            score += 20;
          }
        });

        // Personality style matching
        if (preferences.personality_style === 'classic_timeless') {
          // Boost classic, well-known fragrances
          if (
            fragrance.brand.includes('Chanel') ||
            fragrance.brand.includes('Dior')
          ) {
            score += 15;
          }
        } else if (preferences.personality_style === 'unique_creative') {
          // Boost niche or unique fragrances
          if (
            fragrance.brand.includes('Le Labo') ||
            fragrance.brand.includes('Tom Ford')
          ) {
            score += 15;
          }
        }

        // Popularity and rating boost
        if (fragrance.popularity_score > 15) {
          score += 10;
        }

        if (fragrance.rating_average > 4.0) {
          score += 10;
        }

        return {
          ...fragrance,
          match_score: Math.min(score, 100),
        };
      })
      .sort((a, b) => b.match_score - a.match_score);
  }

  /**
   * Add AI insight to recommendation
   */
  private addAIInsight(
    recommendation: any,
    preferences: any
  ): FragranceRecommendation {
    const insight = this.generatePersonalizedInsight(
      recommendation,
      preferences
    );
    const reasoning = this.generateReasoning(recommendation, preferences);

    return {
      id: recommendation.id,
      name: recommendation.name,
      brand: recommendation.brand,
      image_url: undefined, // JSON data doesn't have images
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
   * Generate personalized AI insight
   */
  private generatePersonalizedInsight(
    fragrance: any,
    preferences: any
  ): string {
    const insights = [];

    // Gender-based insights
    if (preferences.gender_preference === fragrance.gender_target) {
      insights.push('Perfect match for your preferences.');
    } else if (fragrance.gender_target === 'unisex') {
      insights.push('This versatile fragrance works beautifully for everyone.');
    }

    // Scent family insights
    const matchingAccords = fragrance.accords.filter((accord: string) =>
      preferences.scent_families.some(
        (family: string) =>
          accord.toLowerCase().includes(family.toLowerCase()) ||
          family.toLowerCase().includes(accord.toLowerCase())
      )
    );

    if (matchingAccords.length > 0) {
      insights.push(
        `The ${matchingAccords[0]} notes align perfectly with your taste.`
      );
    }

    // Personality style insights
    if (preferences.personality_style === 'classic_timeless') {
      insights.push('A timeless choice that never goes out of style.');
    } else if (preferences.personality_style === 'unique_creative') {
      insights.push('A distinctive choice that expresses your creativity.');
    } else if (preferences.personality_style === 'bold_confident') {
      insights.push('Bold and memorable, perfect for making an impression.');
    }

    return (
      insights.slice(0, 2).join(' ') ||
      'This fragrance matches your quiz responses beautifully.'
    );
  }

  /**
   * Generate reasoning
   */
  private generateReasoning(fragrance: any, preferences: any): string {
    const reasons = [];

    if (preferences.scent_families.length > 0) {
      reasons.push(
        `Your quiz responses show you enjoy ${preferences.scent_families[0].replace('_', ' ')} scents.`
      );
    }

    if (fragrance.accords.length > 0) {
      reasons.push(
        `${fragrance.name} features ${fragrance.accords.slice(0, 2).join(' and ')} notes that match this preference.`
      );
    }

    if (fragrance.rating_average > 4.0) {
      reasons.push(
        `It's highly rated (${fragrance.rating_average.toFixed(1)}/5) by ${fragrance.rating_count} users.`
      );
    }

    return (
      reasons.join(' ') ||
      'Based on your answers, this fragrance aligns well with your taste.'
    );
  }

  /**
   * Get "why recommended" explanation
   */
  private getWhyRecommended(fragrance: any, preferences: any): string {
    if (preferences.personality_style === 'classic_timeless') {
      return 'Classic and timeless choice';
    } else if (preferences.personality_style === 'unique_creative') {
      return 'Unique and creative expression';
    } else if (preferences.personality_style === 'bold_confident') {
      return 'Bold and confident statement';
    } else if (preferences.personality_style === 'easy_relaxed') {
      return 'Easy-going and versatile';
    }

    return 'Matches your preferences';
  }

  /**
   * Clean fragrance data helper method
   */
  private cleanFragranceData(rawData: any[]): any[] {
    return rawData.map(frag => {
      const cleaned = this.cleanFragranceName(frag.name);

      return {
        id: frag.id,
        name: cleaned.name,
        brand: this.standardizeBrandName(frag.brandName),
        gender_target: cleaned.gender_target,
        scent_family: frag.accords?.[0] || 'miscellaneous',
        sample_available: true, // Assume available for MVP
        sample_price_usd: this.calculateSamplePrice(frag),
        popularity_score: frag.score || 0,
        rating_average: frag.ratingValue || 0,
        rating_count: frag.ratingCount || 0,
        accords: frag.accords || [],
      };
    });
  }

  /**
   * Clean fragrance name helper method
   */
  private cleanFragranceName(originalName: string): {
    name: string;
    gender_target: string;
  } {
    let cleanName = originalName;
    let gender = 'unisex';

    // Fix spacing issues first
    cleanName = cleanName.replace(/([a-z])for (women|men)/gi, '$1 for $2');

    // Remove "for Women" suffix
    if (cleanName.endsWith(' for Women') || cleanName.endsWith(' for women')) {
      cleanName = cleanName.replace(/ for [Ww]omen$/, '');
      gender = 'women';
    }

    // Remove "for Men" suffix
    if (cleanName.endsWith(' for Men') || cleanName.endsWith(' for men')) {
      cleanName = cleanName.replace(/ for [Mm]en$/, '');
      gender = 'men';
    }

    return {
      name: cleanName.trim(),
      gender_target: gender,
    };
  }

  /**
   * Standardize brand name helper method
   */
  private standardizeBrandName(originalBrand: string): string {
    if (!originalBrand) return 'Unknown Brand';

    // Handle special cases
    const specialCases: { [key: string]: string } = {
      'tom ford': 'Tom Ford',
      'le labo': 'Le Labo',
      'jo malone london': 'Jo Malone London',
      'yves saint laurent': 'Yves Saint Laurent',
      'maison francis kurkdjian': 'Maison Francis Kurkdjian',
      'maison margiela': 'Maison Margiela',
    };

    const lowerBrand = originalBrand.toLowerCase();
    if (specialCases[lowerBrand]) {
      return specialCases[lowerBrand];
    }

    // Default: title case
    return originalBrand
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Calculate sample price helper method
   */
  private calculateSamplePrice(fragrance: any): number {
    // Base sample price on popularity and rating
    const basePrice = 10;
    const popularityBonus = fragrance.score > 15 ? 3 : 0;
    const ratingBonus = fragrance.ratingValue > 4.5 ? 2 : 0;

    return Math.min(basePrice + popularityBonus + ratingBonus, 20);
  }

  /**
   * Fallback recommendations using popular fragrances
   */
  private getFallbackRecommendations(): FragranceRecommendation[] {
    const cleanedData = this.cleanFragranceData(fragranceData);
    const suitable = cleanedData.filter(frag => frag.sample_available);
    const popular = suitable
      .sort((a, b) => b.popularity_score - a.popularity_score)
      .slice(0, 3);

    return popular.map((frag, index) => ({
      id: frag.id,
      name: frag.name,
      brand: frag.brand,
      image_url: undefined,
      sample_price_usd: frag.sample_price_usd,
      match_percentage: 80 - index * 5, // 80%, 75%, 70%
      ai_insight:
        'This popular fragrance is loved by many users and makes an excellent choice for exploring your preferences.',
      reasoning:
        'Selected based on high user ratings and broad appeal to help you discover what you like.',
      confidence_level: 'good' as const,
      why_recommended: 'Popular and well-reviewed',
      sample_available: frag.sample_available,
    }));
  }
}
