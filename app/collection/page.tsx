import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { CollectionDashboard } from '@/components/collection/collection-dashboard';
import { CollectionSkeleton } from '@/components/ui/skeletons/collection-skeleton';

export const metadata: Metadata = {
  title: 'My Collection - ScentMatch',
  description:
    'Manage your fragrance collection, view insights, and discover new matches.',
  openGraph: {
    title: 'My Collection - ScentMatch',
    description:
      'Manage your fragrance collection, view insights, and discover new matches.',
    url: '/collection',
    type: 'website',
  },
};

interface CollectionPageProps {
  searchParams: {
    source?: string;
    new_collection?: string;
    enhanced?: string;
    category?: string;
    search?: string;
  };
}

/**
 * Collection Dashboard Page - Task 2.1 (Phase 1B)
 *
 * Main collection management page using Next.js 15 App Router with Server Components.
 * Provides comprehensive collection overview, statistics, and management features.
 *
 * Features:
 * - Server-side data fetching with Supabase
 * - Real-time collection statistics
 * - Search and filtering capabilities
 * - Responsive design optimized for all devices
 * - Progressive enhancement with client-side interactions
 * - Integration with analytics and insights
 */
export default async function CollectionPage({
  searchParams,
}: CollectionPageProps) {
  const supabase = await createServerSupabase();

  // Check authentication - redirect to login if needed
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login?redirect_to=/collection');
  }

  // Fetch initial collection data server-side for better performance
  const { data: initialCollection, error: collectionError } = await supabase
    .from('user_collections')
    .select(
      `
      id,
      collection_type,
      rating,
      notes,
      created_at,
      updated_at,
      quiz_session_token,
      fragrances!inner(
        id,
        name,
        slug,
        fragrance_family,
        gender,
        sample_available,
        sample_price_usd,
        rating_value,
        main_accords,
        season_tags,
        personality_tags,
        image_url,
        fragrance_brands!inner(
          name,
          brand_tier
        )
      )
    `
    )
    .eq('user_id', user.id)
    .eq('collection_type', 'saved')
    .order('created_at', { ascending: false });

  // Get collection statistics server-side
  const { data: collectionStats } = await supabase
    .from('user_collections')
    .select(
      `
      id,
      rating,
      created_at,
      fragrances!inner(fragrance_family)
    `
    )
    .eq('user_id', user.id)
    .eq('collection_type', 'saved');

  // Get user engagement data
  const { data: engagementData } = await supabase
    .from('user_engagement_scores')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Handle collection fetch errors
  if (collectionError) {
    console.error('Collection fetch error:', collectionError);
    // Don't redirect - show error state in component instead
  }

  // Process initial data for statistics
  const processedStats = processCollectionStats(collectionStats || []);

  // Prepare initial props for the dashboard
  const dashboardProps = {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.user_metadata?.first_name || 'User',
    },
    initialCollection: initialCollection || [],
    collectionStats: processedStats,
    engagementData,
    searchParams,
    hasCollectionError: !!collectionError,
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Page Header */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='py-8'>
            <div className='md:flex md:items-center md:justify-between'>
              <div className='flex-1 min-w-0'>
                <h1 className='text-3xl font-bold text-gray-900 sm:text-4xl'>
                  My Collection
                </h1>
                <p className='mt-2 text-lg text-gray-600'>
                  Manage your fragrance collection and discover new favorites
                </p>
              </div>

              {/* Quick Stats in Header */}
              <div className='mt-6 flex space-x-6 md:mt-0'>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-purple-600'>
                    {processedStats.total_items}
                  </div>
                  <div className='text-sm text-gray-500'>Fragrances</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-blue-600'>
                    {processedStats.families_explored}
                  </div>
                  <div className='text-sm text-gray-500'>Families</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-green-600'>
                    {processedStats.completion_rate}%
                  </div>
                  <div className='text-sm text-gray-500'>Complete</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <Suspense fallback={<CollectionSkeleton />}>
          <CollectionDashboard {...dashboardProps} />
        </Suspense>
      </div>

      {/* Welcome Message for New Collections */}
      {searchParams.new_collection === 'true' && (
        <WelcomeNewCollection source={searchParams.source} />
      )}
    </div>
  );
}

/**
 * Process collection statistics server-side for initial load
 */
function processCollectionStats(collections: any[]) {
  if (!collections.length) {
    return {
      total_items: 0,
      families_explored: 0,
      completion_rate: 0,
      average_rating: 0,
      total_rated: 0,
      most_recent: null,
    };
  }

  const familiesSet = new Set<string>();
  let totalRated = 0;
  let totalRatingSum = 0;

  collections.forEach(item => {
    if (item.fragrances?.scent_family) {
      familiesSet.add(item.fragrances.scent_family);
    }
    if (item.rating) {
      totalRated++;
      totalRatingSum += item.rating;
    }
  });

  const itemsWithData = collections.filter(
    item => item.rating || (item.notes && item.notes.trim())
  );

  return {
    total_items: collections.length,
    families_explored: familiesSet.size,
    completion_rate: Math.round(
      (itemsWithData.length / collections.length) * 100
    ),
    average_rating:
      totalRated > 0 ? Math.round((totalRatingSum / totalRated) * 10) / 10 : 0,
    total_rated: totalRated,
    most_recent: collections[0]?.created_at || null,
  };
}

/**
 * Welcome message component for users with new collections
 */
function WelcomeNewCollection({ source }: { source?: string }) {
  const getMessage = () => {
    switch (source) {
      case 'quiz_completion':
        return 'Welcome to your collection! Your quiz recommendations have been saved.';
      case 'account_creation':
        return 'Account created successfully! Your collection is now enhanced with premium features.';
      default:
        return 'Welcome to your collection! Start exploring and organizing your fragrances.';
    }
  };

  return (
    <div className='fixed bottom-4 right-4 z-50'>
      <div className='bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg max-w-sm'>
        <div className='flex items-start'>
          <div className='flex-shrink-0'>
            <div className='text-2xl'>🎉</div>
          </div>
          <div className='ml-3'>
            <p className='text-sm font-medium'>{getMessage()}</p>
            <button className='mt-2 text-xs underline hover:no-underline'>
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
