import { describe, it, expect } from 'vitest';
import {
  authenticPersonalityProfiles,
  matchPersonalityProfile,
  getPersonalityFragranceRecommendations,
} from '@/lib/personality/authentic-profiles';

describe('Authentic Personality Profiles', () => {
  it('should have 7 distinct personality profiles', () => {
    expect(authenticPersonalityProfiles).toHaveLength(7);

    // Verify each profile has required properties
    authenticPersonalityProfiles.forEach(profile => {
      expect(profile).toHaveProperty('id');
      expect(profile).toHaveProperty('name');
      expect(profile).toHaveProperty('archetype');
      expect(profile).toHaveProperty('description');
      expect(profile).toHaveProperty('scentProfile');
      expect(profile).toHaveProperty('keyTraits');
      expect(profile.keyTraits).toBeInstanceOf(Array);
      expect(profile.keyTraits.length).toBeGreaterThan(0);
    });
  });

  it('should have memorable and authentic profile names', () => {
    const profileNames = authenticPersonalityProfiles.map(p => p.name);

    expect(profileNames).toContain('The Velvet Rebel');
    expect(profileNames).toContain('The Serene Voyager');
    expect(profileNames).toContain('The Golden Romantic');
    expect(profileNames).toContain('The Midnight Philosopher');
    expect(profileNames).toContain('The Wild Sophisticate');
    expect(profileNames).toContain('The Gentle Maverick');
    expect(profileNames).toContain('The Cosmic Dreamer');

    // Verify naming patterns follow research insights
    profileNames.forEach(name => {
      expect(name).toMatch(/^The \w+ \w+$/); // "The [Adjective] [Noun]" pattern
      expect(name).not.toMatch(/profile|type|category/i); // Avoid robotic terms
    });
  });

  it('should have engaging storytelling descriptions', () => {
    authenticPersonalityProfiles.forEach(profile => {
      // Check for storytelling elements
      expect(profile.description).toContain('As **' + profile.name + '**');
      expect(profile.description.length).toBeGreaterThan(200); // Substantial descriptions

      // Should avoid robotic language patterns
      expect(profile.description).not.toMatch(
        /you are a|you have a tendency|your type/i
      );

      // Should include sensory and aspirational language
      expect(
        profile.description.includes('you') ||
          profile.description.includes('your') ||
          profile.description.includes('You')
      ).toBe(true);
    });
  });

  it('should match personality profiles based on emotional responses', () => {
    const responses = [
      {
        question_id: 'weekend_ritual',
        answer_value: 'coffee_journal',
        emotional_trigger: 'lifestyle_aspiration',
      },
      {
        question_id: 'texture_affinity',
        answer_value: 'velvet_crush',
        emotional_trigger: 'sensory_memory',
      },
      {
        question_id: 'memory_scent',
        answer_value: 'library_secrets',
        emotional_trigger: 'nostalgic_resonance',
      },
    ];

    const matchedProfile = matchPersonalityProfile(responses);

    expect(matchedProfile).toBeDefined();
    expect(matchedProfile.name).toBe('The Midnight Philosopher');
    expect(matchedProfile.keyTraits).toContain('thoughtful');
    expect(matchedProfile.keyTraits).toContain('mysterious');
  });

  it('should provide meaningful fragrance recommendations based on personality', () => {
    const velvetRebelProfile = authenticPersonalityProfiles.find(
      p => p.id === 'velvet_rebel'
    )!;
    const recommendations =
      getPersonalityFragranceRecommendations(velvetRebelProfile);

    expect(recommendations.primary_families).toContain('woody');
    expect(recommendations.primary_families).toContain('oriental');
    expect(recommendations.secondary_families).toContain('leather');
    expect(recommendations.avoid_families).toContain('overly sweet');
    expect(recommendations.personality_context).toContain(
      'complexity and story'
    );
  });

  it('should handle multiple selection scoring correctly', () => {
    const multipleSelectionResponses = [
      {
        question_id: 'color_emotion',
        answer_value: 'champagne_gold,deep_forest',
        answer_metadata: { selections: ['champagne_gold', 'deep_forest'] },
        emotional_trigger: 'self_identity',
      },
      {
        question_id: 'dream_escape',
        answer_value: 'secret_garden,forest_cottage',
        answer_metadata: { selections: ['secret_garden', 'forest_cottage'] },
        emotional_trigger: 'aspirational_fantasy',
      },
    ];

    const matchedProfile = matchPersonalityProfile(multipleSelectionResponses);

    expect(matchedProfile).toBeDefined();
    // Should match with nature-oriented profiles like Grounded Alchemist
    expect([
      'grounded_alchemist',
      'golden_romantic',
      'serene_voyager',
    ]).toContain(matchedProfile.id);
  });

  it('should include lifestyle and social style information', () => {
    authenticPersonalityProfiles.forEach(profile => {
      expect(profile.lifestyle).toHaveProperty('occasions');
      expect(profile.lifestyle).toHaveProperty('energy');
      expect(profile.lifestyle).toHaveProperty('socialStyle');
      expect(profile.lifestyle.occasions).toBeInstanceOf(Array);
      expect(profile.lifestyle.occasions.length).toBeGreaterThan(0);
    });
  });

  it('should have distinct scent profiles for each personality', () => {
    const scentProfiles = authenticPersonalityProfiles.map(p => p.scentProfile);

    // Each profile should have different primary scent families
    scentProfiles.forEach(profile => {
      expect(profile.primary).toBeInstanceOf(Array);
      expect(profile.primary.length).toBeGreaterThan(0);
      expect(profile.secondary).toBeInstanceOf(Array);
      expect(profile.avoid).toBeInstanceOf(Array);
    });

    // Verify variety in scent preferences
    const allPrimaryFamilies = scentProfiles.flatMap(p => p.primary);
    const uniqueFamilies = [...new Set(allPrimaryFamilies)];
    expect(uniqueFamilies.length).toBeGreaterThan(5); // Should have diverse scent families
  });

  it('should use authentic archetypes that avoid robotic language', () => {
    authenticPersonalityProfiles.forEach(profile => {
      // Archetypes should be descriptive and human
      expect(profile.archetype).not.toMatch(/type|category|classification/i);
      expect(profile.archetype.length).toBeGreaterThan(5);
      expect(profile.archetype).not.toMatch(/^\w+$/); // Not single words
    });
  });
});
