import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { SearchSuggestionEngine, QueryProcessor } from '@/lib/ai/ai-search';

/**
 * GET /api/search/suggestions
 * 
 * AI-powered autocomplete endpoint with semantic suggestions, personalization,
 * and intelligent query expansion. Maintains backward compatibility with MVP.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '8');
    const includeTrending = searchParams.get('include_trending') === 'true';
    const enablePersonalization = searchParams.get('personalized') !== 'false';

    // Minimum query length check for performance
    if (query.length < 2) {
      return NextResponse.json({
        suggestions: [],
        query,
        total_suggestions: 0,
        personalization_applied: false,
        processing_time_ms: Date.now() - startTime
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      });
    }

    const supabase = await createServerSupabase();

    // Try AI-powered suggestions first
    let suggestions = [];
    let personalizationApplied = false;
    let aiSuggestionsWorked = false;

    try {
      // Initialize AI suggestion engine
      const suggestionEngine = new SearchSuggestionEngine({
        supabase,
        enableRealTime: true,
        enablePersonalization: enablePersonalization && !!userId,
        maxSuggestions: limit,
        minQueryLength: 2
      });

      if (userId && enablePersonalization) {
        // Get personalized suggestions
        suggestions = await suggestionEngine.getPersonalizedSuggestions(query, userId);
        personalizationApplied = true;
      } else {
        // Get general AI suggestions
        suggestions = await suggestionEngine.getSuggestions(query);
      }

      // Add trending suggestions if requested
      if (includeTrending && query.length < 4) {
        const trending = await suggestionEngine.getTrendingSuggestions(query);
        suggestions = [...suggestions, ...trending].slice(0, limit);
      }

      aiSuggestionsWorked = true;

    } catch (aiError) {
      console.warn('AI suggestions failed, using fallback:', String(aiError));
      
      // Fallback to original MVP implementation
      const [fragranceResults, brandResults] = await Promise.all([
        supabase
          .from('fragrances')
          .select('name')
          .ilike('name', `%${query}%`)
          .limit(3)
          .order('rating_value', { ascending: false, nullsFirst: false }),
        
        supabase
          .from('fragrance_brands')
          .select('name')
          .ilike('name', `%${query}%`)
          .limit(2)
          .order('name', { ascending: true })
      ]);

      const fallbackSuggestions: any[] = [];

      // Add fragrance suggestions
      if (fragranceResults.data) {
        fragranceResults.data.forEach(fragrance => {
          fallbackSuggestions.push({
            text: fragrance.name,
            type: 'fragrance',
            confidence: 0.7
          });
        });
      }

      // Add brand suggestions
      if (brandResults.data) {
        brandResults.data.forEach(brand => {
          fallbackSuggestions.push({
            text: brand.name,
            type: 'brand',
            confidence: 0.8
          });
        });
      }

      suggestions = fallbackSuggestions.slice(0, limit);
    }

    // Format response for backward compatibility
    const formattedSuggestions = suggestions.map(s => ({
      text: s.text,
      type: s.type || 'general',
      ...(aiSuggestionsWorked && { 
        confidence: s.confidence,
        personalized: s.personalized 
      })
    }));

    return NextResponse.json({
      suggestions: formattedSuggestions,
      ...(aiSuggestionsWorked && {
        query,
        total_suggestions: suggestions.length,
        personalization_applied: personalizationApplied,
        processing_time_ms: Date.now() - startTime,
        ai_powered: true
      })
    }, {
      headers: {
        'Cache-Control': personalizationApplied 
          ? 'private, max-age=60' // 1 minute cache for personalized
          : 'public, s-maxage=300, stale-while-revalidate=600', // 5 minute cache for AI
        'X-AI-Powered': aiSuggestionsWorked.toString(),
        'X-Personalized': personalizationApplied.toString()
      },
    });

  } catch (error) {
    console.error('Unexpected error in suggestions API:', error);
    
    return NextResponse.json({
      suggestions: [],
      query: 'error',
      total_suggestions: 0,
      personalization_applied: false,
      processing_time_ms: Date.now() - startTime,
      error: 'Suggestions temporarily unavailable'
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'public, s-maxage=60', // 1 minute cache for errors
      },
    });
  }
}