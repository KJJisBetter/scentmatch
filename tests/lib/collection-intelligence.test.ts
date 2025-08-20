/**
 * AI-Powered Collection Intelligence System Tests
 * 
 * Tests for advanced collection analysis, gap identification, personality profiling,
 * optimization recommendations, and integration with AI recommendation systems.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import {
  CollectionIntelligenceEngine,
  CollectionPatternAnalyzer,
  GapAnalysisEngine,
  CollectionOptimizer,
  PersonalityProfiler,
  CollectionInsightGenerator,
  SeasonalAnalyzer,
  OccasionAnalyzer,
  type CollectionAnalysis,
  type GapAnalysisResult,
  type CollectionPersonality,
  type OptimizationPlan
} from '@/lib/ai/collection-intelligence';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

describe('AI-Powered Collection Intelligence System', () => {

  describe('COLLECTION-001: Pattern Analysis Tests', () => {
    let patternAnalyzer: CollectionPatternAnalyzer;
    let testUserId: string;

    beforeEach(() => {
      testUserId = randomUUID();
      patternAnalyzer = new CollectionPatternAnalyzer({
        supabase,
        enableVectorAnalysis: true,
        enableBrandAnalysis: true,
        enableNoteAnalysis: true,
        confidenceThreshold: 0.7
      });
    });

    afterEach(async () => {
      // Clean up test data
      await supabase
        .from('collection_analysis_cache')
        .delete()
        .eq('user_id', testUserId);
    });

    it('COLLECTION-001a: Scent Family Distribution Analysis', async () => {
      // Mock user collection with diverse scent families
      const mockCollection = [
        {
          fragrance_id: 'pattern-1',
          rating: 5,
          usage_frequency: 'daily',
          fragrance: {
            fragrance_family: 'oriental',
            main_accords: ['vanilla', 'amber', 'spicy'],
            rating_value: 4.5,
            embedding: Array.from({ length: 2000 }, () => 0.1)
          }
        },
        {
          fragrance_id: 'pattern-2',
          rating: 5,
          usage_frequency: 'weekly',
          fragrance: {
            fragrance_family: 'oriental',
            main_accords: ['oud', 'rose', 'amber'],
            rating_value: 4.7,
            embedding: Array.from({ length: 2000 }, () => 0.12)
          }
        },
        {
          fragrance_id: 'pattern-3',
          rating: 4,
          usage_frequency: 'occasional',
          fragrance: {
            fragrance_family: 'woody',
            main_accords: ['sandalwood', 'cedar', 'vetiver'],
            rating_value: 4.2,
            embedding: Array.from({ length: 2000 }, () => 0.2)
          }
        },
        {
          fragrance_id: 'pattern-4',
          rating: 3,
          usage_frequency: 'special',
          fragrance: {
            fragrance_family: 'fresh',
            main_accords: ['citrus', 'aquatic', 'mint'],
            rating_value: 3.8,
            embedding: Array.from({ length: 2000 }, () => 0.3)
          }
        }
      ];

      vi.spyOn(patternAnalyzer, 'getUserCollection').mockResolvedValue(mockCollection);

      const patternAnalysis = await patternAnalyzer.analyzePatterns(testUserId);
      
      expect(patternAnalysis.success).toBe(true);
      expect(patternAnalysis.scent_family_distribution).toBeDefined();
      expect(patternAnalysis.dominant_preferences).toBeDefined();
      expect(patternAnalysis.preference_strength).toBeDefined();

      // Oriental should be dominant (2 items with high ratings)
      const orientalPreference = patternAnalysis.scent_family_distribution.find(
        family => family.family === 'oriental'
      );
      expect(orientalPreference?.percentage).toBeGreaterThan(0.4); // >40%
      expect(orientalPreference?.preference_strength).toBeGreaterThan(0.8); // High ratings

      // Analyze rating-weighted preferences
      expect(patternAnalysis.preference_strength.overall).toBeGreaterThan(0.7);
      expect(patternAnalysis.preference_strength.consistency).toBeGreaterThan(0.6);
    });

    it('COLLECTION-001b: Brand Affinity and Loyalty Analysis', async () => {
      const brandCollection = [
        {
          fragrance_id: 'brand-1',
          rating: 5,
          fragrance: {
            fragrance_family: 'oriental',
            fragrance_brands: { name: 'Tom Ford' },
            rating_value: 4.6
          }
        },
        {
          fragrance_id: 'brand-2',
          rating: 5,
          fragrance: {
            fragrance_family: 'woody',
            fragrance_brands: { name: 'Tom Ford' },
            rating_value: 4.8
          }
        },
        {
          fragrance_id: 'brand-3',
          rating: 4,
          fragrance: {
            fragrance_family: 'fresh',
            fragrance_brands: { name: 'Creed' },
            rating_value: 4.3
          }
        },
        {
          fragrance_id: 'brand-4',
          rating: 3,
          fragrance: {
            fragrance_family: 'floral',
            fragrance_brands: { name: 'Chanel' },
            rating_value: 4.1
          }
        }
      ];

      vi.spyOn(patternAnalyzer, 'getUserCollection').mockResolvedValue(brandCollection);

      const brandAnalysis = await patternAnalyzer.analyzeBrandPatterns(testUserId);
      
      expect(brandAnalysis.brand_affinity).toBeDefined();
      expect(brandAnalysis.loyalty_score).toBeGreaterThan(0);
      expect(brandAnalysis.brand_diversity).toBeGreaterThan(0);

      // Tom Ford should have highest affinity (2 items, both high rated)
      const tomFordAffinity = brandAnalysis.brand_affinity.find(
        brand => brand.brand === 'Tom Ford'
      );
      expect(tomFordAffinity?.affinity_score).toBeGreaterThan(0.8);
      expect(tomFordAffinity?.item_count).toBe(2);
      expect(tomFordAffinity?.avg_rating).toBeGreaterThan(4.5);

      // Should detect brand loyalty pattern
      expect(brandAnalysis.loyalty_score).toBeGreaterThan(0.6);
      expect(brandAnalysis.dominant_brand).toBe('Tom Ford');
    });

    it('COLLECTION-001c: Note and Accord Pattern Recognition', async () => {
      const noteRichCollection = [
        {
          fragrance_id: 'note-1',
          rating: 5,
          fragrance: {
            main_accords: ['vanilla', 'amber', 'spicy'],
            top_notes: ['bergamot', 'pink pepper'],
            middle_notes: ['rose', 'jasmine'],
            base_notes: ['vanilla', 'amber', 'musk']
          }
        },
        {
          fragrance_id: 'note-2',
          rating: 5,
          fragrance: {
            main_accords: ['vanilla', 'woody', 'sweet'],
            top_notes: ['mandarin', 'cardamom'],
            middle_notes: ['cedar', 'cinnamon'],
            base_notes: ['vanilla', 'sandalwood', 'tonka']
          }
        },
        {
          fragrance_id: 'note-3',
          rating: 2,
          fragrance: {
            main_accords: ['patchouli', 'earthy', 'green'],
            top_notes: ['basil', 'mint'],
            middle_notes: ['patchouli', 'geranium'],
            base_notes: ['vetiver', 'moss', 'earth']
          }
        }
      ];

      vi.spyOn(patternAnalyzer, 'getUserCollection').mockResolvedValue(noteRichCollection);

      const noteAnalysis = await patternAnalyzer.analyzeNotePatterns(testUserId);
      
      expect(noteAnalysis.loved_notes).toBeDefined();
      expect(noteAnalysis.disliked_notes).toBeDefined();
      expect(noteAnalysis.note_combinations).toBeDefined();
      expect(noteAnalysis.accord_preferences).toBeDefined();

      // Vanilla should be loved (appears in high-rated fragrances)
      const vanillaPattern = noteAnalysis.loved_notes.find(note => note.note === 'vanilla');
      expect(vanillaPattern?.strength).toBeGreaterThan(0.8);
      expect(vanillaPattern?.frequency).toBe(2);

      // Patchouli should be disliked (low-rated fragrance)
      const patchouliPattern = noteAnalysis.disliked_notes.find(note => note.note === 'patchouli');
      expect(patchouliPattern?.strength).toBeGreaterThan(0.5);
      expect(patchouliPattern?.evidence).toContain('low_rating');

      // Should identify successful note combinations
      expect(noteAnalysis.note_combinations.successful.length).toBeGreaterThan(0);
      expect(noteAnalysis.note_combinations.successful[0]).toContain('vanilla');
    });

    it('COLLECTION-001d: Vector-Based Collection Clustering', async () => {
      const embeddingCollection = [
        {
          fragrance_id: 'cluster-1',
          rating: 5,
          fragrance: {
            embedding: Array.from({ length: 2000 }, () => 0.1), // Similar embeddings
            fragrance_family: 'oriental'
          }
        },
        {
          fragrance_id: 'cluster-2',
          rating: 5,
          fragrance: {
            embedding: Array.from({ length: 2000 }, () => 0.11), // Very similar
            fragrance_family: 'oriental'
          }
        },
        {
          fragrance_id: 'cluster-3',
          rating: 4,
          fragrance: {
            embedding: Array.from({ length: 2000 }, () => 0.5), // Different cluster
            fragrance_family: 'fresh'
          }
        },
        {
          fragrance_id: 'cluster-4',
          rating: 3,
          fragrance: {
            embedding: Array.from({ length: 2000 }, () => 0.8), // Another cluster
            fragrance_family: 'woody'
          }
        }
      ];

      vi.spyOn(patternAnalyzer, 'getUserCollection').mockResolvedValue(embeddingCollection);

      const clusterAnalysis = await patternAnalyzer.performVectorClustering(testUserId);
      
      expect(clusterAnalysis.clusters.length).toBeGreaterThan(1);
      expect(clusterAnalysis.cluster_quality).toBeGreaterThan(0.5);
      expect(clusterAnalysis.preference_clusters).toBeDefined();

      // Should identify oriental cluster as strongest (high ratings, similar embeddings)
      const strongestCluster = clusterAnalysis.clusters.find(c => c.strength === Math.max(...clusterAnalysis.clusters.map(cl => cl.strength)));
      expect(strongestCluster?.dominant_family).toBe('oriental');
      expect(strongestCluster?.avg_rating).toBeGreaterThan(4.5);
      expect(strongestCluster?.cohesion_score).toBeGreaterThan(0.8);
    });

    it('COLLECTION-001e: Usage Pattern and Frequency Analysis', async () => {
      const usageCollection = [
        {
          fragrance_id: 'usage-1',
          rating: 5,
          usage_frequency: 'daily',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          fragrance: { fragrance_family: 'fresh', main_accords: ['citrus'] }
        },
        {
          fragrance_id: 'usage-2',
          rating: 4,
          usage_frequency: 'weekly',
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          fragrance: { fragrance_family: 'woody', main_accords: ['sandalwood'] }
        },
        {
          fragrance_id: 'usage-3',
          rating: 5,
          usage_frequency: 'special',
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          fragrance: { fragrance_family: 'oriental', main_accords: ['oud'] }
        }
      ];

      vi.spyOn(patternAnalyzer, 'getUserCollection').mockResolvedValue(usageCollection);

      const usageAnalysis = await patternAnalyzer.analyzeUsagePatterns(testUserId);
      
      expect(usageAnalysis.daily_drivers).toBeDefined();
      expect(usageAnalysis.special_occasion_scents).toBeDefined();
      expect(usageAnalysis.rotation_patterns).toBeDefined();
      expect(usageAnalysis.temporal_trends).toBeDefined();

      // Daily driver should be the fresh fragrance
      expect(usageAnalysis.daily_drivers[0]?.fragrance_id).toBe('usage-1');
      expect(usageAnalysis.daily_drivers[0]?.confidence).toBeGreaterThan(0.8);

      // Should detect special occasion preference for oriental/oud
      const specialScent = usageAnalysis.special_occasion_scents.find(s => s.fragrance_id === 'usage-3');
      expect(specialScent?.occasion_strength).toBeGreaterThan(0.8);
    });
  });

  describe('COLLECTION-002: Gap Analysis Tests', () => {
    let gapAnalyzer: GapAnalysisEngine;
    let testUserId: string;

    beforeEach(() => {
      testUserId = randomUUID();
      gapAnalyzer = new GapAnalysisEngine({
        supabase,
        enableSeasonalAnalysis: true,
        enableOccasionAnalysis: true,
        enableIntensityAnalysis: true,
        gapDetectionThreshold: 0.3
      });
    });

    it('COLLECTION-002a: Seasonal Gap Detection', async () => {
      // Collection heavily skewed toward winter/fall scents
      const seasonalCollection = [
        {
          fragrance_id: 'seasonal-1',
          rating: 5,
          fragrance: {
            fragrance_family: 'oriental',
            main_accords: ['amber', 'vanilla', 'spicy'],
            season_tags: ['fall', 'winter'],
            intensity_level: 8
          }
        },
        {
          fragrance_id: 'seasonal-2',
          rating: 4,
          fragrance: {
            fragrance_family: 'woody',
            main_accords: ['cedar', 'tobacco', 'leather'],
            season_tags: ['fall', 'winter'],
            intensity_level: 7
          }
        },
        {
          fragrance_id: 'seasonal-3',
          rating: 4,
          fragrance: {
            fragrance_family: 'gourmand',
            main_accords: ['chocolate', 'coffee', 'vanilla'],
            season_tags: ['winter'],
            intensity_level: 9
          }
        }
        // Notice: No spring/summer fragrances
      ];

      vi.spyOn(gapAnalyzer, 'getUserCollection').mockResolvedValue(seasonalCollection);

      const seasonalGaps = await gapAnalyzer.identifySeasonalGaps(testUserId);
      
      expect(seasonalGaps.gaps.length).toBeGreaterThan(0);
      expect(seasonalGaps.severity_score).toBeGreaterThan(0.6); // High severity
      
      // Should identify spring and summer gaps
      const springGap = seasonalGaps.gaps.find(gap => gap.season === 'spring');
      const summerGap = seasonalGaps.gaps.find(gap => gap.season === 'summer');
      
      expect(springGap?.gap_severity).toBe('critical');
      expect(summerGap?.gap_severity).toBe('critical');
      expect(springGap?.recommended_families).toContain('fresh');
      expect(summerGap?.recommended_families).toContain('citrus');

      // Should provide specific recommendations
      expect(springGap?.fragrance_suggestions.length).toBeGreaterThan(0);
      expect(summerGap?.fragrance_suggestions.length).toBeGreaterThan(0);
    });

    it('COLLECTION-002b: Occasion Coverage Analysis', async () => {
      const occasionSkewedCollection = [
        {
          fragrance_id: 'occasion-1',
          rating: 5,
          fragrance: {
            fragrance_family: 'oriental',
            occasion_tags: ['evening', 'date', 'formal'],
            intensity_level: 8
          }
        },
        {
          fragrance_id: 'occasion-2',
          rating: 4,
          fragrance: {
            fragrance_family: 'oriental',
            occasion_tags: ['evening', 'special'],
            intensity_level: 9
          }
        }
        // Notice: No office/casual/daytime options
      ];

      vi.spyOn(gapAnalyzer, 'getUserCollection').mockResolvedValue(occasionSkewedCollection);

      const occasionGaps = await gapAnalyzer.identifyOccasionGaps(testUserId);
      
      expect(occasionGaps.gaps.length).toBeGreaterThan(0);
      expect(occasionGaps.lifestyle_impact).toBe('high');

      // Should identify office/casual gaps
      const officeGap = occasionGaps.gaps.find(gap => gap.occasion === 'office');
      const casualGap = occasionGaps.gaps.find(gap => gap.occasion === 'casual');
      
      expect(officeGap?.priority).toBe('high');
      expect(casualGap?.priority).toBe('high');
      expect(officeGap?.intensity_recommendation).toBe('light_to_medium');
      expect(officeGap?.family_suggestions).toContain('fresh');

      // Should provide specific workplace-appropriate recommendations
      expect(officeGap?.fragrance_suggestions.length).toBeGreaterThan(0);
      expect(officeGap?.usage_guidance).toContain('office');
    });

    it('COLLECTION-002c: Intensity and Complexity Gap Analysis', async () => {
      const intensitySkewedCollection = [
        {
          fragrance_id: 'intensity-1',
          rating: 5,
          fragrance: {
            intensity_level: 9, // Very strong
            complexity_score: 8,
            longevity_hours: 12
          }
        },
        {
          fragrance_id: 'intensity-2',
          rating: 4,
          fragrance: {
            intensity_level: 8, // Strong
            complexity_score: 9,
            longevity_hours: 10
          }
        },
        {
          fragrance_id: 'intensity-3',
          rating: 5,
          fragrance: {
            intensity_level: 7, // Medium-strong
            complexity_score: 7,
            longevity_hours: 8
          }
        }
        // Notice: No light/moderate fragrances
      ];

      vi.spyOn(gapAnalyzer, 'getUserCollection').mockResolvedValue(intensitySkewedCollection);

      const intensityGaps = await gapAnalyzer.identifyIntensityGaps(testUserId);
      
      expect(intensityGaps.intensity_distribution).toBeDefined();
      expect(intensityGaps.gaps.length).toBeGreaterThan(0);
      expect(intensityGaps.versatility_score).toBeLessThan(0.5); // Low versatility

      // Should identify light fragrance gap
      const lightGap = intensityGaps.gaps.find(gap => gap.intensity_range === 'light');
      expect(lightGap?.priority).toBe('medium');
      expect(lightGap?.use_cases).toContain('daytime');
      expect(lightGap?.use_cases).toContain('office');

      // Should suggest specific light fragrances
      expect(lightGap?.recommendations.length).toBeGreaterThan(0);
      expect(lightGap?.recommendations[0].intensity_level).toBeLessThan(5);
    });

    it('COLLECTION-002d: Collection Diversity and Balance Assessment', async () => {
      const diversityTestCollections = [
        {
          name: 'highly_diverse',
          collection: [
            { fragrance_family: 'fresh', main_accords: ['citrus'] },
            { fragrance_family: 'oriental', main_accords: ['amber'] },
            { fragrance_family: 'woody', main_accords: ['cedar'] },
            { fragrance_family: 'floral', main_accords: ['rose'] },
            { fragrance_family: 'gourmand', main_accords: ['vanilla'] }
          ],
          expected_diversity: 'high'
        },
        {
          name: 'narrow_focus',
          collection: [
            { fragrance_family: 'oriental', main_accords: ['amber', 'vanilla'] },
            { fragrance_family: 'oriental', main_accords: ['oud', 'rose'] },
            { fragrance_family: 'oriental', main_accords: ['spicy', 'woody'] }
          ],
          expected_diversity: 'low'
        },
        {
          name: 'moderate_variety',
          collection: [
            { fragrance_family: 'oriental', main_accords: ['amber'] },
            { fragrance_family: 'oriental', main_accords: ['vanilla'] },
            { fragrance_family: 'woody', main_accords: ['sandalwood'] },
            { fragrance_family: 'fresh', main_accords: ['citrus'] }
          ],
          expected_diversity: 'medium'
        }
      ];

      for (const testCase of diversityTestCollections) {
        vi.spyOn(gapAnalyzer, 'getUserCollection').mockResolvedValue(
          testCase.collection.map((frag, i) => ({
            fragrance_id: `diversity-${i}`,
            rating: 4,
            fragrance: frag
          }))
        );

        const diversityAnalysis = await gapAnalyzer.analyzeDiversity(testUserId);
        
        expect(diversityAnalysis.diversity_level).toBe(testCase.expected_diversity);
        expect(diversityAnalysis.balance_score).toBeGreaterThan(0);
        expect(diversityAnalysis.recommendations).toBeDefined();

        if (testCase.expected_diversity === 'low') {
          expect(diversityAnalysis.balance_score).toBeLessThan(0.4);
          expect(diversityAnalysis.recommendations.expand_families.length).toBeGreaterThan(2);
        } else if (testCase.expected_diversity === 'high') {
          expect(diversityAnalysis.balance_score).toBeGreaterThan(0.8);
          expect(diversityAnalysis.recommendations.maintain_balance).toBe(true);
        }
      }
    });
  });

  describe('COLLECTION-003: Personality Profiling Tests', () => {
    let personalityProfiler: PersonalityProfiler;
    let testUserId: string;

    beforeEach(() => {
      testUserId = randomUUID();
      personalityProfiler = new PersonalityProfiler({
        supabase,
        enablePsychologicalAnalysis: true,
        enableLifestyleInference: true,
        enablePersonalityTraits: true
      });
    });

    it('COLLECTION-003a: Fragrance Personality Archetype Detection', async () => {
      const personalityTestCollections = [
        {
          archetype: 'sophisticated_minimalist',
          collection: [
            { 
              fragrance_family: 'woody',
              brand: 'Tom Ford',
              rating: 5,
              usage_frequency: 'daily',
              price_paid: 200,
              main_accords: ['sandalwood', 'cedar']
            },
            {
              fragrance_family: 'fresh',
              brand: 'Creed',
              rating: 5,
              usage_frequency: 'weekly',
              price_paid: 300,
              main_accords: ['bergamot', 'citrus']
            }
          ]
        },
        {
          archetype: 'adventurous_explorer',
          collection: [
            { fragrance_family: 'gourmand', brand: 'Unknown Niche', rating: 4 },
            { fragrance_family: 'leather', brand: 'Indie Brand', rating: 5 },
            { fragrance_family: 'incense', brand: 'Experimental', rating: 3 },
            { fragrance_family: 'animalic', brand: 'Avant Garde', rating: 4 },
            { fragrance_family: 'smoky', brand: 'Unique', rating: 5 }
          ]
        },
        {
          archetype: 'romantic_traditionalist',
          collection: [
            { fragrance_family: 'floral', brand: 'Chanel', rating: 5, main_accords: ['rose'] },
            { fragrance_family: 'oriental', brand: 'Guerlain', rating: 5, main_accords: ['vanilla'] },
            { fragrance_family: 'floral', brand: 'Dior', rating: 4, main_accords: ['jasmine'] }
          ]
        }
      ];

      for (const testCase of personalityTestCollections) {
        vi.spyOn(personalityProfiler, 'getUserCollection').mockResolvedValue(
          testCase.collection.map((frag, i) => ({
            fragrance_id: `personality-${i}`,
            rating: frag.rating,
            usage_frequency: frag.usage_frequency || 'occasional',
            fragrance: {
              ...frag,
              fragrance_brands: { name: frag.brand }
            }
          }))
        );

        const personality = await personalityProfiler.generatePersonalityProfile(testUserId);
        
        expect(personality.archetype).toBe(testCase.archetype);
        expect(personality.confidence).toBeGreaterThan(0.6);
        expect(personality.traits.length).toBeGreaterThan(2);
        expect(personality.lifestyle_indicators).toBeDefined();

        // Verify archetype-specific traits
        if (testCase.archetype === 'sophisticated_minimalist') {
          expect(personality.traits).toContain('quality_focused');
          expect(personality.traits).toContain('minimalist');
          expect(personality.lifestyle_indicators.luxury_orientation).toBeGreaterThan(0.7);
        } else if (testCase.archetype === 'adventurous_explorer') {
          expect(personality.traits).toContain('experimental');
          expect(personality.traits).toContain('open_to_new_experiences');
          expect(personality.lifestyle_indicators.exploration_tendency).toBeGreaterThan(0.8);
        }
      }
    });

    it('COLLECTION-003b: Lifestyle and Demographic Inference', async () => {
      const lifestyleCollection = [
        {
          fragrance_id: 'lifestyle-1',
          rating: 5,
          usage_frequency: 'daily',
          occasions: ['office', 'business'],
          fragrance: {
            fragrance_family: 'fresh',
            intensity_level: 5,
            longevity_hours: 6,
            main_accords: ['citrus', 'clean']
          }
        },
        {
          fragrance_id: 'lifestyle-2',
          rating: 5,
          usage_frequency: 'weekly',
          occasions: ['evening', 'date'],
          fragrance: {
            fragrance_family: 'oriental',
            intensity_level: 8,
            longevity_hours: 10,
            main_accords: ['vanilla', 'amber']
          }
        },
        {
          fragrance_id: 'lifestyle-3',
          rating: 4,
          usage_frequency: 'weekend',
          occasions: ['casual', 'outdoor'],
          fragrance: {
            fragrance_family: 'woody',
            intensity_level: 6,
            longevity_hours: 8,
            main_accords: ['cedar', 'pine']
          }
        }
      ];

      vi.spyOn(personalityProfiler, 'getUserCollection').mockResolvedValue(lifestyleCollection);

      const lifestyleInference = await personalityProfiler.inferLifestyle(testUserId);
      
      expect(lifestyleInference.work_style).toBeDefined();
      expect(lifestyleInference.social_style).toBeDefined();
      expect(lifestyleInference.activity_preferences).toBeDefined();
      expect(lifestyleInference.confidence).toBeGreaterThan(0.5);

      // Should infer professional lifestyle from office fragrance usage
      expect(lifestyleInference.work_style.type).toBe('professional');
      expect(lifestyleInference.work_style.confidence).toBeGreaterThan(0.7);
      expect(lifestyleInference.work_style.indicators).toContain('office_appropriate_scents');

      // Should infer active social life from date/evening fragrances
      expect(lifestyleInference.social_style.type).toBe('active');
      expect(lifestyleInference.social_style.evening_preference).toBe(true);
    });

    it('COLLECTION-003c: Collection Maturity and Experience Level', async () => {
      const experienceLevelTests = [
        {
          level: 'beginner',
          collection: [
            { brand: 'Designer Popular', fragrance_family: 'fresh', complexity: 3 },
            { brand: 'Mass Market', fragrance_family: 'floral', complexity: 4 },
            { brand: 'Accessible', fragrance_family: 'woody', complexity: 3 }
          ],
          collection_age_days: 30
        },
        {
          level: 'intermediate',
          collection: [
            { brand: 'Tom Ford', fragrance_family: 'oriental', complexity: 7 },
            { brand: 'Creed', fragrance_family: 'fresh', complexity: 6 },
            { brand: 'Le Labo', fragrance_family: 'woody', complexity: 8 },
            { brand: 'Maison Margiela', fragrance_family: 'gourmand', complexity: 7 }
          ],
          collection_age_days: 180
        },
        {
          level: 'expert',
          collection: [
            { brand: 'Amouage', fragrance_family: 'oriental', complexity: 9 },
            { brand: 'Serge Lutens', fragrance_family: 'animalic', complexity: 10 },
            { brand: 'L\'Artisan Parfumeur', fragrance_family: 'incense', complexity: 9 },
            { brand: 'Tiziana Terenzi', fragrance_family: 'gourmand', complexity: 8 },
            { brand: 'Papillon', fragrance_family: 'vintage', complexity: 10 }
          ],
          collection_age_days: 730
        }
      ];

      for (const test of experienceLevelTests) {
        vi.spyOn(personalityProfiler, 'getUserCollection').mockResolvedValue(
          test.collection.map((frag, i) => ({
            fragrance_id: `experience-${i}`,
            rating: 4,
            created_at: new Date(Date.now() - test.collection_age_days * 24 * 60 * 60 * 1000),
            fragrance: {
              ...frag,
              fragrance_brands: { name: frag.brand },
              complexity_score: frag.complexity
            }
          }))
        );

        const experienceAnalysis = await personalityProfiler.assessExperienceLevel(testUserId);
        
        expect(experienceAnalysis.experience_level).toBe(test.level);
        expect(experienceAnalysis.confidence).toBeGreaterThan(0.6);
        expect(experienceAnalysis.progression_indicators).toBeDefined();

        if (test.level === 'beginner') {
          expect(experienceAnalysis.complexity_comfort).toBeLessThan(0.5);
          expect(experienceAnalysis.next_level_recommendations).toContain('explore_niche_brands');
        } else if (test.level === 'expert') {
          expect(experienceAnalysis.complexity_comfort).toBeGreaterThan(0.8);
          expect(experienceAnalysis.expertise_areas.length).toBeGreaterThan(2);
        }
      }
    });

    it('COLLECTION-003d: Collection Journey and Evolution Analysis', async () => {
      const journeyCollection = [
        {
          fragrance_id: 'journey-1',
          rating: 5,
          created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
          fragrance: {
            fragrance_family: 'fresh',
            complexity_score: 3,
            fragrance_brands: { name: 'Acqua di Parma' }
          }
        },
        {
          fragrance_id: 'journey-2',
          rating: 4,
          created_at: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000), // 10 months ago
          fragrance: {
            fragrance_family: 'woody',
            complexity_score: 5,
            fragrance_brands: { name: 'Tom Ford' }
          }
        },
        {
          fragrance_id: 'journey-3',
          rating: 5,
          created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
          fragrance: {
            fragrance_family: 'oriental',
            complexity_score: 7,
            fragrance_brands: { name: 'Amouage' }
          }
        },
        {
          fragrance_id: 'journey-4',
          rating: 5,
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
          fragrance: {
            fragrance_family: 'animalic',
            complexity_score: 9,
            fragrance_brands: { name: 'Zoologist' }
          }
        }
      ];

      vi.spyOn(personalityProfiler, 'getUserCollection').mockResolvedValue(journeyCollection);

      const evolutionAnalysis = await personalityProfiler.analyzeCollectionEvolution(testUserId);
      
      expect(evolutionAnalysis.journey_stage).toBeDefined();
      expect(evolutionAnalysis.progression_pattern).toBeDefined();
      expect(evolutionAnalysis.complexity_evolution).toBeDefined();
      expect(evolutionAnalysis.predicted_next_interests).toBeDefined();

      // Should detect progression from simple to complex
      expect(evolutionAnalysis.complexity_evolution.trend).toBe('increasing');
      expect(evolutionAnalysis.complexity_evolution.rate).toBeGreaterThan(0.5);
      
      // Should predict continued exploration
      expect(evolutionAnalysis.predicted_next_interests).toContain('niche_exploration');
      expect(evolutionAnalysis.journey_stage).toBe('advanced_explorer');
      
      // Should suggest appropriate next steps
      expect(evolutionAnalysis.next_level_suggestions.length).toBeGreaterThan(0);
      expect(evolutionAnalysis.growth_opportunities).toBeDefined();
    });
  });

  describe('COLLECTION-004: Optimization Recommendations Tests', () => {
    let optimizer: CollectionOptimizer;
    let testUserId: string;

    beforeEach(() => {
      testUserId = randomUUID();
      optimizer = new CollectionOptimizer({
        supabase,
        enableBudgetOptimization: true,
        enableDiversityOptimization: true,
        enableUsageOptimization: true,
        optimizationGoals: ['balance', 'coverage', 'value']
      });
    });

    it('COLLECTION-004a: Collection Balance Optimization', async () => {
      const unbalancedCollection = [
        // Too many similar oriental fragrances
        { fragrance_family: 'oriental', rating: 5, usage_frequency: 'daily' },
        { fragrance_family: 'oriental', rating: 4, usage_frequency: 'weekly' },
        { fragrance_family: 'oriental', rating: 5, usage_frequency: 'occasional' },
        { fragrance_family: 'oriental', rating: 4, usage_frequency: 'special' },
        // One outlier
        { fragrance_family: 'fresh', rating: 3, usage_frequency: 'rare' }
      ];

      vi.spyOn(optimizer, 'getUserCollection').mockResolvedValue(
        unbalancedCollection.map((frag, i) => ({
          fragrance_id: `balance-${i}`,
          rating: frag.rating,
          usage_frequency: frag.usage_frequency,
          fragrance: {
            fragrance_family: frag.fragrance_family,
            rating_value: frag.rating,
            main_accords: ['test']
          }
        }))
      );

      const balanceOptimization = await optimizer.optimizeForBalance(testUserId);
      
      expect(balanceOptimization.optimization_type).toBe('diversification');
      expect(balanceOptimization.current_balance_score).toBeLessThan(0.4);
      expect(balanceOptimization.target_balance_score).toBeGreaterThan(0.7);
      expect(balanceOptimization.recommendations).toBeDefined();

      // Should recommend diversification
      expect(balanceOptimization.recommendations.add_families).toContain('woody');
      expect(balanceOptimization.recommendations.add_families).toContain('fresh');
      expect(balanceOptimization.recommendations.consider_reducing).toContain('oriental');

      // Should provide specific fragrance suggestions
      expect(balanceOptimization.specific_recommendations.length).toBeGreaterThan(0);
      expect(balanceOptimization.specific_recommendations[0].reason).toContain('diversify');
    });

    it('COLLECTION-004b: Budget and Value Optimization', async () => {
      const budgetTestScenarios = [
        {
          scenario: 'high_value_budget_conscious',
          budget: 500,
          collection: [
            { price_paid: 200, rating: 5, fragrance_family: 'oriental' },
            { price_paid: 150, rating: 4, fragrance_family: 'woody' },
            { price_paid: 80, rating: 5, fragrance_family: 'fresh' } // Great value
          ],
          expected_optimization: 'value_seeking'
        },
        {
          scenario: 'luxury_focused',
          budget: 2000,
          collection: [
            { price_paid: 350, rating: 5, fragrance_family: 'oriental' },
            { price_paid: 400, rating: 5, fragrance_family: 'woody' },
            { price_paid: 450, rating: 4, fragrance_family: 'fresh' }
          ],
          expected_optimization: 'premium_expansion'
        },
        {
          scenario: 'budget_constrained',
          budget: 200,
          collection: [
            { price_paid: 60, rating: 4, fragrance_family: 'fresh' },
            { price_paid: 45, rating: 3, fragrance_family: 'floral' },
            { price_paid: 80, rating: 5, fragrance_family: 'oriental' }
          ],
          expected_optimization: 'budget_maximization'
        }
      ];

      for (const scenario of budgetTestScenarios) {
        vi.spyOn(optimizer, 'getUserCollection').mockResolvedValue(
          scenario.collection.map((frag, i) => ({
            fragrance_id: `budget-${i}`,
            rating: frag.rating,
            purchase_price: frag.price_paid,
            fragrance: {
              fragrance_family: frag.fragrance_family,
              rating_value: frag.rating
            }
          }))
        );

        const budgetOptimization = await optimizer.optimizeForBudget(testUserId, scenario.budget);
        
        expect(budgetOptimization.optimization_strategy).toBe(scenario.expected_optimization);
        expect(budgetOptimization.current_efficiency_score).toBeGreaterThan(0);
        expect(budgetOptimization.projected_efficiency_score).toBeGreaterThan(budgetOptimization.current_efficiency_score);

        // Should provide budget-appropriate recommendations
        expect(budgetOptimization.recommendations.length).toBeGreaterThan(0);
        expect(budgetOptimization.recommendations.every(rec => rec.price <= scenario.budget)).toBe(true);

        if (scenario.expected_optimization === 'budget_maximization') {
          expect(budgetOptimization.value_opportunities.length).toBeGreaterThan(0);
          expect(budgetOptimization.recommendations[0].value_score).toBeGreaterThan(0.7);
        }
      }
    });

    it('COLLECTION-004c: Usage-Based Collection Optimization', async () => {
      const usageOptimizationCollection = [
        {
          fragrance_id: 'usage-opt-1',
          rating: 5,
          usage_frequency: 'daily',
          last_used: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          fragrance: { fragrance_family: 'fresh', longevity_hours: 6 }
        },
        {
          fragrance_id: 'usage-opt-2',
          rating: 4,
          usage_frequency: 'never', // Bought but never used
          last_used: null,
          fragrance: { fragrance_family: 'oriental', longevity_hours: 10 }
        },
        {
          fragrance_id: 'usage-opt-3',
          rating: 5,
          usage_frequency: 'weekly',
          last_used: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          fragrance: { fragrance_family: 'woody', longevity_hours: 8 }
        },
        {
          fragrance_id: 'usage-opt-4',
          rating: 3,
          usage_frequency: 'rarely', // Low rating, rarely used
          last_used: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
          fragrance: { fragrance_family: 'gourmand', longevity_hours: 4 }
        }
      ];

      vi.spyOn(optimizer, 'getUserCollection').mockResolvedValue(usageOptimizationCollection);

      const usageOptimization = await optimizer.optimizeForUsage(testUserId);
      
      expect(usageOptimization.usage_efficiency_score).toBeGreaterThan(0);
      expect(usageOptimization.underutilized_fragrances).toBeDefined();
      expect(usageOptimization.optimization_opportunities).toBeDefined();

      // Should identify underutilized fragrances
      const neverUsed = usageOptimization.underutilized_fragrances.find(
        frag => frag.fragrance_id === 'usage-opt-2'
      );
      expect(neverUsed?.usage_issue).toBe('never_used');
      expect(neverUsed?.recommendations).toContain('trial_recommendation');

      // Should identify poorly performing fragrances
      const poorPerformer = usageOptimization.underutilized_fragrances.find(
        frag => frag.fragrance_id === 'usage-opt-4'
      );
      expect(poorPerformer?.usage_issue).toBe('poor_performance');
      expect(poorPerformer?.recommendations).toContain('consider_replacement');

      // Should suggest optimization strategies
      expect(usageOptimization.optimization_opportunities.length).toBeGreaterThan(0);
      expect(usageOptimization.optimization_opportunities[0].strategy).toBeDefined();
    });

    it('COLLECTION-004d: Strategic Collection Planning', async () => {
      const strategicPlanningInputs = {
        current_collection_size: 8,
        target_collection_size: 12,
        collection_goals: ['seasonal_coverage', 'occasion_versatility', 'signature_scent'],
        budget_constraints: { 
          total_budget: 800,
          preferred_price_range: { min: 50, max: 200 }
        },
        priority_preferences: ['quality_over_quantity', 'fill_gaps', 'explore_new_families']
      };

      const strategicPlan = await optimizer.createStrategicPlan(testUserId, strategicPlanningInputs);
      
      expect(strategicPlan.plan_type).toBe('strategic_expansion');
      expect(strategicPlan.phases.length).toBeGreaterThan(1);
      expect(strategicPlan.total_estimated_cost).toBeLessThanOrEqual(strategicPlanningInputs.budget_constraints.total_budget);
      expect(strategicPlan.timeline_months).toBeGreaterThan(0);

      // Should prioritize gap filling based on goals
      const firstPhase = strategicPlan.phases[0];
      expect(firstPhase.goal).toBe('fill_critical_gaps');
      expect(firstPhase.recommended_additions.length).toBeGreaterThan(0);
      expect(firstPhase.budget_allocation).toBeGreaterThan(0);

      // Should provide specific acquisition recommendations
      expect(strategicPlan.recommended_acquisitions.length).toBeGreaterThan(0);
      expect(strategicPlan.recommended_acquisitions[0].priority_level).toBeDefined();
      expect(strategicPlan.recommended_acquisitions[0].gap_addressed).toBeDefined();
    });
  });

  describe('COLLECTION-005: Real-Time Insights and Updates Tests', () => {
    let insightGenerator: CollectionInsightGenerator;
    let testUserId: string;

    beforeEach(() => {
      testUserId = randomUUID();
      insightGenerator = new CollectionInsightGenerator({
        supabase,
        enableRealTimeUpdates: true,
        enablePredictiveInsights: true,
        insightRefreshInterval: 60000 // 1 minute
      });
    });

    it('COLLECTION-005a: Real-Time Collection Change Detection', async () => {
      // Simulate collection before and after adding a fragrance
      const beforeCollection = [
        {
          fragrance_id: 'before-1',
          rating: 5,
          fragrance: { fragrance_family: 'oriental', main_accords: ['vanilla'] }
        },
        {
          fragrance_id: 'before-2',
          rating: 4,
          fragrance: { fragrance_family: 'woody', main_accords: ['cedar'] }
        }
      ];

      const afterCollection = [
        ...beforeCollection,
        {
          fragrance_id: 'new-addition',
          rating: 5,
          fragrance: { fragrance_family: 'fresh', main_accords: ['citrus', 'aquatic'] }
        }
      ];

      // Mock collection change
      vi.spyOn(insightGenerator, 'getUserCollection')
        .mockResolvedValueOnce(beforeCollection)
        .mockResolvedValueOnce(afterCollection);

      const changeDetection = await insightGenerator.detectCollectionChanges(testUserId, {
        change_type: 'addition',
        fragrance_id: 'new-addition',
        rating: 5
      });
      
      expect(changeDetection.change_detected).toBe(true);
      expect(changeDetection.impact_analysis).toBeDefined();
      expect(changeDetection.new_insights).toBeDefined();
      expect(changeDetection.updated_recommendations).toBeDefined();

      // Should detect family expansion
      expect(changeDetection.impact_analysis.family_expansion).toBe(true);
      expect(changeDetection.impact_analysis.diversity_improvement).toBeGreaterThan(0);
      
      // Should generate new insights based on addition
      expect(changeDetection.new_insights.length).toBeGreaterThan(0);
      expect(changeDetection.new_insights[0].type).toBe('preference_evolution');
    });

    it('COLLECTION-005b: Predictive Collection Insights', async () => {
      const trendingCollection = [
        {
          fragrance_id: 'trending-1',
          rating: 5,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Recent
          fragrance: {
            fragrance_family: 'oriental',
            trending_score: 85,
            main_accords: ['oud', 'rose']
          }
        },
        {
          fragrance_id: 'trending-2', 
          rating: 4,
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          fragrance: {
            fragrance_family: 'oriental',
            trending_score: 90,
            main_accords: ['amber', 'vanilla']
          }
        }
      ];

      vi.spyOn(insightGenerator, 'getUserCollection').mockResolvedValue(trendingCollection);

      const predictiveInsights = await insightGenerator.generatePredictiveInsights(testUserId);
      
      expect(predictiveInsights.trend_predictions).toBeDefined();
      expect(predictiveInsights.preference_evolution_forecast).toBeDefined();
      expect(predictiveInsights.upcoming_opportunities).toBeDefined();
      expect(predictiveInsights.risk_analysis).toBeDefined();

      // Should predict continued interest in oriental fragrances
      expect(predictiveInsights.preference_evolution_forecast.strengthening_preferences).toContain('oriental');
      expect(predictiveInsights.preference_evolution_forecast.confidence).toBeGreaterThan(0.7);

      // Should identify opportunities based on trends
      expect(predictiveInsights.upcoming_opportunities.length).toBeGreaterThan(0);
      expect(predictiveInsights.upcoming_opportunities[0].opportunity_type).toBeDefined();
      expect(predictiveInsights.upcoming_opportunities[0].time_sensitivity).toBeDefined();
    });

    it('COLLECTION-005c: Collection Health Monitoring', async () => {
      const healthMonitoringCollection = [
        {
          fragrance_id: 'health-1',
          rating: 5,
          usage_frequency: 'daily',
          last_used: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          fragrance: {
            fragrance_family: 'fresh',
            longevity_hours: 6,
            performance_issues: false
          }
        },
        {
          fragrance_id: 'health-2',
          rating: 4,
          usage_frequency: 'never',
          last_used: null,
          purchase_date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
          fragrance: {
            fragrance_family: 'oriental',
            longevity_hours: 10,
            performance_issues: false
          }
        },
        {
          fragrance_id: 'health-3',
          rating: 2, // Poor rating
          usage_frequency: 'rarely',
          last_used: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 4 months ago
          fragrance: {
            fragrance_family: 'gourmand',
            longevity_hours: 3, // Poor performance
            performance_issues: true
          }
        }
      ];

      vi.spyOn(insightGenerator, 'getUserCollection').mockResolvedValue(healthMonitoringCollection);

      const healthAnalysis = await insightGenerator.analyzeCollectionHealth(testUserId);
      
      expect(healthAnalysis.overall_health_score).toBeGreaterThan(0);
      expect(healthAnalysis.health_issues).toBeDefined();
      expect(healthAnalysis.optimization_recommendations).toBeDefined();
      expect(healthAnalysis.health_trends).toBeDefined();

      // Should identify health issues
      const healthIssues = healthAnalysis.health_issues;
      const unusedFragranceIssue = healthIssues.find(issue => issue.type === 'unused_fragrance');
      const poorPerformanceIssue = healthIssues.find(issue => issue.type === 'poor_performance');

      expect(unusedFragranceIssue?.fragrance_id).toBe('health-2');
      expect(unusedFragranceIssue?.severity).toBe('medium');
      expect(poorPerformanceIssue?.fragrance_id).toBe('health-3');
      expect(poorPerformanceIssue?.severity).toBe('high');

      // Should provide actionable recommendations
      expect(healthAnalysis.optimization_recommendations.length).toBeGreaterThan(0);
      expect(healthAnalysis.optimization_recommendations[0].action_type).toBeDefined();
    });

    it('COLLECTION-005d: Smart Collection Notifications', async () => {
      const notificationTriggers = [
        {
          trigger_type: 'seasonal_transition',
          context: { from_season: 'summer', to_season: 'fall' },
          expected_notification: 'seasonal_preparation'
        },
        {
          trigger_type: 'new_high_rating',
          context: { fragrance_id: 'new-favorite', rating: 5, family: 'oriental' },
          expected_notification: 'preference_strengthening'
        },
        {
          trigger_type: 'unused_fragrance_alert',
          context: { fragrance_id: 'unused', days_unused: 90 },
          expected_notification: 'usage_optimization'
        },
        {
          trigger_type: 'collection_milestone',
          context: { milestone_type: 'family_complete', family: 'woody' },
          expected_notification: 'achievement_unlock'
        }
      ];

      for (const trigger of notificationTriggers) {
        const notification = await insightGenerator.generateSmartNotification(testUserId, trigger);
        
        expect(notification.notification_type).toBe(trigger.expected_notification);
        expect(notification.priority).toBeDefined();
        expect(notification.message).toBeDefined();
        expect(notification.actionable_suggestions).toBeDefined();
        expect(notification.timing_appropriate).toBe(true);

        // Verify notification content quality
        expect(notification.message.length).toBeGreaterThan(20);
        expect(notification.actionable_suggestions.length).toBeGreaterThan(0);
        
        if (trigger.trigger_type === 'seasonal_transition') {
          expect(notification.message).toContain('fall');
          expect(notification.actionable_suggestions[0]).toContain('seasonal');
        }
      }
    });
  });

  describe('COLLECTION-006: Advanced Analytics Tests', () => {
    it('COLLECTION-006a: Collection DNA and Signature Analysis', async () => {
      const signatureCollection = [
        {
          fragrance_id: 'signature-1',
          rating: 5,
          usage_frequency: 'daily',
          signature_rating: 9, // Strong signature potential
          fragrance: {
            fragrance_family: 'oriental',
            main_accords: ['vanilla', 'amber', 'spicy'],
            uniqueness_score: 7,
            versatility_score: 8
          }
        },
        {
          fragrance_id: 'signature-2',
          rating: 4,
          usage_frequency: 'weekly',
          signature_rating: 6,
          fragrance: {
            fragrance_family: 'woody',
            main_accords: ['sandalwood', 'cedar'],
            uniqueness_score: 6,
            versatility_score: 9
          }
        }
      ];

      const collectionIntelligence = new CollectionIntelligenceEngine({
        supabase,
        enableAdvancedAnalytics: true
      });

      vi.spyOn(collectionIntelligence, 'getUserCollection').mockResolvedValue(signatureCollection);

      const dnaAnalysis = await collectionIntelligence.analyzeCollectionDNA(testUserId);
      
      expect(dnaAnalysis.collection_dna).toBeDefined();
      expect(dnaAnalysis.signature_scent_potential).toBeDefined();
      expect(dnaAnalysis.uniqueness_factors).toBeDefined();
      expect(dnaAnalysis.collection_character).toBeDefined();

      // Should identify collection's unique characteristics
      expect(dnaAnalysis.collection_dna.dominant_characteristics).toContain('warm');
      expect(dnaAnalysis.collection_dna.secondary_characteristics).toBeDefined();
      expect(dnaAnalysis.signature_scent_potential.top_candidates.length).toBeGreaterThan(0);

      // Signature potential should rank highly-rated, frequently used fragrances
      const topSignatureCandidate = dnaAnalysis.signature_scent_potential.top_candidates[0];
      expect(topSignatureCandidate.fragrance_id).toBe('signature-1');
      expect(topSignatureCandidate.signature_score).toBeGreaterThan(0.8);
    });

    it('COLLECTION-006b: Collection Mood and Emotion Mapping', async () => {
      const emotionalCollection = [
        {
          fragrance_id: 'mood-1',
          rating: 5,
          emotional_tags: ['confident', 'powerful', 'seductive'],
          mood_contexts: ['important_meetings', 'date_nights'],
          fragrance: {
            fragrance_family: 'oriental',
            intensity_level: 8,
            mood_profile: { confidence: 0.9, seduction: 0.8, power: 0.85 }
          }
        },
        {
          fragrance_id: 'mood-2',
          rating: 4,
          emotional_tags: ['fresh', 'energetic', 'optimistic'],
          mood_contexts: ['morning_routine', 'casual_outings'],
          fragrance: {
            fragrance_family: 'fresh',
            intensity_level: 5,
            mood_profile: { energy: 0.9, freshness: 0.95, optimism: 0.8 }
          }
        },
        {
          fragrance_id: 'mood-3',
          rating: 5,
          emotional_tags: ['sophisticated', 'elegant', 'timeless'],
          mood_contexts: ['formal_events', 'professional_meetings'],
          fragrance: {
            fragrance_family: 'chypre',
            intensity_level: 6,
            mood_profile: { sophistication: 0.95, elegance: 0.9, timelessness: 0.85 }
          }
        }
      ];

      vi.spyOn(insightGenerator, 'getUserCollection').mockResolvedValue(emotionalCollection);

      const moodMapping = await insightGenerator.generateMoodMapping(testUserId);
      
      expect(moodMapping.emotional_preferences).toBeDefined();
      expect(moodMapping.mood_fragrance_associations).toBeDefined();
      expect(moodMapping.emotional_gaps).toBeDefined();
      expect(moodMapping.mood_journey_insights).toBeDefined();

      // Should map emotional preferences correctly
      const confidencePreference = moodMapping.emotional_preferences.find(
        pref => pref.emotion === 'confident'
      );
      expect(confidencePreference?.strength).toBeGreaterThan(0.8);
      expect(confidencePreference?.associated_fragrances).toContain('mood-1');

      // Should identify emotional gaps
      expect(moodMapping.emotional_gaps.length).toBeGreaterThan(0);
      const relaxationGap = moodMapping.emotional_gaps.find(gap => gap.emotion === 'relaxation');
      if (relaxationGap) {
        expect(relaxationGap.priority).toBe('medium');
        expect(relaxationGap.recommended_families).toContain('lavender');
      }
    });

    it('COLLECTION-006c: Cross-Platform Collection Integration', async () => {
      const crossPlatformData = {
        fragrantica_data: {
          owned: ['cross-1', 'cross-2'],
          wishlist: ['cross-3', 'cross-4'],
          ratings: { 'cross-1': 5, 'cross-2': 4 }
        },
        other_platforms: {
          basenotes_reviews: ['cross-1'],
          perfume_society_collection: ['cross-2', 'cross-5']
        },
        social_mentions: {
          instagram_posts: ['cross-1', 'cross-3'],
          fragrance_reviews: ['cross-2']
        }
      };

      const integrationAnalysis = await insightGenerator.analyzeCrossPlatformCollection(
        testUserId,
        crossPlatformData
      );
      
      expect(integrationAnalysis.platform_consistency).toBeGreaterThan(0);
      expect(integrationAnalysis.external_validation).toBeDefined();
      expect(integrationAnalysis.social_influence_factors).toBeDefined();
      expect(integrationAnalysis.authenticity_score).toBeGreaterThan(0.5);

      // Should identify consistent preferences across platforms
      expect(integrationAnalysis.consistent_favorites).toContain('cross-1');
      expect(integrationAnalysis.platform_specific_preferences).toBeDefined();
      
      // Should detect social influence
      if (integrationAnalysis.social_influence_factors.influenced_choices.length > 0) {
        expect(integrationAnalysis.social_influence_factors.influence_strength).toBeGreaterThan(0);
      }
    });
  });

  describe('COLLECTION-007: Integration with Recommendation Engine Tests', () => {
    it('COLLECTION-007a: Collection-Informed Recommendations', async () => {
      const wellRoundedCollection = [
        {
          fragrance_id: 'integrated-1',
          rating: 5,
          fragrance: {
            fragrance_family: 'oriental',
            embedding: Array.from({ length: 2000 }, () => 0.1),
            main_accords: ['vanilla', 'amber']
          }
        },
        {
          fragrance_id: 'integrated-2',
          rating: 4,
          fragrance: {
            fragrance_family: 'woody',
            embedding: Array.from({ length: 2000 }, () => 0.2),
            main_accords: ['sandalwood', 'cedar']
          }
        }
      ];

      const collectionEngine = new CollectionIntelligenceEngine({
        supabase,
        enableRecommendationIntegration: true
      });

      vi.spyOn(collectionEngine, 'getUserCollection').mockResolvedValue(wellRoundedCollection);

      const collectionBasedRecs = await collectionEngine.generateCollectionBasedRecommendations(testUserId, {
        recommendation_types: ['gap_filling', 'collection_complement', 'exploration'],
        max_recommendations: 10,
        include_explanations: true
      });
      
      expect(collectionBasedRecs.success).toBe(true);
      expect(collectionBasedRecs.recommendations.length).toBeGreaterThan(0);
      expect(collectionBasedRecs.collection_analysis_used).toBe(true);

      // Should provide different types of recommendations
      const gapFillingRec = collectionBasedRecs.recommendations.find(
        rec => rec.recommendation_type === 'gap_filling'
      );
      const complementRec = collectionBasedRecs.recommendations.find(
        rec => rec.recommendation_type === 'collection_complement'
      );

      expect(gapFillingRec?.gap_addressed).toBeDefined();
      expect(gapFillingRec?.collection_impact).toBeGreaterThan(0.5);
      expect(complementRec?.similarity_to_favorites).toBeGreaterThan(0.7);

      // Each recommendation should have detailed explanations
      collectionBasedRecs.recommendations.forEach(rec => {
        expect(rec.explanation).toBeDefined();
        expect(rec.collection_rationale).toBeDefined();
        expect(rec.confidence_score).toBeGreaterThan(0);
      });
    });

    it('COLLECTION-007b: Dynamic Preference Weight Adjustment', async () => {
      const preferenceLearningCollection = [
        {
          fragrance_id: 'learning-1',
          rating: 5,
          added_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          fragrance: { 
            fragrance_family: 'oriental', 
            main_accords: ['oud', 'rose'],
            embedding: Array.from({ length: 2000 }, () => 0.1)
          }
        },
        {
          fragrance_id: 'learning-2',
          rating: 5,
          added_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          fragrance: { 
            fragrance_family: 'oriental', 
            main_accords: ['amber', 'vanilla'],
            embedding: Array.from({ length: 2000 }, () => 0.11)
          }
        },
        {
          fragrance_id: 'learning-3',
          rating: 2, // Recent dislike
          added_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          fragrance: { 
            fragrance_family: 'fresh', 
            main_accords: ['aquatic', 'marine'],
            embedding: Array.from({ length: 2000 }, () => 0.8)
          }
        }
      ];

      const dynamicEngine = new CollectionIntelligenceEngine({
        supabase,
        enableDynamicWeighting: true,
        learningRate: 0.1
      });

      vi.spyOn(dynamicEngine, 'getUserCollection').mockResolvedValue(preferenceLearningCollection);

      const dynamicWeights = await dynamicEngine.calculateDynamicPreferenceWeights(testUserId);
      
      expect(dynamicWeights.family_weights).toBeDefined();
      expect(dynamicWeights.note_weights).toBeDefined();
      expect(dynamicWeights.learning_confidence).toBeGreaterThan(0);
      expect(dynamicWeights.weight_changes).toBeDefined();

      // Oriental should have high weight (recent positive ratings)
      expect(dynamicWeights.family_weights.oriental).toBeGreaterThan(0.7);
      
      // Fresh should have negative weight (recent negative rating)
      expect(dynamicWeights.family_weights.fresh).toBeLessThan(0.3);
      
      // Should track learning trajectory
      expect(dynamicWeights.learning_trajectory.direction).toBe('towards_oriental');
      expect(dynamicWeights.learning_trajectory.confidence).toBeGreaterThan(0.6);
    });

    it('COLLECTION-007c: Collection-Based Similarity Search', async () => {
      const referenceCollection = [
        {
          fragrance_id: 'ref-1',
          rating: 5,
          fragrance: {
            embedding: Array.from({ length: 2000 }, () => 0.1),
            fragrance_family: 'oriental',
            main_accords: ['vanilla', 'amber']
          }
        },
        {
          fragrance_id: 'ref-2',
          rating: 5,
          fragrance: {
            embedding: Array.from({ length: 2000 }, () => 0.12),
            fragrance_family: 'oriental',
            main_accords: ['oud', 'rose']
          }
        }
      ];

      const collectionEngine = new CollectionIntelligenceEngine({
        supabase,
        enableVectorSimilarity: true
      });

      vi.spyOn(collectionEngine, 'getUserCollection').mockResolvedValue(referenceCollection);

      // Mock similar fragrances in database
      vi.spyOn(collectionEngine, 'findSimilarToCollection').mockResolvedValue([
        {
          fragrance_id: 'similar-1',
          collection_similarity: 0.91,
          similar_to: ['ref-1', 'ref-2'],
          fragrance: {
            name: 'Very Similar Fragrance',
            fragrance_family: 'oriental',
            main_accords: ['vanilla', 'amber', 'oud']
          }
        },
        {
          fragrance_id: 'similar-2',
          collection_similarity: 0.83,
          similar_to: ['ref-1'],
          fragrance: {
            name: 'Somewhat Similar Fragrance',
            fragrance_family: 'oriental',
            main_accords: ['vanilla', 'spicy']
          }
        }
      ]);

      const similaritySearch = await collectionEngine.findFragrancesSimilarToCollection(testUserId, {
        similarity_threshold: 0.8,
        max_results: 5,
        exclude_owned: true
      });
      
      expect(similaritySearch.success).toBe(true);
      expect(similaritySearch.similar_fragrances.length).toBeGreaterThan(0);
      expect(similaritySearch.collection_embedding_used).toBe(true);

      // Most similar fragrance should rank first
      expect(similaritySearch.similar_fragrances[0].fragrance_id).toBe('similar-1');
      expect(similaritySearch.similar_fragrances[0].collection_similarity).toBeGreaterThan(0.9);
      expect(similaritySearch.similar_fragrances[0].explanation).toContain('collection');
    });
  });

  describe('COLLECTION-008: Performance and Scalability Tests', () => {
    it('COLLECTION-008a: Large Collection Analysis Performance', async () => {
      // Simulate large collection (100+ fragrances)
      const largeCollection = Array.from({ length: 150 }, (_, i) => ({
        fragrance_id: `large-${i}`,
        rating: Math.floor(Math.random() * 5) + 1,
        usage_frequency: ['daily', 'weekly', 'monthly', 'occasional', 'special'][Math.floor(Math.random() * 5)],
        fragrance: {
          fragrance_family: ['oriental', 'woody', 'fresh', 'floral', 'gourmand'][Math.floor(Math.random() * 5)],
          main_accords: ['vanilla', 'cedar', 'citrus', 'rose', 'chocolate'].slice(0, Math.floor(Math.random() * 3) + 1),
          embedding: Array.from({ length: 2000 }, () => Math.random()),
          rating_value: Math.random() * 5
        }
      }));

      const performanceEngine = new CollectionIntelligenceEngine({
        supabase,
        enablePerformanceOptimization: true,
        maxAnalysisTime: 5000 // 5 second timeout
      });

      vi.spyOn(performanceEngine, 'getUserCollection').mockResolvedValue(largeCollection);

      const startTime = Date.now();
      const largeCollectionAnalysis = await performanceEngine.analyzeCollection(testUserId);
      const analysisTime = Date.now() - startTime;
      
      expect(largeCollectionAnalysis.success).toBe(true);
      expect(analysisTime).toBeLessThan(5000); // Should complete within timeout
      expect(largeCollectionAnalysis.performance_metrics).toBeDefined();
      expect(largeCollectionAnalysis.analysis_complexity).toBe('high');

      // Should still provide comprehensive analysis
      expect(largeCollectionAnalysis.insights.scent_family_analysis).toBeDefined();
      expect(largeCollectionAnalysis.insights.gap_analysis).toBeDefined();
      expect(largeCollectionAnalysis.insights.optimization_recommendations).toBeDefined();

      // Performance metrics should be tracked
      expect(largeCollectionAnalysis.performance_metrics.analysis_time_ms).toBe(analysisTime);
      expect(largeCollectionAnalysis.performance_metrics.collection_size).toBe(150);
      expect(largeCollectionAnalysis.performance_metrics.complexity_score).toBeGreaterThan(0.7);
    });

    it('COLLECTION-008b: Concurrent Analysis Request Handling', async () => {
      const concurrentEngine = new CollectionIntelligenceEngine({
        supabase,
        enableConcurrencyControl: true,
        maxConcurrentAnalyses: 5
      });

      // Simulate multiple concurrent analysis requests
      const concurrentUsers = Array.from({ length: 8 }, () => randomUUID());
      
      const analysisPromises = concurrentUsers.map(userId => 
        concurrentEngine.analyzeCollection(userId)
      );

      const startTime = Date.now();
      const results = await Promise.allSettled(analysisPromises);
      const totalTime = Date.now() - startTime;

      // Should handle concurrency gracefully
      const successful = results.filter(r => r.status === 'fulfilled');
      const throttled = results.filter(r => 
        r.status === 'rejected' && r.reason.message.includes('throttled')
      );

      expect(successful.length).toBeGreaterThanOrEqual(5); // At least max concurrent should succeed
      expect(totalTime).toBeLessThan(10000); // Should complete within reasonable time
      
      // System should maintain quality under load
      if (successful.length > 0) {
        const successfulResult = successful[0].value;
        expect(successfulResult.analysis_quality).toBeDefined();
      }
    });

    it('COLLECTION-008c: Cache Performance and Intelligence', async () => {
      const cachingEngine = new CollectionIntelligenceEngine({
        supabase,
        enableIntelligentCaching: true,
        cacheInvalidationStrategy: 'smart'
      });

      const userId = randomUUID();
      
      // First analysis - should cache results
      const firstAnalysis = await cachingEngine.analyzeCollection(userId);
      expect(firstAnalysis.cache_used).toBe(false);

      // Second analysis - should use cache
      const secondAnalysis = await cachingEngine.analyzeCollection(userId);
      expect(secondAnalysis.cache_used).toBe(true);
      expect(secondAnalysis.cache_age_seconds).toBeLessThan(60);

      // Simulate collection change that should invalidate cache
      await cachingEngine.invalidateCacheOnCollectionChange(userId, {
        change_type: 'rating_update',
        fragrance_id: 'test-fragrance',
        old_rating: 3,
        new_rating: 5,
        impact_level: 'medium'
      });

      // Next analysis should not use cache
      const thirdAnalysis = await cachingEngine.analyzeCollection(userId);
      expect(thirdAnalysis.cache_used).toBe(false);
      expect(thirdAnalysis.cache_invalidation_reason).toBe('collection_change');
    });
  });
});

// Type definitions for testing
interface CollectionAnalysis {
  success: boolean;
  insights: any;
  personality_profile: CollectionPersonality;
  gap_analysis: GapAnalysisResult;
  optimization_plan: OptimizationPlan;
  cache_used?: boolean;
  performance_metrics?: any;
}

interface GapAnalysisResult {
  seasonal_gaps: any[];
  occasion_gaps: any[];
  intensity_gaps: any[];
  family_gaps: any[];
  priority_scores: Record<string, number>;
}

interface CollectionPersonality {
  archetype: string;
  traits: string[];
  lifestyle_indicators: any;
  confidence: number;
}

interface OptimizationPlan {
  optimization_type: string;
  current_scores: any;
  target_scores: any;
  recommendations: any[];
  timeline: any;
}