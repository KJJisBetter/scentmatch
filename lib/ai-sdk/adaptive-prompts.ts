/**
 * Experience-Adaptive AI Prompt System
 * 
 * Generates prompts tailored to user experience level for beginner-friendly
 * or advanced explanations based on SCE-66 and SCE-67 requirements
 */

import type { UserExperienceLevel, ExplanationStyle } from './user-experience-detector';

export interface AdaptivePromptConfig {
  experienceLevel: UserExperienceLevel;
  explanationStyle: ExplanationStyle;
  fragranceDetails: string;
  userContext: string;
  educationMode?: boolean;
}

export interface FragranceEducationTerms {
  term: string;
  beginnerExplanation: string;
  example?: string;
}

/**
 * Enhanced fragrance education knowledge base - educational not baby-talk
 */
export const FRAGRANCE_EDUCATION: Record<string, FragranceEducationTerms> = {
  'edp': {
    term: 'EDP (Eau de Parfum)',
    beginnerExplanation: '15-20% oil concentration providing 6-8 hour longevity with strong projection',
    example: 'EDP versions have more depth and complexity than EDT'
  },
  'edt': {
    term: 'EDT (Eau de Toilette)', 
    beginnerExplanation: '5-15% oil concentration offering 3-5 hours with moderate projection',
    example: 'EDT is lighter, perfect for office or daytime when you want subtle presence'
  },
  'top_notes': {
    term: 'Top Notes',
    beginnerExplanation: 'First scents you smell that evaporate within 15-30 minutes',
    example: 'Citrus top notes like bergamot create the opening impression'
  },
  'heart_notes': {
    term: 'Heart Notes',
    beginnerExplanation: 'Main character of the fragrance lasting 2-4 hours',
    example: 'Floral or spice heart notes define the fragrance personality'
  },
  'base_notes': {
    term: 'Base Notes',
    beginnerExplanation: 'Foundation scents lasting 6+ hours that create the dry down',
    example: 'Woody or amber base notes provide longevity and depth'
  },
  'projection': {
    term: 'Projection',
    beginnerExplanation: 'Scent bubble radius - how far the fragrance travels from your skin',
    example: 'Strong projection (arm\'s length), moderate (close proximity), soft (intimate)'
  },
  'longevity': {
    term: 'Longevity', 
    beginnerExplanation: 'Duration the fragrance remains detectable on skin',
    example: 'Excellent (8+ hours), good (4-6 hours), moderate (2-4 hours)'
  },
  'sillage': {
    term: 'Sillage',
    beginnerExplanation: 'Scent trail intensity and how long it lingers in a space',
    example: 'Heavy sillage leaves noticeable trail, light sillage dissipates quickly'
  },
  'dry_down': {
    term: 'Dry Down',
    beginnerExplanation: 'Final phase when top and heart notes fade, revealing base character',
    example: 'Dry down often differs significantly from opening - woody, warm, or powdery'
  },
  'fresh': {
    term: 'Fresh Family',
    beginnerExplanation: 'Citrus, aquatic, and green scents that energize and refresh',
    example: 'Bergamot, lemon, marine notes create clean, uplifting character'
  },
  'oriental': {
    term: 'Oriental Family',
    beginnerExplanation: 'Warm, spicy, and resinous scents with amber, vanilla, or incense',
    example: 'Rich, cozy fragrances perfect for cooler weather and evening wear'
  },
  'woody': {
    term: 'Woody Family',
    beginnerExplanation: 'Cedar, sandalwood, and vetiver creating warm, grounding character',
    example: 'Sophisticated base that adds depth and longevity to compositions'
  },
  'floral': {
    term: 'Floral Family',
    beginnerExplanation: 'Rose, jasmine, lily creating romantic, elegant, or fresh character',
    example: 'Range from light, airy florals to rich, intoxicating blooms'
  },
  'fougere': {
    term: 'Fougère Family',
    beginnerExplanation: 'Classic aromatic blend of lavender, herbs, and woody notes',
    example: 'Traditional masculine structure but modern versions work for everyone'
  }
};

/**
 * Educational vocabulary progression - teach terms rather than avoid them
 */
export const VOCABULARY_PROGRESSION: Record<string, Record<UserExperienceLevel, string>> = {
  'olfactory': {
    beginner: 'scent (olfactory)', // Teach the term in parentheses
    intermediate: 'olfactory profile',
    advanced: 'olfactory architecture'
  },
  'sophisticated': {
    beginner: 'complex and refined',
    intermediate: 'sophisticated',
    advanced: 'sophisticated'
  },
  'composition': {
    beginner: 'fragrance structure (composition)',
    intermediate: 'composition', 
    advanced: 'olfactory composition'
  },
  'facet': {
    beginner: 'characteristic note (facet)',
    intermediate: 'note facet',
    advanced: 'olfactory facet'
  },
  'accord': {
    beginner: 'note blend (accord)',
    intermediate: 'fragrance accord',
    advanced: 'olfactory accord'
  },
  'tenacity': {
    beginner: 'lasting power (tenacity)',
    intermediate: 'tenacity',
    advanced: 'olfactory tenacity'
  },
  'nuance': {
    beginner: 'subtle characteristic',
    intermediate: 'nuanced element',
    advanced: 'olfactory nuance'
  }
};

/**
 * Adaptive prompt generator for different experience levels
 */
export class AdaptivePromptEngine {
  
  /**
   * Generate recommendation explanation prompt based on user experience
   */
  generateExplanationPrompt(config: AdaptivePromptConfig): string {
    const { experienceLevel, explanationStyle, fragranceDetails, userContext } = config;
    
    switch (experienceLevel) {
      case 'beginner':
        return this.generateBeginnerPrompt(config);
      case 'intermediate':
        return this.generateIntermediatePrompt(config);
      case 'advanced':
        return this.generateAdvancedPrompt(config);
      default:
        return this.generateBeginnerPrompt(config);
    }
  }

  /**
   * Educational beginner prompt (SCE-66: 30-40 words max)
   * IMPROVED: Teaches fragrance concepts while staying concise
   */
  private generateBeginnerPrompt(config: AdaptivePromptConfig): string {
    const { fragranceDetails, userContext, explanationStyle } = config;
    
    return `
      Explain this fragrance recommendation while teaching fragrance concepts. Be educational and concise.
      
      CRITICAL REQUIREMENTS:
      - EXACTLY ${explanationStyle.maxWords} words maximum (count every word)
      - TEACH one fragrance concept (scent families, note structure, performance)
      - EXPLAIN why it matches using fragrance knowledge
      - INCLUDE educational terms: top notes, longevity, projection, scent family, base notes
      - MAKE comparisons that explain technical differences
      - EDUCATE about fragrance performance and characteristics
      
      Fragrance: ${fragranceDetails}
      User Profile: ${userContext}
      
      EDUCATIONAL EXAMPLES:
      "Bergamot citrus top notes match your fresh preference. 6-hour longevity suits daily wear. Aromatic fougère family combines herbs with citrus. Skin chemistry affects development."
      
      "Oriental spice family with warm cardamom-amber base. 8-hour performance ideal for evening. Richer than fresh scents due to resinous base notes. Sample shows spice development."
      
      Write an educational explanation that teaches fragrance knowledge:
    `;
  }

  /**
   * Educational intermediate prompt (60 words max) - teaches advanced concepts
   */
  private generateIntermediatePrompt(config: AdaptivePromptConfig): string {
    const { fragranceDetails, userContext, explanationStyle } = config;
    
    return `
      Provide a technical explanation of this fragrance match while teaching intermediate concepts.
      
      REQUIREMENTS:
      - Maximum ${explanationStyle.maxWords} words
      - TEACH fragrance composition and performance concepts
      - EXPLAIN note interactions and development phases
      - INCLUDE technical comparisons with reasoning
      - EDUCATE about performance metrics and occasions
      
      Fragrance: ${fragranceDetails}
      User Profile: ${userContext}
      
      EDUCATIONAL FOCUS:
      - Note structure (top/heart/base progression)
      - Performance characteristics (projection, longevity timing)
      - Scent family classification and why it matters
      - Meaningful technical comparisons
      
      EXAMPLE: "Complex bergamot-pepper opening transitions to ambroxan base over 6 hours. Fresh aromatic fougère family balances citrus freshness with woody depth. Similar to Sauvage's performance but with more sophisticated note development."
      
      Provide technical analysis that builds fragrance knowledge:
    `;
  }

  /**
   * Advanced expert prompt (100 words max) - full technical education
   */
  private generateAdvancedPrompt(config: AdaptivePromptConfig): string {
    const { fragranceDetails, userContext, explanationStyle } = config;
    
    return `
      Provide expert-level fragrance analysis explaining this recommendation match with technical precision.
      
      REQUIREMENTS:
      - Maximum ${explanationStyle.maxWords} words
      - FULL technical fragrance terminology and concepts
      - DETAILED compositional analysis with ingredient specificity
      - PRECISE performance metrics with timing and evolution
      - EXPERT-level insights into perfumery techniques
      
      Fragrance: ${fragranceDetails}
      User Profile: ${userContext}
      
      TECHNICAL ANALYSIS FOCUS:
      - Olfactory architecture and compositional structure
      - Specific aromachemicals and natural materials
      - Performance curves (projection peaks, longevity phases)
      - Perfumery techniques and quality indicators
      - Market positioning and comparable alternatives
      
      EXAMPLE: "Masterful aromatic fougère showcasing bergamot FCF with lavender-coumarin heart transitioning to cedar-vetiver base. Excellent tenacity (8-10 hours) with moderate projection peaking at 90 minutes. Superior to mass-market alternatives through natural bergamot's Earl Grey facet and quality aromatic complex."
      
      Provide technical perfumery analysis:
    `;
  }

  /**
   * Generate educational tooltips for beginners
   */
  generateEducationalContent(terms: string[]): Record<string, FragranceEducationTerms> {
    const educational: Record<string, FragranceEducationTerms> = {};
    
    terms.forEach(term => {
      const lowerTerm = term.toLowerCase();
      if (FRAGRANCE_EDUCATION[lowerTerm]) {
        educational[lowerTerm] = FRAGRANCE_EDUCATION[lowerTerm];
      }
    });
    
    return educational;
  }

  /**
   * Enhance vocabulary based on experience level - teach terms rather than simplify
   */
  adaptVocabulary(text: string, experienceLevel: UserExperienceLevel): string {
    let adaptedText = text;
    
    Object.entries(VOCABULARY_PROGRESSION).forEach(([complex, levels]) => {
      const replacement = levels[experienceLevel];
      if (replacement) {
        const regex = new RegExp(complex, 'gi');
        adaptedText = adaptedText.replace(regex, replacement);
      }
    });
    
    return adaptedText;
  }

  /**
   * Generate progressive disclosure summary (for beginners)
   */
  generateProgressiveDisclosureSummary(fullExplanation: string): {
    summary: string;
    expandedContent: string;
  } {
    // Extract first sentence as summary
    const sentences = fullExplanation.split(/[.!?]+/);
    const summary = sentences[0]?.trim() + '.';
    const expandedContent = sentences.slice(1).join('. ').trim();
    
    return {
      summary: summary || fullExplanation,
      expandedContent: expandedContent || 'Learn more about fragrance matching...'
    };
  }

  /**
   * Generate personality-based context for prompts
   */
  generatePersonalityContext(
    quizData: any,
    experienceLevel: UserExperienceLevel
  ): string {
    if (!quizData) return 'New fragrance explorer seeking guidance';
    
    const { personality_type, confidence_score } = quizData;
    
    const contexts = {
      beginner: `Someone with ${personality_type} style preferences who's new to fragrances`,
      intermediate: `${personality_type} personality type (${Math.round(confidence_score * 100)}% confidence) exploring fragrance options`,
      advanced: `Established ${personality_type} fragrance enthusiast with developed preferences and collection experience`
    };
    
    return contexts[experienceLevel];
  }

  /**
   * Generate recommendation confidence explanation
   */
  generateConfidenceExplanation(
    score: number,
    experienceLevel: UserExperienceLevel
  ): string {
    const percentage = Math.round(score * 100);
    
    const explanations = {
      beginner: {
        high: `${percentage}% match - This is a great choice for you!`,
        medium: `${percentage}% match - Worth trying, good fit for your style`,
        low: `${percentage}% match - Might be different from your usual, but could surprise you`
      },
      intermediate: {
        high: `${percentage}% compatibility based on your preferences and collection`,
        medium: `${percentage}% match with some aspects aligning well with your profile`,
        low: `${percentage}% match - diverges from your typical preferences but offers exploration potential`
      },
      advanced: {
        high: `${percentage}% algorithmic compatibility based on comprehensive profile analysis`,
        medium: `${percentage}% match with selective alignment to your established preference patterns`,
        low: `${percentage}% compatibility - represents departure from core preferences with potential for profile expansion`
      }
    };
    
    const confidenceLevel = score >= 0.8 ? 'high' : score >= 0.6 ? 'medium' : 'low';
    return explanations[experienceLevel][confidenceLevel];
  }
}

// Export singleton instance
export const adaptivePromptEngine = new AdaptivePromptEngine();

/**
 * Beginner explanation validation
 */
export function validateBeginnerExplanation(explanation: string): {
  valid: boolean;
  wordCount: number;
  hasEducationalTerms: boolean;
  hasPerformanceInfo: boolean;
  hasMeaningfulComparison: boolean;
  issues: string[];
} {
  const words = explanation.trim().split(/\s+/);
  const wordCount = words.length;
  const issues: string[] = [];
  const lowerExplanation = explanation.toLowerCase();
  
  // Check word count (30-40 words for beginners)
  const withinWordCount = wordCount >= 25 && wordCount <= 45; // Slightly flexible for educational content
  if (!withinWordCount) {
    issues.push(`Word count ${wordCount} outside 25-45 range (target: 30-40)`);
  }
  
  // Check for educational fragrance terms (teaches fragrance concepts)
  const educationalTerms = [
    'top notes', 'heart notes', 'base notes', 'longevity', 'projection', 
    'scent family', 'aromatic', 'fougère', 'oriental', 'fresh', 'woody',
    'citrus', 'bergamot', 'amber', 'cedar', 'cardamom', 'lavender'
  ];
  const hasEducationalTerms = educationalTerms.some(term => 
    lowerExplanation.includes(term.toLowerCase())
  );
  if (!hasEducationalTerms) {
    issues.push('Missing educational fragrance terms - should teach concepts');
  }
  
  // Check for performance information (longevity, projection, timing)
  const performanceTerms = ['hour', 'longevity', 'projection', 'lasts', 'performance', 'development', 'dry down'];
  const hasPerformanceInfo = performanceTerms.some(term => 
    lowerExplanation.includes(term)
  );
  if (!hasPerformanceInfo) {
    issues.push('Missing performance information - should explain how fragrance behaves');
  }
  
  // Check for meaningful comparisons (not just "similar to X")
  const hasMeaningfulComparison = (
    (lowerExplanation.includes('similar') || lowerExplanation.includes('like') || lowerExplanation.includes('than')) &&
    (lowerExplanation.includes('but') || lowerExplanation.includes('however') || lowerExplanation.includes('due to') || lowerExplanation.includes('with'))
  );
  if (!hasMeaningfulComparison) {
    issues.push('Missing meaningful comparison - should explain similarities and differences');
  }
  
  // Check for baby-talk phrases that should be avoided
  const babyTalkPhrases = ['like you wanted', 'works for', 'perfect for you', 'just for you'];
  const hasBabyTalk = babyTalkPhrases.some(phrase => 
    lowerExplanation.includes(phrase)
  );
  if (hasBabyTalk) {
    issues.push('Contains baby-talk phrases - should be educational not patronizing');
  }
  
  return {
    valid: issues.length === 0,
    wordCount,
    hasEducationalTerms,
    hasPerformanceInfo,
    hasMeaningfulComparison,
    issues
  };
}

// Export prompt templates organized by experience level
export const ADAPTIVE_PROMPT_TEMPLATES = {
  BEGINNER_RECOMMENDATION: `
    Format: "✅ [match reason] / 👍 [practical use] / 💡 [reference] / 🧪 [action]"
    Maximum 35 words. Include familiar fragrance reference and practical tip.
    Use encouraging, confidence-building language.
  `,
  
  INTERMEDIATE_RECOMMENDATION: `
    Provide a balanced explanation of this fragrance recommendation.
    Maximum 60 words. Include specific matching factors and performance details.
    Assume basic fragrance knowledge.
  `,
  
  ADVANCED_RECOMMENDATION: `
    Deliver comprehensive analysis of recommendation compatibility.
    Maximum 100 words. Use technical terminology and detailed matching rationale.
    Include performance characteristics and collection synergy.
  `,
  
  BEGINNER_EDUCATION: `
    Explain this fragrance concept in simple terms for someone who just started learning about fragrances.
    Use everyday comparisons and examples.
  `
};