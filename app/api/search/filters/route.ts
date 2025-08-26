import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { withRateLimit } from '@/lib/rate-limit';

/**
 * Filter Options API - Provides filter data for browse page
 * 
 * GET /api/search/filters
 * 
 * Returns available filter options for fragrance search/browse
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Rate limiting check
  const rateLimitCheck = await withRateLimit(request, 'search');
  if (rateLimitCheck.blocked) {
    return rateLimitCheck.response;
  }

  try {
    const supabase = await createServerSupabase();

    // Fetch all filter data in parallel
    const [
      brandsResult,
      scentFamiliesResult,
      occasionsResult,
      seasonsResult,
      statsResult
    ] = await Promise.all([
      // Get top brands
      (supabase as any)
        .from('fragrance_brands')
        .select('id, name')
        .order('name', { ascending: true })
        .limit(50),

      // Get scent families from fragrances
      (supabase as any)
        .from('fragrances')
        .select('gender')
        .not('gender', 'is', null),

      // Get occasions (mock for now)
      Promise.resolve({ data: ['Everyday', 'Date Night', 'Office', 'Special Events', 'Casual'] }),

      // Get seasons (mock for now)
      Promise.resolve({ data: ['Spring', 'Summer', 'Fall', 'Winter', 'Year Round'] }),

      // Get overall stats
      (supabase as any)
        .from('fragrances')
        .select('id, sample_available')
        .not('id', 'is', null)
    ]);

    // Check for errors
    if (brandsResult.error) {
      throw new Error(`Brands query error: ${brandsResult.error.message}`);
    }
    if (scentFamiliesResult.error) {
      throw new Error(`Scent families query error: ${scentFamiliesResult.error.message}`);
    }
    if (statsResult.error) {
      throw new Error(`Stats query error: ${statsResult.error.message}`);
    }

    // Process brands
    const brands = (brandsResult.data || []).map((brand: any) => ({
      id: brand.id,
      name: brand.name,
      value: brand.name.toLowerCase().replace(/\s+/g, '-')
    }));

    // Process scent families (use gender as proxy for now)
    const genderCounts = (scentFamiliesResult.data || []).reduce((acc: any, item: any) => {
      acc[item.gender] = (acc[item.gender] || 0) + 1;
      return acc;
    }, {});

    const scent_families = Object.entries(genderCounts).map(([gender, count]) => ({
      name: gender === 'men' ? 'Masculine' : gender === 'women' ? 'Feminine' : 'Unisex',
      value: gender,
      count: count as number
    }));

    // Process occasions
    const occasions = (occasionsResult.data || []).map((occasion: string) => ({
      name: occasion,
      value: occasion.toLowerCase().replace(/\s+/g, '-')
    }));

    // Process seasons
    const seasons = (seasonsResult.data || []).map((season: string) => ({
      name: season,
      value: season.toLowerCase().replace(/\s+/g, '-')
    }));

    // Calculate stats
    const totalFragrances = (statsResult.data || []).length;
    const samplesAvailable = (statsResult.data || []).filter((f: any) => f.sample_available).length;

    // Price ranges for budget-conscious users like our McDonald's worker
    const price_ranges = [
      { name: 'Under $10', min: 0, max: 10, value: '0-10' },
      { name: '$10 - $20', min: 10, max: 20, value: '10-20' },
      { name: '$20 - $50', min: 20, max: 50, value: '20-50' },
      { name: '$50 - $100', min: 50, max: 100, value: '50-100' },
      { name: 'Over $100', min: 100, max: null, value: '100+' }
    ];

    const availability = [
      { name: 'Samples Available', value: 'samples', description: 'Try before you buy' },
      { name: 'Full Bottles', value: 'bottles', description: 'Complete fragrances' }
    ];

    const response = {
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
        processing_time_ms: Date.now() - startTime
      }
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'X-Total-Fragrances': totalFragrances.toString(),
        'X-Samples-Available': samplesAvailable.toString()
      }
    });

  } catch (error) {
    console.error('Filters API error:', error);
    
    // Return fallback empty filters
    return NextResponse.json({
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
        error: 'Filter data temporarily unavailable'
      }
    }, { status: 200 }); // Return 200 to prevent browse page from breaking
  }
}