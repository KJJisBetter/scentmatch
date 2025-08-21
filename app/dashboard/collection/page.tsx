import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase';
import { CollectionDashboardModern } from '@/components/collection/collection-dashboard-modern';

/**
 * Personal Collection Management Dashboard
 *
 * Route: /dashboard/collection
 * Features:
 * - Progressive collection views (currently wearing → seasonal → full collection)
 * - Multiple visualization modes (grid, list, wheel, calendar)
 * - AI-powered collection insights and analytics
 * - Advanced filtering and organization
 * - Bulk collection management operations
 * - Usage tracking and personal notes
 * - Real-time synchronization
 */

export const metadata: Metadata = {
  title: 'My Collection - ScentMatch',
  description:
    'Manage your fragrance collection with AI-powered insights and organization tools.',
  keywords:
    'fragrance collection, personal collection, scent organization, AI insights, collection management',
  robots: {
    index: false, // Private dashboard pages shouldn't be indexed
    follow: false,
  },
};

async function getUserData() {
  const supabase = await createServerSupabase();

  try {
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await (supabase as any).auth.getUser();

    if (authError || !user) {
      redirect('/auth/signin');
    }

    // Fetch user profile for personalization
    const { data: userProfile, error: profileError } = await (supabase as any)
      .from('user_profiles')
      .select(
        `
        id,
        email,
        first_name,
        last_name,
        experience_level,
        favorite_accords,
        disliked_accords,
        privacy_settings
      `
      )
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching user profile:', profileError);
      }
    }

    // Get basic collection stats for initial load
    const { data: collectionStats, error: statsError } = await (
      supabase as any
    ).rpc('get_collection_insights', {
      target_user_id: user.id,
    });

    if (statsError && statsError.code !== '42883') {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching collection stats:', statsError);
      }
    }

    // Get recent collection activity
    const { data: recentActivity, error: activityError } = await (
      supabase as any
    )
      .from('user_collections')
      .select(
        `
        id,
        fragrance_id,
        status,
        added_at,
        fragrances:fragrance_id (
          name,
          fragrance_brands:brand_id (name)
        )
      `
      )
      .eq('user_id', user.id)
      .order('added_at', { ascending: false })
      .limit(5);

    if (activityError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching recent activity:', activityError);
      }
    }

    return {
      user,
      userProfile,
      collectionStats: collectionStats || {
        total_fragrances: 0,
        diversity_score: 0,
        dominant_families: [],
      },
      recentActivity: recentActivity || [],
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching dashboard data:', error);
    }
    redirect('/auth/signin');
  }
}

export default async function CollectionPage() {
  const { user, userProfile, collectionStats, recentActivity } =
    await getUserData();

  return (
    <div className='min-h-screen bg-gradient-to-br from-cream-50 to-cream-100'>
      {/* Dashboard Container */}
      <div className='container mx-auto px-4 py-6 max-w-7xl'>
        {/* Dashboard Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h1 className='text-3xl font-serif font-bold text-foreground'>
                {userProfile?.first_name ? `${userProfile.first_name}'s` : 'My'}{' '}
                Fragrance Collection
              </h1>
              <p className='text-lg text-muted-foreground'>
                Discover patterns, organize your scents, and find your next
                favorite
              </p>
            </div>

            {/* Quick Actions */}
            <div className='hidden md:flex items-center space-x-3'>
              <button className='px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors'>
                Export Collection
              </button>
              <button className='px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors'>
                Add Fragrance
              </button>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
            <div className='bg-card rounded-lg p-4 border'>
              <div className='text-2xl font-bold text-foreground'>
                {typeof collectionStats.total_fragrances === 'number'
                  ? collectionStats.total_fragrances
                  : 0}
              </div>
              <div className='text-sm text-muted-foreground'>
                Total Fragrances
              </div>
            </div>

            <div className='bg-card rounded-lg p-4 border'>
              <div className='text-2xl font-bold text-foreground'>
                {collectionStats.diversity_score
                  ? Math.round(collectionStats.diversity_score * 100) + '%'
                  : '0%'}
              </div>
              <div className='text-sm text-muted-foreground'>
                Collection Diversity
              </div>
            </div>

            <div className='bg-card rounded-lg p-4 border'>
              <div className='text-2xl font-bold text-foreground'>
                {recentActivity.length}
              </div>
              <div className='text-sm text-muted-foreground'>
                Recent Additions
              </div>
            </div>

            <div className='bg-card rounded-lg p-4 border'>
              <div className='text-2xl font-bold text-foreground'>
                {Array.isArray(collectionStats.dominant_families)
                  ? collectionStats.dominant_families.length
                  : 0}
              </div>
              <div className='text-sm text-muted-foreground'>
                Scent Families
              </div>
            </div>
          </div>
        </div>

        {/* Main Collection Dashboard */}
        <CollectionDashboardModern
          userId={user.id}
          userProfile={userProfile || undefined}
          initialStats={collectionStats}
          recentActivity={recentActivity}
        />
      </div>
    </div>
  );
}

// Enable ISR for dashboard (refresh every 5 minutes)
export const revalidate = 300;
