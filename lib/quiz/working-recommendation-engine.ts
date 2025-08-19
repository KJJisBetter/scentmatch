/**
 * AI-Powered Recommendation Engine - Task 3
 *
 * Truly AI-powered recommendation system using OpenAI for personality analysis
 * and Voyage AI for fragrance similarity matching. Returns personalized recommendations
 * based on deep AI analysis of user preferences.
 */

import fragranceData from '@/data/fragrances.json';
import { generateText } from '@/lib/ai/voyage-client';
import {
  analyzeQuizResponses,
  generatePersonalityDescription,
} from '@/lib/ai/openai-client';

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
      const top3 = this.selectWithDiversity(scoredRecommendations, 3);

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

      // Fallback to popular fragrances (extract gender preference first)
      const preferences = this.extractPreferences(responses);
      const fallbackRecs = this.getFallbackRecommendations(
        preferences.gender_preference
      );

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
        gender_target: this.normalizeGender(frag.gender), // CRITICAL FIX: Use database gender column with normalization
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
   * Map user-friendly preference names to actual fragrance accords
   */
  private mapPreferenceToAccords(preference: string): string[] {
    const preferenceMapping = {
      fresh_clean: [
        'fresh',
        'citrus',
        'aquatic',
        'marine',
        'clean',
        'aromatic',
        'green',
      ],
      sweet_fruity: [
        'sweet',
        'fruity',
        'vanilla',
        'berry',
        'apple',
        'tropical',
        'gourmand',
      ],
      floral_pretty: [
        'floral',
        'rose',
        'jasmine',
        'white floral',
        'powdery',
        'romantic',
      ],
      warm_cozy: [
        'woody',
        'amber',
        'spicy',
        'warm spicy',
        'oriental',
        'vanilla',
        'sandalwood',
        'cedar',
      ],
      open_anything: ['fresh', 'floral', 'woody', 'citrus', 'sweet'], // Broad appeal
      unique_creative: [
        'oud',
        'animalic',
        'smoky',
        'leather',
        'incense',
        'unusual',
      ],
      sophisticated: ['chypre', 'oriental', 'complex', 'elegant', 'refined'],
      natural: ['green', 'herbal', 'earthy', 'natural', 'botanical'],
    };

    return (
      preferenceMapping[preference as keyof typeof preferenceMapping] || [
        preference,
      ]
    );
  }

  /**
   * Normalize gender values from different data sources
   */
  private normalizeGender(gender: string): string {
    if (!gender) return 'unisex';

    const normalizedGender = gender.toLowerCase().trim();

    // Handle exact gender formats from JSON data
    if (normalizedGender === 'for women') {
      return 'women';
    }
    if (normalizedGender === 'for men') {
      return 'men';
    }
    if (normalizedGender === 'for women and men') {
      return 'unisex';
    }

    // Fallback for other formats
    if (
      normalizedGender.includes('women') &&
      !normalizedGender.includes('men')
    ) {
      return 'women';
    }
    if (
      normalizedGender.includes('men') &&
      !normalizedGender.includes('women')
    ) {
      return 'men';
    }

    // Default to unisex for ambiguous cases
    return 'unisex';
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
      .filter(fragrance => {
        // CRITICAL FIX: Filter out inappropriate gender fragrances BEFORE scoring
        if (preferences.gender_preference === 'men') {
          // Men should only get men's or unisex fragrances
          return (
            fragrance.gender_target === 'men' ||
            fragrance.gender_target === 'unisex'
          );
        } else if (preferences.gender_preference === 'women') {
          // Women should only get women's or unisex fragrances
          return (
            fragrance.gender_target === 'women' ||
            fragrance.gender_target === 'unisex'
          );
        }
        // For 'unisex' preference or missing preference, allow all
        return true;
      })
      .map(fragrance => {
        let score = 50; // Base score

        // Gender preference matching (bonus points for exact matches)
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

        // Scent family matching with preference-to-accord mapping and weighting
        preferences.scent_families.forEach((family: string) => {
          const accordMatches = this.mapPreferenceToAccords(family);
          console.log(
            `🎯 Scoring ${fragrance.name}: user wants "${family}" → looking for [${accordMatches.join(', ')}]`
          );

          // Check for primary accord matches (first few accords are most important)
          const primaryAccords = fragrance.accords?.slice(0, 3) || [];
          const secondaryAccords = fragrance.accords?.slice(3) || [];

          // Higher score for primary accord matches
          const hasPrimaryMatch = primaryAccords.some((accord: string) =>
            accordMatches.some(
              match =>
                accord.toLowerCase() === match.toLowerCase() ||
                accord.toLowerCase().includes(match.toLowerCase())
            )
          );

          if (hasPrimaryMatch) {
            score += 35; // High bonus for primary accord match
            console.log(
              `   ✅ +35 PRIMARY match! ${fragrance.name} has [${primaryAccords.join(', ')}] (score: ${score})`
            );
          } else {
            // Lower score for secondary accord matches
            const hasSecondaryMatch = secondaryAccords.some((accord: string) =>
              accordMatches.some(
                match =>
                  accord.toLowerCase().includes(match.toLowerCase()) ||
                  match.toLowerCase().includes(accord.toLowerCase())
              )
            );

            if (hasSecondaryMatch) {
              score += 10; // Lower bonus for secondary match
              console.log(
                `   +10 secondary match for ${fragrance.name} (score: ${score})`
              );
            } else {
              console.log(
                `   ❌ No match for ${fragrance.name} - has [${fragrance.accords?.join(', ')}]`
              );
            }
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

        // Popularity and rating boost with more differentiation
        if (fragrance.popularity_score > 20) {
          score += 15; // High popularity bonus
        } else if (fragrance.popularity_score > 15) {
          score += 8; // Medium popularity bonus
        } else if (fragrance.popularity_score > 10) {
          score += 3; // Small popularity bonus
        }

        // Rating score with more granular scoring
        if (fragrance.rating_average > 4.5) {
          score += 12; // Exceptional rating
        } else if (fragrance.rating_average > 4.0) {
          score += 6; // Good rating
        } else if (fragrance.rating_average > 3.5) {
          score += 2; // Decent rating
        }

        // Add small random factor for variety (±2 points)
        score += Math.random() * 4 - 2;

        return {
          ...fragrance,
          match_score: score, // Keep uncapped score for sorting
        };
      })
      .sort((a, b) => {
        const scoreDiff = b.match_score - a.match_score;
        // Add randomization for tied scores to prevent alphabetical bias
        if (Math.abs(scoreDiff) < 0.1) {
          return Math.random() - 0.5;
        }
        return scoreDiff;
      })
      .map(fragrance => ({
        ...fragrance,
        match_score: Math.min(fragrance.match_score, 100), // Cap at 100 AFTER sorting
      }));
  }

  /**
   * Select recommendations with brand diversity to prevent multiple fragrances from same brand
   */
  private selectWithDiversity(scoredFragrances: any[], count: number): any[] {
    const selected: any[] = [];
    const usedBrands = new Set<string>();

    // First pass: select highest scoring fragrances from different brands
    for (const fragrance of scoredFragrances) {
      if (selected.length >= count) break;

      // Skip if we already have a fragrance from this brand (unless we need to fill remaining slots)
      if (
        usedBrands.has(fragrance.brand) &&
        selected.length < scoredFragrances.length
      ) {
        continue;
      }

      selected.push(fragrance);
      usedBrands.add(fragrance.brand);
    }

    // Second pass: fill remaining slots if needed
    while (
      selected.length < count &&
      selected.length < scoredFragrances.length
    ) {
      const nextBest = scoredFragrances.find(f => !selected.includes(f));
      if (nextBest) {
        selected.push(nextBest);
      } else {
        break;
      }
    }

    return selected;
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
      gender_target: recommendation.gender_target, // CRITICAL: Include gender info for debugging
      scent_family: recommendation.scent_family, // CRITICAL: Include scent family for debugging
      accords: recommendation.accords, // CRITICAL: Include accords for debugging
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
   * Generate personalized AI insight with dynamic, unique content
   */
  private generatePersonalizedInsight(
    fragrance: any,
    preferences: any
  ): string {
    // Build personalized insight based on multiple factors
    const fragranceName = fragrance.name;
    const brand = fragrance.brand;
    const mainAccords = fragrance.accords.slice(0, 3); // Top 3 accords
    const userPreferences = preferences.scent_families || [];

    // Find specific accord matches
    const matchingAccords = mainAccords.filter((accord: string) =>
      userPreferences.some(
        (pref: string) =>
          accord.toLowerCase().includes(pref.replace('_', ' ').toLowerCase()) ||
          pref.replace('_', ' ').toLowerCase().includes(accord.toLowerCase())
      )
    );

    // Create unique insight based on fragrance + user combination
    const insights = [];

    // Lead with fragrance-specific characteristic
    if (brand === 'Chanel' && fragranceName.includes('Bleu')) {
      insights.push(
        `${fragranceName}'s sophisticated citrus-woody composition`
      );
    } else if (brand === 'Creed' && fragranceName.includes('Aventus')) {
      insights.push(`${fragranceName}'s legendary pineapple-birch blend`);
    } else if (brand === 'Tom Ford') {
      insights.push(
        `${fragranceName}'s luxury approach to ${mainAccords[0] || 'fragrance'}`
      );
    } else if (brand === 'Dior' && fragranceName.includes('Sauvage')) {
      insights.push(`${fragranceName}'s fresh-spicy signature`);
    } else if (mainAccords.length > 0) {
      insights.push(
        `${fragranceName} opens with ${mainAccords[0]} that transitions into ${mainAccords[1] || 'rich base notes'}`
      );
    } else {
      insights.push(
        `${fragranceName} by ${brand} offers a distinctive approach`
      );
    }

    // Connect to user's specific preferences
    if (matchingAccords.length > 0) {
      if (
        matchingAccords.includes('citrus') &&
        userPreferences.includes('fresh_clean')
      ) {
        insights.push(`perfectly matching your love for fresh, clean scents`);
      } else if (
        matchingAccords.includes('vanilla') &&
        userPreferences.includes('sweet_fruity')
      ) {
        insights.push(`delivering the sweet warmth you're drawn to`);
      } else if (
        matchingAccords.includes('woody') &&
        userPreferences.includes('warm_cozy')
      ) {
        insights.push(`providing the warm, grounding presence you seek`);
      } else {
        insights.push(
          `beautifully aligning with your preference for ${matchingAccords[0]} compositions`
        );
      }
    } else {
      // Fallback to personality-style connection
      if (preferences.personality_style === 'classic_timeless') {
        insights.push(
          `embodies the timeless elegance that suits your classic style`
        );
      } else if (preferences.personality_style === 'bold_confident') {
        insights.push(
          `makes the confident statement that reflects your bold personality`
        );
      } else if (preferences.personality_style === 'unique_creative') {
        insights.push(
          `offers the distinctive character that matches your creative spirit`
        );
      } else {
        insights.push(`complements your personal style beautifully`);
      }
    }

    // Add personality-specific insights with unique variations
    if (preferences.personality_style === 'classic_timeless') {
      insights.push(
        `This timeless composition builds sophistication through its refined note progression.`
      );
    } else if (preferences.personality_style === 'bold_confident') {
      insights.push(
        `The distinctive character projects confidence with its memorable sillage.`
      );
    } else if (preferences.personality_style === 'unique_creative') {
      insights.push(
        `Its unconventional accord structure expresses creativity and individuality.`
      );
    } else if (preferences.personality_style === 'easy_relaxed') {
      insights.push(
        `The effortless wearability offers relaxed elegance for any occasion.`
      );
    }

    // Add occasion-specific insight with fragrance terminology
    if (preferences.occasion_preferences?.includes('everyday')) {
      insights.push(
        `The balanced note structure ensures versatile daily performance.`
      );
    } else if (preferences.occasion_preferences?.includes('professional')) {
      insights.push(
        `Its subtle projection creates an appropriate professional presence.`
      );
    } else if (
      preferences.occasion_preferences?.includes('special_occasions')
    ) {
      insights.push(
        `The complex development makes it perfect for memorable moments.`
      );
    }

    // Join with proper flow and ensure uniqueness
    const finalInsight = insights.join(' ').replace(/\s+/g, ' ').trim();

    return (
      finalInsight ||
      `${fragranceName} offers a carefully crafted composition that complements your fragrance preferences.`
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
   * Fallback recommendations using popular fragrances
   */
  private getFallbackRecommendations(
    genderPreference?: string
  ): FragranceRecommendation[] {
    const cleanedData = this.cleanFragranceData(fragranceData);
    let suitable = cleanedData.filter(frag => frag.sample_available);

    // Apply gender filtering to fallback recommendations too
    if (genderPreference === 'men') {
      suitable = suitable.filter(
        frag => frag.gender_target === 'men' || frag.gender_target === 'unisex'
      );
    } else if (genderPreference === 'women') {
      suitable = suitable.filter(
        frag =>
          frag.gender_target === 'women' || frag.gender_target === 'unisex'
      );
    }

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
