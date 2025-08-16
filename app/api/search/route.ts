import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { generateQueryEmbedding } from '@/lib/ai/voyage-client';

/**
 * GET /api/search
 * 
 * MVP search endpoint for fragrances using existing database capabilities
 * Leverages the advanced_fragrance_search function for comprehensive search
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate search parameters with MVP-focused defaults
    const query = searchParams.get('q')?.trim() || '';
    const scentFamilies = searchParams.get('scent_families')?.split(',').filter(Boolean) || [];
    const occasions = searchParams.get('occasions')?.split(',').filter(Boolean) || [];
    const seasons = searchParams.get('seasons')?.split(',').filter(Boolean) || [];
    const sampleOnly = searchParams.get('sample_only') === 'true';
    
    // Parse numeric filters with reasonable limits for MVP
    const intensityMin = Math.max(0, Math.min(10, 
      parseFloat(searchParams.get('intensity_min') || '0')
    ));
    const intensityMax = Math.max(intensityMin, Math.min(10, 
      parseFloat(searchParams.get('intensity_max') || '10')
    ));
    const longevityMin = Math.max(0, Math.min(24,
      parseFloat(searchParams.get('longevity_min') || '0')
    ));
    
    // Result limit with MVP performance in mind (max 50 results)
    const limit = Math.max(1, Math.min(50, 
      parseInt(searchParams.get('limit') || '20')
    ));

    const supabase = await createServerSupabase();

    // Try AI-powered vector search first, fall back to text search
    let searchResults = null;
    let error = null;
    let searchMethod = 'text';

    if (query && query.trim().length > 0) {
      try {
        // Generate embedding for the search query
        console.log(`🧠 Generating embedding for query: "${query}"`);
        const queryEmbedding = await generateQueryEmbedding(query.trim());
        
        // Use vector similarity search for semantic results
        const { data: vectorResults, error: vectorError } = await supabase.rpc('vector_similarity_search', {
          query_embedding: queryEmbedding,
          similarity_threshold: 0.2, // Lower threshold for more results
          max_results: limit,
        });

        if (!vectorError && vectorResults && vectorResults.length > 0) {
          searchResults = vectorResults;
          searchMethod = 'vector';
          console.log(`✅ Vector search found ${vectorResults.length} results`);
        } else {
          throw new Error('Vector search returned no results');
        }

      } catch (embeddingError) {
        console.log(`⚠️ Vector search failed, falling back to text search:`, embeddingError instanceof Error ? embeddingError.message : embeddingError);
        
        // Fall back to text search
        const { data: textResults, error: textError } = await supabase.rpc('simple_fragrance_search', {
          query_text: query,
          limit_count: limit,
        });

        searchResults = textResults;
        error = textError;
        searchMethod = 'text';
      }
    } else {
      // No query - get popular fragrances
      const { data: popularResults, error: popularError } = await supabase.rpc('simple_fragrance_search', {
        query_text: '',
        limit_count: limit,
      });

      searchResults = popularResults;
      error = popularError;
      searchMethod = 'popular';
    }

    if (error) {
      console.error('Error in advanced_fragrance_search:', error);
      
      // Fallback strategy for MVP if the function isn't available yet
      if (error.code === '42883') {
        // Function not found - use basic search as fallback
        let fallbackQuery = supabase
          .from('fragrances')
          .select(`
            id,
            name,
            description,
            scent_family,
            sample_available,
            sample_price_usd,
            popularity_score,
            fragrance_brands:brand_id (
              name
            )
          `);

        // Apply basic text search if query provided
        if (query) {
          fallbackQuery = fallbackQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
        }

        // Apply sample filter if requested
        if (sampleOnly) {
          fallbackQuery = fallbackQuery.eq('sample_available', true);
        }

        // Apply scent family filter
        if (scentFamilies.length > 0) {
          fallbackQuery = fallbackQuery.in('scent_family', scentFamilies);
        }

        // Order by popularity for MVP
        fallbackQuery = fallbackQuery
          .order('popularity_score', { ascending: false, nullsFirst: false })
          .limit(limit);

        const { data: fallbackResults, error: fallbackError } = await fallbackQuery;

        if (fallbackError) {
          console.error('Fallback search error:', fallbackError);
          return NextResponse.json(
            { error: 'Search service temporarily unavailable' },
            { status: 503 }
          );
        }

        // Format fallback results to match expected structure
        const formattedResults = fallbackResults?.map(f => ({
          fragrance_id: f.id,
          name: f.name,
          brand: (f.fragrance_brands as any)?.name || 'Unknown Brand',
          scent_family: f.scent_family || 'Unknown',
          relevance_score: query ? 0.5 : (f.popularity_score || 0) / 100, // Mock relevance
        })) || [];

        return NextResponse.json({
          fragrances: formattedResults,
          total: formattedResults.length,
          query: query,
          filters_applied: {
            scent_families: scentFamilies,
            sample_only: sampleOnly,
            occasions: occasions,
            seasons: seasons
          },
          fallback: true,
          message: 'Using basic search - advanced features coming soon'
        }, {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // 5 min cache for fallback
          },
        });
      }

      return NextResponse.json(
        { error: 'Search request failed' },
        { status: 500 }
      );
    }

    // Enhance search results with additional metadata for MVP
    const enhancedResults = await Promise.all(
      (searchResults || []).map(async (result: any) => {
        const { data: fragrance } = await supabase
          .from('fragrances')
          .select(`
            sample_available,
            sample_price_usd,
            travel_size_available,
            travel_size_price_usd,
            image_url,
            description,
            notes,
            recommended_occasions,
            recommended_seasons
          `)
          .eq('id', result.fragrance_id)
          .single();

        return {
          id: result.fragrance_id,
          name: result.name,
          brand: result.brand,
          scent_family: result.scent_family,
          relevance_score: result.relevance_score,
          sample_available: fragrance?.sample_available || false,
          sample_price_usd: fragrance?.sample_price_usd || null,
          travel_size_available: fragrance?.travel_size_available || false,
          travel_size_price_usd: fragrance?.travel_size_price_usd || null,
          image_url: fragrance?.image_url || null,
          description: fragrance?.description || null,
          notes: fragrance?.notes || [],
          recommended_occasions: fragrance?.recommended_occasions || [],
          recommended_seasons: fragrance?.recommended_seasons || [],
        };
      })
    );

    // Return structured response with AI-powered search information
    return NextResponse.json({
      fragrances: enhancedResults,
      total: enhancedResults.length,
      query: query,
      search_method: searchMethod, // 'vector', 'text', or 'popular'
      filters_applied: {
        scent_families: scentFamilies,
        sample_only: sampleOnly,
        occasions: occasions,
        seasons: seasons,
        intensity_range: intensityMin !== 0 || intensityMax !== 10 ? [intensityMin, intensityMax] : null,
        longevity_min: longevityMin > 0 ? longevityMin : null
      },
      metadata: {
        limit_used: limit,
        has_more: enhancedResults.length === limit,
        ai_powered: searchMethod === 'vector', // Indicates if AI semantic search was used
        cost_estimate: searchMethod === 'vector' ? 0.0001 : 0 // Rough cost estimate
      }
    }, {
      headers: {
        'Cache-Control': searchMethod === 'vector' 
          ? 'public, s-maxage=300, stale-while-revalidate=900' // 5 min cache for AI results
          : 'public, s-maxage=600, stale-while-revalidate=1800', // 10 min cache for text results
      },
    });

  } catch (error) {
    console.error('Unexpected error in search API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}