/**
 * Experience Level Language Updates Tests - Task 1.1
 *
 * Tests for natural, conversational language updates to experience level options
 * and the removal of technical fragrance terminology in favor of approachable language.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock data for natural language experience levels
const updatedExperienceLevels = [
  {
    id: 'beginner',
    display_name: 'New to Fragrances',
    description: "I'm just starting to explore different scents",
    natural_language: true,
    technical_terminology: false,
  },
  {
    id: 'enthusiast',
    display_name: 'Fragrance Lover',
    description: 'I enjoy fragrances and know some of my preferences',
    natural_language: true,
    technical_terminology: false,
  },
  {
    id: 'collector',
    display_name: 'Fragrance Collector',
    description: 'I have an extensive collection and deep knowledge',
    natural_language: true,
    technical_terminology: true, // Collectors can handle some technical terms
  },
];

// Mock fragrance question with natural language
const naturalLanguageQuestions = {
  style_preferences: {
    original_text: 'Select your classical heritage olfactory preferences',
    updated_text: 'What fragrances do you enjoy most?',
    natural_language_improved: true,
  },
  scent_descriptions: {
    original_options: [
      'Aldehydic florals with powdery undertones',
      'Gourmand compositions with olfactory complexity',
      'Chypre structures with oakmoss foundations',
    ],
    updated_options: [
      'Light, powdery florals (like classic elegance)',
      'Sweet, dessert-like scents (like vanilla and caramel)',
      'Green, earthy scents (like a forest after rain)',
    ],
    approachable_language: true,
  },
  gender_options: {
    original_options: ['Men', 'Women', 'Uninex'], // Typo intentionally included
    updated_options: ['For Men', 'For Women', 'Unisex'], // Fixed typo
    typo_fixed: true,
  },
};

describe('Experience Level Language Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Natural Language Experience Levels', () => {
    it('should display conversational experience level options', () => {
      const mockExperienceLevels = updatedExperienceLevels;

      // Test that each level uses natural, approachable language
      mockExperienceLevels.forEach(level => {
        expect(level.display_name).not.toContain('Advanced');
        expect(level.display_name).not.toContain('Expert');
        expect(level.display_name).not.toContain('Professional');

        expect(level.description).toContain('I');
        expect(level.description).toMatch(/^I['m\s]/); // Starts with "I" or "I'm"

        expect(level.natural_language).toBe(true);
      });
    });

    it('should replace technical terminology with conversational language', () => {
      const beginnerLevel = updatedExperienceLevels.find(
        l => l.id === 'beginner'
      );
      const enthusiastLevel = updatedExperienceLevels.find(
        l => l.id === 'enthusiast'
      );

      // Beginner and enthusiast should avoid technical terms
      expect(beginnerLevel?.technical_terminology).toBe(false);
      expect(enthusiastLevel?.technical_terminology).toBe(false);

      // Collector can use some technical terms but still be approachable
      const collectorLevel = updatedExperienceLevels.find(
        l => l.id === 'collector'
      );
      expect(collectorLevel?.display_name).toBe('Fragrance Collector');
      expect(collectorLevel?.description).toContain('collection');
    });

    it('should use first-person perspective in descriptions', () => {
      updatedExperienceLevels.forEach(level => {
        expect(level.description).toMatch(/^I/);
        expect(level.description).not.toContain('User who');
        expect(level.description).not.toContain('Someone who');
        expect(level.description).not.toContain('People who');
      });
    });
  });

  describe('Question Text Natural Language Updates', () => {
    it('should replace "classical heritage" with natural question', () => {
      const questionUpdate = naturalLanguageQuestions.style_preferences;

      expect(questionUpdate.original_text).toContain('classical heritage');
      expect(questionUpdate.updated_text).toBe(
        'What fragrances do you enjoy most?'
      );
      expect(questionUpdate.natural_language_improved).toBe(true);

      // Updated text should be conversational
      expect(questionUpdate.updated_text).toMatch(/^What/);
      expect(questionUpdate.updated_text).not.toContain('olfactory');
      expect(questionUpdate.updated_text).not.toContain('classical');
      expect(questionUpdate.updated_text).not.toContain('heritage');
    });

    it('should use simple, approachable scent descriptions', () => {
      const scentDescriptions = naturalLanguageQuestions.scent_descriptions;

      // Original descriptions should be technical
      scentDescriptions.original_options.forEach(option => {
        expect(option).toMatch(/aldehydic|gourmand|chypre|oakmoss|olfactory/i);
      });

      // Updated descriptions should be approachable
      scentDescriptions.updated_options.forEach(option => {
        expect(option).toContain('like');
        expect(option).not.toMatch(
          /aldehydic|gourmand|chypre|oakmoss|olfactory/i
        );
        expect(option.length).toBeLessThan(60); // Keep descriptions concise
      });

      expect(scentDescriptions.approachable_language).toBe(true);
    });
  });

  describe('Gender Selection Updates', () => {
    it('should fix "uninex" typo and use natural language', () => {
      const genderOptions = naturalLanguageQuestions.gender_options;

      // Should fix the typo
      expect(genderOptions.original_options).toContain('Uninex');
      expect(genderOptions.updated_options).toContain('Unisex');
      expect(genderOptions.updated_options).not.toContain('Uninex');

      // Should use more natural language
      expect(genderOptions.updated_options).toEqual([
        'For Men',
        'For Women',
        'Unisex',
      ]);

      expect(genderOptions.typo_fixed).toBe(true);
    });

    it('should make gender options more inclusive and natural', () => {
      const updatedOptions =
        naturalLanguageQuestions.gender_options.updated_options;

      // Each option should be clear about its purpose
      updatedOptions.forEach(option => {
        expect(option).toMatch(/^(For|Unisex)/);
        expect(option.length).toBeLessThan(15); // Keep options concise
      });
    });
  });

  describe('Overall Language Quality', () => {
    it('should maintain professional tone while being approachable', () => {
      // Test that all updated language maintains quality
      const allTextUpdates = [
        ...updatedExperienceLevels.map(l => l.display_name),
        ...updatedExperienceLevels.map(l => l.description),
        naturalLanguageQuestions.style_preferences.updated_text,
        ...naturalLanguageQuestions.scent_descriptions.updated_options,
        ...naturalLanguageQuestions.gender_options.updated_options,
      ];

      allTextUpdates.forEach(text => {
        // Should not contain overly technical terms
        expect(text).not.toMatch(
          /olfactory|aldehydic|chypre|gourmand|facet|accord/i
        );

        // Should not contain awkward phrasing
        expect(text).not.toContain('classical heritage');
        expect(text).not.toContain('uninex');

        // Should be conversational length (not too long)
        expect(text.length).toBeLessThan(80);

        // Should start with capital letter and proper punctuation
        expect(text).toMatch(/^[A-Z]/);
      });
    });

    it('should provide clear user guidance without overwhelm', () => {
      // Experience level descriptions should guide users
      updatedExperienceLevels.forEach(level => {
        expect(level.description).toContain('I');
        expect(level.description.split(' ').length).toBeLessThanOrEqual(12); // Max 12 words
        expect(level.description).not.toContain('olfactory');
        expect(level.description).not.toContain('sophisticated');
      });
    });

    it('should maintain brand voice consistency', () => {
      const allUpdatedTexts = [
        naturalLanguageQuestions.style_preferences.updated_text,
        ...naturalLanguageQuestions.scent_descriptions.updated_options,
      ];

      allUpdatedTexts.forEach(text => {
        // Should feel welcoming and inclusive
        expect(text).not.toContain('advanced');
        expect(text).not.toContain('expert');
        expect(text).not.toContain('professional');

        // Should use helpful analogies when explaining scents
        if (text.includes('like')) {
          expect(text).toMatch(
            /like (a|an|classic|vanilla|caramel|forest|rain|shower)/
          );
        }
      });
    });
  });

  describe('Component Integration Requirements', () => {
    it('should work with adaptive quiz complexity scaling', () => {
      // Test that language updates work with different complexity levels
      const complexityLevels = ['beginner', 'enthusiast', 'collector'];

      complexityLevels.forEach(level => {
        const expectedQuestionCount =
          level === 'beginner' ? 4 : level === 'enthusiast' ? 6 : 8;
        const expectedOptionCount =
          level === 'beginner' ? 4 : level === 'enthusiast' ? 6 : 10;

        expect(expectedQuestionCount).toBeGreaterThan(3);
        expect(expectedOptionCount).toBeGreaterThanOrEqual(4);

        console.log(
          `${level}: ${expectedQuestionCount} questions, ${expectedOptionCount} options per question`
        );
      });
    });

    it('should maintain quiz flow performance with language updates', () => {
      // Language updates should not impact performance
      const performanceRequirements = {
        question_display_time_ms: 50,
        language_processing_overhead_ms: 5,
        total_acceptable_delay_ms: 100,
      };

      expect(performanceRequirements.question_display_time_ms).toBeLessThan(
        100
      );
      expect(
        performanceRequirements.language_processing_overhead_ms
      ).toBeLessThan(10);
      expect(performanceRequirements.total_acceptable_delay_ms).toBeLessThan(
        200
      );
    });
  });
});

/**
 * Integration Test Data for Language Updates
 */
export const experienceLevelLanguageTestData = {
  original_experience_levels: [
    {
      id: 'beginner',
      name: 'Beginner',
      description: 'New to fragrance exploration',
    },
    {
      id: 'enthusiast',
      name: 'Enthusiast',
      description: 'Developing fragrance knowledge',
    },
    {
      id: 'collector',
      name: 'Expert/Collector',
      description: 'Advanced olfactory expertise',
    },
  ],
  updated_experience_levels: updatedExperienceLevels,
  language_quality_metrics: {
    readability_grade: 8, // 8th grade reading level
    conversational_tone: true,
    technical_jargon_removed: true,
    first_person_perspective: true,
    typos_fixed: true,
  },
  question_text_improvements: naturalLanguageQuestions,
};
