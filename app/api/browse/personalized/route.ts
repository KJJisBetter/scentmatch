import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

/**
 * GET /api/browse/personalized
 *
 * Smart discovery endpoint that adapts based on user's collection:
 * - New/unauthenticated users: Popular fragrances
 * - Users with collections: AI-personalized recommendations
 * - Always maintains fallback to popularity sorting
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.max(
      1,
      Math.min(50, parseInt(searchParams.get('limit') || '20'))
    );
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'));

    const supabase = await createServerSupabase();

    // Check user authentication status
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    let sortingStrategy: 'popularity' | 'personalized' = 'popularity';
    let userCollectionSize = 0;
    let fragrances = [];

    // If user is authenticated, check collection size
    if (user && !authError) {
      const { data: collectionData } = await supabase
        .from('user_collections')
        .select('id, collection_type')
        .eq('user_id', user.id)
        .in('collection_type', ['owned', 'wishlist', 'tried']); // Exclude 'saved' as it's more casual

      userCollectionSize = collectionData?.length || 0;

      // Use personalized recommendations if user has substantial collection (3+ items)
      if (userCollectionSize >= 3) {
        sortingStrategy = 'personalized';

        try {
          // Try AI-powered personalized recommendations
          const personalizedResults = await getPersonalizedRecommendations(
            supabase,
            user.id,
            limit,
            offset
          );

          if (personalizedResults && personalizedResults.length > 0) {
            fragrances = personalizedResults;
          } else {
            // Fallback to popularity if personalized returns no results
            sortingStrategy = 'popularity';
          }
        } catch (error) {
          console.error('Personalized recommendations failed:', error);
          sortingStrategy = 'popularity'; // Fallback on error
        }
      }
    }

    // Use popularity sorting if no personalized results or for unauthenticated users
    if (fragrances.length === 0) {
      console.log('🔥 Using popularity sorting - fetching popular fragrances');
      fragrances = await getPopularFragrances(supabase, limit, offset);
      console.log(`🔥 Retrieved ${fragrances.length} popular fragrances`);
    }

    // Get collection status for authenticated users
    const collectionStatuses: Record<string, string[]> = {};
    if (user && fragrances.length > 0) {
      const fragranceIds = fragrances.map((f: any) => f.id);
      const { data: statusData } = await supabase
        .from('user_collections')
        .select('fragrance_id, collection_type')
        .eq('user_id', user.id)
        .in('fragrance_id', fragranceIds);

      if (statusData) {
        statusData.forEach((item: any) => {
          if (!collectionStatuses[item.fragrance_id]) {
            collectionStatuses[item.fragrance_id] = [];
          }
          collectionStatuses[item.fragrance_id]!.push(item.collection_type);
        });
      }
    }

    // Add collection status to each fragrance
    const fragrancesWithStatus = fragrances.map((fragrance: any) => ({
      ...fragrance,
      collection_status: collectionStatuses[fragrance.id] || [],
      in_collection: (collectionStatuses[fragrance.id] || []).includes('owned'),
      in_wishlist: (collectionStatuses[fragrance.id] || []).includes(
        'wishlist'
      ),
    }));

    return NextResponse.json(
      {
        fragrances: fragrancesWithStatus,
        total: fragrancesWithStatus.length,
        sorting_strategy: sortingStrategy,
        user_collection_size: userCollectionSize,
        metadata: {
          processing_time_ms: Date.now() - startTime,
          authenticated: !!user,
          personalized: sortingStrategy === 'personalized',
        },
      },
      {
        headers: {
          'Cache-Control': user
            ? 'private, s-maxage=60, stale-while-revalidate=120' // Shorter cache for personalized
            : 'public, s-maxage=300, stale-while-revalidate=600', // Longer cache for popularity
          'X-Sorting-Strategy': sortingStrategy,
        },
      }
    );
  } catch (error) {
    console.error('Personalized browse API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        fallback_message: 'Please try the regular browse page',
      },
      { status: 500 }
    );
  }
}

/**
 * Get AI-powered personalized recommendations based on user's collection
 */
async function getPersonalizedRecommendations(
  supabase: any,
  userId: string,
  limit: number,
  offset: number
) {
  // Get user's collection with ratings to understand preferences
  const { data: userCollection } = await supabase
    .from('user_collections')
    .select(
      `
      fragrance_id,
      collection_type,
      rating,
      fragrances (
        id,
        scent_family,
        gender,
        seasons,
        occasions,
        scent_strength,
        longevity
      )
    `
    )
    .eq('user_id', userId)
    .in('collection_type', ['owned', 'wishlist', 'tried']);

  if (!userCollection || userCollection.length === 0) {
    return null;
  }

  // Analyze user preferences from their collection
  const preferences = analyzeUserPreferences(userCollection);

  // Get recommendations based on preferences
  let query = supabase.from('fragrances').select(`
      id,
      name,
      brand_id,
      gender,
      scent_family,
      seasons,
      occasions,
      scent_strength,
      longevity,
      popularity_score,
      rating_value,
      rating_count,
      sample_available,
      sample_price_usd,
      fragrance_brands!inner(name)
    `);

  // Filter by user preferences
  if (preferences.preferredFamilies.length > 0) {
    query = query.in('scent_family', preferences.preferredFamilies);
  }

  if (preferences.preferredGenders.length > 0) {
    query = query.in('gender', preferences.preferredGenders);
  }

  // Exclude fragrances already in user's collection
  const ownedIds = userCollection
    .filter((item: any) => item.collection_type === 'owned')
    .map((item: any) => item.fragrance_id);

  if (ownedIds.length > 0) {
    query = query.not('id', 'in', `(${ownedIds.join(',')})`);
  }

  const { data: recommendations } = await query
    .order('popularity_score', { ascending: false })
    .order('rating_value', { ascending: false })
    .range(offset, offset + limit - 1);

  return (
    recommendations?.map((result: any) => ({
      id: result.id,
      name: result.name,
      brand: result.fragrance_brands?.name || 'Unknown Brand',
      brand_id: result.brand_id,
      gender: result.gender || 'unisex',
      scent_family: result.scent_family,
      popularity_score: result.popularity_score || 0,
      rating_value: result.rating_value || 0,
      rating_count: result.rating_count || 0,
      relevance_score: 0.9, // High relevance for personalized recommendations
      sample_available: result.sample_available ?? true,
      sample_price_usd: result.sample_price_usd || 15,
    })) || []
  );
}

/**
 * Get popular fragrances for new/unauthenticated users
 */
async function getPopularFragrances(
  supabase: any,
  limit: number,
  offset: number
) {
  try {
    console.log(
      `🔥 getPopularFragrances called with limit=${limit}, offset=${offset}`
    );

    const { data: popular, error } = await supabase
      .from('fragrances')
      .select(
        `
        id,
        name,
        brand_id,
        gender,
        popularity_score,
        rating_value,
        rating_count,
        sample_available,
        sample_price_usd,
        fragrance_brands!inner(name)
      `
      )
      .order('popularity_score', { ascending: false })
      .order('rating_value', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('🔥 Error fetching popular fragrances:', error);
      return [];
    }

    console.log(`🔥 Raw popular data length: ${popular?.length || 0}`);

    const mapped =
      popular?.map((result: any) => ({
        id: result.id,
        name: result.name,
        brand: result.fragrance_brands?.name || 'Unknown Brand',
        brand_id: result.brand_id,
        gender: result.gender || 'unisex',
        scent_family: result.gender || 'Fragrance', // Use gender as fallback since scent_family doesn't exist
        popularity_score: result.popularity_score || 0,
        rating_value: result.rating_value || 0,
        rating_count: result.rating_count || 0,
        relevance_score: 0.7, // Standard relevance for popular items
        sample_available: result.sample_available ?? true,
        sample_price_usd: result.sample_price_usd || 15,
      })) || [];

    console.log(`🔥 Mapped popular fragrances length: ${mapped.length}`);
    return mapped;
  } catch (error) {
    console.error('🔥 Exception in getPopularFragrances:', error);
    return [];
  }
}

/**
 * Analyze user's collection to understand preferences
 */
function analyzeUserPreferences(userCollection: any[]) {
  const families = new Map();
  const genders = new Map();

  userCollection.forEach(item => {
    if (!item.fragrances) return;

    const fragrance = item.fragrances;
    const weight = getPreferenceWeight(item.collection_type, item.rating);

    // Count scent families
    if (fragrance.scent_family) {
      families.set(
        fragrance.scent_family,
        (families.get(fragrance.scent_family) || 0) + weight
      );
    }

    // Count genders
    if (fragrance.gender) {
      genders.set(
        fragrance.gender,
        (genders.get(fragrance.gender) || 0) + weight
      );
    }
  });

  // Get top preferences
  const preferredFamilies = Array.from(families.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([family]) => family);

  const preferredGenders = Array.from(genders.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([gender]) => gender);

  return {
    preferredFamilies,
    preferredGenders,
  };
}

/**
 * Calculate preference weight based on collection type and rating
 */
function getPreferenceWeight(collectionType: string, rating?: number): number {
  let baseWeight = 1;

  // Higher weight for owned vs. wishlist
  switch (collectionType) {
    case 'owned':
      baseWeight = 3;
      break;
    case 'tried':
      baseWeight = 2;
      break;
    case 'wishlist':
      baseWeight = 1;
      break;
    default:
      baseWeight = 0.5;
  }

  // Multiply by rating if available
  if (rating && rating > 0) {
    baseWeight *= rating / 3; // Normalize rating (1-5 scale to weight multiplier)
  }

  return baseWeight;
}
