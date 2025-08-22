/**
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  VariantDetector,
  PrimaryVariantSelector,
  BadgeAssigner,
  ExperienceRecommender,
  VariantGrouper,
  type FragranceVariant,
  type VariantGroup
} from '@/lib/search/variant-grouping';

describe('Variant Grouping System - SCE-68', () => {
  const mockSauvageVariants: FragranceVariant[] = [
    {
      id: 'sauvage-edp',
      name: 'Sauvage Eau de Parfum',
      brand: 'Dior',
      brand_id: 'dior-brand',
      intensity_score: 7,
      longevity_hours: 8,
      sample_available: true,
      sample_price_usd: 12,
      popularity_score: 95,
      fragrance_family: 'fresh',
      notes: ['bergamot', 'pepper', 'lavender', 'ambroxan']
    },
    {
      id: 'sauvage-edt',
      name: 'Sauvage Eau de Toilette',
      brand: 'Dior',
      brand_id: 'dior-brand',
      intensity_score: 6,
      longevity_hours: 6,
      sample_available: true,
      sample_price_usd: 10,
      popularity_score: 87,
      fragrance_family: 'fresh',
      notes: ['bergamot', 'pepper', 'lavender', 'ambroxan']
    },
    {
      id: 'sauvage-elixir',
      name: 'Sauvage Elixir',
      brand: 'Dior',
      brand_id: 'dior-brand',
      intensity_score: 9,
      longevity_hours: 12,
      sample_available: true,
      sample_price_usd: 18,
      popularity_score: 72,
      fragrance_family: 'fresh',
      notes: ['bergamot', 'pepper', 'lavender', 'ambroxan', 'cardamom']
    },
    {
      id: 'sauvage-parfum',
      name: 'Sauvage Parfum',
      brand: 'Dior',
      brand_id: 'dior-brand',
      intensity_score: 8,
      longevity_hours: 10,
      sample_available: false,
      popularity_score: 63,
      fragrance_family: 'fresh',
      notes: ['bergamot', 'pepper', 'lavender', 'sandalwood']
    },
    {
      id: 'eau-sauvage',
      name: 'Eau Sauvage',
      brand: 'Dior',
      brand_id: 'dior-brand',
      intensity_score: 4,
      longevity_hours: 4,
      sample_available: true,
      sample_price_usd: 8,
      popularity_score: 45,
      fragrance_family: 'fresh',
      notes: ['lemon', 'basil', 'jasmine', 'oakmoss']
    }
  ];

  const mockUnrelatedFragrances: FragranceVariant[] = [
    {
      id: 'bleu-chanel',
      name: 'Bleu de Chanel EDP',
      brand: 'Chanel',
      brand_id: 'chanel-brand',
      intensity_score: 7,
      longevity_hours: 8,
      popularity_score: 92,
      fragrance_family: 'woody',
      notes: ['grapefruit', 'lemon', 'cedar', 'sandalwood']
    },
    {
      id: 'acqua-di-gio',
      name: 'Acqua di Gio',
      brand: 'Giorgio Armani',
      brand_id: 'armani-brand',
      intensity_score: 5,
      longevity_hours: 6,
      popularity_score: 89,
      fragrance_family: 'fresh',
      notes: ['lime', 'bergamot', 'jasmine', 'cedar']
    }
  ];

  describe('VariantDetector', () => {
    it('should detect Sauvage EDP and EDT as variants', () => {
      const similarity = VariantDetector.detectVariants(
        mockSauvageVariants[0], // Sauvage EDP
        mockSauvageVariants[1]  // Sauvage EDT
      );

      expect(similarity).toBeGreaterThan(0.8);
    });

    it('should detect Sauvage and Eau Sauvage as different fragrances', () => {
      const similarity = VariantDetector.detectVariants(
        mockSauvageVariants[0], // Sauvage EDP
        mockSauvageVariants[4]  // Eau Sauvage
      );

      expect(similarity).toBeLessThan(0.7);
    });

    it('should not detect variants across different brands', () => {
      const similarity = VariantDetector.detectVariants(
        mockSauvageVariants[0], // Dior Sauvage
        mockUnrelatedFragrances[0] // Chanel Bleu
      );

      expect(similarity).toBe(0);
    });

    it('should handle fragrances with missing notes gracefully', () => {
      const variant1 = { ...mockSauvageVariants[0], notes: undefined };
      const variant2 = { ...mockSauvageVariants[1], notes: [] };

      const similarity = VariantDetector.detectVariants(variant1, variant2);
      expect(similarity).toBeGreaterThan(0.5); // Should still detect via name similarity
    });

    it('should properly extract base names from fragrance names', () => {
      const testCases = [
        { input: 'Sauvage Eau de Parfum', expected: true },
        { input: 'Sauvage EDP', expected: true },
        { input: 'Sauvage EDT', expected: true },
        { input: 'Sauvage Elixir', expected: true },
        { input: 'Sauvage Parfum', expected: true },
        { input: 'Bleu de Chanel EDP', expected: false }
      ];

      const baseFragrance = mockSauvageVariants[0];
      
      testCases.forEach(({ input, expected }) => {
        const testVariant = { ...baseFragrance, name: input };
        const similarity = VariantDetector.detectVariants(baseFragrance, testVariant);
        
        if (expected) {
          expect(similarity).toBeGreaterThan(0.8);
        } else {
          expect(similarity).toBeLessThan(0.5);
        }
      });
    });
  });

  describe('PrimaryVariantSelector', () => {
    it('should select Sauvage EDP as primary due to highest popularity', () => {
      const primary = PrimaryVariantSelector.selectPrimary(mockSauvageVariants.slice(0, 4));
      expect(primary.id).toBe('sauvage-edp');
    });

    it('should prefer variants with sample availability', () => {
      const variantsWithoutSamples = mockSauvageVariants.map(v => ({
        ...v,
        sample_available: false,
        popularity_score: 50 // Equal popularity
      }));

      // Make one variant have samples
      variantsWithoutSamples[2].sample_available = true;

      const primary = PrimaryVariantSelector.selectPrimary(variantsWithoutSamples);
      expect(primary.id).toBe('sauvage-elixir');
    });

    it('should prefer EDP concentration when popularity is similar', () => {
      const equalPopularityVariants = mockSauvageVariants.slice(0, 3).map(v => ({
        ...v,
        popularity_score: 80 // Equal popularity
      }));

      const primary = PrimaryVariantSelector.selectPrimary(equalPopularityVariants);
      expect(primary.name).toContain('Eau de Parfum');
    });

    it('should handle single variant gracefully', () => {
      const primary = PrimaryVariantSelector.selectPrimary([mockSauvageVariants[0]]);
      expect(primary.id).toBe('sauvage-edp');
    });

    it('should throw error for empty variant list', () => {
      expect(() => {
        PrimaryVariantSelector.selectPrimary([]);
      }).toThrow('Cannot select primary from empty variant list');
    });
  });

  describe('BadgeAssigner', () => {
    it('should assign Most Popular badge to highest popularity variant', () => {
      const badges = BadgeAssigner.assignBadges(
        mockSauvageVariants.slice(0, 3),
        mockSauvageVariants[0] // Sauvage EDP (highest popularity)
      );

      const popularBadge = badges.find(b => b.type === 'most_popular');
      expect(popularBadge).toBeTruthy();
      expect(popularBadge?.label).toBe('Most Popular');
    });

    it('should assign Strongest badge to highest intensity variant', () => {
      const badges = BadgeAssigner.assignBadges(
        mockSauvageVariants.slice(0, 3),
        mockSauvageVariants[2] // Sauvage Elixir (intensity 9)
      );

      const strongestBadge = badges.find(b => b.type === 'strongest');
      expect(strongestBadge).toBeTruthy();
      expect(strongestBadge?.description).toContain('Long-lasting');
    });

    it('should assign Lightest badge to lowest intensity variant', () => {
      const badges = BadgeAssigner.assignBadges(
        mockSauvageVariants.slice(0, 3),
        mockSauvageVariants[1] // Sauvage EDT (intensity 6, lowest among first 3)
      );

      const lightestBadge = badges.find(b => b.type === 'lightest');
      expect(lightestBadge).toBeTruthy();
      expect(lightestBadge?.description).toContain('Fresher');
    });

    it('should assign Best Value badge to cheapest sample', () => {
      const badges = BadgeAssigner.assignBadges(
        mockSauvageVariants.slice(0, 3),
        mockSauvageVariants[1] // Sauvage EDT ($10 sample)
      );

      const valueBadge = badges.find(b => b.type === 'best_value');
      expect(valueBadge).toBeTruthy();
    });

    it('should not assign badges when insufficient data', () => {
      const singleVariant = [mockSauvageVariants[0]];
      const badges = BadgeAssigner.assignBadges(singleVariant, singleVariant[0]);

      // Should still get Most Popular badge
      expect(badges.length).toBeGreaterThan(0);
      expect(badges[0].type).toBe('most_popular');
    });
  });

  describe('ExperienceRecommender', () => {
    it('should recommend EDT for beginners', () => {
      const recommendations = ExperienceRecommender.generateRecommendations(
        mockSauvageVariants.slice(0, 3),
        mockSauvageVariants[0] // Primary is EDP
      );

      const beginnerRec = recommendations.find(r => r.level === 'beginner');
      expect(beginnerRec).toBeTruthy();
      expect(beginnerRec?.recommended_variant_id).toBe('sauvage-edt');
      expect(beginnerRec?.confidence).toBeGreaterThan(0.8);
    });

    it('should recommend EDP for enthusiasts', () => {
      const recommendations = ExperienceRecommender.generateRecommendations(
        mockSauvageVariants.slice(0, 3),
        mockSauvageVariants[0] // Primary is EDP
      );

      const enthusiastRec = recommendations.find(r => r.level === 'enthusiast');
      expect(enthusiastRec).toBeTruthy();
      expect(enthusiastRec?.recommended_variant_id).toBe('sauvage-edp');
    });

    it('should recommend Elixir for collectors', () => {
      const recommendations = ExperienceRecommender.generateRecommendations(
        mockSauvageVariants.slice(0, 3),
        mockSauvageVariants[0] // Primary is EDP
      );

      const collectorRec = recommendations.find(r => r.level === 'collector');
      expect(collectorRec).toBeTruthy();
      expect(collectorRec?.recommended_variant_id).toBe('sauvage-elixir');
    });

    it('should provide reasoning for each recommendation', () => {
      const recommendations = ExperienceRecommender.generateRecommendations(
        mockSauvageVariants.slice(0, 3),
        mockSauvageVariants[0]
      );

      recommendations.forEach(rec => {
        expect(rec.reasoning).toBeTruthy();
        expect(rec.reasoning.length).toBeGreaterThan(10);
      });
    });
  });

  describe('VariantGrouper Integration', () => {
    it('should group Sauvage variants together', async () => {
      const allFragrances = [...mockSauvageVariants, ...mockUnrelatedFragrances];
      const groups = await VariantGrouper.groupVariants(allFragrances);

      // Should have at least 3 groups: Sauvage variants, Bleu de Chanel, Acqua di Gio
      expect(groups.length).toBeGreaterThanOrEqual(3);

      // Find Sauvage group
      const sauvageGroup = groups.find(g => 
        g.primary_variant.name.toLowerCase().includes('sauvage')
      );
      
      expect(sauvageGroup).toBeTruthy();
      expect(sauvageGroup?.total_variants).toBeGreaterThan(1);
    });

    it('should properly separate Sauvage and Eau Sauvage', async () => {
      const groups = await VariantGrouper.groupVariants(mockSauvageVariants);

      // Should have 2 groups: Sauvage variants and Eau Sauvage
      expect(groups.length).toBe(2);

      // Main Sauvage group should have 4 variants
      const mainSauvageGroup = groups.find(g => g.total_variants === 4);
      expect(mainSauvageGroup).toBeTruthy();

      // Eau Sauvage should be separate
      const eauSauvageGroup = groups.find(g => g.total_variants === 1);
      expect(eauSauvageGroup).toBeTruthy();
      expect(eauSauvageGroup?.primary_variant.name).toBe('Eau Sauvage');
    });

    it('should sort groups by popularity', async () => {
      const allFragrances = [...mockSauvageVariants, ...mockUnrelatedFragrances];
      const groups = await VariantGrouper.groupVariants(allFragrances);

      // Groups should be sorted by popularity (descending)
      for (let i = 0; i < groups.length - 1; i++) {
        expect(groups[i].popularity_score).toBeGreaterThanOrEqual(groups[i + 1].popularity_score);
      }
    });

    it('should generate meaningful group IDs and names', async () => {
      const groups = await VariantGrouper.groupVariants(mockSauvageVariants.slice(0, 3));

      const sauvageGroup = groups[0];
      expect(sauvageGroup.group_id).toMatch(/dior-sauvage/);
      expect(sauvageGroup.group_name).toBe('Sauvage');
    });

    it('should include all required group properties', async () => {
      const groups = await VariantGrouper.groupVariants(mockSauvageVariants.slice(0, 3));

      groups.forEach(group => {
        expect(group.primary_variant).toBeTruthy();
        expect(group.related_variants).toBeInstanceOf(Array);
        expect(group.group_id).toBeTruthy();
        expect(group.group_name).toBeTruthy();
        expect(typeof group.total_variants).toBe('number');
        expect(typeof group.popularity_score).toBe('number');
        expect(group.badges).toBeInstanceOf(Array);
        expect(group.experience_recommendations).toBeInstanceOf(Array);
        expect(group.experience_recommendations.length).toBe(3); // beginner, enthusiast, collector
      });
    });

    it('should handle edge cases gracefully', async () => {
      // Empty array
      const emptyGroups = await VariantGrouper.groupVariants([]);
      expect(emptyGroups).toEqual([]);

      // Single fragrance
      const singleGroups = await VariantGrouper.groupVariants([mockSauvageVariants[0]]);
      expect(singleGroups.length).toBe(1);
      expect(singleGroups[0].total_variants).toBe(1);
      expect(singleGroups[0].related_variants.length).toBe(0);
    });
  });

  describe('Real-world Scenario Testing', () => {
    it('should solve the Sauvage choice paralysis problem', async () => {
      // Test the exact problem described in SCE-68
      const searchResults = [
        ...mockSauvageVariants,
        {
          id: 'very-cool-spray',
          name: 'Very Cool Spray',
          brand: 'Dior',
          brand_id: 'dior-brand',
          popularity_score: 25,
          fragrance_family: 'fresh',
          notes: ['mint', 'citrus']
        }
      ];

      const groups = await VariantGrouper.groupVariants(searchResults);

      // Should reduce 6 results to ~3 groups
      expect(groups.length).toBeLessThan(searchResults.length);

      // Primary Sauvage group should be first (highest popularity)
      const primaryGroup = groups[0];
      expect(primaryGroup.primary_variant.name).toContain('Sauvage');
      expect(primaryGroup.primary_variant.name).not.toBe('Eau Sauvage'); // Should prefer main line

      // Should have clear recommendations for different experience levels
      expect(primaryGroup.experience_recommendations.length).toBe(3);
      
      // Should have helpful badges
      expect(primaryGroup.badges.length).toBeGreaterThan(0);
    });

    it('should provide clear hierarchy in search results', async () => {
      const groups = await VariantGrouper.groupVariants(mockSauvageVariants.slice(0, 4));
      const mainGroup = groups[0];

      // Primary variant should be most popular
      expect(mainGroup.primary_variant.popularity_score).toBe(95);

      // Related variants should be sorted by popularity
      const relatedPopularities = mainGroup.related_variants.map(v => v.popularity_score || 0);
      for (let i = 0; i < relatedPopularities.length - 1; i++) {
        expect(relatedPopularities[i]).toBeGreaterThanOrEqual(relatedPopularities[i + 1]);
      }

      // Should have different recommendations for different users
      const beginnerRec = mainGroup.experience_recommendations.find(r => r.level === 'beginner');
      const collectorRec = mainGroup.experience_recommendations.find(r => r.level === 'collector');
      
      expect(beginnerRec?.recommended_variant_id).not.toBe(collectorRec?.recommended_variant_id);
    });
  });

  describe('Performance Requirements', () => {
    it('should handle large datasets efficiently', async () => {
      // Create 50 similar variants (stress test)
      const largeDataset: FragranceVariant[] = [];
      
      for (let i = 0; i < 50; i++) {
        largeDataset.push({
          id: `test-${i}`,
          name: `Test Fragrance ${i} EDT`,
          brand: 'Test Brand',
          brand_id: 'test-brand',
          popularity_score: Math.random() * 100,
          fragrance_family: 'fresh',
          notes: ['bergamot', 'lavender']
        });
      }

      const startTime = Date.now();
      const groups = await VariantGrouper.groupVariants(largeDataset);
      const endTime = Date.now();

      // Should complete within reasonable time (< 1 second for 50 items)
      expect(endTime - startTime).toBeLessThan(1000);
      
      // Should group similar items
      expect(groups.length).toBeLessThan(largeDataset.length);
    });

    it('should handle mixed datasets with minimal variant grouping', async () => {
      // Create dataset with mostly unique fragrances (minimal grouping expected)
      const mixedDataset: FragranceVariant[] = [];
      
      for (let i = 0; i < 20; i++) {
        mixedDataset.push({
          id: `unique-${i}`,
          name: `Unique Fragrance ${i}`,
          brand: `Brand ${i}`,
          brand_id: `brand-${i}`,
          popularity_score: Math.random() * 100,
          fragrance_family: 'fresh'
        });
      }

      const groups = await VariantGrouper.groupVariants(mixedDataset);
      
      // Should create roughly same number of groups (no false grouping)
      expect(groups.length).toBe(mixedDataset.length);
    });
  });
});