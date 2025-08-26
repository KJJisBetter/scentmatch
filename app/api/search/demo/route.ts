import { NextRequest, NextResponse } from 'next/server';
import { VariantGrouper, type FragranceVariant } from '@/lib/search/variant-grouping';

/**
 * GET /api/search/demo
 * 
 * Demo endpoint showing SCE-68 variant grouping in action
 * Demonstrates how to solve choice paralysis from too many variants
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || 'sauvage';

    // Mock search results that would typically come from database
    // This simulates the "14 Sauvage variants" problem described in SCE-68
    const mockSearchResults: FragranceVariant[] = [
      // Main Sauvage Line
      {
        id: 'sauvage-edp-2015',
        name: 'Sauvage Eau de Parfum',
        brand: 'Dior',
        brand_id: 'dior-brand',
        description: 'The iconic fragrance that redefined masculinity',
        notes: ['bergamot', 'pepper', 'lavender', 'ambroxan'],
        intensity_score: 7,
        longevity_hours: 8,
        sample_available: true,
        sample_price_usd: 12,
        popularity_score: 95,
        fragrance_family: 'fresh',
        recommended_occasions: ['daily', 'office', 'date'],
        recommended_seasons: ['spring', 'summer'],
        image_url: '/images/sauvage-edp.jpg'
      },
      {
        id: 'sauvage-edt-2015',
        name: 'Sauvage Eau de Toilette',
        brand: 'Dior',
        brand_id: 'dior-brand',
        description: 'Fresh and vibrant, perfect for everyday wear',
        notes: ['bergamot', 'pepper', 'lavender', 'ambroxan'],
        intensity_score: 6,
        longevity_hours: 6,
        sample_available: true,
        sample_price_usd: 10,
        popularity_score: 87,
        fragrance_family: 'fresh',
        recommended_occasions: ['daily', 'casual'],
        recommended_seasons: ['spring', 'summer'],
        image_url: '/images/sauvage-edt.jpg'
      },
      {
        id: 'sauvage-parfum-2019',
        name: 'Sauvage Parfum',
        brand: 'Dior',
        brand_id: 'dior-brand',
        description: 'Rich and sophisticated concentration',
        notes: ['bergamot', 'pepper', 'lavender', 'sandalwood'],
        intensity_score: 8,
        longevity_hours: 10,
        sample_available: false,
        sample_price_usd: undefined,
        popularity_score: 63,
        fragrance_family: 'fresh',
        recommended_occasions: ['evening', 'formal'],
        recommended_seasons: ['fall', 'winter'],
        image_url: '/images/sauvage-parfum.jpg'
      },
      {
        id: 'sauvage-elixir-2021',
        name: 'Sauvage Elixir',
        brand: 'Dior',
        brand_id: 'dior-brand',
        description: 'The most intense and addictive concentration',
        notes: ['bergamot', 'pepper', 'lavender', 'ambroxan', 'cardamom'],
        intensity_score: 9,
        longevity_hours: 12,
        sample_available: true,
        sample_price_usd: 18,
        popularity_score: 72,
        fragrance_family: 'fresh',
        recommended_occasions: ['evening', 'special'],
        recommended_seasons: ['fall', 'winter'],
        image_url: '/images/sauvage-elixir.jpg'
      },
      
      // Different Sauvage Line (should be separate group)
      {
        id: 'eau-sauvage-1966',
        name: 'Eau Sauvage',
        brand: 'Dior',
        brand_id: 'dior-brand',
        description: 'The original Dior men\'s fragrance from 1966',
        notes: ['lemon', 'basil', 'jasmine', 'oakmoss'],
        intensity_score: 4,
        longevity_hours: 4,
        sample_available: true,
        sample_price_usd: 8,
        popularity_score: 45,
        fragrance_family: 'fresh',
        recommended_occasions: ['daily', 'vintage'],
        recommended_seasons: ['spring', 'summer'],
        image_url: '/images/eau-sauvage.jpg'
      },
      {
        id: 'eau-sauvage-parfum-2012',
        name: 'Eau Sauvage Parfum',
        brand: 'Dior',
        brand_id: 'dior-brand',
        description: 'The parfum concentration of the classic',
        notes: ['lemon', 'basil', 'jasmine', 'oakmoss', 'vetiver'],
        intensity_score: 6,
        longevity_hours: 7,
        sample_available: true,
        sample_price_usd: 12,
        popularity_score: 35,
        fragrance_family: 'fresh',
        recommended_occasions: ['evening', 'vintage'],
        recommended_seasons: ['spring', 'summer'],
        image_url: '/images/eau-sauvage-parfum.jpg'
      },
      {
        id: 'eau-sauvage-extreme-1984',
        name: 'Eau Sauvage Extreme',
        brand: 'Dior',
        brand_id: 'dior-brand',
        description: 'Discontinued intense version of Eau Sauvage',
        notes: ['lemon', 'basil', 'jasmine', 'sandalwood'],
        intensity_score: 7,
        longevity_hours: 8,
        sample_available: false,
        sample_price_usd: undefined,
        popularity_score: 25,
        fragrance_family: 'fresh',
        recommended_occasions: ['evening', 'vintage'],
        recommended_seasons: ['fall'],
        image_url: '/images/eau-sauvage-extreme.jpg'
      },

      // Other fragrances that might appear in search
      {
        id: 'balade-sauvage-2018',
        name: 'Balade Sauvage',
        brand: 'Dior',
        brand_id: 'dior-brand',
        description: 'Unisex fragrance inspired by wild landscapes',
        notes: ['pink pepper', 'rose', 'iris', 'sandalwood'],
        intensity_score: 5,
        longevity_hours: 6,
        sample_available: true,
        sample_price_usd: 14,
        popularity_score: 28,
        fragrance_family: 'floral',
        recommended_occasions: ['casual', 'unisex'],
        recommended_seasons: ['spring'],
        image_url: '/images/balade-sauvage.jpg'
      },
      {
        id: 'very-cool-spray-2007',
        name: 'Very Cool Spray',
        brand: 'Dior',
        brand_id: 'dior-brand',
        description: 'Limited edition cooling spray version',
        notes: ['mint', 'citrus', 'lavender'],
        intensity_score: 3,
        longevity_hours: 3,
        sample_available: false,
        sample_price_usd: undefined,
        popularity_score: 15,
        fragrance_family: 'fresh',
        recommended_occasions: ['sport', 'summer'],
        recommended_seasons: ['summer'],
        image_url: '/images/very-cool-spray.jpg'
      },

      // Non-Dior results that might appear
      {
        id: 'bleu-chanel-edp',
        name: 'Bleu de Chanel EDP',
        brand: 'Chanel',
        brand_id: 'chanel-brand',
        description: 'Sophisticated woody aromatic fragrance',
        notes: ['grapefruit', 'lemon', 'cedar', 'sandalwood'],
        intensity_score: 7,
        longevity_hours: 8,
        sample_available: true,
        sample_price_usd: 15,
        popularity_score: 92,
        fragrance_family: 'woody',
        recommended_occasions: ['office', 'evening'],
        recommended_seasons: ['all'],
        image_url: '/images/bleu-chanel.jpg'
      }
    ];

    // Filter results based on query
    const filteredResults = mockSearchResults.filter(fragrance => 
      fragrance.name.toLowerCase().includes(query) ||
      fragrance.description?.toLowerCase().includes(query) ||
      fragrance.notes?.some(note => note.toLowerCase().includes(query))
    );

    console.log(`🔍 Search for "${query}" returned ${filteredResults.length} results`);

    // Apply variant grouping
    const startTime = Date.now();
    const variantGroups = await VariantGrouper.groupVariants(filteredResults);
    const groupingTime = Date.now() - startTime;

    console.log(`⚡ Variant grouping completed in ${groupingTime}ms`);
    console.log(`📊 Grouped ${filteredResults.length} results into ${variantGroups.length} groups`);

    // Calculate choice paralysis reduction
    const choiceParalysisReduction = filteredResults.length > 0 
      ? Math.round(((filteredResults.length - variantGroups.length) / filteredResults.length) * 100)
      : 0;

    // Format response to match the new search API structure
    const response = {
      // Grouped results
      variant_groups: variantGroups.map(group => ({
        group_id: group.group_id,
        group_name: group.group_name,
        total_variants: group.total_variants,
        primary_variant: {
          id: group.primary_variant.id,
          name: group.primary_variant.name,
          brand: group.primary_variant.brand,
          description: group.primary_variant.description,
          notes: group.primary_variant.notes,
          intensity_score: group.primary_variant.intensity_score,
          longevity_hours: group.primary_variant.longevity_hours,
          sample_available: group.primary_variant.sample_available,
          sample_price_usd: group.primary_variant.sample_price_usd,
          popularity_score: group.primary_variant.popularity_score,
          image_url: group.primary_variant.image_url,
          recommended_occasions: group.primary_variant.recommended_occasions,
          recommended_seasons: group.primary_variant.recommended_seasons
        },
        related_variants: group.related_variants.map(variant => ({
          id: variant.id,
          name: variant.name,
          intensity_score: variant.intensity_score,
          longevity_hours: variant.longevity_hours,
          sample_available: variant.sample_available,
          sample_price_usd: variant.sample_price_usd,
          popularity_score: variant.popularity_score,
          description: variant.description
        })),
        badges: group.badges,
        experience_recommendations: group.experience_recommendations,
        popularity_score: group.popularity_score
      })),

      // Metadata
      total: filteredResults.length,
      query: query,
      grouped_results: true,
      groups_count: variantGroups.length,
      search_method: 'demo',
      
      metadata: {
        choice_paralysis_reduction: choiceParalysisReduction,
        grouping_time_ms: groupingTime,
        original_result_count: filteredResults.length,
        grouped_result_count: variantGroups.length,
        demo_mode: true,
        problem_solved: choiceParalysisReduction >= 30 ? 'Yes' : 'Partial',
        sce_68_requirements: {
          smart_variant_hierarchy: variantGroups.length > 0,
          primary_variant_identification: variantGroups.every(g => g.primary_variant),
          reduced_choice_overwhelm: choiceParalysisReduction > 0,
          experience_based_recommendations: variantGroups.every(g => g.experience_recommendations.length === 3),
          badge_system: variantGroups.some(g => g.badges.length > 0)
        }
      },

      // Performance metrics
      performance: {
        search_time_ms: 0, // Mock search time
        grouping_time_ms: groupingTime,
        total_time_ms: groupingTime,
        cache_hit: false
      },

      // Educational content about the solution
      solution_explanation: {
        problem: `Search for "${query}" returned ${filteredResults.length} variants, causing choice paralysis`,
        solution: `Grouped into ${variantGroups.length} logical groups with clear primary variants`,
        benefits: [
          `${choiceParalysisReduction}% reduction in cognitive load`,
          'Clear primary variant for each fragrance family',
          'Experience-based recommendations for different user levels',
          'Helpful badges to guide selection'
        ],
        user_guidance: variantGroups.length > 0 ? [
          `🏆 Start with "${variantGroups[0]?.primary_variant?.name}" - the most popular choice`,
          variantGroups[0]?.experience_recommendations?.find(r => r.level === 'beginner')?.reasoning || 'Perfect for beginners',
          `💡 ${variantGroups[0]?.related_variants?.length} alternatives available if you want to explore`
        ] : []
      }
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Demo cache
        'X-Demo-Mode': 'true',
        'X-SCE-68-Implementation': 'variant-grouping-v1'
      }
    });

  } catch (error) {
    console.error('Demo API error:', error);
    return NextResponse.json(
      { 
        error: 'Demo API error',
        message: error instanceof Error ? error.message : 'Unknown error',
        demo_mode: true 
      },
      { status: 500 }
    );
  }
}