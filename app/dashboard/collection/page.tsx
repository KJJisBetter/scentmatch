import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createServerSupabase } from '@/lib/supabase/server';
import dynamic from 'next/dynamic';

// Dynamic import for large collection dashboard (826 lines) - massive bundle savings
const CollectionDashboardModern = dynamic(
  () =>
    import('@/components/collection/collection-dashboard-modern').then(mod => ({
      default: mod.CollectionDashboardModern,
    })),
  {
    loading: () => <CollectionDashboardSkeleton />,
  }
);

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

// Streaming Server Components for Progressive Loading
async function CollectionHeader({ userId }: { userId: string }) {
  const supabase = await createServerSupabase();

  const { data: userProfile } = await (supabase as any)
    .from('user_profiles')
    .select('first_name')
    .eq('id', userId)
    .single();

  return (
    <div className='mb-8'>
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h1 className='text-3xl font-serif font-bold text-foreground'>
            {userProfile?.first_name ? `${userProfile.first_name}'s` : 'My'}{' '}
            Fragrance Collection
          </h1>
          <p className='text-lg text-muted-foreground'>
            Discover patterns, organize your scents, and find your next favorite
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
    </div>
  );
}

async function CollectionQuickStats({ userId }: { userId: string }) {
  const supabase = await createServerSupabase();

  // Fast aggregation queries
  const { data: collectionStats } = await (supabase as any)
    .from('user_collections')
    .select('collection_type, rating, created_at')
    .eq('user_id', userId);

  const totalFragrances =
    collectionStats?.filter((c: any) =>
      ['saved', 'owned'].includes(c.collection_type)
    )?.length || 0;
  const ratedItems =
    collectionStats?.filter((c: any) => c.rating !== null)?.length || 0;
  const diversityScore =
    ratedItems > 0 ? Math.round((ratedItems / totalFragrances) * 100) : 0;
  const recentAdditions =
    collectionStats?.filter((c: any) => {
      const addedDate = new Date(c.created_at);
      const daysDiff =
        (Date.now() - addedDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    })?.length || 0;

  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
      <div className='bg-card rounded-lg p-4 border'>
        <div className='text-2xl font-bold text-foreground'>
          {totalFragrances}
        </div>
        <div className='text-sm text-muted-foreground'>Total Fragrances</div>
      </div>

      <div className='bg-card rounded-lg p-4 border'>
        <div className='text-2xl font-bold text-foreground'>
          {diversityScore}%
        </div>
        <div className='text-sm text-muted-foreground'>
          Collection Diversity
        </div>
      </div>

      <div className='bg-card rounded-lg p-4 border'>
        <div className='text-2xl font-bold text-foreground'>
          {recentAdditions}
        </div>
        <div className='text-sm text-muted-foreground'>Recent Additions</div>
      </div>

      <div className='bg-card rounded-lg p-4 border'>
        <div className='text-2xl font-bold text-foreground'>{ratedItems}</div>
        <div className='text-sm text-muted-foreground'>Rated Items</div>
      </div>
    </div>
  );
}

async function StreamingCollectionDashboard({ userId }: { userId: string }) {
  const supabase = await createServerSupabase();

  // Get user profile for dashboard context
  const { data: userProfile } = await (supabase as any)
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
    .eq('id', userId)
    .single();

  // Get collection insights (slower query)
  const { data: collectionStats } = await (supabase as any).rpc(
    'get_collection_insights',
    {
      target_user_id: userId,
    }
  );

  // Get recent activity
  const { data: recentActivity } = await (supabase as any)
    .from('user_collections')
    .select(
      `
      id,
      fragrance_id,
      collection_type as status,
      created_at as added_at,
      fragrances:fragrance_id (
        name,
        fragrance_brands:brand_id (name)
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <CollectionDashboardModern
      userId={userId}
      userProfile={userProfile || undefined}
      initialStats={
        collectionStats || {
          total_fragrances: 0,
          diversity_score: 0,
          dominant_families: [],
        }
      }
      recentActivity={recentActivity || []}
    />
  );
}

// Skeleton Components for Progressive Loading
function CollectionHeaderSkeleton() {
  return (
    <div className='mb-8'>
      <div className='flex items-center justify-between mb-4'>
        <div>
          <div className='h-8 bg-gray-200 animate-pulse rounded w-80 mb-2'></div>
          <div className='h-5 bg-gray-200 animate-pulse rounded w-96'></div>
        </div>
        <div className='hidden md:flex items-center space-x-3'>
          <div className='h-8 w-28 bg-gray-200 animate-pulse rounded'></div>
          <div className='h-8 w-32 bg-gray-200 animate-pulse rounded'></div>
        </div>
      </div>
    </div>
  );
}

function QuickStatsSkeleton() {
  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className='bg-card rounded-lg p-4 border'>
          <div className='h-6 bg-gray-200 animate-pulse rounded w-8 mb-1'></div>
          <div className='h-4 bg-gray-200 animate-pulse rounded w-20'></div>
        </div>
      ))}
    </div>
  );
}

function CollectionDashboardSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Filter controls skeleton */}
      <div className='p-4 bg-card rounded-xl border'>
        <div className='h-6 bg-gray-200 animate-pulse rounded w-32 mb-4'></div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className='h-10 bg-gray-200 animate-pulse rounded'
            ></div>
          ))}
        </div>
      </div>

      {/* Collection grid skeleton */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className='bg-card rounded-xl border p-6'>
            <div className='aspect-square bg-gray-200 animate-pulse rounded-lg mb-4'></div>
            <div className='space-y-2'>
              <div className='h-5 bg-gray-200 animate-pulse rounded w-3/4'></div>
              <div className='h-4 bg-gray-200 animate-pulse rounded w-1/2'></div>
              <div className='h-4 bg-gray-200 animate-pulse rounded w-2/3'></div>
            </div>
            <div className='mt-4 space-y-2'>
              <div className='h-10 bg-gray-200 animate-pulse rounded'></div>
              <div className='flex space-x-2'>
                <div className='h-8 w-16 bg-gray-200 animate-pulse rounded'></div>
                <div className='h-8 w-16 bg-gray-200 animate-pulse rounded'></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function CollectionPage() {
  const supabase = await createServerSupabase();

  // Only verify authentication - don't load heavy data blocking the page
  const {
    data: { user },
    error,
  } = await (supabase as any).auth.getUser();

  if (error || !user) {
    redirect('/auth/signin');
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-cream-50 to-cream-100'>
      {/* Dashboard Container */}
      <div className='container mx-auto px-4 py-6 max-w-7xl'>
        {/* Dashboard Header - streams in first (fast query) */}
        <Suspense fallback={<CollectionHeaderSkeleton />}>
          <CollectionHeader userId={user.id} />
        </Suspense>

        {/* Quick Stats Bar - streams in second (medium query) */}
        <Suspense fallback={<QuickStatsSkeleton />}>
          <CollectionQuickStats userId={user.id} />
        </Suspense>

        {/* Main Collection Dashboard - streams in last (complex analytics) */}
        <Suspense fallback={<CollectionDashboardSkeleton />}>
          <StreamingCollectionDashboard userId={user.id} />
        </Suspense>
      </div>
    </div>
  );
}

// Enable ISR for dashboard (refresh every 5 minutes)
export const revalidate = 300;
