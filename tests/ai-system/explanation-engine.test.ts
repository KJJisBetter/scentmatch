/**
 * Experience-Adaptive AI Explanation Engine Tests - SCE-66
 * 
 * Tests for simplified AI explanations tailored to user experience levels:
 * - Beginner: 30-40 words, simple language, visual elements
 * - Intermediate: 50-75 words, balanced technical terms  
 * - Advanced: 100+ words, full technical analysis
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ExplanationEngine } from '@/lib/ai-sdk/explanation-engine';
import type { FragranceData, UserPreferences, ExperienceLevel } from '@/lib/ai-sdk/explanation-engine';

describe('ExplanationEngine - Experience-Adaptive AI Explanations', () => {
  let engine: ExplanationEngine;
  
  const mockFragrance: FragranceData = {
    id: 'test-1',
    name: 'Bleu de Chanel',
    brand: 'Chanel',
    accords: ['citrus', 'woody', 'aromatic'],
    scent_family: 'fresh',
    rating_average: 4.3,
    rating_count: 1250,
    popularity_score: 18
  };

  beforeEach(() => {
    engine = new ExplanationEngine();
  });

  describe('Beginner Experience Level', () => {
    const beginnerPreferences: UserPreferences = {
      scent_families: ['fresh_clean'],
      personality_style: 'classic_timeless',
      occasion_preferences: ['everyday', 'professional'],
      experience_level: 'beginner'
    };

    it('should generate simple explanations under 40 words', () => {
      const explanation = engine.generateExplanation(mockFragrance, beginnerPreferences);
      const wordCount = explanation.split(' ').filter(word => word.length > 0).length;
      
      expect(wordCount).toBeLessThanOrEqual(40);
    });

    it('should include emojis for visual appeal', () => {
      const explanation = engine.generateExplanation(mockFragrance, beginnerPreferences);
      
      const emojiPattern = /[✅👍💡🧪]/;
      expect(explanation).toMatch(emojiPattern);
    });

    it('should use simple, non-technical language', () => {
      const explanation = engine.generateExplanation(mockFragrance, beginnerPreferences);
      
      // Should NOT contain technical jargon
      const technicalTerms = [
        'sophisticated blend',
        'olfactory experience',
        'compositional structure',
        'molecular interactions',
        'accord combinations',
        'sillage characteristics'
      ];
      
      technicalTerms.forEach(term => {
        expect(explanation.toLowerCase()).not.toContain(term.toLowerCase());
      });
    });

    it('should use bullet-point format with clear benefits', () => {
      const explanation = engine.generateExplanation(mockFragrance, beginnerPreferences, {
        format: 'simple'
      });
      
      // Should contain line breaks for bullet format
      expect(explanation).toContain('\n');
      
      // Should mention user preferences
      expect(explanation.toLowerCase()).toMatch(/fresh|clean|like you wanted/);
      
      // Should mention practical benefits
      expect(explanation.toLowerCase()).toMatch(/works for|everyday|professional/);
    });

    it('should include sample price suggestion', () => {
      const explanation = engine.generateExplanation(mockFragrance, beginnerPreferences);
      
      expect(explanation).toMatch(/\$\d+.*sample/i);
    });

    it('should avoid overwhelming technical details', () => {
      const explanation = engine.generateExplanation(mockFragrance, beginnerPreferences);
      
      // Should not mention complex fragrance terminology
      const complexTerms = [
        'composition',
        'longevity',
        'projection',
        'base notes',
        'heart notes',
        'dry down'
      ];
      
      const mentionsComplexTerms = complexTerms.some(term => 
        explanation.toLowerCase().includes(term.toLowerCase())
      );
      
      expect(mentionsComplexTerms).toBe(false);
    });

    it('should provide actionable next steps', () => {
      const explanation = engine.generateExplanation(mockFragrance, beginnerPreferences);
      
      // Should suggest trying sample before full purchase
      expect(explanation.toLowerCase()).toMatch(/try.*sample|sample.*before/);
    });
  });

  describe('Intermediate Experience Level', () => {
    const intermediatePreferences: UserPreferences = {
      scent_families: ['fresh_clean', 'woody'],
      personality_style: 'unique_creative',
      occasion_preferences: ['everyday', 'evening'],
      experience_level: 'intermediate'
    };

    it('should generate explanations between 50-75 words', () => {
      const explanation = engine.generateExplanation(mockFragrance, intermediatePreferences);
      const wordCount = explanation.split(' ').filter(word => word.length > 0).length;
      
      expect(wordCount).toBeGreaterThanOrEqual(50);
      expect(wordCount).toBeLessThanOrEqual(75);
    });

    it('should include some technical terms but remain accessible', () => {
      const explanation = engine.generateExplanation(mockFragrance, intermediatePreferences);
      
      // Should include moderate technical terms
      const moderateTerms = ['notes', 'accords', 'composition', 'blend'];
      const includesTechnical = moderateTerms.some(term => 
        explanation.toLowerCase().includes(term.toLowerCase())
      );
      
      expect(includesTechnical).toBe(true);
      
      // But should not include very advanced terminology
      const advancedTerms = ['molecular interactions', 'olfactory architecture'];
      const includesAdvanced = advancedTerms.some(term => 
        explanation.toLowerCase().includes(term.toLowerCase())
      );
      
      expect(includesAdvanced).toBe(false);
    });

    it('should mention specific fragrance characteristics', () => {
      const explanation = engine.generateExplanation(mockFragrance, intermediatePreferences);
      
      // Should reference the actual fragrance name
      expect(explanation).toContain(mockFragrance.name);
      
      // Should mention specific accords
      const mentionsAccords = mockFragrance.accords.some(accord => 
        explanation.toLowerCase().includes(accord.toLowerCase())
      );
      expect(mentionsAccords).toBe(true);
    });

    it('should include rating information when available', () => {
      const explanation = engine.generateExplanation(mockFragrance, intermediatePreferences);
      
      // Should mention rating if high (>4.0)
      if (mockFragrance.rating_average && mockFragrance.rating_average > 4.0) {
        expect(explanation).toMatch(/4\.\d\/5|highly rated/i);
      }
    });
  });

  describe('Advanced Experience Level', () => {
    const advancedPreferences: UserPreferences = {
      scent_families: ['fresh_clean', 'woody', 'aromatic'],
      personality_style: 'bold_confident',
      occasion_preferences: ['professional', 'evening', 'special_occasions'],
      experience_level: 'advanced'
    };

    it('should generate detailed explanations over 100 words', () => {
      const explanation = engine.generateExplanation(mockFragrance, advancedPreferences);
      const wordCount = explanation.split(' ').filter(word => word.length > 0).length;
      
      expect(wordCount).toBeGreaterThanOrEqual(100);
    });

    it('should include sophisticated technical terminology', () => {
      const explanation = engine.generateExplanation(mockFragrance, advancedPreferences);
      
      const advancedTerms = [
        'composition',
        'olfactory',
        'architecture',
        'accords',
        'longevity',
        'sillage',
        'sophisticated'
      ];
      
      const includesAdvanced = advancedTerms.some(term => 
        explanation.toLowerCase().includes(term.toLowerCase())
      );
      
      expect(includesAdvanced).toBe(true);
    });

    it('should provide comprehensive analysis', () => {
      const explanation = engine.generateExplanation(mockFragrance, advancedPreferences);
      
      // Should mention multiple aspects
      const analysisAspects = [
        mockFragrance.name, // Fragrance name
        mockFragrance.brand, // Brand
        'accords', // Technical structure
        'performance', // Performance characteristics
      ];
      
      const coveredAspects = analysisAspects.filter(aspect => 
        explanation.toLowerCase().includes(aspect.toLowerCase())
      ).length;
      
      expect(coveredAspects).toBeGreaterThanOrEqual(3);
    });

    it('should include market positioning and statistics', () => {
      const explanation = engine.generateExplanation(mockFragrance, advancedPreferences);
      
      // Should reference popularity score and ratings with context
      if (mockFragrance.popularity_score && mockFragrance.rating_average) {
        expect(explanation).toMatch(/popularity.*score|rating.*evaluation/i);
      }
    });

    it('should provide personality analysis depth', () => {
      const explanation = engine.generateExplanation(mockFragrance, advancedPreferences);
      
      // Should include detailed personality connection
      expect(explanation.toLowerCase()).toMatch(/confidence|assertive|distinctive|projection/);
    });
  });

  describe('Explanation Validation', () => {
    it('should correctly validate beginner explanations', () => {
      const validBeginner = "✅ Fresh like you wanted\n👍 Works for work, dates\n💡 Similar to Sauvage but more unique\n🧪 Try $14 sample before full bottle";
      const invalidBeginner = "This sophisticated composition demonstrates complex molecular interactions with exceptional longevity characteristics throughout the olfactory experience.";
      
      expect(engine.validateExplanation(validBeginner, 'beginner')).toBe(true);
      expect(engine.validateExplanation(invalidBeginner, 'beginner')).toBe(false);
    });

    it('should correctly validate intermediate explanations', () => {
      const validIntermediate = "Bleu de Chanel by Chanel features a well-balanced composition of citrus, woody, aromatic notes that align perfectly with your preference for fresh clean and woody scent families. Its timeless composition suits your classic aesthetic perfectly. The balanced note structure provides good longevity and moderate projection, making it suitable for both casual and professional settings. Users consistently rate this fragrance 4.3/5 stars across many reviews.";
      const tooShort = "Great fragrance.";
      const tooLong = "This is an extremely long explanation that goes on and on with excessive detail about every single aspect of the fragrance including its complex molecular structure, detailed performance characteristics, comprehensive brand positioning analysis, thorough market analysis covering demographics and consumer behavior, seasonal appropriateness across all four seasons with specific weather conditions, and detailed comparison with hundreds of other fragrances in the same category covering every possible accord combination and scent profile variation that continues for many more sentences with redundant information about olfactory science and perfumery techniques and manufacturing processes and distribution channels and retail positioning and price analysis.";
      
      expect(engine.validateExplanation(validIntermediate, 'intermediate')).toBe(true);
      expect(engine.validateExplanation(tooShort, 'intermediate')).toBe(false);
      expect(engine.validateExplanation(tooLong, 'intermediate')).toBe(false);
    });

    it('should correctly validate advanced explanations', () => {
      const validAdvanced = "Bleu de Chanel by Chanel presents a sophisticated fresh composition that aligns exceptionally well with your complex olfactory preferences and demonstrates mastery of contemporary perfumery techniques. The fragrance architecture features an intricate interplay of citrus, woody, aromatic, cedar, sandalwood accords that directly correspond to your expressed preference for fresh clean and woody scent families, creating a harmonious olfactory experience that evolves beautifully throughout its wear cycle. This particular composition demonstrates exceptional longevity characteristics ranging from 6-8 hours with impressive sillage projection that creates an elegant scent trail without overwhelming nearby individuals, typical of well-executed fresh fragrances in this caliber. The compositional structure follows classical perfumery principles with well-balanced top, heart, and base note progression that ensures consistent performance across varied environmental conditions. The molecular composition and volatility profile make this fragrance particularly well-suited for your specified occasion preferences, with its balanced top-to-base note progression ensuring appropriate presence across various social and professional contexts.";
      const tooShort = "Good advanced fragrance with nice notes.";
      
      expect(engine.validateExplanation(validAdvanced, 'advanced')).toBe(true);
      expect(engine.validateExplanation(tooShort, 'advanced')).toBe(false);
    });
  });

  describe('Cross-Experience Level Comparison', () => {
    const basePreferences: Omit<UserPreferences, 'experience_level'> = {
      scent_families: ['fresh_clean'],
      personality_style: 'classic_timeless',
      occasion_preferences: ['everyday']
    };

    it('should generate progressively more detailed explanations', () => {
      const beginnerExplanation = engine.generateExplanation(mockFragrance, {
        ...basePreferences,
        experience_level: 'beginner'
      });
      
      const intermediateExplanation = engine.generateExplanation(mockFragrance, {
        ...basePreferences,
        experience_level: 'intermediate'
      });
      
      const advancedExplanation = engine.generateExplanation(mockFragrance, {
        ...basePreferences,
        experience_level: 'advanced'
      });

      const beginnerWords = beginnerExplanation.split(' ').length;
      const intermediateWords = intermediateExplanation.split(' ').length;
      const advancedWords = advancedExplanation.split(' ').length;

      expect(beginnerWords).toBeLessThan(intermediateWords);
      expect(intermediateWords).toBeLessThan(advancedWords);
    });

    it('should use different language complexity across levels', () => {
      const explanations = {
        beginner: engine.generateExplanation(mockFragrance, {
          ...basePreferences,
          experience_level: 'beginner'
        }),
        intermediate: engine.generateExplanation(mockFragrance, {
          ...basePreferences,
          experience_level: 'intermediate'
        }),
        advanced: engine.generateExplanation(mockFragrance, {
          ...basePreferences,
          experience_level: 'advanced'
        })
      };

      // Beginner should be simplest
      expect(explanations.beginner.toLowerCase()).not.toContain('composition');
      
      // Intermediate should have moderate complexity
      expect(explanations.intermediate.toLowerCase()).toMatch(/notes|accords|blend/);
      
      // Advanced should have highest complexity
      expect(explanations.advanced.toLowerCase()).toMatch(/olfactory|sophisticated|architecture/);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle fragrances with minimal data', () => {
      const minimalFragrance: FragranceData = {
        id: 'minimal-1',
        name: 'Unknown Fragrance',
        brand: 'Unknown Brand',
        accords: [],
        scent_family: 'miscellaneous'
      };

      const preferences: UserPreferences = {
        scent_families: ['fresh_clean'],
        personality_style: 'classic_timeless',
        occasion_preferences: ['everyday'],
        experience_level: 'beginner'
      };

      const explanation = engine.generateExplanation(minimalFragrance, preferences);
      
      expect(explanation).toBeTruthy();
      expect(explanation.length).toBeGreaterThan(20);
      expect(explanation).not.toBe('');
    });

    it('should default to beginner level for unknown experience levels', () => {
      const preferences: UserPreferences = {
        scent_families: ['fresh_clean'],
        personality_style: 'classic_timeless',
        occasion_preferences: ['everyday'],
        experience_level: 'unknown' as ExperienceLevel
      };

      const explanation = engine.generateExplanation(mockFragrance, preferences);
      const wordCount = explanation.split(' ').length;
      
      // Should behave like beginner level
      expect(wordCount).toBeLessThanOrEqual(40);
    });

    it('should handle empty preference arrays gracefully', () => {
      const emptyPreferences: UserPreferences = {
        scent_families: [],
        personality_style: '',
        occasion_preferences: [],
        experience_level: 'beginner'
      };

      const explanation = engine.generateExplanation(mockFragrance, emptyPreferences);
      
      expect(explanation).toBeTruthy();
      expect(explanation.length).toBeGreaterThan(10);
    });
  });

  describe('Format Options', () => {
    const preferences: UserPreferences = {
      scent_families: ['fresh_clean'],
      personality_style: 'classic_timeless',
      occasion_preferences: ['everyday'],
      experience_level: 'beginner'
    };

    it('should support simple format with bullet points', () => {
      const explanation = engine.generateExplanation(mockFragrance, preferences, {
        format: 'simple'
      });

      expect(explanation).toContain('\n'); // Should have line breaks
      expect(explanation).toMatch(/[✅👍💡🧪]/); // Should have emojis
    });

    it('should support paragraph format', () => {
      const explanation = engine.generateExplanation(mockFragrance, preferences, {
        format: 'paragraph'
      });

      expect(explanation).not.toContain('\n'); // Should be continuous text
    });

    it('should respect emoji inclusion option', () => {
      const withEmojis = engine.generateExplanation(mockFragrance, preferences, {
        includeEmojis: true
      });
      
      const withoutEmojis = engine.generateExplanation(mockFragrance, preferences, {
        includeEmojis: false
      });

      expect(withEmojis).toMatch(/[✅👍💡🧪]/);
      expect(withoutEmojis).not.toMatch(/[✅👍💡🧪]/);
    });
  });
});

describe('ExplanationEngine - Real-World Scenarios', () => {
  let engine: ExplanationEngine;

  beforeEach(() => {
    engine = new ExplanationEngine();
  });

  describe('Beginner User Journey', () => {
    it('should help complete beginner understand why fragrance matches', () => {
      const fragrance: FragranceData = {
        id: 'beginner-friendly',
        name: 'Acqua di Gio',
        brand: 'Giorgio Armani',
        accords: ['aquatic', 'citrus', 'fresh'],
        scent_family: 'fresh'
      };

      const newUserPreferences: UserPreferences = {
        scent_families: ['fresh_clean'],
        personality_style: 'easy_relaxed',
        occasion_preferences: ['everyday'],
        experience_level: 'beginner'
      };

      const explanation = engine.generateExplanation(fragrance, newUserPreferences);

      // Should be immediately understandable
      expect(explanation.toLowerCase()).toMatch(/fresh|clean|like you wanted/);
      expect(explanation.toLowerCase()).toMatch(/everyday|daily/);
      expect(explanation).toMatch(/sample/i);
      
      // Should not overwhelm with technical details
      expect(explanation.split(' ').length).toBeLessThanOrEqual(40);
    });
  });

  describe('Advanced User Analysis', () => {
    it('should provide comprehensive analysis for experienced users', () => {
      const nicheFrgrance: FragranceData = {
        id: 'niche-complex',
        name: 'Oud Wood',
        brand: 'Tom Ford',
        accords: ['oud', 'woody', 'warm', 'oriental', 'balsamic'],
        scent_family: 'oriental',
        rating_average: 4.1,
        rating_count: 890,
        popularity_score: 12
      };

      const expertPreferences: UserPreferences = {
        scent_families: ['oriental_luxury', 'woody', 'warm_cozy'],
        personality_style: 'unique_creative',
        occasion_preferences: ['evening', 'special_occasions'],
        experience_level: 'advanced'
      };

      const explanation = engine.generateExplanation(nicheFrgrance, expertPreferences);

      // Should include technical analysis
      expect(explanation.toLowerCase()).toMatch(/composition|olfactory|sophisticated/);
      expect(explanation).toContain('Tom Ford');
      expect(explanation).toContain('Oud Wood');
      
      // Should reference multiple accords
      const mentionedAccords = nicheFrgrance.accords.filter(accord => 
        explanation.toLowerCase().includes(accord.toLowerCase())
      );
      expect(mentionedAccords.length).toBeGreaterThanOrEqual(2);
      
      // Should be comprehensive
      expect(explanation.split(' ').length).toBeGreaterThanOrEqual(100);
    });
  });
});