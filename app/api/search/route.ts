import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { generateQueryEmbedding } from '@/lib/ai/voyage-client';
import {
  SemanticSearchEngine,
  QueryProcessor,
  IntentClassifier,
  HybridSearchEngine,
  SearchPersonalizer,
} from '@/lib/ai/ai-search';

/**
 * GET /api/search
 *
 * AI-powered search endpoint with semantic understanding, intent classification,
 * and personalized ranking. Maintains backward compatibility with MVP.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);

    // Parse search parameters
    const query = searchParams.get('q')?.trim() || '';
    const userId = searchParams.get('user_id'); // For personalization
    const scentFamilies =
      searchParams.get('scent_families')?.split(',').filter(Boolean) || [];
    const occasions =
      searchParams.get('occasions')?.split(',').filter(Boolean) || [];
    const seasons =
      searchParams.get('seasons')?.split(',').filter(Boolean) || [];
    const brands = searchParams.get('brands')?.split(',').filter(Boolean) || [];
    const sampleOnly = searchParams.get('sample_only') === 'true';
    const enableAI = searchParams.get('ai') === 'true'; // AI temporarily disabled (mock data issue)

    // Numeric filters
    const intensityMin = Math.max(
      0,
      Math.min(10, parseFloat(searchParams.get('intensity_min') || '0'))
    );
    const intensityMax = Math.max(
      intensityMin,
      Math.min(10, parseFloat(searchParams.get('intensity_max') || '10'))
    );

    // Result limit
    const limit = Math.max(
      1,
      Math.min(50, parseInt(searchParams.get('limit') || '20'))
    );

    const supabase = await createServerSupabase();

    // Prepare filters object
    const filters = {
      scent_families: scentFamilies,
      occasions,
      seasons,
      brands,
      sample_only: sampleOnly,
      intensity_range:
        intensityMin !== 0 || intensityMax !== 10
          ? { min: intensityMin, max: intensityMax }
          : undefined,
    };

    let searchResults;
    let searchMethod = 'keyword'; // Default fallback
    let aiPowered = false;
    let embeddingCost = 0;
    const personalizationApplied = false;

    // Try AI-powered search first if enabled and query provided
    if (enableAI && query && query.length >= 2) {
      try {
        console.log(`🤖 AI Search: "${query}"`);

        // Initialize hybrid search engine
        const hybridSearch = new HybridSearchEngine({
          supabase,
          vectorWeight: 0.6,
          keywordWeight: 0.3,
          popularityWeight: 0.1,
          enablePersonalization: !!userId,
          maxResults: limit,
        });

        const aiResults = await hybridSearch.search(query, {
          filters,
          page: 1,
          pageSize: limit,
        });

        if (aiResults.success && aiResults.results.length > 0) {
          searchResults = {
            fragrances: aiResults.results.map(result => ({
              id: result.fragrance_id,
              name: result.name,
              brand: result.brand,
              brand_id: result.brand_id || result.brand,
              gender: result.gender || 'unisex',
              relevance_score: result.final_score,
              similarity_score: result.similarity,
              sample_available: result.sample_available ?? true,
              sample_price_usd: result.sample_price_usd || 15,
              metadata: result.metadata,
            })),
            total: aiResults.total_results,
            search_methods_used: aiResults.search_methods_used,
          };

          searchMethod = aiResults.search_methods_used.join('+');
          aiPowered = true;
          embeddingCost = 0.000027; // Estimated embedding cost
        }
      } catch (aiError) {
        console.warn(
          'AI search failed, using keyword fallback:',
          aiError.message
        );
      }
    }

    // Fallback to original implementation if AI search didn't work
    if (!searchResults) {
      console.log(`🔍 Fallback database search: "${query}"`);
      searchMethod = query ? 'text' : 'popular';

      // Build query with minimal columns that definitely exist
      let searchQuery = supabase.from('fragrances').select(`
          id,
          name,
          brand_id,
          gender
        `);

      // Apply text search if query provided
      if (query && query.trim().length > 0) {
        searchQuery = searchQuery.or(`name.ilike.%${query}%`);
      }

      // Apply gender filter if provided
      const gender = searchParams.get('gender');
      if (gender) {
        searchQuery = searchQuery.eq('gender', gender);
      }

      // Apply brand filter if provided
      const brand = searchParams.get('brand');
      if (brand) {
        searchQuery = searchQuery.eq('brand_id', brand);
      }

      // Order by name for now (since score column doesn't exist) and limit results
      searchQuery = searchQuery.order('name', { ascending: true }).limit(limit);

      const { data: fallbackResults, error } = await searchQuery;

      if (error) {
        console.error('Search query error:', error);
        return NextResponse.json(
          {
            error: 'Search temporarily unavailable',
            details:
              process.env.NODE_ENV === 'development'
                ? error.message
                : undefined,
          },
          { status: 503 }
        );
      }

      // Format search results using minimal database data and set searchResults
      const enhancedResults = (fallbackResults || []).map((result: any) => ({
        id: result.id,
        name: result.name || 'Untitled Fragrance',
        brand: result.brand_id || 'Unknown Brand', // Frontend expects 'brand'
        brand_id: result.brand_id,
        gender: result.gender || 'unisex',
        relevance_score: query ? 0.8 : 1.0,
        // MVP defaults for missing enhanced features
        sample_available: true,
        sample_price_usd: 15,
        image_url: null,
      }));

      // Set searchResults to the proper format for consistent handling
      searchResults = {
        fragrances: enhancedResults,
        total: enhancedResults.length,
      };
    }

    // Format final results (searchResults is now guaranteed to be defined)
    const finalResults = searchResults;

    // Return structured response with AI metadata
    return NextResponse.json(
      {
        fragrances: finalResults.fragrances,
        total: finalResults.total,
        query: query,
        search_method: searchMethod,
        filters_applied: {
          scent_families: scentFamilies,
          sample_only: sampleOnly,
          occasions: occasions,
          seasons: seasons,
          brands: brands,
          intensity_range:
            intensityMin !== 0 || intensityMax !== 10
              ? [intensityMin, intensityMax]
              : null,
        },
        metadata: {
          limit_used: limit,
          has_more: finalResults.fragrances.length === limit,
          ai_powered: aiPowered,
          search_methods_used: finalResults.search_methods_used || [
            searchMethod,
          ],
          processing_time_ms: Date.now() - startTime,
          embedding_cost: embeddingCost,
          personalization_applied: personalizationApplied,
          cost_estimate: embeddingCost || 0,
        },
      },
      {
        headers: {
          'Cache-Control': aiPowered
            ? 'public, s-maxage=300, stale-while-revalidate=900' // 5 min cache for AI results
            : 'public, s-maxage=600, stale-while-revalidate=1800', // 10 min cache for text results
          'X-AI-Powered': aiPowered.toString(),
          'X-Search-Method': searchMethod,
          'X-Processing-Time': (Date.now() - startTime).toString(),
        },
      }
    );
  } catch (error) {
    console.error('Unexpected error in search API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
