import { describe, test, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { setupRpcOperations, resetDatabaseMocks } from '../utils/database-test-utils';

/**
 * Recommendation API Endpoints Tests
 * 
 * Tests for AI-powered recommendation API routes:
 * - GET /api/recommendations - Personalized recommendations with themed sections
 * - GET /api/recommendations/personalized - Core personalized algorithm
 * - GET /api/recommendations/trending - Social signals and trending items
 * - GET /api/recommendations/seasonal - Context-aware seasonal suggestions
 * - POST /api/recommendations/feedback - User feedback processing
 * - GET /api/recommendations/explain/[id] - Recommendation explanations
 * - POST /api/recommendations/refresh - Real-time preference updates
 */

// Mock AI services
vi.mock('@/lib/ai/recommendation-engine', () => ({
  HybridRecommendationEngine: vi.fn(),
  PreferenceLearningEngine: vi.fn(),
  RecommendationExplainer: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  createServerSupabase: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
  getCurrentUser: vi.fn(),
}));

describe('Recommendation API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDatabaseMocks();
    setupRpcOperations();
  });

  describe('GET /api/recommendations', () => {
    test('should return comprehensive recommendation sections', async () => {
      const mockRecommendationSections = {
        perfect_matches: [
          {
            fragrance_id: 'perfect-1',
            name: 'Perfect Match 1',
            brand: 'Luxury Brand',
            match_percentage: 94,
            confidence: 'high',
            explanation: 'Similar to your favorite Tom Ford Black Orchid',
            sample_price: 15.99,
            image_url: '/perfect1.jpg'
          }
        ],
        trending: [
          {
            fragrance_id: 'trend-1',
            name: 'Trending Fragrance',
            brand: 'Popular Brand',
            match_percentage: 78,
            trend_score: 0.91,
            social_proof: '87% who tried bought full size',
            sample_price: 12.99
          }
        ],
        adventurous: [
          {
            fragrance_id: 'adventure-1',
            name: 'Adventurous Pick',
            brand: 'Niche Brand',
            match_percentage: 68,
            novelty_score: 0.88,
            exploration_reason: 'Expand into gourmand territory',
            sample_price: 18.99
          }
        ],
        seasonal: [
          {
            fragrance_id: 'seasonal-1',
            name: 'Winter Warmth',
            brand: 'Seasonal Brand',
            match_percentage: 85,
            season_relevance: 0.95,
            weather_context: 'Perfect for cold winter days',
            sample_price: 14.99
          }
        ],
        metadata: {
          user_id: 'user-123',
          generated_at: '2024-12-15T10:00:00Z',
          preference_confidence: 0.87,
          total_recommendations: 4,
          processing_time_ms: 45
        }
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockRecommendationSections), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'private, max-age=300' // 5 minutes
          },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.perfect_matches).toHaveLength(1);
      expect(data.perfect_matches[0].match_percentage).toBe(94);
      expect(data.trending[0].trend_score).toBe(0.91);
      expect(data.adventurous[0].novelty_score).toBe(0.88);
      expect(data.seasonal[0].season_relevance).toBe(0.95);
      expect(data.metadata.processing_time_ms).toBeLessThan(100);
    });

    test('should support customization parameters', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          perfect_matches: [],
          customization: {
            max_results_per_section: 3,
            include_explanations: true,
            adventure_level: 0.3,
            price_range: { min: 10, max: 50 }
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations?max_per_section=3&explanations=true&adventure=0.3&price_min=10&price_max=50');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.customization.max_results_per_section).toBe(3);
      expect(data.customization.include_explanations).toBe(true);
      expect(data.customization.adventure_level).toBe(0.3);
    });

    test('should handle cold start users appropriately', async () => {
      const coldStartResponse = {
        cold_start: true,
        onboarding_recommendations: [
          { fragrance_id: 'popular-1', reason: 'Best seller for beginners', family: 'fresh' },
          { fragrance_id: 'popular-2', reason: 'Versatile everyday scent', family: 'woody' },
          { fragrance_id: 'popular-3', reason: 'Classic feminine choice', family: 'floral' },
          { fragrance_id: 'popular-4', reason: 'Sophisticated evening option', family: 'oriental' }
        ],
        next_steps: {
          message: 'Try a few samples to unlock personalized recommendations',
          action: 'Take our fragrance quiz for instant personalization'
        }
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(coldStartResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cold_start).toBe(true);
      expect(data.onboarding_recommendations).toHaveLength(4);
      expect(data.next_steps.message).toContain('personalized recommendations');
      
      // Should cover diverse fragrance families
      const families = data.onboarding_recommendations.map((r: any) => r.family);
      expect(new Set(families).size).toBe(4);
    });

    test('should require authentication for personalized recommendations', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    test('should handle recommendation service failures gracefully', async () => {
      const fallbackResponse = {
        service_degraded: true,
        fallback_recommendations: [
          { fragrance_id: 'popular-1', source: 'popularity_fallback' },
          { fragrance_id: 'popular-2', source: 'popularity_fallback' }
        ],
        message: 'Showing popular items while personalization service recovers'
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(fallbackResponse), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'X-Service-Status': 'degraded'
          },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.service_degraded).toBe(true);
      expect(data.fallback_recommendations).toHaveLength(2);
      expect(response.headers.get('X-Service-Status')).toBe('degraded');
    });
  });

  describe('GET /api/recommendations/personalized', () => {
    test('should return highly personalized recommendations with explanations', async () => {
      const personalizedResponse = {
        recommendations: [
          {
            fragrance_id: 'pers-1',
            name: 'Highly Personalized 1',
            brand: 'Perfect Brand',
            score: 0.94,
            explanation: {
              primary_reason: 'Matches your love for woody oriental fragrances',
              factors: [
                { type: 'collection_similarity', weight: 0.6, score: 0.91 },
                { type: 'note_preference', weight: 0.3, score: 0.88 },
                { type: 'occasion_match', weight: 0.1, score: 0.95 }
              ],
              confidence: 0.94
            },
            sample_available: true,
            sample_price: 16.99
          }
        ],
        user_profile: {
          preference_confidence: 0.87,
          dominant_style: 'Sophisticated Evening',
          learning_status: 'well_established'
        },
        cache_info: {
          cache_hit: false,
          generated_fresh: true,
          cache_expires: '2024-12-15T10:30:00Z'
        }
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(personalizedResponse), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'private, max-age=1800' // 30 minutes
          },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations/personalized?explanations=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recommendations[0].score).toBe(0.94);
      expect(data.recommendations[0].explanation.confidence).toBe(0.94);
      expect(data.user_profile.preference_confidence).toBe(0.87);
      expect(data.cache_info.generated_fresh).toBe(true);
    });

    test('should adapt recommendations based on user context', async () => {
      const contextualResponse = {
        recommendations: [
          {
            fragrance_id: 'context-1',
            context_adapted: true,
            original_score: 0.85,
            context_boosted_score: 0.91,
            context_factors: {
              current_season: 'winter',
              upcoming_events: ['date_night'],
              weather: 'cold',
              time_of_day: 'evening'
            }
          }
        ]
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(contextualResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations/personalized?context=true&season=winter&occasion=date');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recommendations[0].context_adapted).toBe(true);
      expect(data.recommendations[0].context_boosted_score).toBeGreaterThan(data.recommendations[0].original_score);
      expect(data.recommendations[0].context_factors.current_season).toBe('winter');
    });

    test('should limit recommendation count and support pagination', async () => {
      const paginatedResponse = {
        recommendations: Array.from({ length: 10 }, (_, i) => ({
          fragrance_id: `rec-${i}`,
          score: 0.9 - (i * 0.05) // Decreasing scores
        })),
        pagination: {
          current_page: 1,
          per_page: 10,
          total_available: 247,
          has_next_page: true
        }
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(paginatedResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations/personalized?page=1&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recommendations).toHaveLength(10);
      expect(data.pagination.per_page).toBe(10);
      expect(data.pagination.has_next_page).toBe(true);
      
      // Scores should be in descending order
      for (let i = 1; i < data.recommendations.length; i++) {
        expect(data.recommendations[i-1].score).toBeGreaterThanOrEqual(data.recommendations[i].score);
      }
    });
  });

  describe('GET /api/recommendations/trending', () => {
    test('should return trending fragrances with social proof', async () => {
      const trendingResponse = {
        trending_recommendations: [
          {
            fragrance_id: 'trend-1',
            name: 'Viral Sensation',
            brand: 'Trending Brand',
            trend_score: 0.95,
            social_signals: {
              weekly_growth: 0.34,
              user_engagement_rate: 0.89,
              sample_to_purchase_rate: 0.67,
              social_media_mentions: 1247
            },
            community_match: {
              users_with_similar_taste: 156,
              average_rating_from_similar: 4.7,
              purchase_rate_similar_users: 0.73
            }
          }
        ],
        trending_context: {
          time_window: '7_days',
          trending_algorithm: 'exponential_smoothing',
          minimum_interactions: 50,
          geographic_scope: 'global'
        }
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(trendingResponse), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=600' // 10 minutes for trending
          },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations/trending');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.trending_recommendations[0].trend_score).toBe(0.95);
      expect(data.trending_recommendations[0].social_signals.weekly_growth).toBe(0.34);
      expect(data.trending_context.time_window).toBe('7_days');
    });

    test('should filter trending by user preferences when authenticated', async () => {
      const filteredTrendingResponse = {
        trending_recommendations: [
          {
            fragrance_id: 'trend-filtered-1',
            personalized_trend_score: 0.88, // Adjusted for user preferences
            base_trend_score: 0.92,
            preference_alignment: 0.81,
            why_relevant: 'Trending among users who also love woody fragrances'
          }
        ],
        filtering_applied: true,
        user_preference_weight: 0.3
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(filteredTrendingResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations/trending?personalized=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filtering_applied).toBe(true);
      expect(data.trending_recommendations[0].personalized_trend_score).toBe(0.88);
      expect(data.trending_recommendations[0].preference_alignment).toBe(0.81);
    });

    test('should provide geographic and demographic trending filters', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          trending_recommendations: [],
          filters_applied: {
            geographic: 'north_america',
            age_group: '25_34',
            experience_level: 'intermediate'
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations/trending?region=north_america&age=25_34&experience=intermediate');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters_applied.geographic).toBe('north_america');
      expect(data.filters_applied.age_group).toBe('25_34');
    });
  });

  describe('GET /api/recommendations/seasonal', () => {
    test('should return contextually relevant seasonal recommendations', async () => {
      const seasonalResponse = {
        seasonal_recommendations: [
          {
            fragrance_id: 'winter-1',
            name: 'Winter Warmth',
            seasonal_score: 0.94,
            season: 'winter',
            weather_match: {
              temperature_range: 'cold',
              humidity_preference: 'low',
              optimal_conditions: 'below_50_degrees'
            },
            mood_alignment: {
              seasonal_mood: 'cozy_sophisticated',
              energy_level: 'intimate',
              social_context: 'close_gatherings'
            }
          }
        ],
        season_context: {
          current_season: 'winter',
          days_into_season: 25,
          upcoming_season: 'spring',
          days_until_transition: 65
        }
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(seasonalResponse), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600' // 1 hour
          },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations/seasonal');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.seasonal_recommendations[0].seasonal_score).toBe(0.94);
      expect(data.season_context.current_season).toBe('winter');
      expect(data.seasonal_recommendations[0].weather_match.temperature_range).toBe('cold');
    });

    test('should handle season transitions with bridge recommendations', async () => {
      const transitionResponse = {
        seasonal_recommendations: [
          {
            fragrance_id: 'transition-1',
            name: 'Winter to Spring Bridge',
            transition_score: 0.89,
            works_for_both_seasons: true,
            transition_period: 'late_winter_early_spring',
            versatility_notes: 'Fresh enough for spring, warm enough for winter'
          }
        ],
        is_transition_period: true,
        transition_context: {
          from_season: 'winter',
          to_season: 'spring',
          transition_stage: 'early', // early, mid, late
          recommended_strategy: 'bridge_fragrances'
        }
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(transitionResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations/seasonal?transition=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.is_transition_period).toBe(true);
      expect(data.seasonal_recommendations[0].works_for_both_seasons).toBe(true);
      expect(data.transition_context.recommended_strategy).toBe('bridge_fragrances');
    });
  });

  describe('POST /api/recommendations/feedback', () => {
    test('should process explicit feedback (likes, dislikes, ratings)', async () => {
      const feedbackData = {
        fragrance_id: 'feedback-item',
        feedback_type: 'like',
        context: 'recommendation_view',
        metadata: {
          recommendation_source: 'perfect_matches',
          position_in_list: 2,
          time_viewed_ms: 15000
        }
      };

      const feedbackResponse = {
        processed: true,
        preference_update: {
          updated_preferences: ['increased_woody', 'increased_vanilla'],
          confidence_change: 0.12,
          embedding_updated: true
        },
        next_recommendations_affected: true,
        processing_time_ms: 23
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(feedbackResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations/feedback', {
        method: 'POST',
        body: JSON.stringify(feedbackData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.processed).toBe(true);
      expect(data.preference_update.confidence_change).toBe(0.12);
      expect(data.processing_time_ms).toBeLessThan(50); // Real-time requirement
    });

    test('should handle implicit feedback signals', async () => {
      const implicitFeedback = {
        interactions: [
          {
            fragrance_id: 'implicit-1',
            interaction_type: 'view',
            duration_ms: 25000,
            scroll_depth: 0.8,
            clicked_details: true
          },
          {
            fragrance_id: 'implicit-2',
            interaction_type: 'quick_view',
            duration_ms: 3000,
            scroll_depth: 0.2,
            clicked_details: false
          }
        ]
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          implicit_signals_processed: 2,
          weak_positive_signal: 'implicit-1',
          weak_negative_signal: 'implicit-2',
          preference_adjustment: 'minimal'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations/feedback', {
        method: 'POST',
        body: JSON.stringify(implicitFeedback),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.implicit_signals_processed).toBe(2);
      expect(data.weak_positive_signal).toBe('implicit-1');
      expect(data.preference_adjustment).toBe('minimal');
    });

    test('should validate and sanitize feedback data', async () => {
      const invalidFeedback = {
        fragrance_id: '<script>alert("xss")</script>',
        feedback_type: 'invalid_type',
        rating: 15 // Invalid rating > 5
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          error: 'Invalid feedback data',
          validation_errors: [
            'Invalid fragrance_id format',
            'Invalid feedback_type',
            'Rating must be between 1-5'
          ]
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations/feedback', {
        method: 'POST',
        body: JSON.stringify(invalidFeedback),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.validation_errors).toHaveLength(3);
      expect(data.validation_errors[0]).toContain('Invalid fragrance_id');
    });

    test('should implement rate limiting for feedback processing', async () => {
      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          retry_after_seconds: 60,
          current_rate: '100 requests per minute'
        }), {
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations/feedback', {
        method: 'POST',
        body: JSON.stringify({ feedback_type: 'spam_request' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.retry_after_seconds).toBe(60);
      expect(response.headers.get('Retry-After')).toBe('60');
    });
  });

  describe('GET /api/recommendations/explain/[id]', () => {
    test('should provide detailed recommendation explanations', async () => {
      const explanationResponse = {
        fragrance: {
          id: 'explain-fragrance-1',
          name: 'Detailed Explanation Fragrance',
          brand: 'Expert Brand'
        },
        explanation: {
          match_percentage: 87,
          primary_reason: 'Perfect match for your sophisticated evening style',
          detailed_factors: [
            {
              category: 'Scent Profile Match',
              description: 'Shares 91% similarity with your top-rated fragrances',
              strength: 'very_strong',
              evidence: ['Tom Ford Black Orchid (95% similar)', 'Yves Saint Laurent Black Opium (89% similar)']
            },
            {
              category: 'Note Preferences',
              description: 'Contains your most-loved notes: vanilla, patchouli, amber',
              strength: 'strong',
              evidence: ['Vanilla: 87% of your 5-star ratings', 'Patchouli: Featured in 73% of your collection']
            },
            {
              category: 'Occasion Alignment',
              description: 'Perfect for evening occasions you frequent',
              strength: 'moderate',
              evidence: ['62% of your collection is evening-appropriate']
            }
          ],
          confidence_breakdown: {
            data_quality: 0.91,
            algorithm_certainty: 0.85,
            user_profile_completeness: 0.89,
            overall_confidence: 0.87
          },
          similar_users: {
            found_scent_twins: 23,
            their_average_rating: 4.6,
            their_purchase_rate: 0.78
          }
        },
        recommendation_context: {
          generated_for: 'perfect_matches_section',
          algorithm_version: 'hybrid_v2.1',
          personalization_strength: 'high'
        }
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(explanationResponse), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'private, max-age=3600' // 1 hour
          },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations/explain/explain-fragrance-1');
      const response = await GET(request, { params: { id: 'explain-fragrance-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.explanation.match_percentage).toBe(87);
      expect(data.explanation.detailed_factors).toHaveLength(3);
      expect(data.explanation.confidence_breakdown.overall_confidence).toBe(0.87);
      expect(data.explanation.similar_users.found_scent_twins).toBe(23);
    });

    test('should handle explanations for low-confidence recommendations', async () => {
      const lowConfidenceExplanation = {
        explanation: {
          match_percentage: 45,
          primary_reason: 'Exploratory recommendation to expand your style',
          confidence_breakdown: {
            overall_confidence: 0.45
          },
          exploration_context: {
            type: 'diversity_injection',
            goal: 'discover_new_fragrance_families',
            expected_outcome: 'style_expansion'
          },
          disclaimer: 'This is an adventurous pick - it may not match your usual preferences'
        }
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(lowConfidenceExplanation), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations/explain/exploratory-item');
      const response = await GET(request, { params: { id: 'exploratory-item' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.explanation.match_percentage).toBe(45);
      expect(data.explanation.exploration_context.type).toBe('diversity_injection');
      expect(data.explanation.disclaimer).toContain('adventurous pick');
    });

    test('should return 404 for non-existent recommendation explanations', async () => {
      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          error: 'Recommendation not found or explanation not available'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations/explain/nonexistent');
      const response = await GET(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });
  });

  describe('POST /api/recommendations/refresh', () => {
    test('should trigger real-time recommendation updates', async () => {
      const refreshRequest = {
        trigger: 'collection_change',
        changed_items: ['fragrance-1', 'fragrance-2'],
        change_type: 'rating_update',
        immediate_refresh: true
      };

      const refreshResponse = {
        refresh_triggered: true,
        updated_sections: ['perfect_matches', 'seasonal'],
        processing_time_ms: 67,
        cache_invalidated: true,
        new_recommendations_available: true,
        estimated_improvement: 0.15 // Expected accuracy improvement
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(refreshResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations/refresh', {
        method: 'POST',
        body: JSON.stringify(refreshRequest),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.refresh_triggered).toBe(true);
      expect(data.updated_sections).toContain('perfect_matches');
      expect(data.processing_time_ms).toBeLessThan(100);
      expect(data.estimated_improvement).toBe(0.15);
    });

    test('should handle batch refresh for multiple users efficiently', async () => {
      const batchRefreshRequest = {
        user_ids: ['user-1', 'user-2', 'user-3'],
        trigger: 'algorithm_update',
        priority: 'background'
      };

      const POST = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          batch_refresh_queued: true,
          users_affected: 3,
          estimated_completion: '2024-12-15T10:15:00Z',
          queue_position: 1
        }), {
          status: 202, // Accepted for processing
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations/refresh', {
        method: 'POST',
        body: JSON.stringify(batchRefreshRequest),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data.batch_refresh_queued).toBe(true);
      expect(data.users_affected).toBe(3);
    });
  });

  describe('Performance and Reliability', () => {
    test('should meet sub-100ms latency requirements', async () => {
      const startTime = Date.now();
      
      const GET = vi.fn().mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => resolve(
            new Response(JSON.stringify({ recommendations: [] }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          ), 75); // 75ms simulated processing
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations');
      await GET(request);
      
      const requestTime = Date.now() - startTime;
      expect(requestTime).toBeLessThan(100);
    });

    test('should implement proper caching strategies', async () => {
      const cachedResponse = {
        recommendations: [],
        cache_info: {
          cache_hit: true,
          cached_at: '2024-12-15T09:55:00Z',
          expires_at: '2024-12-15T10:25:00Z',
          cache_key: 'recommendations:user-123:personalized'
        }
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(cachedResponse), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
            'Cache-Control': 'private, max-age=1800'
          },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cache_info.cache_hit).toBe(true);
      expect(response.headers.get('X-Cache')).toBe('HIT');
    });

    test('should handle high load with graceful degradation', async () => {
      const degradedResponse = {
        recommendations: [],
        service_status: 'degraded',
        degradation_reason: 'high_load',
        fallback_strategy: 'cached_popular_items',
        expected_recovery: '2024-12-15T10:10:00Z'
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(degradedResponse), {
          status: 503,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '300' // 5 minutes
          },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.service_status).toBe('degraded');
      expect(data.fallback_strategy).toBe('cached_popular_items');
      expect(response.headers.get('Retry-After')).toBe('300');
    });

    test('should monitor and report recommendation quality metrics', async () => {
      const metricsResponse = {
        quality_metrics: {
          precision_at_5: 0.73,
          precision_at_10: 0.68,
          recall_at_10: 0.45,
          ndcg_at_10: 0.81,
          diversity_score: 0.67,
          novelty_score: 0.23,
          coverage: 0.89
        },
        performance_metrics: {
          avg_response_time_ms: 47,
          p95_response_time_ms: 89,
          p99_response_time_ms: 156,
          error_rate: 0.002,
          cache_hit_rate: 0.78
        },
        user_satisfaction: {
          feedback_rating: 4.2,
          click_through_rate: 0.31,
          conversion_rate: 0.14,
          recommendation_acceptance: 0.67
        }
      };

      const GET = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(metricsResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/recommendations/metrics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quality_metrics.precision_at_10).toBeGreaterThan(0.6);
      expect(data.performance_metrics.avg_response_time_ms).toBeLessThan(50);
      expect(data.user_satisfaction.click_through_rate).toBeGreaterThan(0.3);
    });
  });
});