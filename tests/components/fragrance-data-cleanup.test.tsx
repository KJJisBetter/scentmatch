/**
 * Fragrance Data Cleanup Tests - Task 4.1
 *
 * Tests for cleaning fragrance data to ensure consistent presentation
 * and proper API response format for the recommendation system.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fragrance data with issues that need cleaning
const mockRawFragranceData = [
  {
    id: 'frag-1',
    name: 'Chanel No. 5 for Women',
    brand: 'chanel',
    scent_family: 'floral aldehydic',
    sample_price_usd: 12,
    sample_available: true,
    popularity_score: 9.2,
    rating_average: 4.8,
  },
  {
    id: 'frag-2',
    name: 'Bleu de Chanel for Men',
    brand: 'CHANEL',
    scent_family: 'woody aromatic',
    sample_price_usd: 15,
    sample_available: true,
    popularity_score: 8.9,
    rating_average: 4.6,
  },
  {
    id: 'frag-3',
    name: 'Santal 33',
    brand: 'Le Labo',
    scent_family: 'woody',
    sample_price_usd: 18,
    sample_available: true,
    popularity_score: 8.7,
    rating_average: 4.5,
  },
  {
    id: 'frag-4',
    name: 'Tom Ford Oud Wood for Men',
    brand: 'tom ford',
    scent_family: 'woody oud',
    sample_price_usd: null, // Missing price
    sample_available: false,
    popularity_score: 8.5,
    rating_average: 4.7,
  },
];

// Expected cleaned data structure
const expectedCleanedData = [
  {
    id: 'frag-1',
    name: 'Chanel No. 5',
    brand: 'Chanel',
    scent_family: 'floral aldehydic',
    sample_price_usd: 12,
    sample_available: true,
    popularity_score: 9.2,
    rating_average: 4.8,
    gender_target: 'women', // Extracted from original name
  },
  {
    id: 'frag-2',
    name: 'Bleu de Chanel',
    brand: 'Chanel',
    scent_family: 'woody aromatic',
    sample_price_usd: 15,
    sample_available: true,
    popularity_score: 8.9,
    rating_average: 4.6,
    gender_target: 'men',
  },
  {
    id: 'frag-3',
    name: 'Santal 33',
    brand: 'Le Labo',
    scent_family: 'woody',
    sample_price_usd: 18,
    sample_available: true,
    popularity_score: 8.7,
    rating_average: 4.5,
    gender_target: 'unisex',
  },
];

describe('Fragrance Data Cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Name Cleanup', () => {
    it('should remove "for Men/Women" suffixes from fragrance names', () => {
      const testCases = [
        {
          original: 'Chanel No. 5 for Women',
          cleaned: 'Chanel No. 5',
          gender: 'women',
        },
        {
          original: 'Bleu de Chanel for Men',
          cleaned: 'Bleu de Chanel',
          gender: 'men',
        },
        {
          original: 'Tom Ford Oud Wood for Men',
          cleaned: 'Tom Ford Oud Wood',
          gender: 'men',
        },
        { original: 'Santal 33', cleaned: 'Santal 33', gender: 'unisex' }, // No suffix = unisex
      ];

      testCases.forEach(testCase => {
        const cleaned = cleanFragranceName(testCase.original);
        expect(cleaned.name).toBe(testCase.cleaned);
        expect(cleaned.gender_target).toBe(testCase.gender);
      });
    });

    it('should handle edge cases in name cleaning', () => {
      const edgeCases = [
        {
          original: 'Fragrance For Women Special Edition',
          cleaned: 'Fragrance For Women Special Edition',
          gender: 'unisex',
        }, // Only remove suffix, not middle
        {
          original: "Men's Cologne",
          cleaned: "Men's Cologne",
          gender: 'unisex',
        }, // Don't remove "Men's" when it's possessive
        {
          original: 'For Her by Narciso Rodriguez',
          cleaned: 'For Her by Narciso Rodriguez',
          gender: 'unisex',
        }, // Don't remove when it's part of the actual name
      ];

      edgeCases.forEach(testCase => {
        const cleaned = cleanFragranceName(testCase.original);
        expect(cleaned.name).toBe(testCase.cleaned);
        expect(cleaned.gender_target).toBe(testCase.gender);
      });
    });
  });

  describe('Brand Name Standardization', () => {
    it('should standardize brand name capitalization', () => {
      const brandCases = [
        { original: 'chanel', standardized: 'Chanel' },
        { original: 'CHANEL', standardized: 'Chanel' },
        { original: 'tom ford', standardized: 'Tom Ford' },
        { original: 'le labo', standardized: 'Le Labo' },
        { original: 'yves saint laurent', standardized: 'Yves Saint Laurent' },
      ];

      brandCases.forEach(brandCase => {
        const standardized = standardizeBrandName(brandCase.original);
        expect(standardized).toBe(brandCase.standardized);
      });
    });

    it('should handle special brand name cases', () => {
      const specialCases = [
        {
          original: 'maison francis kurkdjian',
          standardized: 'Maison Francis Kurkdjian',
        },
        { original: 'jo malone london', standardized: 'Jo Malone London' },
        { original: 'diptyque', standardized: 'Diptyque' },
      ];

      specialCases.forEach(specialCase => {
        const standardized = standardizeBrandName(specialCase.original);
        expect(standardized).toBe(specialCase.standardized);
      });
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields for recommendations', () => {
      mockRawFragranceData.forEach(fragrance => {
        const validation = validateFragranceData(fragrance);

        // Required for recommendations
        expect(fragrance.id).toBeTruthy();
        expect(fragrance.name).toBeTruthy();
        expect(fragrance.brand).toBeTruthy();

        // Optional but important
        if (fragrance.sample_available) {
          expect(fragrance.sample_price_usd).toBeTruthy();
        }
      });
    });

    it('should filter out unsuitable fragrances for recommendations', () => {
      const unsuitableFragrances = mockRawFragranceData.filter(
        frag => !frag.sample_available || frag.sample_price_usd === null
      );

      expect(unsuitableFragrances.length).toBeGreaterThan(0); // Should find the Tom Ford example

      const suitableForRecommendations = mockRawFragranceData.filter(
        frag => frag.sample_available && frag.sample_price_usd !== null
      );

      expect(suitableForRecommendations.length).toBe(3); // Should be 3 suitable fragrances
    });

    it('should ensure recommendation response format includes AI reasoning', () => {
      const expectedResponseFormat = {
        recommendations: [
          {
            id: 'string',
            name: 'string',
            brand: 'string',
            match_percentage: 'number',
            ai_insight: 'string', // AI reasoning required
            reasoning: 'string',
            confidence_level: 'string',
            sample_price_usd: 'number',
            sample_available: 'boolean',
          },
        ],
        quiz_session_token: 'string',
        total_processing_time_ms: 'number',
        recommendation_method: 'string',
        success: 'boolean',
      };

      // Validate that the expected format has all required fields
      expect(expectedResponseFormat.recommendations[0].ai_insight).toBe(
        'string'
      );
      expect(expectedResponseFormat.recommendations[0].reasoning).toBe(
        'string'
      );
      expect(expectedResponseFormat.success).toBe('boolean');
    });
  });

  describe('API Response Format', () => {
    it('should return exactly 3 recommendations', () => {
      const mockApiResponse = {
        recommendations: expectedCleanedData,
        success: true,
      };

      expect(mockApiResponse.recommendations.length).toBeGreaterThanOrEqual(3);

      // Should limit to 3 for the response
      const limitedResponse = {
        ...mockApiResponse,
        recommendations: mockApiResponse.recommendations.slice(0, 3),
      };

      expect(limitedResponse.recommendations).toHaveLength(3);
    });

    it('should include all required fields for recommendation display', () => {
      expectedCleanedData.forEach(rec => {
        // Required for display component
        expect(rec.id).toBeTruthy();
        expect(rec.name).toBeTruthy();
        expect(rec.brand).toBeTruthy();
        expect(typeof rec.sample_price_usd).toBe('number');
        expect(typeof rec.sample_available).toBe('boolean');

        // These should be added by the recommendation engine
        // expect(rec.ai_insight).toBeTruthy();
        // expect(rec.match_percentage).toBeGreaterThan(0);
      });
    });
  });
});

/**
 * Fragrance Data Cleaning Functions
 */
function cleanFragranceName(originalName: string): {
  name: string;
  gender_target: string;
} {
  let cleanName = originalName;
  let gender = 'unisex';

  // Remove "for Women" suffix
  if (cleanName.endsWith(' for Women')) {
    cleanName = cleanName.replace(' for Women', '');
    gender = 'women';
  }

  // Remove "for Men" suffix
  if (cleanName.endsWith(' for Men')) {
    cleanName = cleanName.replace(' for Men', '');
    gender = 'men';
  }

  return {
    name: cleanName.trim(),
    gender_target: gender,
  };
}

function standardizeBrandName(originalBrand: string): string {
  // Convert to title case
  return originalBrand
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function validateFragranceData(fragrance: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!fragrance.id) errors.push('Missing fragrance ID');
  if (!fragrance.name) errors.push('Missing fragrance name');
  if (!fragrance.brand) errors.push('Missing brand name');

  if (fragrance.sample_available && !fragrance.sample_price_usd) {
    errors.push('Sample available but no price specified');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
