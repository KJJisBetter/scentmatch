/**
 * AI Explanation Engine for Experience-Adaptive Recommendations
 * 
 * Generates explanations adapted to user experience level:
 * - Beginner: 30-40 words, simple language, visual elements
 * - Intermediate: 50-75 words, balanced technical terms
 * - Advanced: 100+ words, full technical analysis
 */

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface FragranceData {
  id: string;
  name: string;
  brand: string;
  accords: string[];
  scent_family: string;
  rating_average?: number;
  rating_count?: number;
  popularity_score?: number;
}

export interface UserPreferences {
  scent_families: string[];
  personality_style: string;
  occasion_preferences: string[];
  experience_level: ExperienceLevel;
}

export interface ExplanationOptions {
  includeEmojis?: boolean;
  maxWords?: number;
  format?: 'paragraph' | 'bullets' | 'simple';
}

/**
 * Experience-Adaptive AI Explanation Engine
 */
export class ExplanationEngine {
  /**
   * Generate explanation adapted to user experience level
   */
  generateExplanation(
    fragrance: FragranceData,
    preferences: UserPreferences,
    options: ExplanationOptions = {}
  ): string {
    const { experience_level } = preferences;
    const {
      includeEmojis = experience_level === 'beginner',
      format = experience_level === 'beginner' ? 'simple' : 'paragraph'
    } = options;

    switch (experience_level) {
      case 'beginner':
        return this.generateBeginnerExplanation(fragrance, preferences, { includeEmojis, format });
      case 'intermediate':
        return this.generateIntermediateExplanation(fragrance, preferences);
      case 'advanced':
        return this.generateAdvancedExplanation(fragrance, preferences);
      default:
        return this.generateBeginnerExplanation(fragrance, preferences, { includeEmojis, format });
    }
  }

  /**
   * Beginner-friendly explanation (30-40 words, emojis, simple language)
   */
  private generateBeginnerExplanation(
    fragrance: FragranceData,
    preferences: UserPreferences,
    options: ExplanationOptions
  ): string {
    const { includeEmojis = true, format = 'simple' } = options;
    const elements: string[] = [];

    // Find preference matches
    const matchingFamilies = this.findMatchingFamilies(fragrance, preferences);
    const occasionFit = this.getOccasionFit(preferences.occasion_preferences);
    
    if (format === 'simple') {
      // Simple bullet-style format with emojis
      // Always mention preference match first
      if (matchingFamilies.length > 0) {
        const emoji = includeEmojis ? '✅ ' : '';
        elements.push(`${emoji}${matchingFamilies[0]} like you wanted`);
      } else {
        // Fallback to scent family match
        const emoji = includeEmojis ? '✅ ' : '';
        const familyDisplay = fragrance.scent_family === 'fresh' ? 'Fresh & clean' : 
                              fragrance.scent_family === 'woody' ? 'Warm & woody' :
                              fragrance.scent_family === 'floral' ? 'Pretty & floral' :
                              'Great scent match';
        elements.push(`${emoji}${familyDisplay} like you wanted`);
      }

      if (occasionFit) {
        const emoji = includeEmojis ? '👍 ' : '';
        elements.push(`${emoji}Works for ${occasionFit}`);
      }

      // Add comparison or uniqueness
      const comparison = this.getSimpleComparison(fragrance, preferences);
      if (comparison) {
        const emoji = includeEmojis ? '💡 ' : '';
        elements.push(`${emoji}${comparison}`);
      }

      // Sample suggestion
      const emoji = includeEmojis ? '🧪 ' : '';
      const samplePrice = this.calculateSamplePrice(fragrance);
      elements.push(`${emoji}Try $${samplePrice} sample before full bottle`);

      return elements.join('\n');
    }

    // Paragraph format for beginners
    const primaryMatch = matchingFamilies[0] || 'quality fragrance';
    return `Perfect ${primaryMatch} match! Great for ${occasionFit || 'daily wear'}. ${this.getSimpleComparison(fragrance, preferences) || 'Try the sample first!'}`
      .slice(0, 150); // Ensure under word limit
  }

  /**
   * Intermediate explanation (50-75 words, some technical terms)
   */
  private generateIntermediateExplanation(
    fragrance: FragranceData,
    preferences: UserPreferences
  ): string {
    const matchingFamilies = this.findMatchingFamilies(fragrance, preferences);
    const mainAccords = fragrance.accords.slice(0, 3);
    
    let explanation = `${fragrance.name} by ${fragrance.brand} features a well-balanced composition of ${mainAccords.join(', ')} notes that align perfectly with your preference for ${matchingFamilies.join(' and ')} scent families.`;

    // Add personality connection
    if (preferences.personality_style) {
      const personalityConnection = this.getPersonalityConnection(fragrance, preferences.personality_style);
      explanation += ` ${personalityConnection}`;
    }

    // Add performance characteristics
    explanation += ` The balanced note structure provides good longevity and moderate projection, making it suitable for both casual and professional settings.`;

    // Add rating information if available
    if (fragrance.rating_average && fragrance.rating_average > 4.0) {
      explanation += ` Users consistently rate this fragrance ${fragrance.rating_average.toFixed(1)}/5 stars across ${fragrance.rating_count || 'many'} reviews.`;
    }

    return this.limitWords(explanation, 75);
  }

  /**
   * Advanced explanation (100+ words, full technical analysis)
   */
  private generateAdvancedExplanation(
    fragrance: FragranceData,
    preferences: UserPreferences
  ): string {
    const matchingFamilies = this.findMatchingFamilies(fragrance, preferences);
    const mainAccords = fragrance.accords.slice(0, 5);

    let explanation = `${fragrance.name} by ${fragrance.brand} presents a sophisticated ${fragrance.scent_family} composition that aligns exceptionally well with your complex olfactory preferences and demonstrates mastery of contemporary perfumery techniques. `;

    // Detailed accord analysis
    explanation += `The fragrance architecture features an intricate interplay of ${mainAccords.join(', ')} accords that directly correspond to your expressed preference for ${matchingFamilies.join(' and ')} scent families, creating a harmonious olfactory experience that evolves beautifully throughout its wear cycle. `;

    // Technical performance notes
    explanation += `This particular composition demonstrates exceptional longevity characteristics ranging from 6-8 hours with impressive sillage projection that creates an elegant scent trail without overwhelming nearby individuals, typical of well-executed ${fragrance.scent_family} fragrances in this caliber. `;

    // Advanced personality analysis
    const advancedPersonality = this.getAdvancedPersonalityAnalysis(fragrance, preferences);
    explanation += advancedPersonality + ' ';

    // Seasonal and occasion analysis
    explanation += `The molecular composition and volatility profile make this fragrance particularly well-suited for your specified occasion preferences, with its balanced top-to-base note progression ensuring appropriate presence across various social and professional contexts. `;

    // Market positioning and comparable alternatives
    if (fragrance.popularity_score && fragrance.rating_average) {
      explanation += `With a popularity score of ${fragrance.popularity_score} and ${fragrance.rating_average.toFixed(1)}/5 rating from ${fragrance.rating_count} comprehensive evaluations, this represents a thoroughly validated choice within the ${fragrance.scent_family} category, demonstrating both critical acclaim and broad consumer satisfaction.`;
    }

    return explanation;
  }

  /**
   * Find matching scent families between fragrance and preferences
   */
  private findMatchingFamilies(fragrance: FragranceData, preferences: UserPreferences): string[] {
    const matches: string[] = [];
    
    preferences.scent_families.forEach(preferred => {
      // Direct family match
      if (fragrance.scent_family.toLowerCase().includes(preferred.replace('_', ' ').toLowerCase())) {
        matches.push(preferred.replace('_', ' '));
      }
      
      // Accord match
      fragrance.accords.forEach(accord => {
        if (accord.toLowerCase().includes(preferred.replace('_', ' ').toLowerCase()) ||
            preferred.replace('_', ' ').toLowerCase().includes(accord.toLowerCase())) {
          matches.push(preferred.replace('_', ' '));
        }
      });
    });

    return Array.from(new Set(matches)); // Remove duplicates
  }

  /**
   * Get occasion fit description
   */
  private getOccasionFit(occasions: string[]): string {
    const occasionMap: Record<string, string> = {
      'everyday': 'daily wear',
      'professional': 'work',
      'special_occasions': 'dates & events',
      'evening': 'nights out',
      'casual': 'casual outings'
    };

    const mapped = occasions.map(occ => occasionMap[occ] || occ);
    return mapped.slice(0, 2).join(', ');
  }

  /**
   * Get simple comparison for beginners
   */
  private getSimpleComparison(fragrance: FragranceData, preferences: UserPreferences): string | null {
    // Popular comparison references beginners would know
    const popularRefs: Record<string, string> = {
      'fresh': 'Similar to Sauvage but more unique',
      'citrus': 'Like Light Blue but longer-lasting',
      'woody': 'Think Tom Ford but more affordable',
      'floral': 'Reminds of Miss Dior but different',
      'oriental': 'Like Black Opium family'
    };

    const family = fragrance.scent_family.toLowerCase();
    for (const [key, comparison] of Object.entries(popularRefs)) {
      if (family.includes(key)) {
        return comparison;
      }
    }

    return null;
  }

  /**
   * Get personality connection
   */
  private getPersonalityConnection(fragrance: FragranceData, personalityStyle: string): string {
    const connections: Record<string, string> = {
      'classic_timeless': 'Its timeless composition suits your classic aesthetic perfectly.',
      'bold_confident': 'The distinctive character projects confidence and makes a memorable impression.',
      'unique_creative': 'This unconventional blend expresses creativity and individual style.',
      'easy_relaxed': 'The effortless wearability offers relaxed elegance for any setting.'
    };

    return connections[personalityStyle] || 'It complements your personal style beautifully.';
  }

  /**
   * Get advanced personality analysis
   */
  private getAdvancedPersonalityAnalysis(fragrance: FragranceData, preferences: UserPreferences): string {
    const style = preferences.personality_style;
    
    const advanced: Record<string, string> = {
      'classic_timeless': 'The compositional structure follows classical perfumery principles with well-balanced top, heart, and base note progression that ensures consistent performance across varied environmental conditions.',
      'bold_confident': 'The fragrance demonstrates assertive projection characteristics and complex molecular interactions that create distinctive olfactory presence suitable for confident self-expression.',
      'unique_creative': 'This composition employs innovative accord combinations and unconventional ingredient pairings that challenge traditional scent boundaries while maintaining sophisticated wearability.',
      'easy_relaxed': 'The formula prioritizes skin-friendly molecular weights and gentle diffusion patterns that provide comfortable, non-overwhelming sensory experience throughout extended wear periods.'
    };

    return advanced[style] || 'The fragrance architecture demonstrates careful attention to contemporary preferences while respecting classical perfumery traditions.';
  }

  /**
   * Calculate sample price based on fragrance characteristics
   */
  private calculateSamplePrice(fragrance: FragranceData): number {
    const basePrice = 12;
    const popularityBonus = (fragrance.popularity_score || 0) > 15 ? 3 : 0;
    const ratingBonus = (fragrance.rating_average || 0) > 4.5 ? 2 : 0;
    
    return Math.min(basePrice + popularityBonus + ratingBonus, 20);
  }

  /**
   * Limit explanation to specified word count
   */
  private limitWords(text: string, maxWords: number): string {
    const words = text.split(' ');
    if (words.length <= maxWords) return text;
    
    return words.slice(0, maxWords).join(' ') + '...';
  }

  /**
   * Validate explanation meets requirements for experience level
   */
  validateExplanation(explanation: string, experienceLevel: ExperienceLevel): boolean {
    // Count words properly, removing emojis and handling newlines
    const cleanText = explanation.replace(/[✅👍💡🧪]/g, '').replace(/\n/g, ' ');
    const wordCount = cleanText.split(' ').filter(word => word.trim().length > 0).length;
    
    switch (experienceLevel) {
      case 'beginner':
        return wordCount <= 40 && !this.hasTechnicalJargon(explanation);
      case 'intermediate':
        return wordCount >= 50 && wordCount <= 80; // Tighter upper limit
      case 'advanced':
        return wordCount >= 100;
      default:
        return true;
    }
  }

  /**
   * Check if explanation contains technical jargon inappropriate for beginners
   */
  private hasTechnicalJargon(text: string): boolean {
    const jargonTerms = [
      'sophisticated blend',
      'olfactory experience', 
      'compositional structure',
      'molecular interactions',
      'accord combinations',
      'sillage characteristics',
      'longevity performance'
    ];

    return jargonTerms.some(term => text.toLowerCase().includes(term.toLowerCase()));
  }
}