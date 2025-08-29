'use server';

import { unstable_rethrow } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';

/**
 * Get Filter Options Server Action
 *
 * Replaces /api/search/filters route for browse page
 * Returns all available filter options for search functionality
 */
export async function getFilterOptions(): Promise<{
  success: boolean;
  error?: string;
  data?: {
    scent_families: Array<{ value: string; label: string; count: number }>;
    brands: Array<{ value: string; label: string; count: number }>;
    occasions: Array<{ value: string; label: string; count: number }>;
    seasons: Array<{ value: string; label: string; count: number }>;
    price_ranges: Array<{
      min: number;
      max: number;
      label: string;
      count: number;
    }>;
    availability: Array<{ value: string; label: string; count: number }>;
    metadata: {
      total_fragrances: number;
      samples_available: number;
      last_updated: string;
      processing_time_ms: number;
    };
  };
}> {
  const startTime = Date.now();

  try {
    const supabase = await createServerSupabase();

    // Fetch all filter data in parallel
    const [
      brandsResult,
      scentFamiliesResult,
      occasionsResult,
      seasonsResult,
      statsResult,
    ] = await Promise.all([
      // Get top brands
      supabase
        .from('fragrance_brands')
        .select('id, name')
        .order('name', { ascending: true })
        .limit(50),

      // Get scent families from fragrances (using gender as proxy)
      supabase.from('fragrances').select('gender').not('gender', 'is', null),

      // Get occasions (static data)
      Promise.resolve({
        data: ['Everyday', 'Date Night', 'Office', 'Special Events', 'Casual'],
      }),

      // Get seasons (static data)
      Promise.resolve({
        data: ['Spring', 'Summer', 'Fall', 'Winter', 'Year Round'],
      }),

      // Get overall stats
      supabase
        .from('fragrances')
        .select('id, sample_available')
        .not('id', 'is', null),
    ]);

    // Check for errors
    if (brandsResult.error) {
      throw new Error(`Brands query error: ${brandsResult.error.message}`);
    }
    if (scentFamiliesResult.error) {
      throw new Error(
        `Scent families query error: ${scentFamiliesResult.error.message}`
      );
    }
    if (statsResult.error) {
      throw new Error(`Stats query error: ${statsResult.error.message}`);
    }

    // Process brands
    const brands = (brandsResult.data || []).map((brand: any) => ({
      label: brand.name,
      value: brand.name.toLowerCase().replace(/\s+/g, '-'),
      count: 0, // TODO: Add actual counts
    }));

    // Process scent families (use gender as proxy for now)
    const genderCounts = (scentFamiliesResult.data || []).reduce(
      (acc: any, item: any) => {
        acc[item.gender] = (acc[item.gender] || 0) + 1;
        return acc;
      },
      {}
    );

    const scent_families = Object.entries(genderCounts).map(
      ([gender, count]) => ({
        label:
          gender === 'men'
            ? 'Masculine'
            : gender === 'women'
              ? 'Feminine'
              : 'Unisex',
        value: gender,
        count: count as number,
      })
    );

    // Process occasions
    const occasions = (occasionsResult.data || []).map((occasion: string) => ({
      label: occasion,
      value: occasion.toLowerCase().replace(/\s+/g, '-'),
      count: 0, // TODO: Add actual counts
    }));

    // Process seasons
    const seasons = (seasonsResult.data || []).map((season: string) => ({
      label: season,
      value: season.toLowerCase().replace(/\s+/g, '-'),
      count: 0, // TODO: Add actual counts
    }));

    // Calculate stats
    const totalFragrances = (statsResult.data || []).length;
    const samplesAvailable = (statsResult.data || []).filter(
      (f: any) => f.sample_available
    ).length;

    // Price ranges
    const price_ranges = [
      { label: 'Under $10', min: 0, max: 10, value: '0-10', count: 0 },
      { label: '$10 - $20', min: 10, max: 20, value: '10-20', count: 0 },
      { label: '$20 - $50', min: 20, max: 50, value: '20-50', count: 0 },
      { label: '$50 - $100', min: 50, max: 100, value: '50-100', count: 0 },
      { label: 'Over $100', min: 100, max: null, value: '100+', count: 0 },
    ];

    const availability = [
      {
        label: 'Samples Available',
        value: 'samples',
        description: 'Try before you buy',
        count: samplesAvailable,
      },
      {
        label: 'Full Bottles',
        value: 'bottles',
        description: 'Complete fragrances',
        count: totalFragrances - samplesAvailable,
      },
    ];

    return {
      success: true,
      data: {
        scent_families,
        brands,
        occasions,
        seasons,
        price_ranges,
        availability,
        metadata: {
          total_fragrances: totalFragrances,
          samples_available: samplesAvailable,
          last_updated: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime,
        },
      },
    };
  } catch (error) {
    console.error('Filter Options Server Action error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      error: 'Filter options temporarily unavailable',
    };
  }
}
