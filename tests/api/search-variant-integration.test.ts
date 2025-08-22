/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/search/route';

// Mock the dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/ai/voyage-client');
jest.mock('@/lib/resource-validation/middleware');

describe('Search API with Variant Grouping - SCE-68 Integration', () => {
  const mockSauvageSearchResults = [
    {
      fragrance_id: 'sauvage-edp',
      name: 'Sauvage Eau de Parfum',
      brand: 'Dior',
      scent_family: 'Fresh',
      relevance_score: 0.95
    },
    {
      fragrance_id: 'sauvage-edt',
      name: 'Sauvage Eau de Toilette',
      brand: 'Dior',
      scent_family: 'Fresh',
      relevance_score: 0.90
    },
    {
      fragrance_id: 'sauvage-elixir',
      name: 'Sauvage Elixir',
      brand: 'Dior',
      scent_family: 'Fresh',
      relevance_score: 0.85
    },
    {
      fragrance_id: 'sauvage-parfum',
      name: 'Sauvage Parfum',
      brand: 'Dior',
      scent_family: 'Fresh',
      relevance_score: 0.82
    },
    {
      fragrance_id: 'eau-sauvage',
      name: 'Eau Sauvage',
      brand: 'Dior',
      scent_family: 'Fresh',
      relevance_score: 0.75
    },
    {
      fragrance_id: 'bleu-chanel',
      name: 'Bleu de Chanel EDP',
      brand: 'Chanel',
      scent_family: 'Woody',
      relevance_score: 0.70
    }
  ];

  const mockFragranceDetails = {
    'sauvage-edp': {
      sample_available: true,
      sample_price_usd: 12,
      intensity_score: 7,
      longevity_hours: 8,
      popularity_score: 95,
      fragrance_family: 'fresh',
      notes: ['bergamot', 'pepper', 'lavender', 'ambroxan'],
      fragrance_brands: { id: 'dior-brand', name: 'Dior' }
    },
    'sauvage-edt': {
      sample_available: true,
      sample_price_usd: 10,
      intensity_score: 6,
      longevity_hours: 6,
      popularity_score: 87,
      fragrance_family: 'fresh',
      notes: ['bergamot', 'pepper', 'lavender', 'ambroxan'],
      fragrance_brands: { id: 'dior-brand', name: 'Dior' }
    },
    'sauvage-elixir': {
      sample_available: true,
      sample_price_usd: 18,
      intensity_score: 9,
      longevity_hours: 12,
      popularity_score: 72,
      fragrance_family: 'fresh',
      notes: ['bergamot', 'pepper', 'lavender', 'ambroxan', 'cardamom'],
      fragrance_brands: { id: 'dior-brand', name: 'Dior' }
    },
    'sauvage-parfum': {
      sample_available: false,
      intensity_score: 8,
      longevity_hours: 10,
      popularity_score: 63,
      fragrance_family: 'fresh',
      notes: ['bergamot', 'pepper', 'lavender', 'sandalwood'],
      fragrance_brands: { id: 'dior-brand', name: 'Dior' }
    },
    'eau-sauvage': {
      sample_available: true,
      sample_price_usd: 8,
      intensity_score: 4,
      longevity_hours: 4,
      popularity_score: 45,
      fragrance_family: 'fresh',
      notes: ['lemon', 'basil', 'jasmine', 'oakmoss'],
      fragrance_brands: { id: 'dior-brand', name: 'Dior' }
    },
    'bleu-chanel': {
      sample_available: true,
      sample_price_usd: 15,
      intensity_score: 7,
      longevity_hours: 8,
      popularity_score: 92,
      fragrance_family: 'woody',
      notes: ['grapefruit', 'lemon', 'cedar', 'sandalwood'],
      fragrance_brands: { id: 'chanel-brand', name: 'Chanel' }
    }
  };

  let mockSupabase: any;
  let mockCreateValidatedApiResponse: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      rpc: jest.fn(),
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      }))
    };

    // Mock createClient to return mockSupabase
    const { createClient } = require('@/lib/supabase/server');
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    // Mock createValidatedApiResponse
    mockCreateValidatedApiResponse = jest.fn((data, options) => ({
      json: () => Promise.resolve(data),
      headers: new Headers(),
      status: 200
    }));
    
    const { createValidatedApiResponse } = require('@/lib/resource-validation/middleware');
    (createValidatedApiResponse as jest.Mock).mockImplementation(mockCreateValidatedApiResponse);

    // Mock generateQueryEmbedding
    const { generateQueryEmbedding } = require('@/lib/ai/voyage-client');
    (generateQueryEmbedding as jest.Mock).mockResolvedValue([0.1, 0.2, 0.3]);
  });

  describe('Variant Grouping Integration', () => {
    it('should group Sauvage variants and reduce choice paralysis', async () => {
      // Setup: Mock search results and fragrance details
      mockSupabase.rpc.mockResolvedValue({
        data: mockSauvageSearchResults,
        error: null
      });

      // Mock individual fragrance detail queries
      mockSupabase.from().select().eq().single.mockImplementation((fragId: string) => ({
        data: mockFragranceDetails[fragId as keyof typeof mockFragranceDetails],
        error: null
      }));

      // Create request
      const request = new NextRequest('http://localhost:3000/api/search?q=sauvage&group_variants=true');

      // Execute
      const response = await GET(request);
      const responseData = await response.json();

      // Verify variant grouping occurred
      expect(responseData.grouped_results).toBe(true);
      expect(responseData.variant_groups).toBeDefined();
      expect(responseData.variant_groups.length).toBeLessThan(mockSauvageSearchResults.length);

      // Verify choice paralysis reduction
      expect(responseData.metadata.choice_paralysis_reduction).toBeGreaterThan(0);

      // Verify primary variant selection
      const sauvageGroup = responseData.variant_groups.find((group: any) => 
        group.group_name === 'Sauvage'
      );
      expect(sauvageGroup).toBeTruthy();
      expect(sauvageGroup.primary_variant.name).toBe('Sauvage Eau de Parfum'); // Highest popularity
      expect(sauvageGroup.total_variants).toBeGreaterThan(1);
    });

    it('should provide experience-based recommendations for variants', async () => {
      // Setup
      mockSupabase.rpc.mockResolvedValue({
        data: mockSauvageSearchResults.slice(0, 4), // Main Sauvage variants only
        error: null
      });

      mockSupabase.from().select().eq().single.mockImplementation((fragId: string) => ({
        data: mockFragranceDetails[fragId as keyof typeof mockFragranceDetails],
        error: null
      }));

      const request = new NextRequest('http://localhost:3000/api/search?q=sauvage');

      // Execute
      const response = await GET(request);
      const responseData = await response.json();

      // Verify experience recommendations
      const sauvageGroup = responseData.variant_groups[0];
      expect(sauvageGroup.experience_recommendations).toBeDefined();
      expect(sauvageGroup.experience_recommendations.length).toBe(3);

      const levels = sauvageGroup.experience_recommendations.map((rec: any) => rec.level);
      expect(levels).toContain('beginner');
      expect(levels).toContain('enthusiast');
      expect(levels).toContain('collector');

      // Verify different recommendations for different levels
      const beginnerRec = sauvageGroup.experience_recommendations.find((rec: any) => rec.level === 'beginner');
      const collectorRec = sauvageGroup.experience_recommendations.find((rec: any) => rec.level === 'collector');
      
      expect(beginnerRec.recommended_variant_id).not.toBe(collectorRec.recommended_variant_id);
    });

    it('should assign meaningful badges to variants', async () => {
      // Setup
      mockSupabase.rpc.mockResolvedValue({
        data: mockSauvageSearchResults.slice(0, 4),
        error: null
      });

      mockSupabase.from().select().eq().single.mockImplementation((fragId: string) => ({
        data: mockFragranceDetails[fragId as keyof typeof mockFragranceDetails],
        error: null
      }));

      const request = new NextRequest('http://localhost:3000/api/search?q=sauvage');

      // Execute
      const response = await GET(request);
      const responseData = await response.json();

      // Verify badges
      const sauvageGroup = responseData.variant_groups[0];
      expect(sauvageGroup.badges).toBeDefined();
      expect(sauvageGroup.badges.length).toBeGreaterThan(0);

      // Should have Most Popular badge since EDP is primary with highest popularity
      const popularBadge = sauvageGroup.badges.find((badge: any) => badge.type === 'most_popular');
      expect(popularBadge).toBeTruthy();
      expect(popularBadge.label).toBe('Most Popular');
    });

    it('should properly separate Sauvage and Eau Sauvage as different fragrances', async () => {
      // Setup
      mockSupabase.rpc.mockResolvedValue({
        data: mockSauvageSearchResults,
        error: null
      });

      mockSupabase.from().select().eq().single.mockImplementation((fragId: string) => ({
        data: mockFragranceDetails[fragId as keyof typeof mockFragranceDetails],
        error: null
      }));

      const request = new NextRequest('http://localhost:3000/api/search?q=sauvage');

      // Execute
      const response = await GET(request);
      const responseData = await response.json();

      // Should have separate groups for Sauvage and Eau Sauvage
      const groupNames = responseData.variant_groups.map((group: any) => group.group_name);
      expect(groupNames).toContain('Sauvage');
      expect(groupNames).toContain('Eau Sauvage');

      // Main Sauvage group should have multiple variants
      const mainSauvageGroup = responseData.variant_groups.find((group: any) => 
        group.group_name === 'Sauvage'
      );
      expect(mainSauvageGroup.total_variants).toBeGreaterThan(1);

      // Eau Sauvage should be separate
      const eauSauvageGroup = responseData.variant_groups.find((group: any) => 
        group.group_name === 'Eau Sauvage'
      );
      expect(eauSauvageGroup.total_variants).toBe(1);
    });

    it('should allow disabling variant grouping', async () => {
      // Setup
      mockSupabase.rpc.mockResolvedValue({
        data: mockSauvageSearchResults,
        error: null
      });

      mockSupabase.from().select().eq().single.mockImplementation((fragId: string) => ({
        data: mockFragranceDetails[fragId as keyof typeof mockFragranceDetails],
        error: null
      }));

      const request = new NextRequest('http://localhost:3000/api/search?q=sauvage&group_variants=false');

      // Execute
      const response = await GET(request);
      const responseData = await response.json();

      // Should not have variant grouping
      expect(responseData.grouped_results).toBe(false);
      expect(responseData.fragrances).toBeDefined();
      expect(responseData.variant_groups).toBeUndefined();
      expect(responseData.fragrances.length).toBe(mockSauvageSearchResults.length);
    });

    it('should fall back gracefully when variant grouping fails', async () => {
      // Setup
      mockSupabase.rpc.mockResolvedValue({
        data: mockSauvageSearchResults,
        error: null
      });

      // Mock fragrance details to cause an error in variant grouping
      mockSupabase.from().select().eq().single.mockImplementation(() => ({
        data: null,
        error: new Error('Database error')
      }));

      const request = new NextRequest('http://localhost:3000/api/search?q=sauvage');

      // Execute
      const response = await GET(request);
      const responseData = await response.json();

      // Should fall back to regular search results
      expect(responseData.fragrances).toBeDefined();
      expect(responseData.grouped_results).toBe(false);
    });
  });

  describe('Performance and Caching', () => {
    it('should include choice paralysis reduction metrics', async () => {
      // Setup
      mockSupabase.rpc.mockResolvedValue({
        data: mockSauvageSearchResults,
        error: null
      });

      mockSupabase.from().select().eq().single.mockImplementation((fragId: string) => ({
        data: mockFragranceDetails[fragId as keyof typeof mockFragranceDetails],
        error: null
      }));

      const request = new NextRequest('http://localhost:3000/api/search?q=sauvage');

      // Execute
      const response = await GET(request);
      const responseData = await response.json();

      // Verify metrics
      expect(responseData.metadata.variant_grouping_enabled).toBe(true);
      expect(responseData.metadata.choice_paralysis_reduction).toBeGreaterThan(0);
      expect(responseData.groups_count).toBeLessThan(responseData.total);
    });

    it('should cache grouped results appropriately', async () => {
      // Setup
      mockSupabase.rpc.mockResolvedValue({
        data: mockSauvageSearchResults,
        error: null
      });

      mockSupabase.from().select().eq().single.mockImplementation((fragId: string) => ({
        data: mockFragranceDetails[fragId as keyof typeof mockFragranceDetails],
        error: null
      }));

      const request = new NextRequest('http://localhost:3000/api/search?q=sauvage');

      // Execute
      await GET(request);

      // Verify caching was configured
      expect(mockCreateValidatedApiResponse).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          cache: expect.stringContaining('s-maxage')
        })
      );
    });
  });

  describe('Real-world Use Cases', () => {
    it('should solve the exact Sauvage choice paralysis scenario from SCE-68', async () => {
      // Exact scenario: User searches "Sauvage" and gets overwhelming results
      mockSupabase.rpc.mockResolvedValue({
        data: mockSauvageSearchResults,
        error: null
      });

      mockSupabase.from().select().eq().single.mockImplementation((fragId: string) => ({
        data: mockFragranceDetails[fragId as keyof typeof mockFragranceDetails],
        error: null
      }));

      const request = new NextRequest('http://localhost:3000/api/search?q=sauvage');

      // Execute
      const response = await GET(request);
      const responseData = await response.json();

      // Verify the solution meets SCE-68 requirements
      
      // 1. Reduced overwhelming choice overload
      expect(responseData.groups_count).toBeLessThan(responseData.total);
      expect(responseData.metadata.choice_paralysis_reduction).toBeGreaterThan(30); // At least 30% reduction

      // 2. Clear primary variant identification
      const mainGroup = responseData.variant_groups[0];
      expect(mainGroup.primary_variant.name).toBe('Sauvage Eau de Parfum'); // Most popular

      // 3. Hierarchical display with clear differentiators
      expect(mainGroup.badges.length).toBeGreaterThan(0);
      expect(mainGroup.experience_recommendations.length).toBe(3);
      
      // 4. Experience-based guidance
      const beginnerRec = mainGroup.experience_recommendations.find((rec: any) => rec.level === 'beginner');
      expect(beginnerRec.reasoning).toContain('approachable'); // Or similar beginner-friendly language
    });

    it('should provide clear guidance for different user experience levels', async () => {
      // Setup
      mockSupabase.rpc.mockResolvedValue({
        data: mockSauvageSearchResults.slice(0, 4),
        error: null
      });

      mockSupabase.from().select().eq().single.mockImplementation((fragId: string) => ({
        data: mockFragranceDetails[fragId as keyof typeof mockFragranceDetails],
        error: null
      }));

      const request = new NextRequest('http://localhost:3000/api/search?q=sauvage');

      // Execute
      const response = await GET(request);
      const responseData = await response.json();

      const mainGroup = responseData.variant_groups[0];
      
      // Beginner should get EDT (lighter, more approachable)
      const beginnerRec = mainGroup.experience_recommendations.find((rec: any) => rec.level === 'beginner');
      const beginnerVariant = [...[mainGroup.primary_variant], ...mainGroup.related_variants]
        .find((v: any) => v.id === beginnerRec.recommended_variant_id);
      
      expect(beginnerVariant.name.toLowerCase()).toContain('toilette'); // EDT for beginners

      // Collector should get Elixir (strongest, most unique)
      const collectorRec = mainGroup.experience_recommendations.find((rec: any) => rec.level === 'collector');
      const collectorVariant = [...[mainGroup.primary_variant], ...mainGroup.related_variants]
        .find((v: any) => v.id === collectorRec.recommended_variant_id);
      
      expect(collectorVariant.name.toLowerCase()).toContain('elixir'); // Elixir for collectors
    });
  });
});