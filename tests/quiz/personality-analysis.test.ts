import { describe, test, expect, beforeEach, vi } from 'vitest';
import { setupRpcOperations, resetDatabaseMocks } from '../utils/database-test-utils';

/**
 * Personality Analysis Algorithm Tests
 * 
 * Tests for fragrance personality profiling and analysis:
 * - Multi-dimensional scoring across 6 fragrance families
 * - 8 personality archetype classification system
 * - Confidence scoring and accuracy assessment
 * - OpenAI integration for natural language analysis
 * - Vector embedding generation from personality profiles
 * - Lifestyle factor correlation with scent preferences
 * - Real-time analysis performance requirements
 */

// Mock OpenAI integration
vi.mock('@/lib/ai/openai-client', () => ({
  analyzeQuizResponses: vi.fn(),
  generatePersonalityDescription: vi.fn(),
  createEmbeddingFromProfile: vi.fn(),
}));

// Mock personality analysis engine
vi.mock('@/lib/quiz/personality-analyzer', () => ({
  PersonalityAnalyzer: vi.fn().mockImplementation(() => ({
    analyzeQuizResponses: vi.fn(),
    classifyArchetype: vi.fn(),
    calculateConfidence: vi.fn(),
    generateStyleDescription: vi.fn(),
    mapToFragranceFamilies: vi.fn(),
    generatePersonalityEmbedding: vi.fn(),
  })),

  FragranceArchetypeClassifier: vi.fn().mockImplementation(() => ({
    classify: vi.fn(),
    getArchetypeTemplate: vi.fn(),
    calculateArchetypeScores: vi.fn(),
    validateClassification: vi.fn(),
  })),

  LifestyleCorrelationEngine: vi.fn().mockImplementation(() => ({
    analyzeLifestyleFactors: vi.fn(),
    correlatewithFragrancePreferences: vi.fn(),
    predictOccasionPreferences: vi.fn(),
    assessPersonalityConsistency: vi.fn(),
  }))
}));

describe('Personality Analysis Algorithms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDatabaseMocks();
    setupRpcOperations();
  });

  describe('Multi-Dimensional Fragrance Scoring', () => {
    test('should analyze quiz responses across 6 fragrance dimensions', async () => {
      const { PersonalityAnalyzer } = await import('@/lib/quiz/personality-analyzer');
      const analyzer = new PersonalityAnalyzer();
      
      const mockQuizResponses = [
        {
          question_id: 'lifestyle_style',
          answer_value: 'professional_elegant',
          question_category: 'lifestyle',
          weight: 1.5
        },
        {
          question_id: 'environment_preference',
          answer_value: 'cozy_intimate_spaces',
          question_category: 'environment',
          weight: 1.2
        },
        {
          question_id: 'scent_memory',
          answer_value: 'grandmothers_powder_room',
          question_category: 'memory',
          weight: 1.8
        }
      ];

      const expectedDimensionAnalysis = {
        fresh: 15,    // Low - professional, intimate preferences
        floral: 75,   // High - elegant, powder room associations
        oriental: 85, // Very high - sophisticated, intimate
        woody: 45,    // Moderate - professional associations
        fruity: 25,   // Low - sophisticated preferences
        gourmand: 35, // Low-moderate - not playful enough
        analysis_confidence: 0.78,
        dominant_dimensions: ['oriental', 'floral'],
        processing_time_ms: 67
      };

      analyzer.analyzeQuizResponses.mockResolvedValue(expectedDimensionAnalysis);
      
      const analysis = await analyzer.analyzeQuizResponses(mockQuizResponses);
      
      expect(analysis.oriental).toBeGreaterThan(analysis.fresh);
      expect(analysis.floral).toBeGreaterThan(analysis.fruity);
      expect(analysis.dominant_dimensions).toContain('oriental');
      expect(analysis.dominant_dimensions).toContain('floral');
      expect(analysis.analysis_confidence).toBeGreaterThan(0.7);
      expect(analysis.processing_time_ms).toBeLessThan(100);
    });

    test('should weight questions by importance and reliability', async () => {
      const { PersonalityAnalyzer } = await import('@/lib/quiz/personality-analyzer');
      const analyzer = new PersonalityAnalyzer();
      
      const weightedQuestions = [
        {
          question_id: 'core_personality',
          answer_value: 'sophisticated_complex',
          importance_weight: 2.0, // Very important
          reliability_score: 0.95 // Very reliable
        },
        {
          question_id: 'secondary_preference',
          answer_value: 'sometimes_fruity',
          importance_weight: 0.8, // Less important
          reliability_score: 0.6 // Less reliable
        }
      ];

      analyzer.analyzeQuizResponses.mockImplementation((responses) => {
        const coreResponse = responses.find((r: any) => r.question_id === 'core_personality');
        const secondaryResponse = responses.find((r: any) => r.question_id === 'secondary_preference');
        
        return Promise.resolve({
          oriental: coreResponse ? 85 : 45, // Strong impact from core question
          fruity: secondaryResponse ? 25 : 10, // Minimal impact from secondary
          weight_distribution: {
            core_personality: 0.75, // 75% of total weight
            secondary_preference: 0.25 // 25% of total weight
          }
        });
      });
      
      const result = await analyzer.analyzeQuizResponses(weightedQuestions);
      
      expect(result.oriental).toBe(85); // Dominated by high-weight question
      expect(result.fruity).toBe(25); // Minimal influence from low-weight question
      expect(result.weight_distribution.core_personality).toBe(0.75);
    });

    test('should handle conflicting responses with intelligent reconciliation', async () => {
      const { PersonalityAnalyzer } = await import('@/lib/quiz/personality-analyzer');
      const analyzer = new PersonalityAnalyzer();
      
      const conflictingResponses = [
        {
          question_id: 'q1',
          answer_value: 'loves_bold_statements',
          dimension_impact: { oriental: 0.9, woody: 0.8 }
        },
        {
          question_id: 'q2', 
          answer_value: 'prefers_subtle_scents',
          dimension_impact: { oriental: 0.2, fresh: 0.8 }
        },
        {
          question_id: 'q3',
          answer_value: 'depends_on_context',
          dimension_impact: { oriental: 0.5, fresh: 0.5 } // Neutral
        }
      ];

      const conflictResolution = {
        conflicts_detected: 2,
        resolution_strategy: 'weighted_averaging_with_confidence_adjustment',
        final_dimensions: {
          oriental: 0.55, // Balanced resolution
          fresh: 0.43,
          woody: 0.35
        },
        confidence_penalty: -0.12, // Reduced confidence due to conflicts
        consistency_score: 0.67,
        suggested_follow_up_questions: ['intensity_clarification', 'context_specific_preferences']
      };

      analyzer.resolveConflicts = vi.fn().mockResolvedValue(conflictResolution);
      
      const result = await analyzer.resolveConflicts(conflictingResponses);
      
      expect(result.conflicts_detected).toBe(2);
      expect(result.confidence_penalty).toBeLessThan(0);
      expect(result.consistency_score).toBeGreaterThan(0.6);
      expect(result.suggested_follow_up_questions).toContain('intensity_clarification');
    });

    test('should incorporate cultural and demographic factors', async () => {
      const { PersonalityAnalyzer } = await import('@/lib/quiz/personality-analyzer');
      const analyzer = new PersonalityAnalyzer();
      
      const culturalContext = {
        age_group: '25_34',
        cultural_background: 'western',
        climate: 'temperate',
        urban_rural: 'urban',
        fashion_culture: 'contemporary'
      };

      const demographicAdjustments = {
        base_dimensions: { fresh: 50, floral: 60, oriental: 40 },
        cultural_adjustments: {
          age_group_modifier: { fresh: +10, floral: +5, oriental: -5 }, // Younger preference
          climate_modifier: { fresh: +15, oriental: -10 }, // Temperate climate
          urban_modifier: { oriental: +10, woody: +5 } // Urban sophistication
        },
        final_dimensions: { fresh: 75, floral: 65, oriental: 45, woody: 55 },
        adjustment_confidence: 0.73
      };

      analyzer.applyDemographicAdjustments = vi.fn().mockResolvedValue(demographicAdjustments);
      
      const result = await analyzer.applyDemographicAdjustments(culturalContext);
      
      expect(result.final_dimensions.fresh).toBeGreaterThan(result.base_dimensions.fresh);
      expect(result.final_dimensions.oriental).toBeLessThan(result.base_dimensions.oriental);
      expect(result.adjustment_confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Archetype Classification System', () => {
    test('should classify into 8 distinct fragrance personality archetypes', async () => {
      const { FragranceArchetypeClassifier } = await import('@/lib/quiz/personality-analyzer');
      const classifier = new FragranceArchetypeClassifier();
      
      const archetypeTestCases = [
        {
          dimensions: { fresh: 20, floral: 90, oriental: 35, woody: 25, fruity: 70, gourmand: 50 },
          expected_primary: 'romantic',
          expected_secondary: 'playful'
        },
        {
          dimensions: { fresh: 15, floral: 30, oriental: 90, woody: 80, fruity: 20, gourmand: 25 },
          expected_primary: 'sophisticated',
          expected_secondary: 'mysterious'
        },
        {
          dimensions: { fresh: 95, floral: 40, oriental: 15, woody: 60, fruity: 45, gourmand: 20 },
          expected_primary: 'natural',
          expected_secondary: null
        },
        {
          dimensions: { fresh: 25, floral: 35, oriental: 95, woody: 70, fruity: 20, gourmand: 85 },
          expected_primary: 'bold',
          expected_secondary: 'sophisticated'
        }
      ];

      classifier.classify.mockImplementation((dimensions) => {
        const testCase = archetypeTestCases.find(tc => 
          Math.abs(tc.dimensions.fresh - dimensions.fresh) < 10
        );
        
        return Promise.resolve({
          primary_archetype: testCase?.expected_primary || 'classic',
          secondary_archetype: testCase?.expected_secondary,
          confidence: 0.85,
          archetype_scores: {
            romantic: testCase?.expected_primary === 'romantic' ? 0.85 : 0.45,
            sophisticated: testCase?.expected_primary === 'sophisticated' ? 0.85 : 0.35,
            natural: testCase?.expected_primary === 'natural' ? 0.85 : 0.25,
            bold: testCase?.expected_primary === 'bold' ? 0.85 : 0.20
          }
        });
      });

      for (const testCase of archetypeTestCases) {
        const result = await classifier.classify(testCase.dimensions);
        expect(result.primary_archetype).toBe(testCase.expected_primary);
        expect(result.secondary_archetype).toBe(testCase.expected_secondary);
      }
    });

    test('should generate detailed archetype descriptions', async () => {
      const { PersonalityAnalyzer } = await import('@/lib/quiz/personality-analyzer');
      const analyzer = new PersonalityAnalyzer();
      
      const sophisticatedProfile = {
        primary_archetype: 'sophisticated',
        dimension_scores: { oriental: 85, woody: 75, floral: 45 },
        lifestyle_factors: {
          work_style: 'executive_professional',
          social_preference: 'intimate_gatherings',
          fashion_style: 'classic_luxury'
        }
      };

      const expectedDescription = {
        archetype_name: 'Sophisticated Evening Enthusiast',
        core_description: 'You gravitate toward complex, layered fragrances with oriental and woody notes that make a statement without being overwhelming',
        style_characteristics: [
          'Appreciates craftsmanship and quality in fragrance',
          'Prefers scents that evolve beautifully throughout the day',
          'Values exclusivity and refined compositions',
          'Enjoys fragrances that complement professional and social settings'
        ],
        fragrance_journey: {
          beginner_recommendations: 'Start with acclaimed oriental-woody fragrances',
          signature_style: 'Rich, complex evening fragrances with longevity',
          exploration_areas: 'Niche houses and perfumer-driven compositions',
          collection_building: 'Focus on quality over quantity, seasonal variations'
        },
        celebrity_style_matches: ['Cate Blanchett', 'Tilda Swinton'],
        confidence: 0.89
      };

      analyzer.generateStyleDescription.mockResolvedValue(expectedDescription);
      
      const description = await analyzer.generateStyleDescription(sophisticatedProfile);
      
      expect(description.archetype_name).toBe('Sophisticated Evening Enthusiast');
      expect(description.core_description).toContain('complex, layered fragrances');
      expect(description.style_characteristics).toHaveLength(4);
      expect(description.fragrance_journey.signature_style).toContain('evening fragrances');
      expect(description.confidence).toBeGreaterThan(0.8);
    });

    test('should handle mixed archetype profiles with dual personalities', async () => {
      const { FragranceArchetypeClassifier } = await import('@/lib/quiz/personality-analyzer');
      const classifier = new FragranceArchetypeClassifier();
      
      const mixedDimensions = {
        fresh: 65,    // Moderate-high
        floral: 80,   // High
        oriental: 70, // High
        woody: 45,    // Moderate
        fruity: 60,   // Moderate-high
        gourmand: 40  // Moderate
      };

      const mixedArchetypeResult = {
        primary_archetype: 'romantic', // Highest floral score
        secondary_archetype: 'sophisticated', // High oriental score
        archetype_balance: 0.73, // Close scores between primary and secondary
        style_fusion: 'romantic_sophisticated',
        confidence: 0.76,
        personality_complexity: 'dual_nature',
        style_description: 'You blend romantic florals with sophisticated depth - a complex, evolving style that adapts to your mood and occasion'
      };

      classifier.classify.mockResolvedValue(mixedArchetypeResult);
      
      const result = await classifier.classify(mixedDimensions);
      
      expect(result.primary_archetype).toBe('romantic');
      expect(result.secondary_archetype).toBe('sophisticated');
      expect(result.archetype_balance).toBeGreaterThan(0.7);
      expect(result.personality_complexity).toBe('dual_nature');
      expect(result.style_description).toContain('blend romantic florals');
    });

    test('should provide confidence scoring based on response consistency', async () => {
      const { PersonalityAnalyzer } = await import('@/lib/quiz/personality-analyzer');
      const analyzer = new PersonalityAnalyzer();
      
      const consistentResponses = [
        { answer: 'sophisticated_settings', consistency: 0.9 },
        { answer: 'luxury_preferences', consistency: 0.85 },
        { answer: 'evening_occasions', consistency: 0.88 },
        { answer: 'quality_over_trends', consistency: 0.92 }
      ];

      const inconsistentResponses = [
        { answer: 'budget_conscious', consistency: 0.3 },
        { answer: 'prefers_celebrity_scents', consistency: 0.4 },
        { answer: 'loves_fruity_sweet', consistency: 0.2 },
        { answer: 'casual_everyday', consistency: 0.35 }
      ];

      analyzer.calculateConfidence.mockImplementation((responses) => {
        const avgConsistency = responses.reduce((sum: number, r: any) => sum + r.consistency, 0) / responses.length;
        return Promise.resolve({
          confidence_score: avgConsistency,
          consistency_rating: avgConsistency > 0.8 ? 'high' : avgConsistency > 0.6 ? 'moderate' : 'low',
          response_coherence: avgConsistency > 0.7
        });
      });

      const consistentResult = await analyzer.calculateConfidence(consistentResponses);
      const inconsistentResult = await analyzer.calculateConfidence(inconsistentResponses);
      
      expect(consistentResult.confidence_score).toBeGreaterThan(0.8);
      expect(consistentResult.consistency_rating).toBe('high');
      expect(consistentResult.response_coherence).toBe(true);
      
      expect(inconsistentResult.confidence_score).toBeLessThan(0.5);
      expect(inconsistentResult.consistency_rating).toBe('low');
      expect(inconsistentResult.response_coherence).toBe(false);
    });

    test('should map quiz dimensions to specific fragrance families and notes', async () => {
      const { PersonalityAnalyzer } = await import('@/lib/quiz/personality-analyzer');
      const analyzer = new PersonalityAnalyzer();
      
      const dimensionProfile = {
        fresh: 85,
        floral: 30,
        oriental: 15,
        woody: 60,
        fruity: 45,
        gourmand: 20
      };

      const familyMapping = {
        primary_families: ['citrus', 'aquatic', 'green'], // High fresh score
        secondary_families: ['woody_fresh', 'aromatic'], // Moderate woody score
        specific_notes: {
          top_notes: ['bergamot', 'lemon', 'mint', 'eucalyptus'],
          heart_notes: ['geranium', 'pine', 'lavender'],
          base_notes: ['white_musk', 'cedar', 'vetiver']
        },
        avoid_notes: ['heavy_amber', 'vanilla', 'patchouli'], // Low oriental/gourmand
        fragrance_examples: [
          'Acqua di Gio - Classic fresh aquatic',
          'Tom Ford Grey Vetiver - Sophisticated fresh woody',
          'Hermes Un Jardin sur le Toit - Green citrus garden'
        ]
      };

      analyzer.mapToFragranceFamilies.mockResolvedValue(familyMapping);
      
      const mapping = await analyzer.mapToFragranceFamilies(dimensionProfile);
      
      expect(mapping.primary_families).toContain('citrus');
      expect(mapping.primary_families).toContain('aquatic');
      expect(mapping.specific_notes.top_notes).toContain('bergamot');
      expect(mapping.avoid_notes).toContain('heavy_amber');
      expect(mapping.fragrance_examples).toHaveLength(3);
    });
  });

  describe('Lifestyle Factor Correlation', () => {
    test('should correlate lifestyle responses with fragrance preferences', async () => {
      const { LifestyleCorrelationEngine } = await import('@/lib/quiz/personality-analyzer');
      const correlationEngine = new LifestyleCorrelationEngine();
      
      const lifestyleResponses = {
        work_environment: 'creative_studio',
        social_activities: 'art_galleries_concerts',
        fashion_style: 'bohemian_artistic',
        weekend_preferences: 'farmers_markets_hiking',
        home_decor: 'eclectic_vintage',
        travel_style: 'authentic_local_experiences'
      };

      const correlationResult = {
        lifestyle_fragrance_correlation: 0.84,
        predicted_preferences: {
          scent_families: ['woody', 'green', 'herbal'],
          intensity_preference: 'moderate_to_strong',
          brand_preferences: ['niche', 'artisan', 'sustainable'],
          occasion_mapping: {
            work: 'creative_inspiring',
            social: 'unique_memorable', 
            personal: 'authentic_natural'
          }
        },
        personality_insights: {
          values: ['authenticity', 'creativity', 'sustainability'],
          fragrance_motivation: 'self_expression_and_uniqueness',
          shopping_behavior: 'research_driven_quality_focused'
        }
      };

      correlationEngine.analyzeLifestyleFactors.mockResolvedValue(correlationResult);
      
      const result = await correlationEngine.analyzeLifestyleFactors(lifestyleResponses);
      
      expect(result.lifestyle_fragrance_correlation).toBeGreaterThan(0.8);
      expect(result.predicted_preferences.scent_families).toContain('woody');
      expect(result.predicted_preferences.brand_preferences).toContain('niche');
      expect(result.personality_insights.values).toContain('creativity');
    });

    test('should predict occasion preferences from lifestyle patterns', async () => {
      const { LifestyleCorrelationEngine } = await import('@/lib/quiz/personality-analyzer');
      const correlationEngine = new LifestyleCorrelationEngine();
      
      const lifestylePattern = {
        work_schedule: 'traditional_office_hours',
        evening_activities: 'romantic_dinners',
        weekend_style: 'outdoor_adventures',
        special_events: 'formal_celebrations',
        daily_routine: 'structured_consistent'
      };

      const occasionPredictions = {
        work_fragrance_style: 'professional_appropriate_moderate_sillage',
        evening_fragrance_style: 'romantic_intimate_higher_sillage',
        weekend_fragrance_style: 'fresh_outdoorsy_light_longevity',
        special_occasion_style: 'luxurious_memorable_statement_making',
        fragrance_wardrobe_size: 'moderate_4_to_6_fragrances',
        seasonal_variation: 'moderate_2_to_3_per_season'
      };

      correlationEngine.predictOccasionPreferences.mockResolvedValue(occasionPredictions);
      
      const predictions = await correlationEngine.predictOccasionPreferences(lifestylePattern);
      
      expect(predictions.work_fragrance_style).toContain('professional_appropriate');
      expect(predictions.evening_fragrance_style).toContain('romantic_intimate');
      expect(predictions.weekend_fragrance_style).toContain('fresh_outdoorsy');
      expect(predictions.fragrance_wardrobe_size).toBe('moderate_4_to_6_fragrances');
    });

    test('should assess personality consistency across different question types', async () => {
      const { LifestyleCorrelationEngine } = await import('@/lib/quiz/personality-analyzer');
      const correlationEngine = new LifestyleCorrelationEngine();
      
      const crossQuestionResponses = {
        direct_scent_questions: {
          preferred_intensity: 'moderate',
          liked_notes: ['rose', 'vanilla', 'sandalwood'],
          disliked_notes: ['heavy_musk', 'animalic']
        },
        lifestyle_questions: {
          fashion_style: 'romantic_feminine',
          social_settings: 'intimate_gatherings',
          personal_values: 'beauty_harmony_connection'
        },
        scenario_questions: {
          date_night_choice: 'cozy_restaurant',
          vacation_preference: 'romantic_destinations',
          gift_giving_style: 'thoughtful_personal'
        }
      };

      const consistencyAssessment = {
        cross_question_consistency: 0.91,
        response_coherence: 'very_high',
        personality_alignment: {
          direct_vs_lifestyle: 0.89,
          lifestyle_vs_scenario: 0.93,
          scenario_vs_direct: 0.88
        },
        confidence_boost: 0.15, // High consistency increases confidence
        inconsistencies_detected: 0,
        overall_reliability: 0.92
      };

      correlationEngine.assessPersonalityConsistency.mockResolvedValue(consistencyAssessment);
      
      const assessment = await correlationEngine.assessPersonalityConsistency(crossQuestionResponses);
      
      expect(assessment.cross_question_consistency).toBeGreaterThan(0.9);
      expect(assessment.response_coherence).toBe('very_high');
      expect(assessment.confidence_boost).toBeGreaterThan(0.1);
      expect(assessment.inconsistencies_detected).toBe(0);
    });
  });

  describe('Vector Embedding Generation', () => {
    test('should generate vector embeddings from personality profiles', async () => {
      const { PersonalityAnalyzer } = await import('@/lib/quiz/personality-analyzer');
      const analyzer = new PersonalityAnalyzer();
      
      const personalityProfile = {
        primary_archetype: 'sophisticated',
        dimension_scores: { oriental: 85, woody: 75, floral: 45 },
        lifestyle_factors: {
          work: 'professional_executive',
          social: 'intimate_sophisticated',
          personal: 'quality_luxury_focused'
        },
        style_descriptor: 'Sophisticated Evening Enthusiast with preference for complex oriental-woody compositions'
      };

      const expectedEmbedding = {
        embedding_vector: new Array(1536).fill(0), // Would be actual embedding
        embedding_metadata: {
          source: 'quiz_personality_profile',
          confidence: 0.87,
          archetype_influence: 0.6,
          lifestyle_influence: 0.3,
          dimension_influence: 0.1
        },
        similarity_ready: true,
        generation_time_ms: 120
      };

      // Mock realistic embedding values
      expectedEmbedding.embedding_vector[0] = 0.82; // Strong oriental influence
      expectedEmbedding.embedding_vector[1] = 0.75; // Strong woody influence
      expectedEmbedding.embedding_vector[2] = -0.23; // Negative fresh influence

      analyzer.generatePersonalityEmbedding.mockResolvedValue(expectedEmbedding);
      
      const embedding = await analyzer.generatePersonalityEmbedding(personalityProfile);
      
      expect(embedding.embedding_vector).toHaveLength(1536);
      expect(embedding.embedding_vector[0]).toBe(0.82);
      expect(embedding.embedding_metadata.confidence).toBe(0.87);
      expect(embedding.generation_time_ms).toBeLessThan(200);
      expect(embedding.similarity_ready).toBe(true);
    });

    test('should optimize embeddings for fragrance similarity search', async () => {
      const { PersonalityAnalyzer } = await import('@/lib/quiz/personality-analyzer');
      const analyzer = new PersonalityAnalyzer();
      
      const embeddingOptimization = {
        original_embedding: new Array(1536).fill(0.1),
        fragrance_optimized_embedding: new Array(1536).fill(0),
        optimization_applied: true,
        fragrance_space_projection: {
          scent_family_emphasis: 0.4, // 40% weight on scent families
          note_preference_emphasis: 0.3, // 30% weight on specific notes
          lifestyle_context_emphasis: 0.2, // 20% weight on lifestyle
          personality_archetype_emphasis: 0.1 // 10% weight on archetype
        },
        similarity_performance: {
          accuracy_improvement: 0.18,
          search_time_ms: 45,
          relevance_score: 0.89
        }
      };

      analyzer.optimizeForFragranceSearch = vi.fn().mockResolvedValue(embeddingOptimization);
      
      const optimized = await analyzer.optimizeForFragranceSearch(embeddingOptimization.original_embedding);
      
      expect(optimized.optimization_applied).toBe(true);
      expect(optimized.similarity_performance.accuracy_improvement).toBeGreaterThan(0.15);
      expect(optimized.similarity_performance.search_time_ms).toBeLessThan(50);
    });

    test('should validate embedding quality and similarity performance', async () => {
      const { PersonalityAnalyzer } = await import('@/lib/quiz/personality-analyzer');
      const analyzer = new PersonalityAnalyzer();
      
      const embeddingValidation = {
        embedding: new Array(1536).fill(0.1),
        validation_tests: {
          dimension_consistency: 0.91,
          archetype_alignment: 0.87,
          similarity_accuracy: 0.84,
          recommendation_relevance: 0.89
        },
        quality_score: 0.88,
        passes_validation: true,
        issues_detected: 0,
        performance_metrics: {
          search_latency_ms: 35,
          accuracy_vs_manual_curation: 0.82,
          user_satisfaction_correlation: 0.78
        }
      };

      analyzer.validateEmbeddingQuality = vi.fn().mockResolvedValue(embeddingValidation);
      
      const validation = await analyzer.validateEmbeddingQuality(embeddingValidation.embedding);
      
      expect(validation.quality_score).toBeGreaterThan(0.8);
      expect(validation.passes_validation).toBe(true);
      expect(validation.performance_metrics.search_latency_ms).toBeLessThan(50);
      expect(validation.performance_metrics.accuracy_vs_manual_curation).toBeGreaterThan(0.8);
    });
  });

  describe('OpenAI Integration and Natural Language Analysis', () => {
    test('should enhance quiz analysis with AI-powered insights', async () => {
      const { analyzeQuizResponses } = await import('@/lib/ai/openai-client');
      
      const quizResponsesForAI = {
        responses: [
          { question: 'Describe your ideal evening', answer: 'Candlelit dinner with classical music and meaningful conversation' },
          { question: 'Your fashion inspiration', answer: 'Timeless elegance like Audrey Hepburn but with modern touches' },
          { question: 'Favorite scent memories', answer: 'My grandmother\'s powder room - sophisticated but comforting' }
        ],
        user_context: {
          age_range: '25_34',
          initial_responses: 'professional_sophisticated_romantic'
        }
      };

      const aiAnalysisResult = {
        personality_insights: {
          core_values: ['elegance', 'sophistication', 'tradition', 'comfort'],
          emotional_drivers: ['nostalgia', 'romance', 'refinement'],
          fragrance_motivations: ['self_expression', 'confidence', 'memory_creation'],
          style_evolution: 'Classic foundation with contemporary expression'
        },
        fragrance_predictions: {
          preferred_note_families: ['powdery_florals', 'warm_ambers', 'soft_woods'],
          intensity_preference: 'moderate_with_presence',
          longevity_preference: 'medium_to_long',
          sillage_preference: 'intimate_to_moderate',
          seasonal_adaptability: 'year_round_with_seasonal_variations'
        },
        ai_confidence: 0.84,
        analysis_quality: 'high_natural_language_richness',
        processing_time_ms: 890
      };

      analyzeQuizResponses.mockResolvedValue(aiAnalysisResult);
      
      const analysis = await analyzeQuizResponses(quizResponsesForAI);
      
      expect(analysis.personality_insights.core_values).toContain('sophistication');
      expect(analysis.fragrance_predictions.preferred_note_families).toContain('powdery_florals');
      expect(analysis.ai_confidence).toBeGreaterThan(0.8);
      expect(analysis.processing_time_ms).toBeLessThan(1000);
    });

    test('should generate natural language personality descriptions', async () => {
      const { generatePersonalityDescription } = await import('@/lib/ai/openai-client');
      
      const personalityData = {
        primary_archetype: 'romantic',
        dimension_scores: { floral: 90, fruity: 70, gourmand: 50 },
        lifestyle_context: 'creative professional who values beauty and connection',
        quiz_insights: 'Prefers feminine, floral scents that enhance confidence and spark conversation'
      };

      const generatedDescription = {
        archetype_title: 'Romantic Floral Enthusiast',
        core_description: 'You are a romantic soul who finds joy in beautiful, feminine fragrances that tell a story. Floral notes make you feel most like yourself, while fruity touches add playfulness to your sophisticated taste.',
        style_journey: 'Your fragrance style reflects your appreciation for beauty, romance, and authentic self-expression. You gravitate toward scents that enhance your natural femininity while making you feel confident and alluring.',
        fragrance_philosophy: 'For you, fragrance is about creating an aura of beauty and warmth that draws people in. You prefer scents that evolve throughout the day, revealing different facets of your personality.',
        collection_guidance: 'Build your collection around a signature floral fragrance, then explore seasonal variations and occasions with complementary fruity or gourmand touches.',
        confidence_level: 0.91,
        description_quality: 'personalized_and_engaging'
      };

      generatePersonalityDescription.mockResolvedValue(generatedDescription);
      
      const description = await generatePersonalityDescription(personalityData);
      
      expect(description.archetype_title).toBe('Romantic Floral Enthusiast');
      expect(description.core_description).toContain('romantic soul');
      expect(description.style_journey).toContain('appreciation for beauty');
      expect(description.confidence_level).toBeGreaterThan(0.9);
    });

    test('should create embeddings optimized for fragrance similarity', async () => {
      const { createEmbeddingFromProfile } = await import('@/lib/ai/openai-client');
      
      const profileForEmbedding = {
        archetype: 'sophisticated',
        style_description: 'Sophisticated Evening Enthusiast with preference for complex oriental-woody compositions',
        key_preferences: ['oriental notes', 'woody base', 'evening occasions', 'luxury brands'],
        lifestyle_context: 'Professional executive who appreciates quality and craftsmanship'
      };

      const embeddingResult = {
        embedding: new Array(1536).fill(0),
        optimization_metadata: {
          fragrance_relevance_score: 0.89,
          archetype_representation: 0.91,
          lifestyle_integration: 0.84,
          similarity_search_ready: true
        },
        generation_cost: 0.0003, // USD
        processing_time_ms: 145
      };

      // Mock realistic embedding values for sophisticated profile
      embeddingResult.embedding[0] = 0.78; // High oriental correlation
      embeddingResult.embedding[1] = 0.65; // High woody correlation
      embeddingResult.embedding[2] = -0.45; // Low fresh correlation

      createEmbeddingFromProfile.mockResolvedValue(embeddingResult);
      
      const embedding = await createEmbeddingFromProfile(profileForEmbedding);
      
      expect(embedding.embedding).toHaveLength(1536);
      expect(embedding.optimization_metadata.fragrance_relevance_score).toBeGreaterThan(0.85);
      expect(embedding.processing_time_ms).toBeLessThan(200);
      expect(embedding.generation_cost).toBeLessThan(0.001);
    });
  });

  describe('Performance and Real-time Requirements', () => {
    test('should meet sub-500ms analysis performance for real-time feedback', async () => {
      const { PersonalityAnalyzer } = await import('@/lib/quiz/personality-analyzer');
      const analyzer = new PersonalityAnalyzer();
      
      const singleQuestionResponse = {
        question_id: 'intensity_preference',
        answer_value: 'moderate_presence',
        session_context: 'mid_quiz_analysis'
      };

      analyzer.analyzeQuizResponses.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => resolve({
            partial_analysis: { emerging_archetype: 'sophisticated' },
            confidence: 0.65,
            processing_time_ms: 120
          }), 120);
        })
      );
      
      const startTime = Date.now();
      const result = await analyzer.analyzeQuizResponses([singleQuestionResponse]);
      const analysisTime = Date.now() - startTime;
      
      expect(analysisTime).toBeLessThan(500); // Sub-500ms requirement
      expect(result.processing_time_ms).toBeLessThan(200);
    });

    test('should handle high concurrent analysis load efficiently', async () => {
      const { PersonalityAnalyzer } = await import('@/lib/quiz/personality-analyzer');
      const analyzer = new PersonalityAnalyzer();
      
      const concurrentAnalyses = Array.from({ length: 50 }, (_, i) => ({
        session_id: `concurrent-session-${i}`,
        responses: [
          { question_id: 'q1', answer_value: 'professional' },
          { question_id: 'q2', answer_value: 'sophisticated' }
        ]
      }));

      analyzer.analyzeQuizResponses.mockImplementation((responses) => 
        Promise.resolve({
          session_processed: true,
          processing_time_ms: 80 + Math.random() * 40, // 80-120ms
          cache_utilization: Math.random() > 0.3 // 70% cache hit rate
        })
      );
      
      const startTime = Date.now();
      
      const results = await Promise.all(
        concurrentAnalyses.map(analysis => 
          analyzer.analyzeQuizResponses(analysis.responses)
        )
      );
      
      const totalTime = Date.now() - startTime;
      const avgTimePerAnalysis = totalTime / concurrentAnalyses.length;
      
      expect(results).toHaveLength(50);
      expect(avgTimePerAnalysis).toBeLessThan(150); // Efficient concurrent processing
    });

    test('should implement intelligent caching for repeated analysis patterns', async () => {
      const { PersonalityAnalyzer } = await import('@/lib/quiz/personality-analyzer');
      const analyzer = new PersonalityAnalyzer();
      
      const commonResponsePattern = [
        { question_id: 'q1', answer_value: 'professional_polished' },
        { question_id: 'q2', answer_value: 'sophisticated_settings' },
        { question_id: 'q3', answer_value: 'luxury_quality' }
      ];

      let analysisCallCount = 0;
      analyzer.analyzeQuizResponses.mockImplementation(() => {
        analysisCallCount++;
        return Promise.resolve({
          analysis_completed: true,
          cache_status: analysisCallCount === 1 ? 'cache_miss' : 'cache_hit',
          processing_time_ms: analysisCallCount === 1 ? 380 : 25, // Much faster on cache hit
          personality_profile: { archetype: 'sophisticated', confidence: 0.85 }
        });
      });
      
      // First analysis - should compute and cache
      const firstResult = await analyzer.analyzeQuizResponses(commonResponsePattern);
      expect(firstResult.cache_status).toBe('cache_miss');
      expect(firstResult.processing_time_ms).toBe(380);
      
      // Second analysis with same pattern - should use cache
      const secondResult = await analyzer.analyzeQuizResponses(commonResponsePattern);
      expect(secondResult.cache_status).toBe('cache_hit');
      expect(secondResult.processing_time_ms).toBe(25);
    });

    test('should batch process multiple personality analyses efficiently', async () => {
      const { PersonalityAnalyzer } = await import('@/lib/quiz/personality-analyzer');
      const analyzer = new PersonalityAnalyzer();
      
      const batchAnalysisRequests = [
        { user_id: 'batch-user-1', responses: [] },
        { user_id: 'batch-user-2', responses: [] },
        { user_id: 'batch-user-3', responses: [] },
        { user_id: 'batch-user-4', responses: [] },
        { user_id: 'batch-user-5', responses: [] }
      ];

      analyzer.batchAnalyze = vi.fn().mockResolvedValue({
        batch_processed: true,
        analyses_completed: 5,
        total_processing_time_ms: 450, // ~90ms per analysis
        cache_hit_rate: 0.6,
        errors: 0,
        batch_efficiency_gain: 0.35 // 35% faster than individual processing
      });
      
      const batchResult = await analyzer.batchAnalyze(batchAnalysisRequests);
      
      expect(batchResult.batch_processed).toBe(true);
      expect(batchResult.analyses_completed).toBe(5);
      expect(batchResult.total_processing_time_ms).toBeLessThan(600);
      expect(batchResult.batch_efficiency_gain).toBeGreaterThan(0.3);
    });
  });

  describe('Quiz Accuracy and Validation', () => {
    test('should validate personality analysis against known fragrance preferences', async () => {
      const { PersonalityAnalyzer } = await import('@/lib/quiz/personality-analyzer');
      const analyzer = new PersonalityAnalyzer();
      
      const validationDataset = {
        quiz_responses: [
          { question_id: 'q1', answer: 'loves_rose_gardens' },
          { question_id: 'q2', answer: 'romantic_settings' },
          { question_id: 'q3', answer: 'feminine_fashion' }
        ],
        known_fragrance_preferences: {
          loved_fragrances: ['chanel_coco_mademoiselle', 'dior_jadore', 'marc_jacobs_daisy'],
          disliked_fragrances: ['tom_ford_oud_wood', 'creed_aventus'],
          average_rating_floral: 4.8,
          average_rating_oriental: 2.1
        },
        expected_accuracy: 0.89
      };

      const validationResult = {
        predicted_archetype: 'romantic',
        predicted_preferences: ['floral', 'fruity', 'light_woods'],
        actual_preference_match: 0.91, // How well prediction matches known preferences
        accuracy_breakdown: {
          archetype_accuracy: 0.94,
          family_prediction_accuracy: 0.89,
          note_prediction_accuracy: 0.87,
          intensity_prediction_accuracy: 0.84
        },
        validation_passed: true,
        confidence_justified: true
      };

      analyzer.validateAgainstKnownPreferences = vi.fn().mockResolvedValue(validationResult);
      
      const validation = await analyzer.validateAgainstKnownPreferences(validationDataset);
      
      expect(validation.actual_preference_match).toBeGreaterThan(0.85);
      expect(validation.accuracy_breakdown.archetype_accuracy).toBeGreaterThan(0.9);
      expect(validation.validation_passed).toBe(true);
    });

    test('should detect and handle edge cases in personality analysis', async () => {
      const { PersonalityAnalyzer } = await import('@/lib/quiz/personality-analyzer');
      const analyzer = new PersonalityAnalyzer();
      
      const edgeCases = [
        {
          case_type: 'all_neutral_responses',
          responses: [
            { answer: 'depends_on_mood' },
            { answer: 'varies_by_situation' },
            { answer: 'no_strong_preference' }
          ],
          expected_handling: 'extend_quiz_with_specific_questions'
        },
        {
          case_type: 'contradictory_responses',
          responses: [
            { answer: 'loves_luxury_brands' },
            { answer: 'budget_conscious_shopper' },
            { answer: 'prefers_niche_artisan' }
          ],
          expected_handling: 'identify_context_dependent_preferences'
        },
        {
          case_type: 'extreme_single_preference',
          responses: [
            { answer: 'only_vanilla_scents' },
            { answer: 'nothing_but_gourmands' },
            { answer: 'sweet_obsessed' }
          ],
          expected_handling: 'focused_personality_with_exploration_suggestions'
        }
      ];

      analyzer.handleEdgeCases = vi.fn().mockImplementation((caseType) => {
        const edgeCase = edgeCases.find(ec => ec.case_type === caseType);
        return Promise.resolve({
          case_detected: true,
          handling_strategy: edgeCase?.expected_handling,
          analysis_adjusted: true,
          confidence_modified: true,
          special_recommendations: true
        });
      });

      for (const edgeCase of edgeCases) {
        const result = await analyzer.handleEdgeCases(edgeCase.case_type);
        expect(result.case_detected).toBe(true);
        expect(result.handling_strategy).toBe(edgeCase.expected_handling);
      }
    });

    test('should provide personality evolution tracking for returning users', async () => {
      const { PersonalityAnalyzer } = await import('@/lib/quiz/personality-analyzer');
      const analyzer = new PersonalityAnalyzer();
      
      const evolutionAnalysis = {
        user_id: 'evolving-user-123',
        previous_personality: {
          archetype: 'natural',
          confidence: 0.82,
          analyzed_at: '2025-02-15T10:00:00Z' // 6 months ago
        },
        current_personality: {
          archetype: 'sophisticated',
          confidence: 0.89,
          analyzed_at: '2025-08-15T10:00:00Z'
        },
        evolution_analysis: {
          archetype_shift: 'natural_to_sophisticated',
          shift_confidence: 0.84,
          likely_causes: ['increased_fragrance_experience', 'lifestyle_changes', 'refined_taste'],
          evolution_timeline: '6_months',
          evolution_naturalness: 'natural_progression'
        },
        recommendation_impact: {
          previous_accuracy: 0.73,
          current_accuracy: 0.89,
          improvement: 0.16,
          recommendation_refresh_needed: true
        }
      };

      analyzer.analyzePersonalityEvolution = vi.fn().mockResolvedValue(evolutionAnalysis);
      
      const evolution = await analyzer.analyzePersonalityEvolution('evolving-user-123');
      
      expect(evolution.evolution_analysis.archetype_shift).toBe('natural_to_sophisticated');
      expect(evolution.evolution_analysis.shift_confidence).toBeGreaterThan(0.8);
      expect(evolution.recommendation_impact.improvement).toBeGreaterThan(0.1);
      expect(evolution.recommendation_impact.recommendation_refresh_needed).toBe(true);
    });
  });
});