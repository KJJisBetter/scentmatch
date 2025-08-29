/**
 * Beginner Explanation Engine
 *
 * Specialized engine for generating beginner-friendly fragrance explanations
 * Solves SCE-66 and SCE-67 with educational, confidence-building content
 */

import { generateText } from 'ai';
import { AI_MODELS } from './config';
import {
  adaptivePromptEngine,
  validateBeginnerExplanation,
  FRAGRANCE_EDUCATION,
} from './adaptive-prompts';
import type { UserExperienceLevel } from './user-experience-detector';

export interface BeginnerExplanationRequest {
  fragranceId: string;
  fragranceName: string;
  brand: string;
  scentFamily: string;
  userContext: string;
  similarFragrances?: string[];
  priceRange?: { min: number; max: number };
}

export interface BeginnerExplanationResult {
  explanation: string;
  summary: string;
  educationalContent: {
    terms: Record<string, any>;
    tips: string[];
    confidenceBooster: string;
  };
  validation: {
    wordCount: number;
    meetsRequirements: boolean;
    issues: string[];
  };
  metadata: {
    generationAttempts: number;
    finalScore: number;
  };
}

/**
 * Specialized engine for beginner-friendly explanations
 * Implements strict 30-40 word format with educational integration
 */
export class BeginnerExplanationEngine {
  private maxRetries = 3;
  private targetWordCount = { min: 30, max: 40 };

  /**
   * Generate beginner-friendly explanation with validation
   * Implements SCE-66 format: ✅ / 👍 / 💡 / 🧪
   */
  async generateExplanation(
    request: BeginnerExplanationRequest
  ): Promise<BeginnerExplanationResult> {
    let attempts = 0;
    let bestResult: any = null;
    let bestScore = 0;

    // Try multiple times to get optimal explanation
    while (attempts < this.maxRetries) {
      attempts++;

      try {
        const explanation = await this.generateSingleExplanation(
          request,
          attempts
        );
        const validation = validateBeginnerExplanation(explanation);
        const score = this.calculateExplanationScore(explanation, validation);

        if (validation.valid || score > bestScore) {
          bestResult = { explanation, validation, score };
          bestScore = score;

          // If we got a valid result, use it
          if (validation.valid) break;
        }
      } catch (error) {
        console.warn(
          `Explanation generation attempt ${attempts} failed:`,
          error
        );
      }
    }

    if (!bestResult) {
      throw new Error(
        'Failed to generate beginner explanation after multiple attempts'
      );
    }

    // Generate educational content
    const educationalContent = await this.generateEducationalContent(
      request,
      bestResult.explanation
    );

    // Create summary from explanation
    const summary = this.extractSummary(bestResult.explanation);

    return {
      explanation: bestResult.explanation,
      summary,
      educationalContent,
      validation: {
        wordCount: bestResult.validation.wordCount,
        meetsRequirements: bestResult.validation.valid,
        issues: bestResult.validation.issues,
      },
      metadata: {
        generationAttempts: attempts,
        finalScore: bestScore,
      },
    };
  }

  /**
   * Generate single explanation attempt with adaptive prompting
   */
  private async generateSingleExplanation(
    request: BeginnerExplanationRequest,
    attemptNumber: number
  ): Promise<string> {
    const fragranceDetails = `${request.fragranceName} by ${request.brand} (${request.scentFamily})`;

    // Build enhanced context based on attempt number
    const enhancedContext = this.buildEnhancedContext(request, attemptNumber);

    const prompt = `
      You are teaching someone about fragrances while explaining why this recommendation matches their preferences. Be educational but concise.
      
      CRITICAL REQUIREMENTS (ATTEMPT ${attemptNumber}):
      - EXACTLY 30-40 words total (count every single word!)
      - TEACH one fragrance concept while explaining the match
      - EXPLAIN the "why" behind the recommendation with fragrance knowledge
      - INCLUDE educational fragrance terms (top notes, longevity, projection, scent family)
      - MAKE meaningful comparisons that explain similarities and differences
      
      Fragrance: ${fragranceDetails}
      User Profile: ${enhancedContext}
      ${request.priceRange ? `Price Range: $${request.priceRange.min}-${request.priceRange.max}` : ''}
      
      ${attemptNumber > 1 ? 'PREVIOUS ATTEMPT FAILED - Focus on educational value within word count!' : ''}
      
      EDUCATIONAL EXAMPLES:
      "Bergamot citrus top notes match your fresh preference. 6-hour longevity suits daily wear. Aromatic fougère family - herbs with citrus. Skin chemistry affects how citrus develops."
      
      "Oriental spice family with cardamom-rose heart. 8-hour longevity for evening wear. Warmer than fresh fragrances due to amber base notes. Sample reveals how spices develop on skin."
      
      Generate an educational explanation that teaches fragrance concepts:
    `;

    const { text } = await generateText({
      model: AI_MODELS.RECOMMENDATION,
      prompt,
      maxOutputTokens: 80, // Strict limit for word count control
      temperature: attemptNumber > 1 ? 0.3 : 0.5, // Lower temperature for retries
    });

    return text.trim();
  }

  /**
   * Build enhanced context based on attempt number
   */
  private buildEnhancedContext(
    request: BeginnerExplanationRequest,
    attemptNumber: number
  ): string {
    let context = request.userContext;

    // Add more specific guidance on retries
    if (attemptNumber > 1) {
      context += '. Focus on ONE clear benefit that resonates with beginners.';
    }

    if (attemptNumber > 2) {
      context += ` Keep explanations simple and practical.`;
    }

    return context;
  }

  /**
   * Calculate explanation quality score - updated for educational focus
   */
  private calculateExplanationScore(
    explanation: string,
    validation: any
  ): number {
    let score = 0;

    // Word count score (max 30 points) - reduced weight for educational flexibility
    const wordCount = validation.wordCount;
    if (wordCount >= 30 && wordCount <= 40) {
      score += 30;
    } else if (wordCount >= 25 && wordCount <= 45) {
      score += 20;
    }

    // Educational terms score (max 30 points) - NEW: prioritize teaching
    if (validation.hasEducationalTerms) score += 30;

    // Performance information score (max 25 points) - NEW: explain fragrance behavior
    if (validation.hasPerformanceInfo) score += 25;

    // Meaningful comparison score (max 15 points) - NEW: educational comparisons
    if (validation.hasMeaningfulComparison) score += 15;

    // Penalty for baby-talk (subtract 20 points)
    if (
      validation.issues?.some((issue: string) => issue.includes('baby-talk'))
    ) {
      score -= 20;
    }

    return Math.max(score, 0); // Ensure non-negative score
  }

  /**
   * Generate educational content for beginners
   */
  private async generateEducationalContent(
    request: BeginnerExplanationRequest,
    explanation: string
  ): Promise<{
    terms: Record<string, any>;
    tips: string[];
    confidenceBooster: string;
  }> {
    // Extract fragrance terms for education
    const terms = this.extractEducationalTerms(explanation, request);

    // Generate contextual tips
    const tips = await this.generateContextualTips(request);

    // Generate confidence booster
    const confidenceBooster = await this.generateConfidenceBooster(request);

    return {
      terms,
      tips,
      confidenceBooster,
    };
  }

  /**
   * Extract educational terms from explanation and fragrance details
   */
  private extractEducationalTerms(
    explanation: string,
    request: BeginnerExplanationRequest
  ): Record<string, any> {
    const terms: Record<string, any> = {};
    const combinedText = `${explanation} ${request.scentFamily}`.toLowerCase();

    // Check for fragrance education terms
    Object.entries(FRAGRANCE_EDUCATION).forEach(([key, edu]) => {
      if (
        combinedText.includes(key) ||
        combinedText.includes(edu.term.toLowerCase())
      ) {
        terms[key] = {
          ...edu,
          contextualExample: this.generateContextualExample(edu, request),
        };
      }
    });

    // Add scent family education if not already covered
    if (!terms.scent_family && request.scentFamily) {
      terms.scent_family = {
        term: request.scentFamily,
        beginnerExplanation: this.getScentFamilyExplanation(
          request.scentFamily
        ),
        example: `${request.fragranceName} is a ${request.scentFamily.toLowerCase()} fragrance`,
      };
    }

    return terms;
  }

  /**
   * Generate contextual example for educational terms
   */
  private generateContextualExample(
    edu: any,
    request: BeginnerExplanationRequest
  ): string {
    return (
      edu.example ||
      `In ${request.fragranceName}, this means ${edu.beginnerExplanation.toLowerCase()}`
    );
  }

  /**
   * Get beginner-friendly scent family explanation
   */
  private getScentFamilyExplanation(scentFamily: string): string {
    const explanations: Record<string, string> = {
      fresh: 'Clean, energizing scents like citrus and ocean breeze',
      floral: 'Flower-based scents like rose, jasmine, and lily',
      woody: 'Warm, earthy scents like cedar, sandalwood, and pine',
      oriental: 'Rich, spicy scents like vanilla, amber, and cinnamon',
      fougere: 'Classic masculine blend of lavender, herbs, and woods',
      chypre: 'Elegant blend of citrus, flowers, and mossy woods',
    };

    return (
      explanations[scentFamily.toLowerCase()] ||
      `${scentFamily} scents have their own unique character and style`
    );
  }

  /**
   * Generate contextual fragrance tips
   */
  private async generateContextualTips(
    request: BeginnerExplanationRequest
  ): Promise<string[]> {
    const baseTips = [
      'Start with smaller sizes to test how fragrances work with your skin',
      'Fragrances smell different on everyone due to body chemistry',
      'Apply to pulse points (wrists, neck) for best projection',
      "Don't judge a fragrance immediately - let it develop for 30 minutes",
    ];

    // Add contextual tips based on scent family
    const contextualTips = this.getContextualTips(
      request.scentFamily,
      request.priceRange
    );

    return [...contextualTips, ...baseTips.slice(0, 2)];
  }

  /**
   * Get contextual tips based on fragrance characteristics
   */
  private getContextualTips(scentFamily: string, priceRange?: any): string[] {
    const tips: Record<string, string[]> = {
      fresh: [
        'Great for beginners - clean scents are universally appealing',
        'Perfect for daytime and office wear',
      ],
      floral: [
        'Excellent for romantic occasions and spring/summer',
        'Layer with unscented lotion for longer wear',
      ],
      woody: [
        'Ideal for fall/winter and evening events',
        'A little goes a long way with woody scents',
      ],
      oriental: [
        'Start with light application - these are powerful scents',
        'Perfect for special occasions and cooler weather',
      ],
    };

    const familyTips = tips[scentFamily.toLowerCase()] || [
      'Trust your instincts when trying new scent families',
    ];

    if (priceRange && priceRange.min < 50) {
      familyTips.push('Great value option for exploring this scent family');
    }

    return familyTips;
  }

  /**
   * Generate confidence-building message
   */
  private async generateConfidenceBooster(
    request: BeginnerExplanationRequest
  ): Promise<string> {
    const prompt = `
      Generate a short, encouraging message for someone trying their first fragrances.
      Maximum 12 words. Make them feel confident about exploring scents.
      
      Context: They're considering ${request.fragranceName} by ${request.brand}
      
      Examples:
      - "Every fragrance expert started where you are now!"
      - "Trust your nose - you're developing great taste!"
      - "Perfect choice for beginning your scent journey!"
    `;

    const { text } = await generateText({
      model: AI_MODELS.FAST,
      prompt,
      maxOutputTokens: 30,
    });

    return text.trim();
  }

  /**
   * Extract summary from formatted explanation
   */
  private extractSummary(explanation: string): string {
    // Extract the first part (before first /)
    const parts = explanation.split('/');
    if (parts.length > 0) {
      return parts[0].replace('✅', '').trim();
    }
    return explanation.split('.')[0] || explanation;
  }

  /**
   * Batch generate explanations for multiple fragrances
   */
  async generateBatchExplanations(
    requests: BeginnerExplanationRequest[]
  ): Promise<BeginnerExplanationResult[]> {
    const results: BeginnerExplanationResult[] = [];

    // Process in small batches to avoid rate limits
    const batchSize = 3;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchPromises = batch.map(request =>
        this.generateExplanation(request)
      );

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        console.error(
          `Batch generation failed for batch starting at index ${i}:`,
          error
        );
        // Add error results for failed batch
        batch.forEach((request, index) => {
          results.push({
            explanation: `Simple match for ${request.fragranceName} - great for beginners to explore!`,
            summary: `Good match for ${request.fragranceName}`,
            educationalContent: {
              terms: {},
              tips: ['Start with travel sizes when trying new fragrances'],
              confidenceBooster: 'Trust your instincts!',
            },
            validation: {
              wordCount: 12,
              meetsRequirements: false,
              issues: ['Fallback explanation due to generation error'],
            },
            metadata: {
              generationAttempts: 0,
              finalScore: 0,
            },
          });
        });
      }
    }

    return results;
  }
}

// Export singleton instance
export const beginnerExplanationEngine = new BeginnerExplanationEngine();

// Export convenience function
export async function generateBeginnerExplanation(
  request: BeginnerExplanationRequest
): Promise<BeginnerExplanationResult> {
  return beginnerExplanationEngine.generateExplanation(request);
}
