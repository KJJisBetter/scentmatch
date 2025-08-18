/**
 * AI Profile Generation System Tests
 *
 * Tests the AI-powered profile generation system that creates unique,
 * personalized profile names and descriptions based on quiz responses
 */

import { AIProfileGenerator } from '@/lib/ai/ai-profile-generator';
import { ProfileCache } from '@/lib/ai/profile-cache';

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Mocked AI description for testing',
              },
            },
          ],
        }),
      },
    },
  })),
}));

describe('AIProfileGenerator', () => {
  let generator: AIProfileGenerator;

  beforeEach(() => {
    generator = new AIProfileGenerator();
    jest.clearAllMocks();
  });

  describe('Unique Profile Name Generation', () => {
    test('should generate unique profile names following adjective + noun + place pattern', () => {
      const personalityData = {
        personality_type: 'romantic_floral_lover',
        experience_level: 'enthusiast',
        dimensions: { floral: 0.8, fresh: 0.2 },
        confidence_score: 0.9,
      };

      const name1 = generator.generateUniqueProfileName(personalityData);
      const name2 = generator.generateUniqueProfileName(personalityData);

      // Should follow pattern
      expect(name1).toMatch(/\w+ \w+ of \w+/);
      expect(name2).toMatch(/\w+ \w+ of \w+/);

      // Should be different
      expect(name1).not.toBe(name2);

      // Should contain 3 parts
      expect(name1.split(' ')).toHaveLength(4); // adjective + noun + "of" + place
      expect(name2.split(' ')).toHaveLength(4);
    });

    test('should adapt vocabulary to experience level', () => {
      const basePersonality = {
        personality_type: 'sophisticated_woody_lover',
        dimensions: { woody: 0.7, oriental: 0.3 },
        confidence_score: 0.8,
      };

      const beginnerName = generator.generateUniqueProfileName({
        ...basePersonality,
        experience_level: 'beginner',
      });

      const collectorName = generator.generateUniqueProfileName({
        ...basePersonality,
        experience_level: 'collector',
      });

      // Beginner names should use simpler vocabulary
      expect(beginnerName).toMatch(/discovering|gentle|fresh|sweet|bright/i);

      // Collector names should use sophisticated vocabulary
      expect(collectorName).toMatch(
        /discerning|connoisseur|avant-garde|masterful|visionary/i
      );
    });

    test('should reflect dominant fragrance dimension in name', () => {
      const floralPersonality = {
        personality_type: 'romantic_floral_lover',
        experience_level: 'enthusiast',
        dimensions: { floral: 0.9, fresh: 0.1 },
        confidence_score: 0.8,
      };

      const woodyPersonality = {
        personality_type: 'sophisticated_woody_lover',
        experience_level: 'enthusiast',
        dimensions: { woody: 0.9, oriental: 0.1 },
        confidence_score: 0.8,
      };

      const floralName = generator.generateUniqueProfileName(floralPersonality);
      const woodyName = generator.generateUniqueProfileName(woodyPersonality);

      // Names should reflect dominant dimensions
      expect(floralName).toMatch(/bloom|bouquet|petal|rose|garden/i);
      expect(woodyName).toMatch(/forest|cedar|earth|grove|wood/i);
    });

    test('should generate evocative place names', () => {
      const personality = {
        personality_type: 'mysterious_oriental_lover',
        experience_level: 'collector',
        dimensions: { oriental: 0.8, woody: 0.2 },
        confidence_score: 0.9,
      };

      const name = generator.generateUniqueProfileName(personality);

      // Should end with evocative place
      expect(name).toMatch(
        /(gardens|sanctuary|haven|palace|atelier|studio|temple|library)$/i
      );
    });

    test('should ensure name uniqueness across multiple generations', () => {
      const personality = {
        personality_type: 'classic_fresh_lover',
        experience_level: 'beginner',
        dimensions: { fresh: 0.7, floral: 0.3 },
        confidence_score: 0.8,
      };

      const names = new Set();
      for (let i = 0; i < 50; i++) {
        const name = generator.generateUniqueProfileName(personality);
        names.add(name);
      }

      // Should generate at least 40 unique names out of 50 attempts
      expect(names.size).toBeGreaterThan(40);
    });
  });

  describe('Multi-Paragraph AI Description Generation', () => {
    test('should generate 3-paragraph descriptions', async () => {
      const profileData = {
        profile_name: 'Elegant Rose of Secret Gardens',
        personality_analysis: {
          personality_type: 'romantic_floral_lover',
          experience_level: 'enthusiast',
          dimensions: { floral: 0.8, fresh: 0.2 },
          confidence_score: 0.9,
        },
        selected_favorites: [
          { id: '1', name: 'Chanel No. 5', brand: 'Chanel' },
        ],
      };

      const description = await generator.generateAIDescription(profileData);

      // Should have 3 paragraphs
      const paragraphs = description
        .split('\n\n')
        .filter(p => p.trim().length > 0);
      expect(paragraphs).toHaveLength(3);

      // Should include profile name
      expect(description).toContain(profileData.profile_name);

      // Should be substantial (at least 300 characters)
      expect(description.length).toBeGreaterThan(300);
    });

    test('should adapt description complexity to experience level', async () => {
      const baseProfile = {
        profile_name: 'Sophisticated Cedar of Ancient Groves',
        personality_analysis: {
          personality_type: 'woody_lover',
          dimensions: { woody: 0.8, oriental: 0.2 },
          confidence_score: 0.9,
        },
        selected_favorites: [],
      };

      const beginnerDescription = await generator.generateAIDescription({
        ...baseProfile,
        personality_analysis: {
          ...baseProfile.personality_analysis,
          experience_level: 'beginner',
        },
      });

      const collectorDescription = await generator.generateAIDescription({
        ...baseProfile,
        personality_analysis: {
          ...baseProfile.personality_analysis,
          experience_level: 'collector',
        },
      });

      // Beginner descriptions should use simpler language
      expect(beginnerDescription).toMatch(/scent|smell|fresh|sweet|pretty/i);
      expect(beginnerDescription).not.toMatch(
        /olfactory|sillage|composition|accord/i
      );

      // Collector descriptions should use sophisticated terminology
      expect(collectorDescription).toMatch(
        /olfactory|composition|artistry|craftsmanship|nuanced/i
      );
    });

    test('should incorporate selected favorites into description', async () => {
      const profileData = {
        profile_name: 'Modern Citrus of Urban Gardens',
        personality_analysis: {
          personality_type: 'fresh_lover',
          experience_level: 'enthusiast',
          dimensions: { fresh: 0.7, citrus: 0.3 },
          confidence_score: 0.8,
        },
        selected_favorites: [
          { id: '1', name: 'Tom Ford Neroli Portofino', brand: 'Tom Ford' },
          { id: '2', name: 'Chanel Chance Eau Fraiche', brand: 'Chanel' },
        ],
      };

      const description = await generator.generateAIDescription(profileData);

      // Should reference favorite fragrances or brands
      expect(description).toMatch(/tom ford|chanel|neroli|citrus|fresh/i);
    });

    test('should handle missing OpenAI response gracefully', async () => {
      // Mock OpenAI failure
      const mockOpenAI = require('openai').OpenAI;
      mockOpenAI.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('API Error')),
          },
        },
      }));

      const profileData = {
        profile_name: 'Test Profile',
        personality_analysis: {
          personality_type: 'test_type',
          experience_level: 'beginner',
          dimensions: { fresh: 0.5 },
          confidence_score: 0.7,
        },
        selected_favorites: [],
      };

      const description = await generator.generateAIDescription(profileData);

      // Should return fallback template
      expect(description).toBeTruthy();
      expect(description.length).toBeGreaterThan(100);
      expect(description).toContain(profileData.profile_name);
    });
  });

  describe('3-Tier Caching System', () => {
    let cache: ProfileCache;

    beforeEach(() => {
      cache = new ProfileCache();
    });

    test('should implement cache → template → AI fallback hierarchy', async () => {
      const profileKey = 'test-profile-123';
      const profileData = {
        personality_type: 'romantic_floral_lover',
        experience_level: 'enthusiast',
      };

      // First call should hit AI (cache miss)
      const result1 = await cache.getOrGenerateProfile(profileKey, profileData);
      expect(result1.source).toBe('ai');
      expect(result1.profile).toBeTruthy();

      // Second call should hit cache
      const result2 = await cache.getOrGenerateProfile(profileKey, profileData);
      expect(result2.source).toBe('cache');
      expect(result2.profile).toEqual(result1.profile);
    });

    test('should fall back to templates when AI fails', async () => {
      // Mock AI failure
      jest
        .spyOn(generator, 'generateAIDescription')
        .mockRejectedValue(new Error('AI Error'));

      const profileKey = 'test-profile-456';
      const profileData = {
        personality_type: 'woody_lover',
        experience_level: 'collector',
      };

      const result = await cache.getOrGenerateProfile(profileKey, profileData);

      expect(result.source).toBe('template');
      expect(result.profile).toBeTruthy();
      expect(result.profile.description).toContain('template'); // Should indicate template source
    });

    test('should respect cache expiration (24 hours)', async () => {
      const profileKey = 'test-profile-789';
      const profileData = {
        personality_type: 'fresh_lover',
        experience_level: 'beginner',
      };

      // Set cache entry with old timestamp
      const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      cache.set(profileKey, {
        profile: { name: 'Old Profile', description: 'Old description' },
        timestamp: oldTimestamp,
        source: 'ai',
      });

      // Should regenerate due to expiration
      const result = await cache.getOrGenerateProfile(profileKey, profileData);
      expect(result.source).toBe('ai'); // Should hit AI, not expired cache
      expect(result.profile.description).not.toBe('Old description');
    });

    test('should handle cache size limits (LRU eviction)', () => {
      const maxCacheSize = 1000; // Assume 1000 entry limit

      // Fill cache beyond limit
      for (let i = 0; i < maxCacheSize + 100; i++) {
        cache.set(`profile-${i}`, {
          profile: { name: `Profile ${i}`, description: `Description ${i}` },
          timestamp: Date.now(),
          source: 'ai',
        });
      }

      // Oldest entries should be evicted
      expect(cache.has('profile-0')).toBeFalsy();
      expect(cache.has(`profile-${maxCacheSize + 50}`)).toBeTruthy();
    });
  });

  describe('Profile Uniqueness Validation', () => {
    test('should detect and regenerate duplicate profile names', async () => {
      const existingNames = [
        'Elegant Rose of Secret Gardens',
        'Mysterious Spice of Ancient Temples',
        'Fresh Breeze of Morning Meadows',
      ];

      const profileData = {
        personality_type: 'romantic_floral_lover',
        experience_level: 'enthusiast',
        dimensions: { floral: 0.8 },
        confidence_score: 0.9,
      };

      // Mock generator to return existing name first, then unique one
      let callCount = 0;
      jest
        .spyOn(generator, 'generateUniqueProfileName')
        .mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return existingNames[0]; // Return duplicate
          }
          return 'Unique New Profile Name'; // Return unique name
        });

      const result = await generator.generateUniqueProfile(
        profileData,
        existingNames
      );

      expect(generator.generateUniqueProfileName).toHaveBeenCalledTimes(2);
      expect(result.profile_name).toBe('Unique New Profile Name');
      expect(result.profile_name).not.toContain(existingNames[0]);
    });

    test('should calculate uniqueness score based on complexity', () => {
      const simpleProfile = {
        profile_name: 'Nice Person',
        style_descriptor: 'good',
        experience_level: 'beginner',
      };

      const complexProfile = {
        profile_name: 'Sophisticated Connoisseur of Rare Vintage Treasures',
        style_descriptor: 'avant-garde and masterfully curated',
        experience_level: 'collector',
      };

      const simpleScore = generator.calculateUniquenessScore(simpleProfile);
      const complexScore = generator.calculateUniquenessScore(complexProfile);

      expect(complexScore).toBeGreaterThan(simpleScore);
      expect(simpleScore).toBeGreaterThan(0);
      expect(complexScore).toBeLessThanOrEqual(1);
    });

    test('should regenerate profiles with low uniqueness scores', async () => {
      const profileData = {
        personality_type: 'basic_type',
        experience_level: 'beginner',
        dimensions: { fresh: 0.5 },
        confidence_score: 0.6,
      };

      // Mock generator to return low uniqueness first time
      jest
        .spyOn(generator, 'calculateUniquenessScore')
        .mockReturnValueOnce(0.3) // Below threshold
        .mockReturnValueOnce(0.8); // Above threshold

      const result = await generator.generateUniqueProfile(profileData, []);

      // Should have regenerated due to low uniqueness
      expect(generator.calculateUniquenessScore).toHaveBeenCalledTimes(2);
      expect(result.uniqueness_score).toBe(0.8);
    });
  });

  describe('Performance and Caching', () => {
    test('should complete profile generation under 500ms', async () => {
      const profileData = {
        personality_type: 'fresh_lover',
        experience_level: 'enthusiast',
        dimensions: { fresh: 0.7, floral: 0.3 },
        confidence_score: 0.8,
      };

      const startTime = Date.now();
      await generator.generateUniqueProfile(profileData, []);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500);
    });

    test('should use template fallback for immediate response', async () => {
      // Mock slow AI response
      const mockOpenAI = require('openai').OpenAI;
      mockOpenAI.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: jest.fn().mockImplementation(
              () => new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
            ),
          },
        },
      }));

      const profileData = {
        personality_type: 'woody_lover',
        experience_level: 'collector',
        dimensions: { woody: 0.8 },
        confidence_score: 0.9,
      };

      const startTime = Date.now();
      const result = await generator.generateUniqueProfile(profileData, []);
      const endTime = Date.now();

      // Should return quickly using template
      expect(endTime - startTime).toBeLessThan(1000);
      expect(result.description).toBeTruthy();
    });

    test('should implement cost optimization through template hybridization', async () => {
      const profileData = {
        personality_type: 'gourmand_lover',
        experience_level: 'enthusiast',
        dimensions: { gourmand: 0.7, fruity: 0.3 },
        confidence_score: 0.8,
      };

      const result = await generator.generateUniqueProfile(profileData, []);

      // Should use hybrid approach (80% template, 20% AI)
      expect(result.generation_method).toBe('hybrid');
      expect(result.ai_token_usage).toBeLessThan(500); // Cost optimization
    });
  });

  describe('Experience-Level Personalization', () => {
    test('should generate beginner-appropriate profiles', async () => {
      const beginnerData = {
        personality_type: 'casual_fresh_lover',
        experience_level: 'beginner',
        dimensions: { fresh: 0.6, floral: 0.4 },
        confidence_score: 0.7,
      };

      const profile = await generator.generateUniqueProfile(beginnerData, []);

      // Should use encouraging, accessible language
      expect(profile.description).toMatch(
        /discover|journey|beginning|wonderful|perfect/i
      );
      expect(profile.description).not.toMatch(
        /olfactory|composition|accord|sillage/i
      );

      // Should focus on emotions and lifestyle
      expect(profile.description).toMatch(
        /feel|style|personality|charm|confidence/i
      );
    });

    test('should generate collector-level sophisticated profiles', async () => {
      const collectorData = {
        personality_type: 'avant_garde_oriental_lover',
        experience_level: 'collector',
        dimensions: { oriental: 0.7, woody: 0.3 },
        confidence_score: 0.95,
      };

      const profile = await generator.generateUniqueProfile(collectorData, []);

      // Should use sophisticated perfumery language
      expect(profile.description).toMatch(
        /artistry|composition|olfactory|craftsmanship|masterful/i
      );

      // Should reference expertise and collection
      expect(profile.description).toMatch(
        /collection|expertise|connoisseur|sophisticated|discerning/i
      );
    });

    test('should incorporate favorite fragrances for enthusiast+ levels', async () => {
      const enthusiastData = {
        personality_type: 'refined_floral_lover',
        experience_level: 'enthusiast',
        dimensions: { floral: 0.8, fruity: 0.2 },
        confidence_score: 0.85,
        selected_favorites: [
          { id: '1', name: 'Tom Ford Black Orchid', brand: 'Tom Ford' },
          { id: '2', name: "Dior J'adore", brand: 'Dior' },
        ],
      };

      const profile = await generator.generateUniqueProfile(enthusiastData, []);

      // Should reference favorite brands or fragrance characteristics
      expect(profile.description).toMatch(
        /tom ford|dior|orchid|floral|sophistication/i
      );
    });
  });

  describe('Error Handling and Fallbacks', () => {
    test('should handle OpenAI API failures gracefully', async () => {
      // Mock OpenAI to throw error
      const mockOpenAI = require('openai').OpenAI;
      mockOpenAI.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('OpenAI API Error')),
          },
        },
      }));

      const profileData = {
        personality_type: 'oriental_lover',
        experience_level: 'collector',
        dimensions: { oriental: 0.9 },
        confidence_score: 0.8,
      };

      const result = await generator.generateUniqueProfile(profileData, []);

      // Should return valid profile using template fallback
      expect(result.profile_name).toBeTruthy();
      expect(result.description).toBeTruthy();
      expect(result.generation_method).toBe('template_fallback');
    });

    test('should validate generated content for appropriateness', async () => {
      const profileData = {
        personality_type: 'mysterious_lover',
        experience_level: 'enthusiast',
        dimensions: { oriental: 0.8, woody: 0.2 },
        confidence_score: 0.9,
      };

      const result = await generator.generateUniqueProfile(profileData, []);

      // Should not contain inappropriate content
      expect(result.description).not.toMatch(
        /\b(sex|drug|alcohol|inappropriate)\b/i
      );

      // Should be positive and encouraging
      expect(result.description).toMatch(
        /wonderful|beautiful|perfect|amazing|elegant/i
      );
    });

    test('should provide meaningful insights regardless of confidence score', async () => {
      const lowConfidenceData = {
        personality_type: 'uncertain_type',
        experience_level: 'beginner',
        dimensions: { fresh: 0.4, floral: 0.3, woody: 0.3 },
        confidence_score: 0.4, // Low confidence
      };

      const highConfidenceData = {
        personality_type: 'clear_floral_lover',
        experience_level: 'enthusiast',
        dimensions: { floral: 0.9, fresh: 0.1 },
        confidence_score: 0.95, // High confidence
      };

      const lowConfidenceProfile = await generator.generateUniqueProfile(
        lowConfidenceData,
        []
      );
      const highConfidenceProfile = await generator.generateUniqueProfile(
        highConfidenceData,
        []
      );

      // Both should provide meaningful content
      expect(lowConfidenceProfile.description.length).toBeGreaterThan(200);
      expect(highConfidenceProfile.description.length).toBeGreaterThan(200);

      // Low confidence should acknowledge exploration nature
      expect(lowConfidenceProfile.description).toMatch(
        /explore|discover|journey|developing/i
      );

      // High confidence should be more definitive
      expect(highConfidenceProfile.description).toMatch(
        /clearly|definitely|perfectly|precisely/i
      );
    });
  });

  describe('Integration with Quiz System', () => {
    test('should integrate seamlessly with quiz analysis results', async () => {
      const quizResults = {
        experience_level: 'enthusiast',
        personality_analysis: {
          personality_type: 'romantic_floral_lover',
          dimensions: { floral: 0.8, fresh: 0.2 },
          confidence_score: 0.85,
          occasion_preferences: ['romantic', 'evening'],
          seasonal_preferences: ['spring', 'summer'],
        },
        selected_favorites: [
          { id: '1', name: 'Chanel Coco Mademoiselle', brand: 'Chanel' },
        ],
      };

      const profile =
        await generator.generateProfileFromQuizResults(quizResults);

      // Should include all relevant quiz data
      expect(profile.experience_context).toBe('enthusiast');
      expect(profile.profile_name).toBeTruthy();
      expect(profile.description).toBeTruthy();
      expect(profile.personality_insights).toContain('romantic');
      expect(profile.seasonal_preferences).toContain('spring');
    });
  });
});
