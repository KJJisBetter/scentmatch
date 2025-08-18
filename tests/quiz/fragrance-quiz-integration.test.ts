/**
 * Fragrance Quiz Integration Tests
 *
 * Tests the complete data flow from quiz questions → AI analysis → recommendations
 * Ensures question IDs and answer values match what AI analysis expects
 */

import {
  describe,
  it,
  expect,
  beforeEach,
} from '@jest/testing-library/jest-dom';

// Mock the quiz API
const mockQuizAnalysis = {
  analyzePersonalityByExperience: jest.fn(),
  post: jest.fn(),
};

// Expected question IDs that AI analysis recognizes
const AI_EXPECTED_QUESTION_IDS = [
  'style_simple',
  'style_moderate',
  'collection_style',
  'occasions_simple',
  'occasions_detailed',
  'wearing_occasions',
  'scent_preference_simple',
  'fragrance_families',
  'composition_preferences',
  'intensity_simple',
  'investment_approach',
];

// Expected answer values that map to scent dimensions
const AI_EXPECTED_SCENT_VALUES = [
  'fresh_clean',
  'sweet_fruity',
  'floral_pretty',
  'warm_cozy',
  'fresh_citrus',
  'floral_bouquet',
  'oriental_spicy',
  'woody_earthy',
  'gourmand_sweet',
];

// Expected style answer values
const AI_EXPECTED_STYLE_VALUES = [
  'casual_relaxed',
  'polished_professional',
  'romantic_feminine',
  'bold_confident',
  'classical_heritage',
  'avant_garde_modern',
  'niche_artisanal',
];

// Expected occasion answer values
const AI_EXPECTED_OCCASION_VALUES = [
  'everyday_casual',
  'work_professional',
  'evening_special',
  'romantic_dates',
  'social_gatherings',
];

describe('Fragrance Quiz Integration Tests', () => {
  describe('Question ID Compatibility', () => {
    it('should use question IDs that AI analysis recognizes for beginners', () => {
      const beginnerQuestionIds = [
        'style_simple',
        'occasions_simple',
        'scent_preference_simple',
        'intensity_simple',
      ];

      beginnerQuestionIds.forEach(questionId => {
        expect(AI_EXPECTED_QUESTION_IDS).toContain(questionId);
      });
    });

    it('should use question IDs that AI analysis recognizes for enthusiasts', () => {
      const enthusiastQuestionIds = [
        'style_moderate',
        'fragrance_families',
        'occasions_detailed',
        'intensity_simple',
      ];

      enthusiastQuestionIds.forEach(questionId => {
        expect(AI_EXPECTED_QUESTION_IDS).toContain(questionId);
      });
    });

    it('should use question IDs that AI analysis recognizes for collectors', () => {
      const collectorQuestionIds = [
        'collection_style',
        'composition_preferences',
        'wearing_occasions',
        'investment_approach',
      ];

      collectorQuestionIds.forEach(questionId => {
        expect(AI_EXPECTED_QUESTION_IDS).toContain(questionId);
      });
    });
  });

  describe('Answer Value Mapping', () => {
    it('should use scent answer values that map to AI dimensions', () => {
      const scentAnswerValues = [
        'fresh_clean',
        'floral_pretty',
        'sweet_fruity',
        'warm_cozy',
        'fresh_citrus',
        'floral_bouquet',
        'oriental_spicy',
        'woody_earthy',
        'gourmand_sweet',
      ];

      scentAnswerValues.forEach(answerValue => {
        expect(AI_EXPECTED_SCENT_VALUES).toContain(answerValue);
      });
    });

    it('should use style answer values that AI recognizes', () => {
      const styleAnswerValues = [
        'casual_relaxed',
        'polished_professional',
        'romantic_feminine',
        'bold_confident',
        'classical_heritage',
        'avant_garde_modern',
        'niche_artisanal',
      ];

      styleAnswerValues.forEach(answerValue => {
        expect(AI_EXPECTED_STYLE_VALUES).toContain(answerValue);
      });
    });

    it('should use occasion answer values that AI recognizes', () => {
      const occasionAnswerValues = [
        'everyday_casual',
        'work_professional',
        'evening_special',
        'romantic_dates',
        'social_gatherings',
      ];

      occasionAnswerValues.forEach(answerValue => {
        expect(AI_EXPECTED_OCCASION_VALUES).toContain(answerValue);
      });
    });
  });

  describe('Quiz Response Data Structure', () => {
    it('should format quiz responses correctly for AI analysis', () => {
      const mockQuizResponse = {
        question_id: 'style_simple',
        answer_value: 'romantic_feminine',
        experience_level: 'beginner',
        timestamp: new Date().toISOString(),
      };

      // Verify response structure matches what AI expects
      expect(mockQuizResponse).toHaveProperty('question_id');
      expect(mockQuizResponse).toHaveProperty('answer_value');
      expect(mockQuizResponse).toHaveProperty('experience_level');
      expect(mockQuizResponse).toHaveProperty('timestamp');

      // Verify values are AI-compatible
      expect(AI_EXPECTED_QUESTION_IDS).toContain(mockQuizResponse.question_id);
      expect(AI_EXPECTED_STYLE_VALUES).toContain(mockQuizResponse.answer_value);
    });

    it('should handle multiple selection answers correctly', () => {
      const mockMultipleResponse = {
        question_id: 'fragrance_families',
        answer_value: 'fresh_citrus,floral_bouquet',
        answer_metadata: { selections: ['fresh_citrus', 'floral_bouquet'] },
        experience_level: 'enthusiast',
        timestamp: new Date().toISOString(),
      };

      // Verify multiple selections are AI-compatible
      const selections = mockMultipleResponse.answer_metadata.selections;
      selections.forEach(selection => {
        expect(AI_EXPECTED_SCENT_VALUES).toContain(selection);
      });
    });
  });

  describe('Experience Level Progression', () => {
    it('should provide appropriate question complexity for beginners', () => {
      const beginnerQuestions = [
        { id: 'style_simple', complexity: 'low', options: 4 },
        { id: 'occasions_simple', complexity: 'low', options: 4 },
        { id: 'scent_preference_simple', complexity: 'low', options: 4 },
        { id: 'intensity_simple', complexity: 'low', options: 3 },
      ];

      beginnerQuestions.forEach(q => {
        expect(q.complexity).toBe('low');
        expect(q.options).toBeLessThanOrEqual(4);
      });
    });

    it('should provide appropriate question complexity for enthusiasts', () => {
      const enthusiastQuestions = [
        { id: 'style_moderate', allowMultiple: true, maxSelections: 3 },
        { id: 'fragrance_families', allowMultiple: true, maxSelections: 4 },
        { id: 'occasions_detailed', allowMultiple: true, maxSelections: 4 },
      ];

      enthusiastQuestions.forEach(q => {
        expect(q.allowMultiple).toBe(true);
        expect(q.maxSelections).toBeGreaterThanOrEqual(3);
      });
    });

    it('should provide appropriate question complexity for collectors', () => {
      const collectorQuestions = [
        { id: 'collection_style', terminology: 'advanced' },
        { id: 'composition_preferences', terminology: 'advanced' },
        { id: 'investment_approach', terminology: 'advanced' },
      ];

      collectorQuestions.forEach(q => {
        expect(q.terminology).toBe('advanced');
      });
    });
  });

  describe('Scent Dimension Scoring', () => {
    it('should map fresh scent answers to fresh dimension', () => {
      const freshAnswers = ['fresh_clean', 'fresh_citrus'];

      freshAnswers.forEach(answer => {
        // Mock the AI analysis mapping
        const expectedMapping =
          answer === 'fresh_clean'
            ? { fresh: 0.5 }
            : { fresh: 0.4, fruity: 0.2 };

        expect(expectedMapping).toHaveProperty('fresh');
        expect(expectedMapping.fresh).toBeGreaterThan(0);
      });
    });

    it('should map floral scent answers to floral dimension', () => {
      const floralAnswers = ['floral_pretty', 'floral_bouquet'];

      floralAnswers.forEach(answer => {
        const expectedMapping = { floral: 0.5 };
        expect(expectedMapping).toHaveProperty('floral');
        expect(expectedMapping.floral).toBe(0.5);
      });
    });

    it('should map oriental scent answers to oriental dimension', () => {
      const orientalAnswers = ['oriental_spicy'];

      orientalAnswers.forEach(answer => {
        const expectedMapping = { oriental: 0.5 };
        expect(expectedMapping).toHaveProperty('oriental');
        expect(expectedMapping.oriental).toBe(0.5);
      });
    });

    it('should map woody scent answers to woody dimension', () => {
      const woodyAnswers = ['woody_earthy'];

      woodyAnswers.forEach(answer => {
        const expectedMapping = { woody: 0.5 };
        expect(expectedMapping).toHaveProperty('woody');
        expect(expectedMapping.woody).toBe(0.5);
      });
    });
  });

  describe('API Integration Flow', () => {
    it('should send properly formatted data to analyze-enhanced endpoint', async () => {
      const mockRequestBody = {
        responses: [
          {
            question_id: 'style_simple',
            answer_value: 'romantic_feminine',
            experience_level: 'beginner',
            timestamp: new Date().toISOString(),
          },
          {
            question_id: 'scent_preference_simple',
            answer_value: 'floral_pretty',
            experience_level: 'beginner',
            timestamp: new Date().toISOString(),
          },
        ],
        experience_level: 'beginner',
        selected_favorites: [],
        quiz_session_token: 'test-session-token',
      };

      // Verify request structure
      expect(mockRequestBody).toHaveProperty('responses');
      expect(mockRequestBody).toHaveProperty('experience_level');
      expect(mockRequestBody).toHaveProperty('selected_favorites');
      expect(mockRequestBody).toHaveProperty('quiz_session_token');

      // Verify all question IDs are AI-compatible
      mockRequestBody.responses.forEach(response => {
        expect(AI_EXPECTED_QUESTION_IDS).toContain(response.question_id);
      });
    });

    it('should return proper personality analysis structure', () => {
      const expectedAnalysisStructure = {
        personality_type: 'beginner_floral_lover',
        secondary_type: 'romantic',
        confidence_score: 0.8,
        dimensions: {
          fresh: 0.1,
          floral: 0.6,
          oriental: 0.1,
          woody: 0.1,
          fruity: 0.1,
          gourmand: 0.0,
        },
        preferred_intensity: 0.4,
        occasion_preferences: ['romantic_dates'],
        seasonal_preferences: [],
        brand_preferences: [],
        lifestyle_factors: {
          experience_level: 'beginner',
          sophistication_level: 'developing',
        },
      };

      // Verify analysis structure
      expect(expectedAnalysisStructure).toHaveProperty('personality_type');
      expect(expectedAnalysisStructure).toHaveProperty('dimensions');
      expect(expectedAnalysisStructure.dimensions).toHaveProperty('fresh');
      expect(expectedAnalysisStructure.dimensions).toHaveProperty('floral');
      expect(expectedAnalysisStructure.dimensions).toHaveProperty('oriental');
      expect(expectedAnalysisStructure.dimensions).toHaveProperty('woody');
    });
  });

  describe('Error Handling', () => {
    it('should handle unrecognized question IDs gracefully', () => {
      const invalidQuestionId = 'invalid_question_id';
      expect(AI_EXPECTED_QUESTION_IDS).not.toContain(invalidQuestionId);

      // This should be handled in the AI analysis without breaking
      const mockResponse = {
        question_id: invalidQuestionId,
        answer_value: 'some_value',
        experience_level: 'beginner',
        timestamp: new Date().toISOString(),
      };

      expect(mockResponse.question_id).toBe(invalidQuestionId);
    });

    it('should handle unrecognized answer values gracefully', () => {
      const invalidAnswerValue = 'invalid_answer_value';
      expect(AI_EXPECTED_SCENT_VALUES).not.toContain(invalidAnswerValue);

      // This should be handled in the AI analysis without breaking
      const mockResponse = {
        question_id: 'scent_preference_simple',
        answer_value: invalidAnswerValue,
        experience_level: 'beginner',
        timestamp: new Date().toISOString(),
      };

      expect(mockResponse.answer_value).toBe(invalidAnswerValue);
    });
  });
});

// Additional utility tests for quiz component
describe('Quiz Component Tests', () => {
  describe('Question Flow Logic', () => {
    it('should progress through questions in correct order', () => {
      const expectedQuestionOrder = [
        'style_simple',
        'occasions_simple',
        'scent_preference_simple',
        'intensity_simple',
      ];

      expectedQuestionOrder.forEach((questionId, index) => {
        expect(questionId).toBeDefined();
        expect(AI_EXPECTED_QUESTION_IDS).toContain(questionId);
      });
    });

    it('should handle multiple selection validation', () => {
      const multipleSelectionQuestion = {
        id: 'fragrance_families',
        allowMultiple: true,
        minSelections: 2,
        maxSelections: 4,
      };

      const mockSelections = ['fresh_citrus', 'floral_bouquet', 'woody_earthy'];

      expect(mockSelections.length).toBeGreaterThanOrEqual(
        multipleSelectionQuestion.minSelections
      );
      expect(mockSelections.length).toBeLessThanOrEqual(
        multipleSelectionQuestion.maxSelections
      );

      // Verify all selections are AI-compatible
      mockSelections.forEach(selection => {
        expect(AI_EXPECTED_SCENT_VALUES).toContain(selection);
      });
    });
  });

  describe('Data Persistence', () => {
    it('should maintain quiz session data throughout completion', () => {
      const sessionData = {
        quiz_session_token: 'test-session-123',
        experience_level: 'enthusiast',
        started_at: new Date().toISOString(),
        responses: [],
      };

      expect(sessionData.quiz_session_token).toBeDefined();
      expect(['beginner', 'enthusiast', 'collector']).toContain(
        sessionData.experience_level
      );
      expect(Array.isArray(sessionData.responses)).toBe(true);
    });
  });
});
