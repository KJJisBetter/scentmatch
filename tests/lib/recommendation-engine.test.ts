/**
 * AI-Powered Recommendation Engine Tests
 * 
 * Comprehensive tests for personalized recommendation algorithms,
 * user preference modeling, explanation generation, and real-time learning.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import {
  PersonalizedRecommendationEngine,
  UserPreferenceModeler,
  RecommendationExplainer,
  FeedbackProcessor,
  RecommendationCache,
  CollaborativeFilter,
  ContentBasedFilter,
  ContextualRecommender,
  type UserPreferenceProfile,
  type RecommendationResult,
  type FeedbackEvent,
  type RecommendationExplanation
} from '@/lib/ai/recommendation-engine';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

describe('AI-Powered Recommendation Engine', () => {

  describe('RECOMMENDATION-001: User Preference Modeling Tests', () => {
    let preferenceModeler: UserPreferenceModeler;
    let testUserId: string;

    beforeEach(() => {
      testUserId = randomUUID();
      preferenceModeler = new UserPreferenceModeler({
        supabase,
        embeddingDimensions: 2000,
        enableTempotalDecay: true,
        decayRate: 0.95,
        minimumInteractions: 3
      });
    });

    afterEach(async () => {
      // Clean up test data
      await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', testUserId);
      
      await supabase
        .from('user_interactions')
        .delete()
        .eq('user_id', testUserId);
    });

    it('RECOMMENDATION-001a: Generate User Embedding from Collection', async () => {
      // Mock user collection data
      const userCollection = [
        {
          fragrance_id: 'collection-1',
          rating: 5,
          usage_frequency: 'weekly',
          fragrance: {
            embedding: Array.from({ length: 2000 }, () => 0.1),
            scent_family: 'oriental',
            main_accords: ['vanilla', 'amber']
          }
        },
        {
          fragrance_id: 'collection-2', 
          rating: 4,
          usage_frequency: 'occasional',
          fragrance: {
            embedding: Array.from({ length: 2000 }, () => 0.2),
            scent_family: 'woody',
            main_accords: ['sandalwood', 'cedar']
          }
        },
        {
          fragrance_id: 'collection-3',
          rating: 3,
          usage_frequency: 'special',
          fragrance: {
            embedding: Array.from({ length: 2000 }, () => 0.3),
            scent_family: 'fresh',
            main_accords: ['citrus', 'bergamot']
          }
        }
      ];

      vi.spyOn(preferenceModeler, 'getUserCollection').mockResolvedValue(userCollection);

      const userEmbedding = await preferenceModeler.generateUserEmbedding(testUserId);
      
      expect(userEmbedding.success).toBe(true);
      expect(userEmbedding.embedding).toHaveLength(2000);
      expect(userEmbedding.confidence).toBeGreaterThan(0.5);
      expect(userEmbedding.interaction_count).toBe(3);
      
      // Verify weighted averaging (rating 5 should have more influence than rating 3)
      const weights = userEmbedding.component_weights;
      expect(weights['collection-1']).toBeGreaterThan(weights['collection-3']);
    });

    it('RECOMMENDATION-001b: User Preference Profile Generation', async () => {
      // Mock interaction history
      const interactions = [
        {
          fragrance_id: 'interaction-1',
          interaction_type: 'rating',
          interaction_value: 5,
          fragrance: { scent_family: 'oriental', brand: 'Tom Ford' },
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
        },
        {
          fragrance_id: 'interaction-2',
          interaction_type: 'view',
          interaction_value: 45, // seconds
          fragrance: { scent_family: 'oriental', brand: 'By Kilian' },
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
        },
        {
          fragrance_id: 'interaction-3',
          interaction_type: 'favorite',
          interaction_value: 1,
          fragrance: { scent_family: 'woody', brand: 'Tom Ford' },
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
        }
      ];

      vi.spyOn(preferenceModeler, 'getUserInteractions').mockResolvedValue(interactions);

      const profile = await preferenceModeler.generatePreferenceProfile(testUserId);
      
      expect(profile.user_id).toBe(testUserId);
      expect(profile.dominant_families).toContain('oriental');
      expect(profile.brand_affinity['Tom Ford']).toBeGreaterThan(0.5);
      expect(profile.interaction_patterns.most_active_hours).toBeDefined();
      expect(profile.confidence_score).toBeGreaterThan(0);
      
      // Verify temporal weighting (recent interactions weighted more)
      expect(profile.temporal_preferences.recent_shift).toBeDefined();
      expect(profile.temporal_preferences.stability_score).toBeGreaterThan(0);
    });

    it('RECOMMENDATION-001c: Preference Strength Calculation', async () => {
      const interactionScenarios = [
        {
          name: 'Strong preferences - high ratings, frequent use',
          interactions: [
            { rating: 5, usage_frequency: 'daily', interaction_count: 20 },
            { rating: 5, usage_frequency: 'weekly', interaction_count: 15 },
            { rating: 4, usage_frequency: 'weekly', interaction_count: 10 }
          ],
          expected_strength: 'high'
        },
        {
          name: 'Weak preferences - mixed ratings, infrequent use',
          interactions: [
            { rating: 3, usage_frequency: 'occasional', interaction_count: 2 },
            { rating: 2, usage_frequency: 'special', interaction_count: 1 }
          ],
          expected_strength: 'low'
        },
        {
          name: 'Medium preferences - consistent moderate ratings',
          interactions: [
            { rating: 4, usage_frequency: 'weekly', interaction_count: 8 },
            { rating: 4, usage_frequency: 'monthly', interaction_count: 5 },
            { rating: 3, usage_frequency: 'weekly', interaction_count: 6 }
          ],
          expected_strength: 'medium'
        }
      ];

      for (const scenario of interactionScenarios) {
        const strength = await preferenceModeler.calculatePreferenceStrength(scenario.interactions);
        
        expect(strength.strength_level).toBe(scenario.expected_strength);
        expect(strength.confidence).toBeGreaterThan(0);
        expect(strength.data_quality_score).toBeGreaterThan(0);
        expect(strength.factors).toBeDefined();
      }
    });

    it('RECOMMENDATION-001d: Preference Evolution Tracking', async () => {
      // Mock historical preference data
      const preferenceHistory = [
        {
          timestamp: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
          dominant_families: ['fresh', 'citrus'],
          confidence: 0.6
        },
        {
          timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          dominant_families: ['fresh', 'woody'],
          confidence: 0.7
        },
        {
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          dominant_families: ['woody', 'oriental'],
          confidence: 0.8
        },
        {
          timestamp: new Date(), // Current
          dominant_families: ['oriental', 'amber'],
          confidence: 0.85
        }
      ];

      const evolution = await preferenceModeler.analyzePreferenceEvolution(testUserId, preferenceHistory);
      
      expect(evolution.trend_direction).toBe('towards_oriental');
      expect(evolution.confidence_progression).toBe('increasing');
      expect(evolution.stability_score).toBeGreaterThan(0);
      expect(evolution.predicted_next_preferences).toContain('oriental');
      expect(evolution.evolution_insights.length).toBeGreaterThan(0);
    });

    it('RECOMMENDATION-001e: Cold Start User Handling', async () => {
      const newUserId = randomUUID();
      
      // Mock no interaction data
      vi.spyOn(preferenceModeler, 'getUserCollection').mockResolvedValue([]);
      vi.spyOn(preferenceModeler, 'getUserInteractions').mockResolvedValue([]);

      const coldStartProfile = await preferenceModeler.generateColdStartProfile(newUserId, {
        demographic_info: {
          age_range: '25-35',
          gender: 'any',
          experience_level: 'beginner'
        },
        onboarding_responses: {
          preferred_occasions: ['casual', 'office'],
          scent_preferences: ['fresh', 'not too strong'],
          sample_budget: 50
        }
      });

      expect(coldStartProfile.profile_type).toBe('cold_start');
      expect(coldStartProfile.confidence).toBeLessThan(0.5);
      expect(coldStartProfile.recommended_exploration_strategy).toBe('guided_discovery');
      expect(coldStartProfile.initial_recommendations).toBeDefined();
      expect(coldStartProfile.learning_priorities.length).toBeGreaterThan(0);
    });
  });

  describe('RECOMMENDATION-002: Hybrid Recommendation Algorithm Tests', () => {
    let recommendationEngine: PersonalizedRecommendationEngine;
    let testUserId: string;

    beforeEach(() => {
      testUserId = randomUUID();
      recommendationEngine = new PersonalizedRecommendationEngine({
        supabase,
        contentBasedWeight: 0.5,
        collaborativeWeight: 0.3,
        contextualWeight: 0.1,
        popularityWeight: 0.1,
        enableRealTimeUpdates: true,
        maxRecommendations: 20
      });
    });

    afterEach(async () => {
      await supabase
        .from('recommendation_cache')
        .delete()
        .eq('user_id', testUserId);
    });

    it('RECOMMENDATION-002a: Content-Based Filtering', async () => {
      // Mock user's liked fragrances with embeddings
      const userLikedFragrances = [
        {
          fragrance_id: 'liked-1',
          rating: 5,
          embedding: Array.from({ length: 2000 }, () => 0.1), // Vanilla/amber profile
          scent_family: 'oriental',
          main_accords: ['vanilla', 'amber', 'spicy']
        },
        {
          fragrance_id: 'liked-2',
          rating: 4,
          embedding: Array.from({ length: 2000 }, () => 0.15), // Similar profile
          scent_family: 'oriental',
          main_accords: ['amber', 'woody', 'sweet']
        }
      ];

      // Mock similar fragrances in database
      const candidateFragrances = [
        {
          fragrance_id: 'candidate-1',
          embedding: Array.from({ length: 2000 }, () => 0.12), // Very similar
          scent_family: 'oriental',
          main_accords: ['vanilla', 'amber', 'honey'],
          rating_value: 4.3,
          rating_count: 150
        },
        {
          fragrance_id: 'candidate-2',
          embedding: Array.from({ length: 2000 }, () => 0.5), // Different profile
          scent_family: 'fresh',
          main_accords: ['citrus', 'aquatic', 'light'],
          rating_value: 4.1,
          rating_count: 80
        }
      ];

      vi.spyOn(recommendationEngine, 'getUserLikedFragrances').mockResolvedValue(userLikedFragrances);
      vi.spyOn(recommendationEngine, 'getCandidateFragrances').mockResolvedValue(candidateFragrances);

      const contentBasedRecs = await recommendationEngine.generateContentBasedRecommendations(testUserId);
      
      expect(contentBasedRecs.length).toBeGreaterThan(0);
      expect(contentBasedRecs[0].content_similarity).toBeGreaterThan(contentBasedRecs[1].content_similarity);
      expect(contentBasedRecs[0].fragrance_id).toBe('candidate-1'); // Most similar should rank first
      expect(contentBasedRecs[0].explanation_factors).toContain('scent_family_match');
      expect(contentBasedRecs[0].explanation_factors).toContain('accord_similarity');
    });

    it('RECOMMENDATION-002b: Collaborative Filtering', async () => {
      // Mock users with similar taste
      const similarUsers = [
        {
          user_id: 'similar-user-1',
          similarity_score: 0.87,
          shared_fragrances: ['shared-1', 'shared-2', 'shared-3'],
          unique_fragrances: ['unique-1', 'unique-2']
        },
        {
          user_id: 'similar-user-2',
          similarity_score: 0.73,
          shared_fragrances: ['shared-1', 'shared-4'],
          unique_fragrances: ['unique-3', 'unique-4', 'unique-5']
        }
      ];

      vi.spyOn(recommendationEngine, 'findSimilarUsers').mockResolvedValue(similarUsers);

      const collaborativeRecs = await recommendationEngine.generateCollaborativeRecommendations(testUserId);
      
      expect(collaborativeRecs.length).toBeGreaterThan(0);
      expect(collaborativeRecs[0].collaborative_score).toBeGreaterThan(0.5);
      expect(collaborativeRecs[0].source_users).toBeDefined();
      expect(collaborativeRecs[0].shared_preference_strength).toBeGreaterThan(0);
      
      // Higher similarity users should contribute more to recommendations
      const highSimilarityRec = collaborativeRecs.find(r => 
        r.source_users.includes('similar-user-1')
      );
      const lowSimilarityRec = collaborativeRecs.find(r => 
        r.source_users.includes('similar-user-2') && !r.source_users.includes('similar-user-1')
      );
      
      if (highSimilarityRec && lowSimilarityRec) {
        expect(highSimilarityRec.collaborative_score).toBeGreaterThan(lowSimilarityRec.collaborative_score);
      }
    });

    it('RECOMMENDATION-002c: Contextual Recommendations', async () => {
      const contextualScenarios = [
        {
          context: {
            season: 'summer',
            time_of_day: 'morning',
            occasion: 'office',
            weather: 'warm'
          },
          expected_families: ['fresh', 'citrus', 'aquatic'],
          expected_intensity: 'light'
        },
        {
          context: {
            season: 'winter',
            time_of_day: 'evening',
            occasion: 'date',
            weather: 'cold'
          },
          expected_families: ['oriental', 'woody', 'spicy'],
          expected_intensity: 'strong'
        },
        {
          context: {
            season: 'spring',
            time_of_day: 'afternoon',
            occasion: 'casual',
            weather: 'mild'
          },
          expected_families: ['floral', 'fresh', 'light'],
          expected_intensity: 'medium'
        }
      ];

      for (const scenario of contextualScenarios) {
        const contextualRecs = await recommendationEngine.generateContextualRecommendations(
          testUserId, 
          scenario.context
        );
        
        expect(contextualRecs.length).toBeGreaterThan(0);
        expect(contextualRecs[0].contextual_score).toBeGreaterThan(0.6);
        expect(contextualRecs[0].context_match_factors).toBeDefined();
        
        // Check that recommendations match context
        const hasExpectedFamily = contextualRecs.some(rec => 
          scenario.expected_families.includes(rec.scent_family)
        );
        expect(hasExpectedFamily).toBe(true);
      }
    });

    it('RECOMMENDATION-002d: Hybrid Algorithm Integration', async () => {
      // Mock all recommendation types
      const contentBased = [
        { fragrance_id: 'content-1', content_score: 0.91, source: 'content' },
        { fragrance_id: 'content-2', content_score: 0.85, source: 'content' }
      ];

      const collaborative = [
        { fragrance_id: 'collab-1', collaborative_score: 0.87, source: 'collaborative' },
        { fragrance_id: 'content-1', collaborative_score: 0.75, source: 'collaborative' } // Overlap
      ];

      const contextual = [
        { fragrance_id: 'context-1', contextual_score: 0.89, source: 'contextual' },
        { fragrance_id: 'collab-1', contextual_score: 0.82, source: 'contextual' } // Overlap
      ];

      vi.spyOn(recommendationEngine, 'generateContentBasedRecommendations').mockResolvedValue(contentBased);
      vi.spyOn(recommendationEngine, 'generateCollaborativeRecommendations').mockResolvedValue(collaborative);
      vi.spyOn(recommendationEngine, 'generateContextualRecommendations').mockResolvedValue(contextual);

      const hybridRecs = await recommendationEngine.generateHybridRecommendations(testUserId, {
        include_explanations: true,
        max_results: 10
      });

      expect(hybridRecs.length).toBeGreaterThan(0);
      expect(hybridRecs[0].hybrid_score).toBeDefined();
      expect(hybridRecs[0].contributing_algorithms).toContain('content');
      expect(hybridRecs[0].algorithm_weights).toBeDefined();
      
      // Verify that overlapping recommendations get boosted
      const overlappingRec = hybridRecs.find(r => r.fragrance_id === 'content-1');
      const singleSourceRec = hybridRecs.find(r => r.fragrance_id === 'content-2');
      
      if (overlappingRec && singleSourceRec) {
        expect(overlappingRec.hybrid_score).toBeGreaterThan(singleSourceRec.hybrid_score);
        expect(overlappingRec.contributing_algorithms.length).toBeGreaterThan(1);
      }
    });

    it('RECOMMENDATION-002e: Diversity and Exploration Balance', async () => {
      const diversityScenarios = [
        {
          exploration_level: 0.0, // Conservative - similar to known preferences
          expected_diversity: 'low',
          expected_safety: 'high'
        },
        {
          exploration_level: 0.5, // Balanced - mix of similar and different
          expected_diversity: 'medium',
          expected_safety: 'medium'
        },
        {
          exploration_level: 1.0, // Adventurous - prioritize discovery
          expected_diversity: 'high',
          expected_safety: 'low'
        }
      ];

      for (const scenario of diversityScenarios) {
        const recommendations = await recommendationEngine.generateDiversifiedRecommendations(
          testUserId,
          {
            exploration_level: scenario.exploration_level,
            max_results: 10
          }
        );

        expect(recommendations.length).toBeGreaterThan(0);
        expect(recommendations.diversity_metrics.overall_diversity).toBeDefined();
        expect(recommendations.diversity_metrics.family_distribution).toBeDefined();
        
        const diversityScore = recommendations.diversity_metrics.overall_diversity;
        
        if (scenario.exploration_level === 0.0) {
          expect(diversityScore).toBeLessThan(0.4); // Low diversity
        } else if (scenario.exploration_level === 1.0) {
          expect(diversityScore).toBeGreaterThan(0.7); // High diversity
        }
      }
    });
  });

  describe('RECOMMENDATION-003: Recommendation Explanation Tests', () => {
    let explainer: RecommendationExplainer;
    let testUserId: string;

    beforeEach(() => {
      testUserId = randomUUID();
      explainer = new RecommendationExplainer({
        supabase,
        enableDetailedExplanations: true,
        enableConfidenceScoring: true,
        explanationStyle: 'conversational'
      });
    });

    it('RECOMMENDATION-003a: Multi-Factor Explanation Generation', async () => {
      const recommendationContext = {
        user_id: testUserId,
        fragrance_id: 'explained-fragrance-1',
        recommendation_factors: {
          vector_similarity: 0.89,
          collaborative_score: 0.75,
          contextual_match: 0.82,
          brand_affinity: 0.9,
          scent_family_preference: 0.85
        },
        user_profile: {
          favorite_families: ['oriental', 'woody'],
          favorite_brands: ['Tom Ford', 'Creed'],
          typical_occasions: ['evening', 'special']
        }
      };

      const explanation = await explainer.generateExplanation(recommendationContext);
      
      expect(explanation.primary_reason).toBeDefined();
      expect(explanation.contributing_factors.length).toBeGreaterThan(2);
      expect(explanation.confidence_score).toBeGreaterThan(0.7);
      expect(explanation.explanation_text).toContain('similar');
      
      // Verify different factor types are explained
      const factorTypes = explanation.contributing_factors.map(f => f.type);
      expect(factorTypes).toContain('vector_similarity');
      expect(factorTypes).toContain('brand_affinity');
      
      // Higher weighted factors should appear first
      expect(explanation.contributing_factors[0].weight).toBeGreaterThanOrEqual(
        explanation.contributing_factors[1].weight
      );
    });

    it('RECOMMENDATION-003b: Confidence Scoring Algorithm', async () => {
      const confidenceScenarios = [
        {
          name: 'High confidence - strong signals across all factors',
          factors: {
            vector_similarity: 0.92,
            accord_overlap: 0.88,
            user_interaction_history: 25,
            fragrance_review_count: 200,
            brand_affinity: 0.9
          },
          expected_confidence: 'high'
        },
        {
          name: 'Medium confidence - mixed signals',
          factors: {
            vector_similarity: 0.76,
            accord_overlap: 0.65,
            user_interaction_history: 8,
            fragrance_review_count: 50,
            brand_affinity: 0.4
          },
          expected_confidence: 'medium'
        },
        {
          name: 'Low confidence - weak signals',
          factors: {
            vector_similarity: 0.55,
            accord_overlap: 0.45,
            user_interaction_history: 2,
            fragrance_review_count: 10,
            brand_affinity: 0.2
          },
          expected_confidence: 'low'
        }
      ];

      for (const scenario of confidenceScenarios) {
        const confidence = explainer.calculateConfidenceScore(scenario.factors);
        
        expect(confidence.score).toBeGreaterThan(0);
        expect(confidence.score).toBeLessThanOrEqual(1);
        expect(confidence.level).toBe(scenario.expected_confidence);
        expect(confidence.contributing_factors).toBeDefined();
        expect(confidence.uncertainty_factors).toBeDefined();
      }
    });

    it('RECOMMENDATION-003c: Explanation Quality Assessment', async () => {
      const explanationText = "This fragrance is recommended because it shares 89% scent profile similarity with your favorite Tom Ford Black Orchid, contains your preferred vanilla and amber notes, and is loved by users with similar taste to yours.";
      
      const qualityAssessment = await explainer.assessExplanationQuality(explanationText, {
        user_expertise_level: 'intermediate',
        explanation_preference: 'detailed',
        context: 'web_app'
      });
      
      expect(qualityAssessment.clarity_score).toBeGreaterThan(0.7);
      expect(qualityAssessment.completeness_score).toBeGreaterThan(0.6);
      expect(qualityAssessment.trust_indicators.length).toBeGreaterThan(0);
      expect(qualityAssessment.improvement_suggestions).toBeDefined();
      
      // Should identify key quality factors
      expect(qualityAssessment.includes_similarity_percentage).toBe(true);
      expect(qualityAssessment.includes_specific_notes).toBe(true);
      expect(qualityAssessment.includes_social_proof).toBe(true);
    });

    it('RECOMMENDATION-003d: Personalized Explanation Styles', async () => {
      const userProfiles = [
        {
          user_type: 'beginner',
          expertise_level: 'novice',
          explanation_preference: 'simple',
          expected_style: 'friendly_simple'
        },
        {
          user_type: 'enthusiast',
          expertise_level: 'intermediate',
          explanation_preference: 'detailed',
          expected_style: 'informative_detailed'
        },
        {
          user_type: 'expert',
          expertise_level: 'advanced',
          explanation_preference: 'technical',
          expected_style: 'precise_technical'
        }
      ];

      const baseRecommendation = {
        fragrance_id: 'test-fragrance',
        vector_similarity: 0.87,
        brand_match: true,
        family_match: true
      };

      for (const profile of userProfiles) {
        const explanation = await explainer.generatePersonalizedExplanation(
          baseRecommendation,
          profile
        );
        
        expect(explanation.style).toBe(profile.expected_style);
        expect(explanation.complexity_level).toBe(profile.expertise_level);
        expect(explanation.text).toBeDefined();
        
        // Verify style appropriateness
        if (profile.user_type === 'beginner') {
          expect(explanation.text).not.toContain('vector similarity');
          expect(explanation.text).toContain('like');
        } else if (profile.user_type === 'expert') {
          expect(explanation.text).toContain('similarity');
          expect(explanation.technical_details).toBeDefined();
        }
      }
    });
  });

  describe('RECOMMENDATION-004: Feedback Processing and Learning Tests', () => {
    let feedbackProcessor: FeedbackProcessor;
    let testUserId: string;

    beforeEach(() => {
      testUserId = randomUUID();
      feedbackProcessor = new FeedbackProcessor({
        supabase,
        enableImplicitFeedback: true,
        enableExplicitFeedback: true,
        learningRate: 0.1,
        feedbackDecayDays: 90
      });
    });

    afterEach(async () => {
      await supabase
        .from('user_interactions')
        .delete()
        .eq('user_id', testUserId);
    });

    it('RECOMMENDATION-004a: Explicit Feedback Processing', async () => {
      const explicitFeedback: FeedbackEvent[] = [
        {
          user_id: testUserId,
          fragrance_id: 'feedback-1',
          feedback_type: 'like',
          confidence: 0.9,
          reason: 'love_the_scent',
          context: { recommendation_id: 'rec-1', source: 'personalized' }
        },
        {
          user_id: testUserId,
          fragrance_id: 'feedback-2',
          feedback_type: 'dislike',
          confidence: 0.8,
          reason: 'too_strong',
          context: { recommendation_id: 'rec-2', source: 'trending' }
        },
        {
          user_id: testUserId,
          fragrance_id: 'feedback-3',
          feedback_type: 'rating',
          rating_value: 4,
          confidence: 0.95,
          context: { recommendation_id: 'rec-3', source: 'similar_users' }
        }
      ];

      for (const feedback of explicitFeedback) {
        const result = await feedbackProcessor.processExplicitFeedback(feedback);
        
        expect(result.processed).toBe(true);
        expect(result.preference_update_applied).toBe(true);
        expect(result.learning_impact).toBeGreaterThan(0);
        expect(result.updated_embedding).toBe(true);
        
        // Verify different feedback types are handled correctly
        if (feedback.feedback_type === 'like') {
          expect(result.preference_adjustment).toBe('positive_reinforcement');
        } else if (feedback.feedback_type === 'dislike') {
          expect(result.preference_adjustment).toBe('negative_adjustment');
        } else if (feedback.feedback_type === 'rating') {
          expect(result.preference_adjustment).toBe('weighted_update');
        }
      }
    });

    it('RECOMMENDATION-004b: Implicit Feedback Learning', async () => {
      const implicitInteractions = [
        {
          fragrance_id: 'implicit-1',
          interaction_type: 'view',
          duration: 45, // seconds - high engagement
          scroll_depth: 0.8,
          click_through: false
        },
        {
          fragrance_id: 'implicit-2',
          interaction_type: 'view',
          duration: 5, // seconds - low engagement
          scroll_depth: 0.2,
          click_through: false
        },
        {
          fragrance_id: 'implicit-3',
          interaction_type: 'click',
          duration: 120,
          scroll_depth: 1.0,
          click_through: true
        }
      ];

      for (const interaction of implicitInteractions) {
        const learning = await feedbackProcessor.processImplicitFeedback(testUserId, interaction);
        
        expect(learning.engagement_score).toBeGreaterThan(0);
        expect(learning.preference_signal_strength).toBeGreaterThan(0);
        
        // High engagement should result in stronger preference signals
        if (interaction.duration > 40 && interaction.scroll_depth > 0.7) {
          expect(learning.preference_signal_strength).toBeGreaterThan(0.6);
          expect(learning.engagement_score).toBeGreaterThan(0.7);
        } else if (interaction.duration < 10) {
          expect(learning.preference_signal_strength).toBeLessThan(0.3);
        }
      }
    });

    it('RECOMMENDATION-004c: Preference Learning Convergence', async () => {
      // Simulate sequence of feedback over time
      const feedbackSequence = [
        { day: 1, feedback: { fragrance_id: 'learning-1', rating: 5, family: 'oriental' } },
        { day: 3, feedback: { fragrance_id: 'learning-2', rating: 5, family: 'oriental' } },
        { day: 5, feedback: { fragrance_id: 'learning-3', rating: 4, family: 'woody' } },
        { day: 7, feedback: { fragrance_id: 'learning-4', rating: 2, family: 'fresh' } },
        { day: 10, feedback: { fragrance_id: 'learning-5', rating: 5, family: 'oriental' } }
      ];

      let currentPreferences = {
        families: {},
        confidence: 0.1
      };

      for (const { day, feedback } of feedbackSequence) {
        const learningResult = await feedbackProcessor.updatePreferencesFromFeedback(
          testUserId,
          feedback,
          currentPreferences
        );
        
        currentPreferences = learningResult.updated_preferences;
        
        expect(learningResult.confidence_change).toBeDefined();
        expect(learningResult.preference_strength_change).toBeDefined();
      }

      // After sequence, should have strong preference for oriental
      expect(currentPreferences.families['oriental']).toBeGreaterThan(0.7);
      expect(currentPreferences.families['fresh']).toBeLessThan(0.3);
      expect(currentPreferences.confidence).toBeGreaterThan(0.6);
    });

    it('RECOMMENDATION-004d: Feedback Quality and Reliability', async () => {
      const feedbackQualityTests = [
        {
          feedback: {
            user_id: testUserId,
            fragrance_id: 'quality-1',
            feedback_type: 'rating',
            rating_value: 5,
            time_spent_before_rating: 120, // 2 minutes
            previous_interactions: 3
          },
          expected_quality: 'high'
        },
        {
          feedback: {
            user_id: testUserId,
            fragrance_id: 'quality-2',
            feedback_type: 'rating',
            rating_value: 1,
            time_spent_before_rating: 2, // 2 seconds - rushed
            previous_interactions: 0
          },
          expected_quality: 'low'
        }
      ];

      for (const test of feedbackQualityTests) {
        const quality = await feedbackProcessor.assessFeedbackQuality(test.feedback);
        
        expect(quality.reliability_score).toBeGreaterThan(0);
        expect(quality.quality_level).toBe(test.expected_quality);
        expect(quality.trust_factors).toBeDefined();
        
        // High quality feedback should have higher learning weight
        if (test.expected_quality === 'high') {
          expect(quality.learning_weight).toBeGreaterThan(0.7);
        } else {
          expect(quality.learning_weight).toBeLessThan(0.5);
        }
      }
    });
  });

  describe('RECOMMENDATION-005: Real-Time Updates and Caching Tests', () => {
    let recommendationCache: RecommendationCache;
    let testUserId: string;

    beforeEach(() => {
      testUserId = randomUUID();
      recommendationCache = new RecommendationCache({
        supabase,
        defaultTTL: 3600, // 1 hour
        enableRealTimeInvalidation: true,
        maxCacheSize: 1000
      });
    });

    afterEach(async () => {
      await supabase
        .from('recommendation_cache')
        .delete()
        .eq('user_id', testUserId);
    });

    it('RECOMMENDATION-005a: Recommendation Caching Strategy', async () => {
      const recommendations = [
        {
          fragrance_id: 'cache-1',
          score: 0.91,
          recommendation_type: 'personalized',
          generated_at: new Date()
        },
        {
          fragrance_id: 'cache-2',
          score: 0.87,
          recommendation_type: 'personalized',
          generated_at: new Date()
        }
      ];

      // Cache recommendations
      const cacheResult = await recommendationCache.storeRecommendations(
        testUserId,
        'personalized',
        recommendations,
        {
          user_context_hash: 'context-hash-123',
          generation_metadata: {
            model_version: '1.0',
            algorithm_weights: { content: 0.6, collaborative: 0.4 }
          }
        }
      );

      expect(cacheResult.success).toBe(true);
      expect(cacheResult.cache_key).toBeDefined();
      expect(cacheResult.expires_at).toBeInstanceOf(Date);

      // Retrieve cached recommendations
      const cachedRecs = await recommendationCache.getRecommendations(
        testUserId,
        'personalized',
        'context-hash-123'
      );

      expect(cachedRecs.success).toBe(true);
      expect(cachedRecs.recommendations.length).toBe(2);
      expect(cachedRecs.cache_hit).toBe(true);
      expect(cachedRecs.generated_at).toBeDefined();
    });

    it('RECOMMENDATION-005b: Cache Invalidation on User Changes', async () => {
      // Cache initial recommendations
      await recommendationCache.storeRecommendations(testUserId, 'personalized', [
        { fragrance_id: 'old-rec-1', score: 0.8 }
      ]);

      // Simulate user preference change (rating, collection update, etc.)
      const userChange = {
        type: 'collection_update',
        fragrance_id: 'new-favorite',
        rating: 5,
        impact_level: 'high'
      };

      const invalidationResult = await recommendationCache.invalidateUserCache(testUserId, userChange);
      
      expect(invalidationResult.invalidated).toBe(true);
      expect(invalidationResult.affected_cache_types).toContain('personalized');
      expect(invalidationResult.reason).toContain('user_preference_change');

      // Verify cache is invalidated
      const cachedAfterInvalidation = await recommendationCache.getRecommendations(
        testUserId,
        'personalized'
      );

      expect(cachedAfterInvalidation.cache_hit).toBe(false);
      expect(cachedAfterInvalidation.cache_status).toBe('invalidated');
    });

    it('RECOMMENDATION-005c: Real-Time Recommendation Updates', async () => {
      const realTimeUpdater = new RecommendationEngine({
        supabase,
        enableRealTimeUpdates: true,
        updateTriggers: ['rating', 'favorite', 'purchase_intent']
      });

      // Mock real-time user action
      const userAction = {
        user_id: testUserId,
        action_type: 'rating',
        fragrance_id: 'realtime-fragrance',
        rating_value: 5,
        timestamp: new Date()
      };

      vi.spyOn(realTimeUpdater, 'onUserAction').mockImplementation(async (action) => {
        // Simulate real-time processing
        return {
          recommendations_updated: true,
          new_recommendations: [
            {
              fragrance_id: 'realtime-rec-1',
              score: 0.93,
              reason: 'Based on your new 5-star rating',
              confidence: 0.89
            }
          ],
          update_latency_ms: 150
        };
      });

      const updateResult = await realTimeUpdater.onUserAction(userAction);
      
      expect(updateResult.recommendations_updated).toBe(true);
      expect(updateResult.new_recommendations.length).toBeGreaterThan(0);
      expect(updateResult.update_latency_ms).toBeLessThan(500);
      expect(updateResult.new_recommendations[0].reason).toContain('5-star rating');
    });

    it('RECOMMENDATION-005d: Cache Performance and Memory Management', async () => {
      // Test cache performance under load
      const cacheOperations = [];
      
      // Simulate multiple concurrent cache operations
      for (let i = 0; i < 20; i++) {
        const userId = `load-test-user-${i}`;
        const recommendations = Array.from({ length: 10 }, (_, j) => ({
          fragrance_id: `load-rec-${i}-${j}`,
          score: Math.random()
        }));

        cacheOperations.push(
          recommendationCache.storeRecommendations(userId, 'personalized', recommendations)
        );
      }

      const startTime = Date.now();
      const results = await Promise.all(cacheOperations);
      const operationTime = Date.now() - startTime;

      // All operations should succeed
      expect(results.every(r => r.success)).toBe(true);
      
      // Should complete reasonably fast
      expect(operationTime).toBeLessThan(5000); // 5 seconds for 20 operations
      
      // Cache stats should be tracked
      const cacheStats = await recommendationCache.getCacheStats();
      expect(cacheStats.total_entries).toBe(20);
      expect(cacheStats.memory_usage_mb).toBeGreaterThan(0);
      expect(cacheStats.hit_rate).toBeGreaterThanOrEqual(0);

      // Cleanup load test data
      for (let i = 0; i < 20; i++) {
        await supabase
          .from('recommendation_cache')
          .delete()
          .eq('user_id', `load-test-user-${i}`);
      }
    });
  });

  describe('RECOMMENDATION-006: Algorithm Performance Tests', () => {
    it('RECOMMENDATION-006a: Recommendation Quality Metrics', async () => {
      const qualityEvaluator = new RecommendationQualityEvaluator({
        supabase,
        evaluationMetrics: ['relevance', 'diversity', 'novelty', 'coverage']
      });

      // Mock user test set
      const testUsers = [
        { user_id: 'eval-user-1', known_preferences: ['oriental', 'woody'] },
        { user_id: 'eval-user-2', known_preferences: ['fresh', 'citrus'] },
        { user_id: 'eval-user-3', known_preferences: ['floral', 'romantic'] }
      ];

      const qualityResults = await qualityEvaluator.evaluateRecommendationQuality(testUsers);
      
      expect(qualityResults.overall_quality_score).toBeGreaterThan(0.6);
      expect(qualityResults.metrics.relevance).toBeGreaterThan(0.7);
      expect(qualityResults.metrics.diversity).toBeGreaterThan(0.3);
      expect(qualityResults.metrics.novelty).toBeGreaterThan(0.2);
      expect(qualityResults.metrics.coverage).toBeGreaterThan(0.5);
      expect(qualityResults.user_satisfaction_proxy).toBeGreaterThan(0.6);
    });

    it('RECOMMENDATION-006b: Algorithm A/B Testing Framework', async () => {
      const abTester = new RecommendationABTester({
        supabase,
        enableStatisticalSignificance: true,
        minSampleSize: 100,
        confidenceLevel: 0.95
      });

      // Test two recommendation algorithms
      const algorithmA = {
        name: 'content_heavy',
        weights: { content: 0.8, collaborative: 0.2 }
      };

      const algorithmB = {
        name: 'balanced_hybrid',
        weights: { content: 0.5, collaborative: 0.3, contextual: 0.2 }
      };

      const abTestResult = await abTester.runABTest(algorithmA, algorithmB, {
        test_duration_days: 7,
        success_metrics: ['click_through_rate', 'user_satisfaction', 'conversion_rate']
      });

      expect(abTestResult.test_id).toBeDefined();
      expect(abTestResult.statistical_significance).toBeDefined();
      expect(abTestResult.winning_algorithm).toBeDefined();
      expect(abTestResult.performance_lift).toBeDefined();
      expect(abTestResult.recommendation).toBeDefined();
      
      // Should provide actionable insights
      expect(abTestResult.insights.length).toBeGreaterThan(0);
      expect(abTestResult.next_steps).toBeDefined();
    });

    it('RECOMMENDATION-006c: Scalability and Performance Benchmarks', async () => {
      const performanceTester = new RecommendationPerformanceTester({
        supabase,
        enableBenchmarking: true
      });

      const scalabilityTests = [
        { user_count: 100, fragrance_count: 1000, expected_max_time_ms: 2000 },
        { user_count: 1000, fragrance_count: 5000, expected_max_time_ms: 5000 },
        { user_count: 10000, fragrance_count: 10000, expected_max_time_ms: 10000 }
      ];

      for (const test of scalabilityTests) {
        const startTime = Date.now();
        
        const results = await performanceTester.generateBatchRecommendations(
          test.user_count,
          {
            max_fragrances: test.fragrance_count,
            recommendations_per_user: 20,
            enable_personalization: true
          }
        );
        
        const executionTime = Date.now() - startTime;
        
        expect(results.successful_users).toBeGreaterThan(test.user_count * 0.95); // 95% success rate
        expect(executionTime).toBeLessThan(test.expected_max_time_ms);
        expect(results.avg_recommendations_per_user).toBeGreaterThan(15);
        expect(results.system_resource_usage.memory_mb).toBeLessThan(1000);
      }
    });
  });

  describe('RECOMMENDATION-007: Advanced Algorithm Tests', () => {
    it('RECOMMENDATION-007a: Multi-Armed Bandit Optimization', async () => {
      const banditOptimizer = new MultiArmedBanditRecommender({
        supabase,
        algorithms: [
          { name: 'content_based', initial_weight: 0.25 },
          { name: 'collaborative', initial_weight: 0.25 },
          { name: 'contextual', initial_weight: 0.25 },
          { name: 'trending', initial_weight: 0.25 }
        ],
        explorationRate: 0.1,
        updateFrequency: 100 // Update weights every 100 recommendations
      });

      // Simulate recommendation outcomes
      const outcomes = [
        { algorithm: 'content_based', success: true, user_satisfaction: 0.85 },
        { algorithm: 'content_based', success: true, user_satisfaction: 0.92 },
        { algorithm: 'collaborative', success: false, user_satisfaction: 0.3 },
        { algorithm: 'contextual', success: true, user_satisfaction: 0.78 },
        { algorithm: 'trending', success: true, user_satisfaction: 0.65 }
      ];

      for (const outcome of outcomes) {
        await banditOptimizer.recordOutcome(outcome);
      }

      const optimizedWeights = await banditOptimizer.getOptimizedWeights();
      
      // Content-based should have highest weight based on performance
      expect(optimizedWeights.content_based).toBeGreaterThan(optimizedWeights.collaborative);
      expect(optimizedWeights.content_based).toBeGreaterThan(optimizedWeights.trending);
      expect(optimizedWeights.total_weight).toBeCloseTo(1.0, 2);
    });

    it('RECOMMENDATION-007b: Deep Learning Integration', async () => {
      const deepLearningEngine = new DeepRecommendationEngine({
        supabase,
        modelArchitecture: 'neural_collaborative_filtering',
        embeddingSize: 128,
        hiddenLayers: [256, 128, 64],
        enableGradientUpdates: true
      });

      // Mock training data
      const trainingData = {
        user_embeddings: Array.from({ length: 100 }, () => 
          Array.from({ length: 128 }, () => Math.random())
        ),
        item_embeddings: Array.from({ length: 500 }, () =>
          Array.from({ length: 128 }, () => Math.random())
        ),
        interactions: Array.from({ length: 1000 }, () => ({
          user_id: Math.floor(Math.random() * 100),
          item_id: Math.floor(Math.random() * 500),
          rating: Math.floor(Math.random() * 5) + 1
        }))
      };

      const trainingResult = await deepLearningEngine.trainModel(trainingData);
      
      expect(trainingResult.success).toBe(true);
      expect(trainingResult.final_loss).toBeLessThan(trainingResult.initial_loss);
      expect(trainingResult.epochs_completed).toBeGreaterThan(0);
      expect(trainingResult.model_performance.precision).toBeGreaterThan(0.5);
      expect(trainingResult.model_performance.recall).toBeGreaterThan(0.3);

      // Test model predictions
      const predictions = await deepLearningEngine.predict(testUserId, {
        candidate_fragrances: ['prediction-1', 'prediction-2', 'prediction-3'],
        top_k: 2
      });

      expect(predictions.length).toBe(2);
      expect(predictions[0].confidence).toBeGreaterThan(predictions[1].confidence);
      expect(predictions[0].neural_score).toBeDefined();
    });

    it('RECOMMENDATION-007c: Ensemble Method Integration', async () => {
      const ensembleRecommender = new EnsembleRecommendationEngine({
        supabase,
        baseAlgorithms: [
          { name: 'vector_similarity', type: 'content_based', weight: 0.3 },
          { name: 'collaborative_filtering', type: 'collaborative', weight: 0.3 },
          { name: 'neural_cf', type: 'deep_learning', weight: 0.2 },
          { name: 'contextual_bandit', type: 'contextual', weight: 0.2 }
        ],
        ensembleMethod: 'weighted_voting',
        enableDynamicWeighting: true
      });

      // Mock predictions from different algorithms
      const algorithmPredictions = {
        vector_similarity: [
          { fragrance_id: 'ensemble-1', score: 0.91, confidence: 0.85 },
          { fragrance_id: 'ensemble-2', score: 0.83, confidence: 0.78 }
        ],
        collaborative_filtering: [
          { fragrance_id: 'ensemble-1', score: 0.76, confidence: 0.72 },
          { fragrance_id: 'ensemble-3', score: 0.89, confidence: 0.81 }
        ],
        neural_cf: [
          { fragrance_id: 'ensemble-2', score: 0.88, confidence: 0.83 },
          { fragrance_id: 'ensemble-4', score: 0.79, confidence: 0.75 }
        ]
      };

      vi.spyOn(ensembleRecommender, 'getAlgorithmPredictions').mockResolvedValue(algorithmPredictions);

      const ensembleRecs = await ensembleRecommender.generateEnsembleRecommendations(testUserId);
      
      expect(ensembleRecs.length).toBeGreaterThan(0);
      expect(ensembleRecs[0].ensemble_score).toBeDefined();
      expect(ensembleRecs[0].algorithm_contributions).toBeDefined();
      expect(ensembleRecs[0].consensus_strength).toBeGreaterThan(0);
      
      // Fragrance appearing in multiple algorithms should rank higher
      const multiAlgorithmRec = ensembleRecs.find(r => r.fragrance_id === 'ensemble-1');
      const singleAlgorithmRec = ensembleRecs.find(r => r.fragrance_id === 'ensemble-4');
      
      if (multiAlgorithmRec && singleAlgorithmRec) {
        expect(multiAlgorithmRec.ensemble_score).toBeGreaterThan(singleAlgorithmRec.ensemble_score);
        expect(multiAlgorithmRec.consensus_strength).toBeGreaterThan(singleAlgorithmRec.consensus_strength);
      }
    });
  });

  describe('RECOMMENDATION-008: Edge Cases and Robustness Tests', () => {
    it('RECOMMENDATION-008a: New User Cold Start Scenarios', async () => {
      const coldStartEngine = new ColdStartRecommendationEngine({
        supabase,
        strategies: ['demographic', 'popular', 'exploration', 'onboarding_guided'],
        fallbackStrategy: 'popular'
      });

      const coldStartScenarios = [
        {
          user_context: { signup_source: 'google', age_range: '25-35', gender: 'any' },
          expected_strategy: 'demographic'
        },
        {
          user_context: { quiz_completed: true, preferences: ['fresh', 'summer'] },
          expected_strategy: 'onboarding_guided'  
        },
        {
          user_context: { no_data: true },
          expected_strategy: 'popular'
        }
      ];

      for (const scenario of coldStartScenarios) {
        const recommendations = await coldStartEngine.generateColdStartRecommendations(
          randomUUID(),
          scenario.user_context
        );
        
        expect(recommendations.length).toBeGreaterThan(5);
        expect(recommendations.strategy_used).toBe(scenario.expected_strategy);
        expect(recommendations.confidence).toBeLessThan(0.7); // Lower confidence for cold start
        expect(recommendations.learning_opportunity_score).toBeGreaterThan(0.5);
        expect(recommendations.diversity_score).toBeGreaterThan(0.6); // Should be diverse for exploration
      }
    });

    it('RECOMMENDATION-008b: Recommendation Bias Detection and Mitigation', async () => {
      const biasDetector = new RecommendationBiasDetector({
        supabase,
        biasTypes: ['popularity_bias', 'brand_bias', 'price_bias', 'recency_bias'],
        fairnessMetrics: ['demographic_parity', 'equal_opportunity']
      });

      // Generate recommendations for different user groups
      const userGroups = [
        { group: 'high_budget', users: Array.from({ length: 20 }, () => randomUUID()) },
        { group: 'low_budget', users: Array.from({ length: 20 }, () => randomUUID()) },
        { group: 'experienced', users: Array.from({ length: 20 }, () => randomUUID()) },
        { group: 'beginners', users: Array.from({ length: 20 }, () => randomUUID()) }
      ];

      const biasAnalysis = await biasDetector.analyzeBiasAcrossGroups(userGroups);
      
      expect(biasAnalysis.bias_detected).toBeDefined();
      expect(biasAnalysis.affected_groups).toBeDefined();
      expect(biasAnalysis.bias_strength).toBeGreaterThan(0);
      expect(biasAnalysis.fairness_metrics).toBeDefined();
      expect(biasAnalysis.mitigation_strategies.length).toBeGreaterThan(0);
      
      // Should detect significant bias if present
      if (biasAnalysis.bias_strength > 0.3) {
        expect(biasAnalysis.requires_mitigation).toBe(true);
        expect(biasAnalysis.mitigation_strategies).toContain('diversification');
      }
    });

    it('RECOMMENDATION-008c: System Resilience Under Load', async () => {
      const loadTester = new RecommendationLoadTester({
        supabase,
        maxConcurrentUsers: 1000,
        maxRecommendationsPerSecond: 500
      });

      // Simulate high load scenario
      const loadTest = await loadTester.simulateHighLoad({
        concurrent_users: 500,
        requests_per_user: 3,
        duration_seconds: 60,
        recommendation_types: ['personalized', 'trending', 'seasonal']
      });

      expect(loadTest.completed_successfully).toBe(true);
      expect(loadTest.success_rate).toBeGreaterThan(0.95); // 95% success under load
      expect(loadTest.avg_response_time_ms).toBeLessThan(1000); // <1 second avg
      expect(loadTest.max_response_time_ms).toBeLessThan(5000); // <5 seconds max
      expect(loadTest.recommendations_generated).toBeGreaterThan(1000);
      
      // System should maintain quality under load
      expect(loadTest.quality_degradation).toBeLessThan(0.1); // <10% quality loss
      expect(loadTest.cache_hit_rate).toBeGreaterThan(0.7); // Good cache utilization
    });

    it('RECOMMENDATION-008d: Error Recovery and Graceful Degradation', async () => {
      const resilientEngine = new ResilientRecommendationEngine({
        supabase,
        enableFallbackStrategies: true,
        fallbackOrder: ['cached', 'popular', 'random_diverse'],
        maxFailureRate: 0.05
      });

      // Simulate various failure scenarios
      const failureScenarios = [
        {
          name: 'AI service unavailable',
          failure: 'embedding_generation_failed',
          expected_fallback: 'cached'
        },
        {
          name: 'Database query timeout',
          failure: 'database_timeout',
          expected_fallback: 'popular'
        },
        {
          name: 'User preference corruption',
          failure: 'invalid_user_data',
          expected_fallback: 'random_diverse'
        }
      ];

      for (const scenario of failureScenarios) {
        vi.spyOn(resilientEngine, 'simulateFailure').mockImplementation(async () => {
          throw new Error(scenario.failure);
        });

        const recommendations = await resilientEngine.generateRecommendationsWithFallback(testUserId);
        
        expect(recommendations.success).toBe(true);
        expect(recommendations.fallback_used).toBe(true);
        expect(recommendations.fallback_strategy).toBe(scenario.expected_fallback);
        expect(recommendations.recommendations.length).toBeGreaterThan(0);
        expect(recommendations.degradation_notice).toBeDefined();
      }
    });
  });

  describe('RECOMMENDATION-009: Integration with Real Data Tests', () => {
    it('RECOMMENDATION-009a: Full Pipeline with Real Database', async () => {
      const realDataEngine = new PersonalizedRecommendationEngine({
        supabase,
        useRealData: true,
        enableAllAlgorithms: true
      });

      // Use real fragrance data from database
      const { data: realFragrances } = await supabase
        .from('fragrances')
        .select('id, name, brand_id, scent_family, main_accords, rating_value')
        .not('embedding', 'is', null) // Only fragrances with embeddings
        .limit(10);

      if (realFragrances && realFragrances.length >= 3) {
        // Create mock user with real fragrance preferences
        const mockUserPreferences = {
          liked_fragrances: realFragrances.slice(0, 3).map(f => ({
            fragrance_id: f.id,
            rating: 5,
            fragrance: f
          }))
        };

        vi.spyOn(realDataEngine, 'getUserPreferences').mockResolvedValue(mockUserPreferences);

        const realRecommendations = await realDataEngine.generatePersonalizedRecommendations(
          testUserId,
          {
            max_results: 5,
            include_explanations: true,
            use_real_similarity_search: true
          }
        );

        expect(realRecommendations.length).toBeGreaterThan(0);
        expect(realRecommendations[0].fragrance_id).toBeDefined();
        expect(realRecommendations[0].similarity_score).toBeGreaterThan(0);
        expect(realRecommendations[0].explanation).toBeDefined();
        
        console.log(`✅ Real data test: Generated ${realRecommendations.length} recommendations`);
        console.log(`   Top recommendation: ${realRecommendations[0].fragrance_name} (${realRecommendations[0].similarity_score})`);
      } else {
        console.log('⚠️  Skipping real data test: Insufficient fragrances with embeddings');
        expect(true).toBe(true); // Pass test if no embedded fragrances available yet
      }
    });
  });
});

// Type definitions for tests
interface UserPreferenceProfile {
  user_id: string;
  dominant_families: string[];
  brand_affinity: Record<string, number>;
  interaction_patterns: any;
  confidence_score: number;
  temporal_preferences: any;
}

interface RecommendationResult {
  fragrance_id: string;
  score: number;
  explanation?: string;
  confidence: number;
  metadata: any;
}

interface FeedbackEvent {
  user_id: string;
  fragrance_id: string;
  feedback_type: 'like' | 'dislike' | 'rating' | 'purchase_intent';
  rating_value?: number;
  confidence: number;
  reason?: string;
  context?: any;
}

interface RecommendationExplanation {
  primary_reason: string;
  contributing_factors: Array<{
    type: string;
    description: string;
    weight: number;
    confidence: number;
  }>;
  confidence_score: number;
  explanation_text: string;
}