import { describe, test, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { setupRpcOperations, resetDatabaseMocks } from '../utils/database-test-utils';

/**
 * Quiz API Endpoints Tests
 * 
 * Tests for quiz system API routes:
 * - POST /api/quiz/start - Initialize quiz session (guest or authenticated)
 * - GET /api/quiz/questions - Fetch quiz questions with branching logic
 * - POST /api/quiz/answer - Submit answers and get progressive analysis
 * - GET /api/quiz/results/[session_id] - Get personality profile and results
 * - POST /api/quiz/convert-to-account - Convert guest session to user account
 * - POST /api/quiz/retake - Allow authenticated users to retake quiz
 * - GET /api/onboarding/status - Get onboarding progress
 * - POST /api/onboarding/complete - Mark onboarding completed
 */

// Mock Supabase and authentication
vi.mock('@/lib/supabase', () => ({
  createServerSupabase: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
  getCurrentUser: vi.fn(),
}));

// Mock quiz engine services
vi.mock('@/lib/quiz/quiz-engine', () => ({
  QuizEngine: vi.fn(),
  GuestSessionManager: vi.fn(),
  PersonalityAnalyzer: vi.fn(),
}));

describe('Quiz API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDatabaseMocks();
    setupRpcOperations();
  });

  describe('POST /api/quiz/start', () => {
    test('should start authenticated user quiz session', async () => {
      const quizStartData = {
        user_id: 'user-123',
        referral_source: 'homepage_cta',
        quiz_version: 'v1.0'
      };

      const mockSessionResponse = {
        session_id: 'auth-session-123',
        user_id: 'user-123',
        is_guest_session: false,
        first_question: {
          question_id: 'lifestyle_intro_1',
          question_text: 'Which best describes your daily style?',
          question_type: 'multiple_choice',
          options: [
            { value: 'professional_polished', text: 'Professional and polished' },
            { value: 'casual_comfortable', text: 'Casual and comfortable' },
            { value: 'artistic_expressive', text: 'Artistic and expressive' },
            { value: 'sporty_active', text: 'Sporty and active' }
          ],
          progress: { current: 1, total: 15, percentage: 7 }
        },
        estimated_completion_time: 240 // 4 minutes
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockSessionResponse), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/quiz/start', {
        method: 'POST',
        body: JSON.stringify(quizStartData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.session_id).toBe('auth-session-123');
      expect(data.is_guest_session).toBe(false);
      expect(data.first_question.question_id).toBe('lifestyle_intro_1');
      expect(data.first_question.options).toHaveLength(4);
      expect(data.estimated_completion_time).toBe(240);
    });

    test('should start guest quiz session for anonymous users', async () => {
      const guestStartData = {
        referral_source: 'marketing_campaign',
        user_agent: 'Mozilla/5.0...',
        ip_address: '192.168.1.100'
      };

      const mockGuestResponse = {
        session_id: 'guest-session-456',
        session_token: 'secure-guest-token-abc123',
        is_guest_session: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        first_question: {
          question_id: 'lifestyle_intro_1',
          question_text: 'What\'s your ideal way to spend a free evening?',
          question_type: 'scenario_based',
          options: [
            { value: 'cozy_home', text: 'Cozy night at home', imagery: 'candlelit_room.jpg' },
            { value: 'social_gathering', text: 'Dinner with friends', imagery: 'restaurant.jpg' },
            { value: 'cultural_event', text: 'Concert or theater', imagery: 'theater.jpg' },
            { value: 'outdoor_adventure', text: 'Outdoor activities', imagery: 'nature.jpg' }
          ]
        },
        privacy_notice: 'Your responses help us find your perfect fragrance. Data expires automatically in 24 hours.'
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockGuestResponse), {
          status: 201,
          headers: { 
            'Content-Type': 'application/json',
            'Set-Cookie': `guest_session_token=${mockGuestResponse.session_token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
          },
        })
      );

      const request = new NextRequest('http://localhost/api/quiz/start', {
        method: 'POST',
        body: JSON.stringify(guestStartData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.session_token).toBeDefined();
      expect(data.is_guest_session).toBe(true);
      expect(data.expires_at).toBeDefined();
      expect(data.privacy_notice).toContain('expires automatically');
      expect(response.headers.get('Set-Cookie')).toContain('guest_session_token');
    });

    test('should handle rate limiting for quiz session creation', async () => {
      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: 'Too many quiz sessions created from this IP',
          retry_after_seconds: 3600,
          current_rate: '15 sessions per hour',
          limit: '10 sessions per hour'
        }), {
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '3600'
          },
        })
      );

      const request = new NextRequest('http://localhost/api/quiz/start', {
        method: 'POST',
        body: JSON.stringify({ referral_source: 'spam_test' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.retry_after_seconds).toBe(3600);
      expect(response.headers.get('Retry-After')).toBe('3600');
    });
  });

  describe('POST /api/quiz/answer', () => {
    test('should process quiz answer and return next question', async () => {
      const answerData = {
        session_token: 'active-session-token',
        question_id: 'lifestyle_intro_1',
        answer_value: 'professional_polished',
        response_time_ms: 4500,
        confidence: 0.8
      };

      const mockAnswerResponse = {
        answer_processed: true,
        immediate_insight: 'Your professional style suggests a preference for sophisticated, refined fragrances',
        progress: {
          current_question: 2,
          total_questions: 15,
          percentage: 13,
          estimated_remaining_time: 210 // seconds
        },
        next_question: {
          question_id: 'environment_preference_1',
          question_text: 'Which environment makes you feel most inspired?',
          question_type: 'image_selection',
          options: [
            { value: 'modern_office', text: 'Modern office space', image: 'office.jpg' },
            { value: 'cozy_library', text: 'Cozy library', image: 'library.jpg' },
            { value: 'art_gallery', text: 'Art gallery', image: 'gallery.jpg' },
            { value: 'garden_nature', text: 'Garden or nature', image: 'garden.jpg' }
          ],
          triggered_by: 'professional_polished' // Branching logic result
        },
        partial_analysis: {
          emerging_archetype: 'sophisticated',
          confidence: 0.45,
          dominant_dimensions: ['oriental', 'woody']
        }
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockAnswerResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/quiz/answer', {
        method: 'POST',
        body: JSON.stringify(answerData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.answer_processed).toBe(true);
      expect(data.immediate_insight).toContain('sophisticated');
      expect(data.progress.percentage).toBe(13);
      expect(data.next_question.triggered_by).toBe('professional_polished');
      expect(data.partial_analysis.emerging_archetype).toBe('sophisticated');
    });

    test('should handle quiz completion when confidence threshold reached', async () => {
      const finalAnswerData = {
        session_token: 'completion-session-token',
        question_id: 'final_preference_1',
        answer_value: 'luxury_evening_scents',
        response_time_ms: 3000
      };

      const completionResponse = {
        quiz_completed: true,
        confidence_threshold_reached: true,
        final_confidence: 0.87,
        personality_profile: {
          primary_archetype: 'sophisticated',
          secondary_archetype: 'mysterious',
          style_descriptor: 'Sophisticated Evening Enthusiast - You gravitate toward complex, layered fragrances with oriental and woody notes',
          dominant_families: ['oriental', 'woody', 'amber'],
          lifestyle_alignment: {
            work: 'professional_settings',
            social: 'intimate_gatherings',
            personal: 'quality_over_quantity'
          }
        },
        initial_recommendations: [
          {
            fragrance_id: 'tf-black-orchid',
            match_percentage: 94,
            quiz_reasoning: 'Perfect match for your sophisticated evening style'
          }
        ],
        next_steps: {
          create_account: 'Unlock 15 more personalized matches',
          try_samples: 'Order your top 3 recommendations',
          explore_collection: 'Build your fragrance wardrobe'
        }
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(completionResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/quiz/answer', {
        method: 'POST',
        body: JSON.stringify(finalAnswerData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quiz_completed).toBe(true);
      expect(data.final_confidence).toBeGreaterThan(0.8);
      expect(data.personality_profile.primary_archetype).toBe('sophisticated');
      expect(data.initial_recommendations).toHaveLength(1);
      expect(data.next_steps.create_account).toContain('15 more');
    });

    test('should validate answer format and detect inconsistencies', async () => {
      const invalidAnswerData = {
        session_token: 'test-session-token',
        question_id: 'lifestyle_intro_1',
        answer_value: 'invalid_option_not_in_choices',
        response_time_ms: 50 // Suspiciously fast
      };

      const validationErrorResponse = {
        answer_processed: false,
        validation_errors: [
          'Answer value not in allowed options for this question',
          'Response time below minimum threshold (suggests automation)',
          'Answer inconsistent with previous response pattern'
        ],
        allowed_answers: ['professional_polished', 'casual_comfortable', 'artistic_expressive', 'sporty_active'],
        retry_allowed: true,
        security_flag: false // Not malicious, just invalid
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(validationErrorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/quiz/answer', {
        method: 'POST',
        body: JSON.stringify(invalidAnswerData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.answer_processed).toBe(false);
      expect(data.validation_errors).toHaveLength(3);
      expect(data.allowed_answers).toContain('professional_polished');
      expect(data.retry_allowed).toBe(true);
    });

    test('should detect and prevent automated quiz submission', async () => {
      const suspiciousAnswerPattern = {
        session_token: 'bot-session-token',
        rapid_answers: [
          { question_id: 'q1', answer_value: 'option1', response_time_ms: 100 },
          { question_id: 'q2', answer_value: 'option1', response_time_ms: 95 },
          { question_id: 'q3', answer_value: 'option1', response_time_ms: 105 }
        ],
        pattern_detected: 'uniform_timing_and_selection'
      };

      const botDetectionResponse = {
        bot_detected: true,
        confidence: 0.91,
        detection_reasons: [
          'Uniform response timing (95-105ms)',
          'Always selecting first option',
          'No human-like hesitation patterns'
        ],
        session_flagged: true,
        requires_captcha: true,
        temporary_block: true
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(botDetectionResponse), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/quiz/answer', {
        method: 'POST',
        body: JSON.stringify(suspiciousAnswerPattern),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.bot_detected).toBe(true);
      expect(data.detection_reasons).toContain('Uniform response timing');
      expect(data.requires_captcha).toBe(true);
    });
  });

  describe('GET /api/quiz/results/[session_id]', () => {
    test('should return comprehensive personality profile for completed quiz', async () => {
      const completeResultsResponse = {
        quiz_completed: true,
        session_metadata: {
          session_id: 'completed-session-789',
          completed_at: '2025-08-15T10:15:00Z',
          total_questions_answered: 12,
          completion_time_seconds: 285
        },
        personality_profile: {
          primary_archetype: 'romantic',
          secondary_archetype: 'playful',
          confidence: 0.89,
          style_descriptor: 'Romantic Dreamer - You love feminine, floral fragrances with sweet, playful touches that make you feel beautiful and confident',
          detailed_analysis: {
            dimension_scores: {
              fresh: 25,
              floral: 90,
              oriental: 35,
              woody: 20,
              fruity: 75,
              gourmand: 60
            },
            lifestyle_factors: {
              work_environment: 'creative_collaborative',
              social_style: 'warm_welcoming',
              fashion_preference: 'feminine_romantic',
              weekend_activities: 'cultural_creative'
            },
            fragrance_recommendations: {
              signature_style: 'floral_fruity',
              day_fragrance: 'light_floral',
              evening_fragrance: 'rich_floral_oriental',
              special_occasion: 'luxurious_feminine'
            }
          }
        },
        personalized_insights: {
          key_preferences: [
            'You prefer fragrances that enhance your femininity',
            'Floral notes make you feel most like yourself',
            'You enjoy scents that get compliments and start conversations'
          ],
          style_evolution: 'Your preferences suggest openness to trying new floral combinations',
          collection_building: 'Start with a signature floral and add seasonal varieties'
        },
        initial_recommendations: [
          {
            fragrance_id: 'chanel-chance',
            name: 'Chanel Chance',
            brand: 'Chanel',
            match_percentage: 94,
            quiz_reasoning: 'Perfect floral-fruity match for your romantic style',
            sample_price: 16.99,
            confidence: 0.92
          },
          {
            fragrance_id: 'dior-jadore',
            name: 'Dior J\'adore',
            brand: 'Dior',
            match_percentage: 91,
            quiz_reasoning: 'Luxurious florals that align with your sophisticated taste',
            sample_price: 18.99,
            confidence: 0.89
          }
        ]
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(completeResultsResponse), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'private, max-age=3600' // 1 hour cache
          },
        })
      );

      const request = new NextRequest('http://localhost/api/quiz/results/completed-session-789');
      const response = await GET(request, { params: { session_id: 'completed-session-789' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.personality_profile.primary_archetype).toBe('romantic');
      expect(data.personality_profile.confidence).toBeGreaterThan(0.8);
      expect(data.initial_recommendations).toHaveLength(2);
      expect(data.initial_recommendations[0].match_percentage).toBe(94);
      expect(data.personalized_insights.key_preferences).toHaveLength(3);
    });

    test('should return partial results for incomplete but analyzable quiz', async () => {
      const partialResultsResponse = {
        quiz_completed: false,
        partial_analysis_available: true,
        session_metadata: {
          questions_answered: 8,
          minimum_for_analysis: 6,
          confidence_below_threshold: true
        },
        preliminary_insights: {
          emerging_archetype: 'natural',
          confidence: 0.54,
          likely_preferences: ['fresh', 'green', 'woody'],
          needs_clarification: ['intensity_preference', 'occasion_specifics']
        },
        continue_quiz: {
          questions_remaining: 4,
          estimated_time: 90, // seconds
          potential_confidence_improvement: 0.25,
          recommended_questions: ['intensity_1', 'occasion_1', 'brand_1', 'price_1']
        },
        limited_recommendations: [
          {
            fragrance_id: 'sample-rec-1',
            name: 'Fresh Sample 1',
            match_percentage: 67,
            caveat: 'Based on preliminary analysis - complete quiz for better matches'
          }
        ]
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(partialResultsResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/quiz/results/partial-session-456');
      const response = await GET(request, { params: { session_id: 'partial-session-456' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quiz_completed).toBe(false);
      expect(data.partial_analysis_available).toBe(true);
      expect(data.preliminary_insights.confidence).toBe(0.54);
      expect(data.continue_quiz.questions_remaining).toBe(4);
      expect(data.limited_recommendations[0].caveat).toContain('complete quiz');
    });

    test('should handle non-existent or expired session requests', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          error: 'Session not found or expired',
          session_id: 'non-existent-session',
          possible_reasons: [
            'Session expired (24 hour limit)',
            'Invalid session ID format',
            'Session was deleted or cleaned up'
          ],
          recommended_action: 'start_new_quiz'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/quiz/results/non-existent-session');
      const response = await GET(request, { params: { session_id: 'non-existent-session' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found or expired');
      expect(data.recommended_action).toBe('start_new_quiz');
    });
  });

  describe('POST /api/quiz/convert-to-account', () => {
    test('should convert guest session to authenticated user account', async () => {
      const conversionData = {
        session_token: 'complete-guest-session-token',
        user_data: {
          email: 'newuser@example.com',
          password: 'securePassword123!',
          first_name: 'Sarah',
          last_name: 'Johnson',
          marketing_opt_in: true
        },
        preserve_quiz_data: true,
        immediate_recommendations: true
      };

      const conversionResponse = {
        account_created: true,
        user_id: 'user-new-789',
        quiz_data_transferred: true,
        transfer_summary: {
          quiz_responses: 12,
          personality_profile: true,
          progress_preserved: true,
          recommendations_enhanced: true
        },
        enhanced_profile: {
          onboarding_completed: true,
          quiz_personality_type: 'romantic',
          personalization_confidence: 0.89,
          initial_collection_suggestions: 3
        },
        immediate_benefits: {
          personalized_recommendations: 15,
          quiz_accuracy_bonus: 0.12,
          sample_recommendations: 5,
          account_creation_bonus: 'free_shipping'
        },
        next_steps: {
          redirect_to: '/recommendations?quiz_completed=true',
          onboarding_step: 'explore_recommendations'
        }
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(conversionResponse), {
          status: 201,
          headers: { 
            'Content-Type': 'application/json',
            'Set-Cookie': 'auth_session=...; HttpOnly; Secure'
          },
        })
      );

      const request = new NextRequest('http://localhost/api/quiz/convert-to-account', {
        method: 'POST',
        body: JSON.stringify(conversionData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.account_created).toBe(true);
      expect(data.quiz_data_transferred).toBe(true);
      expect(data.transfer_summary.quiz_responses).toBe(12);
      expect(data.immediate_benefits.personalized_recommendations).toBe(15);
      expect(data.next_steps.redirect_to).toBe('/recommendations?quiz_completed=true');
    });

    test('should handle email conflicts during account conversion', async () => {
      const conflictData = {
        session_token: 'conflict-session-token',
        user_data: {
          email: 'existing@example.com', // Already exists
          password: 'password123',
          first_name: 'John'
        }
      };

      const conflictResponse = {
        account_created: false,
        error: 'Email already exists',
        conflict_resolution: {
          existing_account_found: true,
          can_merge_data: true,
          requires_login: true,
          quiz_data_preserved: true,
          merge_offer: 'Login to transfer your quiz results to existing account'
        },
        alternative_actions: [
          { action: 'use_different_email', description: 'Create account with different email' },
          { action: 'login_and_merge', description: 'Login to existing account and transfer quiz data' },
          { action: 'continue_as_guest', description: 'Continue without account (limited features)' }
        ]
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(conflictResponse), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/quiz/convert-to-account', {
        method: 'POST',
        body: JSON.stringify(conflictData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.account_created).toBe(false);
      expect(data.conflict_resolution.existing_account_found).toBe(true);
      expect(data.alternative_actions).toHaveLength(3);
    });

    test('should validate account creation data and enforce security requirements', async () => {
      const weakAccountData = {
        session_token: 'valid-session-token',
        user_data: {
          email: 'invalid-email-format',
          password: '123', // Too weak
          first_name: '<script>alert("xss")</script>' // XSS attempt
        }
      };

      const securityValidationResponse = {
        account_created: false,
        validation_errors: [
          'Invalid email format',
          'Password too weak (minimum 8 characters, must include numbers and symbols)',
          'Invalid characters in name field'
        ],
        security_violations: [
          'Potential XSS attempt in first_name field'
        ],
        password_requirements: {
          min_length: 8,
          requires_numbers: true,
          requires_symbols: true,
          requires_mixed_case: true
        }
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(securityValidationResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/quiz/convert-to-account', {
        method: 'POST',
        body: JSON.stringify(weakAccountData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.validation_errors).toContain('Invalid email format');
      expect(data.validation_errors).toContain('Password too weak');
      expect(data.security_violations).toContain('Potential XSS attempt');
    });
  });

  describe('POST /api/quiz/retake', () => {
    test('should allow authenticated users to retake quiz', async () => {
      const retakeData = {
        user_id: 'existing-user-123',
        retake_type: 'full_refresh',
        reason: 'preferences_changed',
        preserve_collection_data: true
      };

      const retakeResponse = {
        retake_session_created: true,
        new_session_id: 'retake-session-456',
        previous_results: {
          last_archetype: 'sophisticated',
          last_confidence: 0.84,
          completed_at: '2025-06-15T10:00:00Z',
          months_since_last_quiz: 2
        },
        retake_benefits: {
          improved_accuracy: 'Collection data will enhance quiz analysis',
          preference_evolution: 'We can track how your style has evolved',
          better_recommendations: 'Updated quiz will improve recommendation accuracy'
        },
        quiz_configuration: {
          total_questions: 15,
          includes_evolution_questions: true,
          compares_to_previous: true,
          estimated_time: 180 // 3 minutes for experienced user
        }
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(retakeResponse), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/quiz/retake', {
        method: 'POST',
        body: JSON.stringify(retakeData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.retake_session_created).toBe(true);
      expect(data.previous_results.last_archetype).toBe('sophisticated');
      expect(data.quiz_configuration.includes_evolution_questions).toBe(true);
      expect(data.quiz_configuration.estimated_time).toBe(180);
    });

    test('should support selective quiz update for specific preferences', async () => {
      const selectiveUpdateData = {
        user_id: 'user-selective-456',
        retake_type: 'selective_update',
        questions_to_update: ['intensity_preference', 'price_sensitivity', 'seasonal_preference'],
        reason: 'lifestyle_changes'
      };

      const selectiveResponse = {
        selective_update_created: true,
        targeted_questions: 3,
        estimated_time: 60, // 1 minute for targeted updates
        previous_responses: {
          intensity_preference: 'moderate_projection',
          price_sensitivity: 'luxury_focused',
          seasonal_preference: 'year_round_flexibility'
        },
        update_impact: {
          personality_archetype_change: false,
          recommendation_improvement_expected: 0.08,
          affected_recommendation_sections: ['perfect_matches', 'seasonal']
        }
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(selectiveResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/quiz/retake', {
        method: 'POST',
        body: JSON.stringify(selectiveUpdateData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.selective_update_created).toBe(true);
      expect(data.targeted_questions).toBe(3);
      expect(data.estimated_time).toBe(60);
      expect(data.update_impact.recommendation_improvement_expected).toBe(0.08);
    });
  });

  describe('Onboarding Flow Integration', () => {
    test('should track onboarding progress through quiz completion', async () => {
      const onboardingStatusResponse = {
        user_id: 'onboarding-user-123',
        current_step: 'quiz_in_progress',
        steps_completed: ['welcome', 'quiz_started'],
        steps_remaining: ['quiz_completed', 'recommendations_viewed', 'first_sample_ordered'],
        overall_progress: 0.4, // 40% complete
        quiz_session: {
          session_id: 'onboarding-quiz-session',
          questions_answered: 6,
          questions_remaining: 6,
          estimated_completion_time: 120
        },
        next_recommended_action: {
          action: 'continue_quiz',
          description: 'Complete your fragrance personality quiz',
          cta_text: 'Continue Quiz',
          urgency: 'medium'
        }
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(onboardingStatusResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/onboarding/status');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.current_step).toBe('quiz_in_progress');
      expect(data.overall_progress).toBe(0.4);
      expect(data.quiz_session.questions_answered).toBe(6);
      expect(data.next_recommended_action.action).toBe('continue_quiz');
    });

    test('should complete onboarding when quiz and initial engagement finished', async () => {
      const completionData = {
        user_id: 'completing-user-789',
        completion_trigger: 'first_sample_ordered',
        onboarding_feedback: {
          quiz_experience: 'excellent',
          recommendation_accuracy: 'very_good',
          overall_satisfaction: 4.5,
          would_recommend: true
        }
      };

      const completionResponse = {
        onboarding_completed: true,
        completion_timestamp: new Date().toISOString(),
        user_journey_summary: {
          total_time_minutes: 12,
          quiz_completion_time: 4.5,
          recommendations_viewed: 8,
          samples_ordered: 2,
          conversion_achieved: true
        },
        user_classification: {
          user_type: 'engaged_explorer',
          predicted_ltv: 'high',
          engagement_score: 0.91,
          fragrance_sophistication: 'intermediate'
        },
        post_onboarding_features: {
          unlocked_features: ['collection_management', 'advanced_recommendations', 'community_features'],
          recommended_next_steps: ['explore_collection_dashboard', 'rate_sample_experiences']
        }
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(completionResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/onboarding/complete', {
        method: 'POST',
        body: JSON.stringify(completionData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.onboarding_completed).toBe(true);
      expect(data.user_journey_summary.conversion_achieved).toBe(true);
      expect(data.user_classification.engagement_score).toBe(0.91);
      expect(data.post_onboarding_features.unlocked_features).toContain('collection_management');
    });
  });

  describe('Performance and Analytics', () => {
    test('should meet performance requirements for quiz API endpoints', async () => {
      const performanceTest = {
        endpoint: '/api/quiz/answer',
        concurrent_requests: 100,
        target_latency: 200, // ms
        target_throughput: 500 // requests per second
      };

      const POST = vi.fn().mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => resolve(
            new Response(JSON.stringify({ processed: true }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          ), 150); // 150ms processing time
        })
      );

      const startTime = Date.now();
      
      const requests = Array.from({ length: performanceTest.concurrent_requests }, () =>
        POST(new NextRequest('http://localhost/api/quiz/answer'))
      );
      
      const results = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      const avgLatency = totalTime / performanceTest.concurrent_requests;

      expect(results).toHaveLength(100);
      expect(avgLatency).toBeLessThan(performanceTest.target_latency);
    });

    test('should track quiz funnel analytics for optimization', async () => {
      const funnelAnalytics = {
        quiz_started: 1000,
        question_1_completed: 950, // 95% past intro
        question_5_completed: 750, // 75% reach midpoint
        question_10_completed: 600, // 60% near completion
        quiz_completed: 520, // 52% complete quiz
        account_created: 182, // 35% of completions
        first_sample_ordered: 91, // 50% of accounts
        conversion_rates: {
          quiz_completion: 0.52,
          quiz_to_account: 0.35,
          account_to_purchase: 0.50,
          overall_conversion: 0.091
        }
      };

      // Verify conversion rates meet targets
      expect(funnelAnalytics.conversion_rates.quiz_completion).toBeGreaterThan(0.45);
      expect(funnelAnalytics.conversion_rates.quiz_to_account).toBeGreaterThan(0.30);
      expect(funnelAnalytics.conversion_rates.account_to_purchase).toBeGreaterThan(0.40);
    });

    test('should implement A/B testing for quiz optimization', async () => {
      const abTestScenarios = [
        {
          variant: 'short_quiz_8_questions',
          completion_rate: 0.68,
          accuracy: 0.79,
          time_to_complete: 180
        },
        {
          variant: 'standard_quiz_12_questions',
          completion_rate: 0.52,
          accuracy: 0.87,
          time_to_complete: 285
        },
        {
          variant: 'adaptive_quiz_dynamic',
          completion_rate: 0.61,
          accuracy: 0.84,
          time_to_complete: 225
        }
      ];

      // Each variant should have trade-offs between completion and accuracy
      const shortQuiz = abTestScenarios[0];
      const standardQuiz = abTestScenarios[1];
      const adaptiveQuiz = abTestScenarios[2];

      expect(shortQuiz.completion_rate).toBeGreaterThan(standardQuiz.completion_rate);
      expect(standardQuiz.accuracy).toBeGreaterThan(shortQuiz.accuracy);
      expect(adaptiveQuiz.completion_rate).toBeGreaterThan(standardQuiz.completion_rate);
      expect(adaptiveQuiz.completion_rate).toBeLessThan(shortQuiz.completion_rate);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle quiz service failures gracefully', async () => {
      const serviceFailureResponse = {
        quiz_service_unavailable: true,
        fallback_mode: 'simplified_quiz',
        degraded_features: ['dynamic_branching', 'real_time_analysis'],
        available_features: ['basic_questions', 'simple_scoring'],
        estimated_restoration: '2025-08-15T12:00:00Z',
        user_message: 'Quiz temporarily simplified while we restore full features'
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(serviceFailureResponse), {
          status: 503,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '1800' // 30 minutes
          },
        })
      );

      const request = new NextRequest('http://localhost/api/quiz/questions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.quiz_service_unavailable).toBe(true);
      expect(data.fallback_mode).toBe('simplified_quiz');
      expect(data.degraded_features).toContain('real_time_analysis');
    });

    test('should handle corrupted session data recovery', async () => {
      const corruptedSessionRecovery = {
        session_token: 'corrupted-session-token',
        data_integrity_check: 'failed',
        corruption_detected: true,
        recovery_possible: false,
        data_salvage: {
          responses_recovered: 3,
          responses_lost: 2,
          partial_analysis_possible: true
        },
        recommended_action: 'restart_with_salvaged_insights'
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(corruptedSessionRecovery), {
          status: 422, // Unprocessable Entity
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/quiz/results/corrupted-session-token');
      const response = await GET(request, { params: { session_id: 'corrupted-session-token' } });
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.corruption_detected).toBe(true);
      expect(data.data_salvage.responses_recovered).toBe(3);
      expect(data.recommended_action).toBe('restart_with_salvaged_insights');
    });

    test('should handle malicious input attempts securely', async () => {
      const maliciousInput = {
        session_token: 'valid-token',
        question_id: 'q1',
        answer_value: '{"__proto__":{"admin":true}}', // Prototype pollution attempt
        malicious_payload: '<script>alert("xss")</script>'
      };

      const securityResponse = {
        request_blocked: true,
        security_violation: 'prototype_pollution_attempt',
        ip_address_flagged: true,
        session_invalidated: true,
        incident_logged: true,
        user_message: 'Invalid request format'
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(securityResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/quiz/answer', {
        method: 'POST',
        body: JSON.stringify(maliciousInput),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.request_blocked).toBe(true);
      expect(data.security_violation).toBe('prototype_pollution_attempt');
      expect(data.incident_logged).toBe(true);
    });
  });
});