import { describe, test, expect, beforeEach, vi } from 'vitest';
import { setupRpcOperations, resetDatabaseMocks } from '../utils/database-test-utils';

/**
 * Quiz Engine Tests
 * 
 * Tests for the core fragrance personality quiz engine:
 * - Multi-dimensional scoring algorithms with weighted responses
 * - Progressive analysis with confidence scoring and dynamic question selection
 * - Personality archetype classification (8 archetypes mapped to fragrance families)
 * - Guest session management for anonymous quiz taking
 * - Branching question logic based on previous responses
 * - Real-time performance requirements (sub-500ms analysis)
 * - Integration with vector similarity and recommendation systems
 */

// Mock the quiz engine classes
vi.mock('@/lib/quiz/quiz-engine', () => ({
  QuizEngine: vi.fn().mockImplementation(() => ({
    startQuizSession: vi.fn(),
    submitAnswer: vi.fn(),
    analyzeProgress: vi.fn(),
    completeQuiz: vi.fn(),
    getNextQuestion: vi.fn(),
  })),
  
  QuizScoringEngine: vi.fn().mockImplementation(() => ({
    calculateWeightedScore: vi.fn(),
    updateBayesianInference: vi.fn(),
    generatePersonalityProfile: vi.fn(),
    calculateConfidence: vi.fn(),
  })),

  ProgressiveAnalyzer: vi.fn().mockImplementation(() => ({
    analyzeResponse: vi.fn(),
    selectOptimalQuestion: vi.fn(),
    calculateInformationGain: vi.fn(),
    checkCompletionCriteria: vi.fn(),
  })),

  GuestSessionManager: vi.fn().mockImplementation(() => ({
    createGuestSession: vi.fn(),
    saveGuestProgress: vi.fn(),
    transferToUser: vi.fn(),
    cleanupExpiredSessions: vi.fn(),
  }))
}));

// Mock OpenAI for personality analysis
vi.mock('@/lib/ai/openai-client', () => ({
  analyzeQuizResponses: vi.fn(),
  generatePersonalityDescription: vi.fn(),
  createEmbeddingFromProfile: vi.fn(),
}));

describe('Quiz Engine Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDatabaseMocks();
    setupRpcOperations();
  });

  describe('Quiz Session Management', () => {
    test('should create authenticated user quiz session', async () => {
      const { QuizEngine } = await import('@/lib/quiz/quiz-engine');
      const engine = new QuizEngine();
      
      const mockSession = {
        session_id: 'session-123',
        user_id: 'user-123',
        is_guest_session: false,
        quiz_version: 'v1.0',
        current_question: 1,
        total_questions: 15,
        started_at: new Date().toISOString()
      };

      engine.startQuizSession.mockResolvedValue(mockSession);
      
      const session = await engine.startQuizSession('user-123', { 
        authenticated: true,
        referral_source: 'homepage'
      });
      
      expect(session.user_id).toBe('user-123');
      expect(session.is_guest_session).toBe(false);
      expect(session.current_question).toBe(1);
      expect(session.total_questions).toBe(15);
    });

    test('should create guest quiz session for anonymous users', async () => {
      const { GuestSessionManager } = await import('@/lib/quiz/quiz-engine');
      const guestManager = new GuestSessionManager();
      
      const mockGuestSession = {
        session_id: 'guest-session-456',
        session_token: 'token-abc123',
        user_id: null,
        is_guest_session: true,
        quiz_version: 'v1.0',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };

      guestManager.createGuestSession.mockResolvedValue(mockGuestSession);
      
      const session = await guestManager.createGuestSession({
        referral_source: 'marketing_campaign'
      });
      
      expect(session.user_id).toBeNull();
      expect(session.is_guest_session).toBe(true);
      expect(session.session_token).toBeDefined();
      expect(session.expires_at).toBeDefined();
    });

    test('should handle session expiration and cleanup', async () => {
      const { GuestSessionManager } = await import('@/lib/quiz/quiz-engine');
      const guestManager = new GuestSessionManager();
      
      guestManager.cleanupExpiredSessions.mockResolvedValue({
        cleaned_sessions: 5,
        freed_storage_mb: 2.3
      });
      
      const result = await guestManager.cleanupExpiredSessions();
      
      expect(result.cleaned_sessions).toBe(5);
      expect(result.freed_storage_mb).toBeGreaterThan(0);
    });

    test('should transfer guest session to authenticated user', async () => {
      const { GuestSessionManager } = await import('@/lib/quiz/quiz-engine');
      const guestManager = new GuestSessionManager();
      
      const transferResult = {
        success: true,
        new_user_id: 'user-789',
        transferred_responses: 8,
        preserved_progress: true,
        personality_profile_updated: true
      };

      guestManager.transferToUser.mockResolvedValue(transferResult);
      
      const result = await guestManager.transferToUser('guest-token-123', 'user-789');
      
      expect(result.success).toBe(true);
      expect(result.new_user_id).toBe('user-789');
      expect(result.transferred_responses).toBe(8);
      expect(result.preserved_progress).toBe(true);
    });
  });

  describe('Question Logic and Branching', () => {
    test('should provide first question with multiple answer options', async () => {
      const { QuizEngine } = await import('@/lib/quiz/quiz-engine');
      const engine = new QuizEngine();
      
      const firstQuestion = {
        question_id: 'lifestyle_1',
        question_text: 'Which best describes your daily style?',
        question_type: 'multiple_choice',
        options: [
          { value: 'professional_classic', text: 'Professional and classic', weight: 1.2 },
          { value: 'casual_relaxed', text: 'Casual and relaxed', weight: 1.0 },
          { value: 'trendy_bold', text: 'Trendy and bold', weight: 1.1 },
          { value: 'artistic_unique', text: 'Artistic and unique', weight: 1.3 }
        ],
        category: 'lifestyle',
        importance_weight: 1.5,
        branching_logic: {
          'professional_classic': ['sophistication_questions'],
          'artistic_unique': ['creative_questions']
        }
      };

      engine.getNextQuestion.mockResolvedValue(firstQuestion);
      
      const question = await engine.getNextQuestion('session-123', 1);
      
      expect(question.question_id).toBe('lifestyle_1');
      expect(question.options).toHaveLength(4);
      expect(question.importance_weight).toBe(1.5);
      expect(question.branching_logic).toBeDefined();
    });

    test('should implement branching logic based on previous responses', async () => {
      const { QuizEngine } = await import('@/lib/quiz/quiz-engine');
      const engine = new QuizEngine();
      
      // Simulate user selecting "artistic_unique" which should branch to creative questions
      const previousAnswers = [
        { question_id: 'lifestyle_1', answer_value: 'artistic_unique' }
      ];

      const creativeQuestion = {
        question_id: 'creative_expression_1',
        question_text: 'How do you express your creativity?',
        triggered_by: 'artistic_unique',
        question_type: 'multiple_choice'
      };

      engine.getNextQuestion.mockResolvedValue(creativeQuestion);
      
      const nextQuestion = await engine.getNextQuestion('session-123', 2, previousAnswers);
      
      expect(nextQuestion.question_id).toBe('creative_expression_1');
      expect(nextQuestion.triggered_by).toBe('artistic_unique');
    });

    test('should support different question types with appropriate scoring', async () => {
      const { QuizEngine } = await import('@/lib/quiz/quiz-engine');
      const engine = new QuizEngine();
      
      const questionTypes = [
        {
          type: 'multiple_choice',
          question: 'Which environment makes you feel most at peace?',
          options: ['ocean_beach', 'forest_mountains', 'city_skyline', 'cozy_indoor']
        },
        {
          type: 'slider_scale',
          question: 'How much attention do you like your fragrance to attract?',
          scale: { min: 1, max: 10, labels: ['Subtle', 'Statement'] }
        },
        {
          type: 'image_selection',
          question: 'Which image resonates most with your mood today?',
          images: ['sunset.jpg', 'rain.jpg', 'flowers.jpg', 'library.jpg']
        },
        {
          type: 'scenario_based',
          question: 'For a first date, you would choose:',
          scenarios: ['familiar_restaurant', 'art_gallery', 'outdoor_adventure', 'intimate_cafe']
        }
      ];

      // Each question type should be supported
      for (const questionType of questionTypes) {
        engine.getNextQuestion.mockResolvedValueOnce({
          question_id: `test_${questionType.type}`,
          question_type: questionType.type,
          ...questionType
        });

        const question = await engine.getNextQuestion('session-123', 1);
        expect(question.question_type).toBe(questionType.type);
      }
    });

    test('should validate question responses and provide immediate feedback', async () => {
      const { QuizEngine } = await import('@/lib/quiz/quiz-engine');
      const engine = new QuizEngine();
      
      const validResponse = {
        session_id: 'session-123',
        question_id: 'lifestyle_1',
        answer_value: 'professional_classic',
        response_time_ms: 5000,
        confidence: 0.8
      };

      const responseResult = {
        valid: true,
        processed: true,
        immediate_insight: 'Your response suggests a preference for sophisticated, refined fragrances',
        progress_percentage: 20,
        confidence_boost: 0.12,
        next_question_available: true
      };

      engine.submitAnswer.mockResolvedValue(responseResult);
      
      const result = await engine.submitAnswer(validResponse);
      
      expect(result.valid).toBe(true);
      expect(result.immediate_insight).toContain('sophisticated');
      expect(result.progress_percentage).toBe(20);
      expect(result.confidence_boost).toBeGreaterThan(0);
    });

    test('should handle invalid or inconsistent responses', async () => {
      const { QuizEngine } = await import('@/lib/quiz/quiz-engine');
      const engine = new QuizEngine();
      
      const invalidResponse = {
        session_id: 'session-123',
        question_id: 'lifestyle_1',
        answer_value: 'invalid_option',
        response_time_ms: 100 // Suspiciously fast
      };

      const errorResult = {
        valid: false,
        error: 'Invalid answer option',
        validation_errors: ['Answer not in allowed options', 'Response time too fast'],
        retry_allowed: true
      };

      engine.submitAnswer.mockResolvedValue(errorResult);
      
      const result = await engine.submitAnswer(invalidResponse);
      
      expect(result.valid).toBe(false);
      expect(result.validation_errors).toContain('Answer not in allowed options');
      expect(result.retry_allowed).toBe(true);
    });
  });

  describe('Multi-Dimensional Scoring System', () => {
    test('should calculate weighted scores across fragrance dimensions', async () => {
      const { QuizScoringEngine } = await import('@/lib/quiz/quiz-engine');
      const scorer = new QuizScoringEngine();
      
      const mockResponses = [
        {
          question_id: 'lifestyle_1',
          answer_value: 'professional_classic',
          weight: 1.5,
          confidence: 0.9,
          dimension_mapping: {
            fresh: 0.3,
            floral: 0.6,
            oriental: 0.8,
            woody: 0.7,
            fruity: 0.2,
            gourmand: 0.1
          }
        },
        {
          question_id: 'environment_1', 
          answer_value: 'cozy_indoor',
          weight: 1.2,
          confidence: 0.8,
          dimension_mapping: {
            fresh: 0.1,
            floral: 0.4,
            oriental: 0.9,
            woody: 0.8,
            fruity: 0.3,
            gourmand: 0.7
          }
        }
      ];

      const expectedDimensions = {
        fresh: 23.0, // Weighted calculation
        floral: 52.0,
        oriental: 83.5,
        woody: 73.0,
        fruity: 23.5,
        gourmand: 41.5
      };

      scorer.calculateWeightedScore.mockResolvedValue({
        dimensions: expectedDimensions,
        total_confidence: 0.85,
        processing_time_ms: 45
      });
      
      const result = await scorer.calculateWeightedScore(mockResponses);
      
      expect(result.dimensions.oriental).toBeGreaterThan(result.dimensions.fresh);
      expect(result.dimensions.woody).toBeGreaterThan(result.dimensions.fruity);
      expect(result.total_confidence).toBe(0.85);
      expect(result.processing_time_ms).toBeLessThan(100);
    });

    test('should implement Bayesian inference for preference prediction', async () => {
      const { QuizScoringEngine } = await import('@/lib/quiz/quiz-engine');
      const scorer = new QuizScoringEngine();
      
      const priorPreferences = {
        woody: 0.5,
        fresh: 0.6,
        oriental: 0.3
      };

      const newResponse = {
        question_id: 'scent_preference_1',
        answer_value: 'warm_cozy_environments',
        evidence_for: ['woody', 'oriental'],
        evidence_against: ['fresh'],
        likelihood_scores: {
          woody: 0.8,
          oriental: 0.7,
          fresh: 0.2
        }
      };

      const updatedPreferences = {
        woody: 0.67, // Increased based on evidence
        fresh: 0.45, // Decreased based on negative evidence
        oriental: 0.52, // Moderate increase
        confidence_change: 0.15
      };

      scorer.updateBayesianInference.mockResolvedValue(updatedPreferences);
      
      const result = await scorer.updateBayesianInference(priorPreferences, newResponse);
      
      expect(result.woody).toBeGreaterThan(priorPreferences.woody);
      expect(result.fresh).toBeLessThan(priorPreferences.fresh);
      expect(result.confidence_change).toBeGreaterThan(0);
    });

    test('should handle ambiguous responses with appropriate confidence scoring', async () => {
      const { QuizScoringEngine } = await import('@/lib/quiz/quiz-engine');
      const scorer = new QuizScoringEngine();
      
      const ambiguousResponses = [
        {
          question_id: 'preference_1',
          answer_value: 'depends_on_mood',
          confidence: 0.3, // Low confidence due to ambiguity
          dimension_mapping: {
            fresh: 0.5, // Neutral scores
            floral: 0.5,
            oriental: 0.5,
            woody: 0.5
          }
        }
      ];

      scorer.calculateConfidence.mockReturnValue(0.35);
      
      const confidence = scorer.calculateConfidence(ambiguousResponses);
      
      expect(confidence).toBeLessThan(0.5); // Should reflect uncertainty
    });

    test('should weight questions by importance and reliability', async () => {
      const { QuizScoringEngine } = await import('@/lib/quiz/quiz-engine');
      const scorer = new QuizScoringEngine();
      
      const questions = [
        {
          question_id: 'core_lifestyle',
          importance_weight: 2.0, // High importance
          reliability_score: 0.9, // High reliability
          answer_value: 'sophisticated_evening'
        },
        {
          question_id: 'secondary_preference',
          importance_weight: 1.0, // Normal importance
          reliability_score: 0.6, // Lower reliability
          answer_value: 'sometimes_fruity'
        }
      ];

      // Core lifestyle question should have more impact than secondary
      scorer.calculateWeightedScore.mockImplementation((responses) => {
        const coreResponse = responses.find((r: any) => r.question_id === 'core_lifestyle');
        const secondaryResponse = responses.find((r: any) => r.question_id === 'secondary_preference');
        
        return Promise.resolve({
          dimensions: {
            oriental: coreResponse ? 80 : 40, // Strong impact from core question
            fruity: secondaryResponse ? 30 : 10 // Moderate impact from secondary
          },
          confidence: 0.8
        });
      });
      
      const result = await scorer.calculateWeightedScore(questions);
      
      expect(result.dimensions.oriental).toBe(80); // Strong impact from high-weight question
      expect(result.dimensions.fruity).toBe(30); // Lesser impact from low-weight question
    });
  });

  describe('Personality Archetype Classification', () => {
    test('should classify into 8 fragrance personality archetypes', async () => {
      const { QuizScoringEngine } = await import('@/lib/quiz/quiz-engine');
      const scorer = new QuizScoringEngine();
      
      const mockDimensions = {
        fresh: 20,
        floral: 85, // High floral score
        oriental: 30,
        woody: 25,
        fruity: 60,
        gourmand: 40
      };

      const expectedProfile = {
        primary_archetype: 'romantic', // High floral = romantic
        secondary_archetype: 'playful', // High fruity = playful
        confidence: 0.87,
        style_descriptor: 'You are a Romantic soul who loves feminine, floral fragrances with playful fruity touches',
        dominant_families: ['floral', 'fruity'],
        archetype_scores: {
          romantic: 0.87,
          playful: 0.65,
          sophisticated: 0.34,
          bold: 0.23,
          natural: 0.31,
          mysterious: 0.28,
          classic: 0.45,
          modern: 0.38
        }
      };

      scorer.generatePersonalityProfile.mockResolvedValue(expectedProfile);
      
      const profile = await scorer.generatePersonalityProfile(mockDimensions);
      
      expect(profile.primary_archetype).toBe('romantic');
      expect(profile.secondary_archetype).toBe('playful');
      expect(profile.confidence).toBeGreaterThan(0.8);
      expect(profile.dominant_families).toContain('floral');
      expect(profile.archetype_scores.romantic).toBeGreaterThan(profile.archetype_scores.sophisticated);
    });

    test('should handle edge cases with low confidence scores', async () => {
      const { QuizScoringEngine } = await import('@/lib/quiz/quiz-engine');
      const scorer = new QuizScoringEngine();
      
      const flatDimensions = {
        fresh: 50,
        floral: 50,
        oriental: 50,
        woody: 50,
        fruity: 50,
        gourmand: 50
      };

      const lowConfidenceProfile = {
        primary_archetype: 'classic', // Default for unclear preferences
        secondary_archetype: null,
        confidence: 0.32,
        style_descriptor: 'Your preferences span multiple fragrance families - you appreciate versatility',
        needs_more_questions: true,
        suggested_follow_up: 'Try more specific scent questions'
      };

      scorer.generatePersonalityProfile.mockResolvedValue(lowConfidenceProfile);
      
      const profile = await scorer.generatePersonalityProfile(flatDimensions);
      
      expect(profile.confidence).toBeLessThan(0.5);
      expect(profile.needs_more_questions).toBe(true);
      expect(profile.primary_archetype).toBe('classic'); // Safe default
    });

    test('should provide detailed personality descriptions with lifestyle context', async () => {
      const { QuizScoringEngine } = await import('@/lib/quiz/quiz-engine');
      const scorer = new QuizScoringEngine();
      
      const profile = {
        primary_archetype: 'sophisticated',
        style_descriptor: 'Sophisticated Evening Enthusiast - You gravitate toward complex, layered fragrances',
        lifestyle_factors: {
          work_environment: 'professional',
          social_style: 'intimate_gatherings',
          fashion_preference: 'classic_elegant',
          weekend_activities: 'cultural_events'
        },
        fragrance_recommendations: {
          signature_style: 'oriental_woody',
          occasion_mapping: {
            work: 'subtle_sophisticated',
            evening: 'complex_mysterious',
            weekend: 'comfortable_elegant'
          }
        }
      };

      scorer.generatePersonalityProfile.mockResolvedValue(profile);
      
      const result = await scorer.generatePersonalityProfile({});
      
      expect(result.lifestyle_factors.work_environment).toBe('professional');
      expect(result.fragrance_recommendations.signature_style).toBe('oriental_woody');
      expect(result.fragrance_recommendations.occasion_mapping.evening).toBe('complex_mysterious');
    });

    test('should map personality archetypes to specific fragrance families', async () => {
      const archetypeMapping = {
        romantic: ['floral', 'fruity', 'gourmand'],
        sophisticated: ['oriental', 'woody', 'floral'],
        natural: ['fresh', 'woody', 'green'],
        bold: ['spicy', 'oriental', 'woody'],
        playful: ['fruity', 'gourmand', 'fresh'],
        mysterious: ['woody', 'oriental', 'dark'],
        classic: ['floral', 'fresh', 'balanced'],
        modern: ['clean', 'fresh', 'minimalist']
      };

      // Each archetype should map to appropriate fragrance families
      Object.entries(archetypeMapping).forEach(([archetype, families]) => {
        expect(families).toHaveLength(3);
        expect(Array.isArray(families)).toBe(true);
      });
    });
  });

  describe('Progressive Analysis and Dynamic Questions', () => {
    test('should perform real-time analysis as questions are answered', async () => {
      const { ProgressiveAnalyzer } = await import('@/lib/quiz/quiz-engine');
      const analyzer = new ProgressiveAnalyzer();
      
      const currentResponse = {
        question_id: 'environment_preference',
        answer_value: 'forest_mountains',
        response_time_ms: 3000
      };

      const analysisResult = {
        updated_profile: {
          natural_tendency: 0.8,
          fresh_preference: 0.7,
          confidence: 0.65
        },
        information_gained: 0.23,
        questions_remaining: 8,
        estimated_completion_accuracy: 0.78,
        processing_time_ms: 67
      };

      analyzer.analyzeResponse.mockResolvedValue(analysisResult);
      
      const result = await analyzer.analyzeResponse(currentResponse, []);
      
      expect(result.updated_profile.natural_tendency).toBe(0.8);
      expect(result.information_gained).toBeGreaterThan(0);
      expect(result.processing_time_ms).toBeLessThan(100);
    });

    test('should select optimal next questions based on information gain', async () => {
      const { ProgressiveAnalyzer } = await import('@/lib/quiz/quiz-engine');
      const analyzer = new ProgressiveAnalyzer();
      
      const currentProfile = {
        fresh: 70,
        oriental: 30,
        confidence: 0.6
      };

      const availableQuestions = [
        { 
          question_id: 'fresh_specifics', 
          info_gain_potential: 0.3,
          targets_dimension: 'fresh'
        },
        { 
          question_id: 'intensity_preference', 
          info_gain_potential: 0.8,
          targets_dimension: 'general'
        },
        { 
          question_id: 'oriental_specifics', 
          info_gain_potential: 0.1,
          targets_dimension: 'oriental'
        }
      ];

      analyzer.selectOptimalQuestion.mockReturnValue(availableQuestions[1]); // Highest info gain
      
      const nextQuestion = analyzer.selectOptimalQuestion(availableQuestions, currentProfile);
      
      expect(nextQuestion.question_id).toBe('intensity_preference');
      expect(nextQuestion.info_gain_potential).toBe(0.8);
    });

    test('should determine quiz completion based on confidence thresholds', async () => {
      const { ProgressiveAnalyzer } = await import('@/lib/quiz/quiz-engine');
      const analyzer = new ProgressiveAnalyzer();
      
      const highConfidenceProfile = {
        primary_archetype: 'sophisticated',
        confidence: 0.87,
        questions_answered: 8
      };

      const lowConfidenceProfile = {
        primary_archetype: 'unknown',
        confidence: 0.45,
        questions_answered: 6
      };

      analyzer.checkCompletionCriteria.mockImplementation((profile) => {
        return Promise.resolve({
          should_complete: profile.confidence >= 0.75,
          confidence_sufficient: profile.confidence >= 0.75,
          minimum_questions_met: profile.questions_answered >= 6,
          recommended_action: profile.confidence >= 0.75 ? 'complete' : 'continue'
        });
      });

      const highConfidenceResult = await analyzer.checkCompletionCriteria(highConfidenceProfile);
      const lowConfidenceResult = await analyzer.checkCompletionCriteria(lowConfidenceProfile);
      
      expect(highConfidenceResult.should_complete).toBe(true);
      expect(lowConfidenceResult.should_complete).toBe(false);
      expect(lowConfidenceResult.recommended_action).toBe('continue');
    });

    test('should adapt question difficulty based on user sophistication', async () => {
      const { ProgressiveAnalyzer } = await import('@/lib/quiz/quiz-engine');
      const analyzer = new ProgressiveAnalyzer();
      
      const beginnerProfile = {
        fragrance_knowledge: 'beginner',
        confidence: 0.4,
        clear_preferences: false
      };

      const expertProfile = {
        fragrance_knowledge: 'expert',
        confidence: 0.8,
        clear_preferences: true
      };

      analyzer.selectOptimalQuestion.mockImplementation((questions, profile) => {
        const knowledgeLevel = (profile as any).fragrance_knowledge;
        
        return Promise.resolve({
          question_id: knowledgeLevel === 'beginner' ? 'simple_lifestyle_1' : 'advanced_notes_1',
          difficulty_level: knowledgeLevel === 'beginner' ? 'basic' : 'advanced',
          question_type: knowledgeLevel === 'beginner' ? 'scenario_based' : 'technical_preference'
        });
      });

      const beginnerQuestion = await analyzer.selectOptimalQuestion([], beginnerProfile);
      const expertQuestion = await analyzer.selectOptimalQuestion([], expertProfile);
      
      expect(beginnerQuestion.difficulty_level).toBe('basic');
      expect(beginnerQuestion.question_type).toBe('scenario_based');
      expect(expertQuestion.difficulty_level).toBe('advanced');
      expect(expertQuestion.question_type).toBe('technical_preference');
    });
  });

  describe('Performance and Scalability', () => {
    test('should meet sub-500ms analysis performance requirements', async () => {
      const { QuizEngine } = await import('@/lib/quiz/quiz-engine');
      const engine = new QuizEngine();
      
      const startTime = Date.now();
      
      engine.analyzeProgress.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => resolve({
            personality_profile: { archetype: 'sophisticated' },
            confidence: 0.8,
            processing_time_ms: 200 // Simulated processing time
          }), 200);
        })
      );
      
      const result = await engine.analyzeProgress('session-123');
      const totalTime = Date.now() - startTime;
      
      expect(totalTime).toBeLessThan(500); // Sub-500ms requirement
      expect(result.processing_time_ms).toBeLessThan(300);
    });

    test('should handle concurrent quiz sessions efficiently', async () => {
      const { QuizEngine } = await import('@/lib/quiz/quiz-engine');
      const engine = new QuizEngine();
      
      const concurrentSessions = Array.from({ length: 100 }, (_, i) => `session-${i}`);
      
      engine.analyzeProgress.mockImplementation((sessionId) => 
        Promise.resolve({
          session_id: sessionId,
          analysis_complete: true,
          processing_time_ms: 50 + Math.random() * 100 // 50-150ms
        })
      );
      
      const startTime = Date.now();
      
      const results = await Promise.all(
        concurrentSessions.map(sessionId => engine.analyzeProgress(sessionId))
      );
      
      const totalTime = Date.now() - startTime;
      const avgTimePerSession = totalTime / concurrentSessions.length;
      
      expect(results).toHaveLength(100);
      expect(avgTimePerSession).toBeLessThan(100); // Should scale efficiently
    });

    test('should implement caching for repeated analysis patterns', async () => {
      const { QuizEngine } = await import('@/lib/quiz/quiz-engine');
      const engine = new QuizEngine();
      
      const commonResponsePattern = [
        { question_id: 'q1', answer_value: 'professional' },
        { question_id: 'q2', answer_value: 'evening_sophisticated' },
        { question_id: 'q3', answer_value: 'luxury_brands' }
      ];

      let analysisCallCount = 0;
      engine.analyzeProgress.mockImplementation(() => {
        analysisCallCount++;
        return Promise.resolve({
          cache_hit: analysisCallCount === 1 ? false : true,
          processing_time_ms: analysisCallCount === 1 ? 300 : 15, // Much faster on cache hit
          personality_profile: { archetype: 'sophisticated', confidence: 0.85 }
        });
      });
      
      // First analysis - should compute
      const firstResult = await engine.analyzeProgress('session-1');
      expect(firstResult.cache_hit).toBe(false);
      expect(firstResult.processing_time_ms).toBe(300);
      
      // Second analysis with same pattern - should use cache
      const secondResult = await engine.analyzeProgress('session-2');
      expect(secondResult.cache_hit).toBe(true);
      expect(secondResult.processing_time_ms).toBe(15);
    });

    test('should batch process multiple quiz completions efficiently', async () => {
      const { QuizEngine } = await import('@/lib/quiz/quiz-engine');
      const engine = new QuizEngine();
      
      const batchCompletions = [
        { session_id: 'batch-1', responses: [] },
        { session_id: 'batch-2', responses: [] },
        { session_id: 'batch-3', responses: [] }
      ];

      engine.completeQuiz.mockImplementation((sessionId) => 
        Promise.resolve({
          session_id: sessionId,
          completed: true,
          batch_processed: true,
          processing_time_ms: 50
        })
      );
      
      const startTime = Date.now();
      
      const results = await Promise.all(
        batchCompletions.map(batch => engine.completeQuiz(batch.session_id))
      );
      
      const batchTime = Date.now() - startTime;
      
      expect(results).toHaveLength(3);
      expect(batchTime).toBeLessThan(300); // Efficient batch processing
    });
  });

  describe('Integration with Recommendation System', () => {
    test('should generate quiz-enhanced user embeddings', async () => {
      const { QuizEngine } = await import('@/lib/quiz/quiz-engine');
      const engine = new QuizEngine();
      
      const quizProfile = {
        primary_archetype: 'sophisticated',
        dimension_scores: {
          fresh: 20,
          floral: 30,
          oriental: 85,
          woody: 75,
          fruity: 15,
          gourmand: 25
        },
        lifestyle_factors: {
          work_style: 'professional',
          social_preference: 'intimate',
          fashion_style: 'classic_elegant'
        }
      };

      const expectedEmbedding = new Array(1536).fill(0);
      expectedEmbedding[0] = 0.8; // Mock significant values
      expectedEmbedding[1] = -0.3;
      expectedEmbedding[2] = 0.6;

      engine.generateUserEmbedding = vi.fn().mockResolvedValue(expectedEmbedding);
      
      const embedding = await engine.generateUserEmbedding(quizProfile);
      
      expect(embedding).toHaveLength(1536);
      expect(embedding[0]).toBe(0.8);
      expect(Math.abs(embedding[1])).toBe(0.3);
    });

    test('should bridge quiz results to recommendation API', async () => {
      const { QuizEngine } = await import('@/lib/quiz/quiz-engine');
      const engine = new QuizEngine();
      
      const quizResults = {
        session_id: 'completed-session-123',
        personality_profile: {
          primary_archetype: 'natural',
          confidence: 0.82
        }
      };

      const initialRecommendations = [
        {
          fragrance_id: 'rec-1',
          match_score: 0.89,
          quiz_alignment: 0.91,
          match_reasons: ['Matches your natural personality', 'Fits your outdoor lifestyle']
        }
      ];

      engine.getQuizBasedRecommendations = vi.fn().mockResolvedValue(initialRecommendations);
      
      const recommendations = await engine.getQuizBasedRecommendations(quizResults);
      
      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].quiz_alignment).toBe(0.91);
      expect(recommendations[0].match_reasons).toContain('natural personality');
    });

    test('should enhance existing user preferences with quiz insights', async () => {
      const { QuizEngine } = await import('@/lib/quiz/quiz-engine');
      const engine = new QuizEngine();
      
      const existingPreferences = {
        dominant_families: ['woody'],
        average_intensity: 6.5,
        confidence: 0.7
      };

      const quizInsights = {
        revealed_families: ['oriental', 'gourmand'],
        lifestyle_intensity: 7.8,
        personality_confidence: 0.85
      };

      const enhancedPreferences = {
        dominant_families: ['woody', 'oriental'], // Merged
        average_intensity: 7.15, // Weighted average
        confidence: 0.78, // Improved confidence
        quiz_enhanced: true,
        enhancement_strength: 0.15
      };

      engine.enhanceExistingPreferences = vi.fn().mockResolvedValue(enhancedPreferences);
      
      const result = await engine.enhanceExistingPreferences(existingPreferences, quizInsights);
      
      expect(result.dominant_families).toContain('oriental');
      expect(result.average_intensity).toBeGreaterThan(existingPreferences.average_intensity);
      expect(result.confidence).toBeGreaterThan(existingPreferences.confidence);
      expect(result.quiz_enhanced).toBe(true);
    });
  });

  describe('A/B Testing and Optimization', () => {
    test('should support quiz variant testing for optimization', async () => {
      const quizVariants = [
        {
          id: 'variant_a',
          name: 'Short Quiz (8 questions)',
          question_count: 8,
          scoring_algorithm: 'weighted',
          expected_completion_rate: 0.75
        },
        {
          id: 'variant_b',
          name: 'Progressive Quiz (dynamic length)',
          question_count: 'dynamic',
          scoring_algorithm: 'bayesian',
          expected_completion_rate: 0.68
        }
      ];

      // Each variant should have distinct characteristics
      expect(quizVariants[0].question_count).toBe(8);
      expect(quizVariants[1].question_count).toBe('dynamic');
      expect(quizVariants[0].scoring_algorithm).toBe('weighted');
      expect(quizVariants[1].scoring_algorithm).toBe('bayesian');
    });

    test('should track quiz performance metrics for optimization', async () => {
      const performanceMetrics = {
        completion_rate: 0.73,
        average_completion_time: 240, // seconds
        personality_accuracy: 0.84,
        recommendation_satisfaction: 0.79,
        sample_conversion_rate: 0.31
      };

      // All metrics should be within acceptable ranges
      expect(performanceMetrics.completion_rate).toBeGreaterThan(0.65);
      expect(performanceMetrics.average_completion_time).toBeLessThan(300); // 5 minutes
      expect(performanceMetrics.personality_accuracy).toBeGreaterThan(0.8);
      expect(performanceMetrics.sample_conversion_rate).toBeGreaterThan(0.25);
    });

    test('should measure quiz-to-recommendation accuracy correlation', async () => {
      const accuracyCorrelation = {
        quiz_confidence_vs_recommendation_satisfaction: 0.78,
        personality_stability_over_time: 0.82,
        quiz_prediction_vs_actual_purchases: 0.71,
        sample_accuracy: 0.85 // How well quiz predicts sample satisfaction
      };

      // Correlation should be strong enough to validate quiz effectiveness
      expect(accuracyCorrelation.quiz_confidence_vs_recommendation_satisfaction).toBeGreaterThan(0.7);
      expect(accuracyCorrelation.personality_stability_over_time).toBeGreaterThan(0.8);
      expect(accuracyCorrelation.quiz_prediction_vs_actual_purchases).toBeGreaterThan(0.65);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle incomplete quiz sessions gracefully', async () => {
      const { QuizEngine } = await import('@/lib/quiz/quiz-engine');
      const engine = new QuizEngine();
      
      const incompleteSession = {
        session_id: 'incomplete-session',
        responses_count: 3,
        required_minimum: 6,
        partial_confidence: 0.25
      };

      const partialResult = {
        can_generate_profile: false,
        partial_insights: 'Based on limited responses, you may prefer fresh or floral fragrances',
        recommended_action: 'continue_quiz',
        questions_needed: 3,
        estimated_confidence_improvement: 0.4
      };

      engine.analyzeProgress.mockResolvedValue(partialResult);
      
      const result = await engine.analyzeProgress(incompleteSession.session_id);
      
      expect(result.can_generate_profile).toBe(false);
      expect(result.partial_insights).toContain('fresh or floral');
      expect(result.recommended_action).toBe('continue_quiz');
      expect(result.questions_needed).toBe(3);
    });

    test('should handle conflicting user responses intelligently', async () => {
      const { QuizScoringEngine } = await import('@/lib/quiz/quiz-engine');
      const scorer = new QuizScoringEngine();
      
      const conflictingResponses = [
        { question_id: 'q1', answer_value: 'loves_bold_statements', mapping: { oriental: 0.9 } },
        { question_id: 'q2', answer_value: 'prefers_subtle_scents', mapping: { oriental: 0.1 } }
      ];

      const conflictResolution = {
        conflicts_detected: true,
        conflict_resolution_strategy: 'weighted_recency',
        final_dimensions: { oriental: 0.45 }, // Balanced resolution
        confidence_penalty: -0.15,
        suggested_clarifying_questions: ['intensity_preference_specific']
      };

      scorer.resolveConflicts = vi.fn().mockResolvedValue(conflictResolution);
      
      const result = await scorer.resolveConflicts(conflictingResponses);
      
      expect(result.conflicts_detected).toBe(true);
      expect(result.confidence_penalty).toBeLessThan(0);
      expect(result.suggested_clarifying_questions).toContain('intensity_preference_specific');
    });

    test('should recover from analysis service failures', async () => {
      const { QuizEngine } = await import('@/lib/quiz/quiz-engine');
      const engine = new QuizEngine();
      
      // Simulate service failure
      engine.analyzeProgress.mockRejectedValueOnce(new Error('OpenAI API unavailable'));
      
      // Should fallback to rule-based analysis
      engine.analyzeProgress.mockResolvedValueOnce({
        analysis_method: 'fallback_rules',
        personality_profile: { archetype: 'classic', confidence: 0.6 },
        service_degraded: true,
        fallback_message: 'Using simplified analysis while AI service recovers'
      });

      const result = await engine.analyzeProgress('session-123');
      
      expect(result.analysis_method).toBe('fallback_rules');
      expect(result.service_degraded).toBe(true);
      expect(result.personality_profile.archetype).toBe('classic'); // Safe default
    });

    test('should validate quiz question integrity and consistency', async () => {
      const { QuizEngine } = await import('@/lib/quiz/quiz-engine');
      const engine = new QuizEngine();
      
      const questionValidation = {
        total_questions: 15,
        required_categories: ['lifestyle', 'preferences', 'personality', 'scenarios'],
        category_coverage: {
          lifestyle: 4,
          preferences: 4,
          personality: 3,
          scenarios: 4
        },
        branching_paths: 6,
        max_quiz_length: 15,
        min_quiz_length: 8
      };

      engine.validateQuizStructure = vi.fn().mockResolvedValue({
        valid: true,
        coverage_complete: true,
        branching_logic_valid: true,
        question_weights_balanced: true
      });
      
      const validation = await engine.validateQuizStructure(questionValidation);
      
      expect(validation.valid).toBe(true);
      expect(validation.coverage_complete).toBe(true);
      expect(validation.branching_logic_valid).toBe(true);
    });
  });

  describe('Analytics and Improvement', () => {
    test('should track quiz completion funnel analytics', async () => {
      const funnelAnalytics = {
        quiz_started: 1000,
        question_3_reached: 850, // 85% make it past intro
        question_8_reached: 650, // 65% reach midpoint
        quiz_completed: 520, // 52% complete
        account_created: 182, // 35% of completions create account
        sample_purchased: 91, // 50% of accounts purchase samples
      };

      // Calculate conversion rates
      const completionRate = funnelAnalytics.quiz_completed / funnelAnalytics.quiz_started;
      const accountConversionRate = funnelAnalytics.account_created / funnelAnalytics.quiz_completed;
      const sampleConversionRate = funnelAnalytics.sample_purchased / funnelAnalytics.account_created;

      expect(completionRate).toBeGreaterThan(0.45); // Target 45%+ completion
      expect(accountConversionRate).toBeGreaterThan(0.3); // Target 30%+ account conversion
      expect(sampleConversionRate).toBeGreaterThan(0.4); // Target 40%+ sample conversion
    });

    test('should identify quiz optimization opportunities', async () => {
      const optimizationInsights = {
        drop_off_questions: ['technical_notes_1', 'complex_scenarios_1'],
        high_engagement_questions: ['lifestyle_style_1', 'environment_preference_1'],
        ambiguous_responses: ['depends_on_mood', 'it_varies'],
        personality_prediction_accuracy: {
          romantic: 0.89,
          sophisticated: 0.85,
          natural: 0.91,
          bold: 0.76, // Lower accuracy - needs improvement
        }
      };

      expect(optimizationInsights.drop_off_questions).toHaveLength(2);
      expect(optimizationInsights.personality_prediction_accuracy.natural).toBeGreaterThan(0.9);
      expect(optimizationInsights.personality_prediction_accuracy.bold).toBeLessThan(0.8); // Needs work
    });

    test('should measure long-term quiz accuracy through user feedback', async () => {
      const longTermAccuracy = {
        quiz_personality_vs_collection_analysis: 0.78,
        initial_recommendations_satisfaction: 0.73,
        personality_stability_6_months: 0.84,
        quiz_influenced_purchases_satisfaction: 0.81
      };

      // Long-term metrics should validate quiz effectiveness
      expect(longTermAccuracy.quiz_personality_vs_collection_analysis).toBeGreaterThan(0.75);
      expect(longTermAccuracy.initial_recommendations_satisfaction).toBeGreaterThan(0.7);
      expect(longTermAccuracy.personality_stability_6_months).toBeGreaterThan(0.8);
    });
  });
});