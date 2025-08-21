import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

/**
 * GET /api/search/filters
 *
 * MVP filter options endpoint providing available filter values and counts
 * Uses existing database tables to build filter options dynamically
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Get filter options in parallel for MVP performance
    const [
      scentFamiliesResult,
      brandsResult,
      occasionsResult,
      seasonsResult,
      sampleStatsResult,
    ] = await Promise.all([
      // Scent families with counts
      (supabase as any)
        .from('fragrances')
        .select('scent_family')
        .not('scent_family', 'is', null)
        .not('scent_family', 'eq', ''),

      // Popular brands with item counts
      (supabase as any)
        .from('fragrance_brands')
        .select('name, item_count')
        .not('item_count', 'is', null)
        .order('item_count', { ascending: false })
        .limit(15), // Top 15 brands for MVP

      // Occasions from fragrance data
      (supabase as any)
        .from('fragrances')
        .select('recommended_occasions')
        .not('recommended_occasions', 'is', null),

      // Seasons from fragrance data
      (supabase as any)
        .from('fragrances')
        .select('recommended_seasons')
        .not('recommended_seasons', 'is', null),

      // Sample availability and price stats
      (supabase as any)
        .from('fragrances')
        .select('sample_available, sample_price_usd')
        .eq('sample_available', true)
        .not('sample_price_usd', 'is', null),
    ]);

    // Process scent families for MVP
    const scentFamilyCounts: Record<string, number> = {};
    if (scentFamiliesResult.data) {
      scentFamiliesResult.data.forEach((item: any) => {
        if (item.scent_family) {
          scentFamilyCounts[item.scent_family] =
            (scentFamilyCounts[item.scent_family] || 0) + 1;
        }
      });
    }

    const scentFamilies = Object.entries(scentFamilyCounts)
      .filter(([_, count]: [string, number]) => count >= 3) // MVP: Only show families with 3+ fragrances
      .sort(([, a]: [string, number], [, b]: [string, number]) => b - a) // Sort by count descending
      .slice(0, 10) // Top 10 for MVP
      .map(([family, count]: [string, number]) => ({
        value: family,
        label: family,
        count,
      }));

    // Process brands for MVP
    const brands = (brandsResult.data || [])
      .filter((brand: any) => (brand.item_count || 0) >= 2) // MVP: Only brands with 2+ fragrances
      .slice(0, 10) // Top 10 for MVP
      .map((brand: any) => ({
        value: brand.name,
        label: brand.name,
        count: brand.item_count || 0,
      }));

    // Process occasions for MVP
    const occasionCounts: Record<string, number> = {};
    if (occasionsResult.data) {
      occasionsResult.data.forEach((item: any) => {
        if (
          item.recommended_occasions &&
          Array.isArray(item.recommended_occasions)
        ) {
          item.recommended_occasions.forEach((occasion: string) => {
            if (occasion && occasion.trim()) {
              const normalizedOccasion = occasion.trim();
              occasionCounts[normalizedOccasion] =
                (occasionCounts[normalizedOccasion] || 0) + 1;
            }
          });
        }
      });
    }

    const occasions = Object.entries(occasionCounts)
      .filter(([_, count]: [string, number]) => count >= 5) // MVP: Only occasions with 5+ fragrances
      .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
      .slice(0, 8) // Top 8 for MVP
      .map(([occasion, count]: [string, number]) => ({
        value: occasion,
        label: occasion,
        count,
      }));

    // Process seasons for MVP
    const seasonCounts: Record<string, number> = {};
    if (seasonsResult.data) {
      seasonsResult.data.forEach((item: any) => {
        if (
          item.recommended_seasons &&
          Array.isArray(item.recommended_seasons)
        ) {
          item.recommended_seasons.forEach((season: string) => {
            if (season && season.trim()) {
              const normalizedSeason = season.trim();
              seasonCounts[normalizedSeason] =
                (seasonCounts[normalizedSeason] || 0) + 1;
            }
          });
        }
      });
    }

    const seasons = Object.entries(seasonCounts)
      .filter(([_, count]: [string, number]) => count >= 5) // MVP: Only seasons with 5+ fragrances
      .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
      .map(([season, count]: [string, number]) => ({
        value: season,
        label: season,
        count,
      }));

    // Process sample price ranges for MVP
    const samplePrices = (sampleStatsResult.data || [])
      .map((item: any) => item.sample_price_usd)
      .filter((price: any) => price !== null && price > 0) as number[];

    const priceRanges = [];
    if (samplePrices.length > 0) {
      const underTen = samplePrices.filter((p: any) => p < 10).length;
      const tenToTwenty = samplePrices.filter(
        (p: any) => p >= 10 && p < 20
      ).length;
      const twentyToThirty = samplePrices.filter(
        (p: any) => p >= 20 && p < 30
      ).length;
      const thirtyPlus = samplePrices.filter((p: any) => p >= 30).length;

      if (underTen > 0)
        priceRanges.push({
          min: 0,
          max: 10,
          label: 'Under $10',
          count: underTen,
        });
      if (tenToTwenty > 0)
        priceRanges.push({
          min: 10,
          max: 20,
          label: '$10-$20',
          count: tenToTwenty,
        });
      if (twentyToThirty > 0)
        priceRanges.push({
          min: 20,
          max: 30,
          label: '$20-$30',
          count: twentyToThirty,
        });
      if (thirtyPlus > 0)
        priceRanges.push({
          min: 30,
          max: 1000,
          label: '$30+',
          count: thirtyPlus,
        });
    }

    // Additional MVP filters
    const totalFragrances = scentFamiliesResult.data?.length || 0;
    const samplesAvailable = sampleStatsResult.data?.length || 0;

    return NextResponse.json(
      {
        scent_families: scentFamilies,
        brands: brands,
        occasions: occasions,
        seasons: seasons,
        price_ranges: priceRanges,
        availability: [
          {
            value: 'sample_available',
            label: 'Samples Available',
            count: samplesAvailable,
          },
          {
            value: 'all',
            label: 'All Fragrances',
            count: totalFragrances,
          },
        ],
        metadata: {
          total_fragrances: totalFragrances,
          samples_available: samplesAvailable,
          last_updated: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200', // 1 hour cache, 2 hour stale
        },
      }
    );
  } catch (error) {
    console.error('Unexpected error in filters API:', error);

    // Graceful fallback for MVP - return minimal filter options
    return NextResponse.json(
      {
        scent_families: [],
        brands: [],
        occasions: [],
        seasons: [],
        price_ranges: [],
        availability: [],
        metadata: {
          total_fragrances: 0,
          samples_available: 0,
          last_updated: new Date().toISOString(),
          error: 'Filter data temporarily unavailable',
        },
      },
      {
        status: 200, // Don't fail the whole interface if filters fail
        headers: {
          'Cache-Control': 'public, s-maxage=300', // 5 min cache for errors
        },
      }
    );
  }
}
