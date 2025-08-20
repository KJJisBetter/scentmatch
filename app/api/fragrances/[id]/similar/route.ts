import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/fragrances/[id]/similar
 * 
 * Fetches similar fragrances using vector similarity search
 * Supports query parameters for customizing similarity threshold and result count
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Validate fragrance ID
    if (!id || id.trim() === '') {
      return NextResponse.json(
        { error: 'Fragrance ID is required' },
        { status: 400 }
      );
    }

    // Parse query parameters with defaults
    const threshold = Math.max(0, Math.min(1, 
      parseFloat(searchParams.get('threshold') || '0.7')
    ));
    const limit = Math.max(1, Math.min(20, 
      parseInt(searchParams.get('limit') || '6')
    ));
    const embeddingVersion = searchParams.get('version') || 'voyage-3.5';

    const supabase = await createServerSupabase();

    // First verify the fragrance exists
    const { data: fragranceExists } = await supabase
      .from('fragrances')
      .select('id')
      .eq('id', id)
      .single();

    if (!fragranceExists) {
      return NextResponse.json(
        { error: 'Fragrance not found' },
        { status: 404 }
      );
    }

    // Get similar fragrances using our database function
    const { data: similarFragrances, error } = await supabase.rpc('get_similar_fragrances', {
      target_fragrance_id: id,
      similarity_threshold: threshold,
      max_results: limit,
      embedding_version: embeddingVersion,
    });

    if (error) {
      console.error('Error fetching similar fragrances:', error);
      
      // If the function doesn't exist yet, fall back to a basic approach
      if (error.code === '42883' || error.code === 'PGRST202') {
        // Function not found - return mock data or try alternative approach
        const { data: allFragrances } = await supabase
          .from('fragrances')
          .select(`
            id,
            name,
            fragrance_brands:brand_id (name)
          `)
          .neq('id', id)
          .limit(limit);

        const mockSimilar = allFragrances?.map(f => ({
          fragrance_id: f.id,
          similarity_score: 0.5 + Math.random() * 0.3, // Mock similarity
          name: f.name,
          brand: (f.fragrance_brands as any)?.name || 'Unknown Brand',
        })) || [];

        return NextResponse.json({ 
          similar: mockSimilar,
          fallback: true,
          message: 'Using fallback similarity algorithm'
        }, {
          headers: {
            'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600', // 30 min cache
          },
        });
      }

      return NextResponse.json(
        { error: 'Failed to fetch similar fragrances' },
        { status: 500 }
      );
    }

    // Enhance similar fragrances with additional metadata
    const enhancedSimilar = await Promise.all(
      (similarFragrances || []).map(async (similar: any) => {
        const { data: fragrance } = await supabase
          .from('fragrances')
          .select(`
            image_url,
            sample_available,
            sample_price_usd,
            scent_family
          `)
          .eq('id', similar.fragrance_id)
          .single();

        return {
          ...similar,
          image_url: fragrance?.image_url,
          sample_available: fragrance?.sample_available,
          sample_price_usd: fragrance?.sample_price_usd,
          scent_family: fragrance?.scent_family,
        };
      })
    );

    return NextResponse.json({
      similar: enhancedSimilar,
      metadata: {
        threshold_used: threshold,
        max_results: limit,
        embedding_version: embeddingVersion,
        total_found: enhancedSimilar.length,
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400', // 1 hour cache, 24 hour stale
      },
    });

  } catch (error) {
    console.error('Unexpected error in similar fragrances API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}