import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { createServerSupabase } from '@/lib/supabase/server';
import { CollectionDashboard } from '@/components/collection/collection-dashboard';
import { CollectionSkeleton } from '@/components/ui/skeletons/collection-skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, LogIn, UserPlus } from 'lucide-react';

export const metadata: Metadata = {
  title: 'My Collection - ScentMatch',
  description:
    'View and manage your fragrance collection. Track your perfect matches and discover new favorites.',
  openGraph: {
    title: 'My Collection - ScentMatch',
    description: 'View and manage your fragrance collection',
    url: '/my-collection',
    type: 'website',
  },
};

interface MyCollectionPageProps {
  searchParams: Promise<{
    source?: string;
    new_collection?: string;
    enhanced?: string;
    category?: string;
    search?: string;
    quiz_session?: string;
  }>;
}

/**
 * Guest-Accessible Collection Page - Critical Fix
 *
 * This route allows both authenticated users and guest users with saved
 * collections to view and manage their fragrances. Essential for the
 * collection-first conversion strategy.
 */
export default async function MyCollectionPage({
  searchParams,
}: MyCollectionPageProps) {
  const supabase = await createServerSupabase();
  const resolvedSearchParams = await searchParams;

  // Check authentication but don't redirect - allow guest access
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // For guest users, check if they have a quiz session with saved items
  let guestCollection = null;
  let guestSessionId = null;

  if (!user && resolvedSearchParams.quiz_session) {
    guestSessionId = resolvedSearchParams.quiz_session;

    // Try to get guest collection
    const { data: guestItems } = await supabase
      .from('user_collections')
      .select(
        `
        id,
        collection_type,
        rating,
        notes,
        created_at,
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
          image_url,
          fragrance_brands!inner(name)
        )
      `
      )
      .eq('guest_session_id', guestSessionId)
      .eq('collection_type', 'saved')
      .order('created_at', { ascending: false });

    guestCollection = guestItems || [];
  }

  // If authenticated user, get their collection
  let userCollection = null;
  if (user) {
    const { data: userItems } = await supabase
      .from('user_collections')
      .select(
        `
        id,
        collection_type,
        rating,
        notes,
        created_at,
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
          image_url,
          fragrance_brands!inner(name)
        )
      `
      )
      .eq('user_id', user.id)
      .eq('collection_type', 'saved')
      .order('created_at', { ascending: false });

    userCollection = userItems || [];
  }

  // Determine which collection to show
  const collection = userCollection || guestCollection || [];
  const isGuest = !user;

  // Calculate basic stats
  const processedStats = {
    total_items: collection.length,
    families_explored: new Set(
      collection
        .map((item: any) => item.fragrances?.fragrance_family)
        .filter(Boolean)
    ).size,
    completion_rate:
      collection.length > 0
        ? Math.round(
            (collection.filter((item: any) => item.rating || item.notes?.trim())
              .length /
              collection.length) *
              100
          )
        : 0,
    average_rating: 0,
    total_rated: 0,
    most_recent: collection[0]?.created_at || null,
  };

  // If no collection found and no user, redirect to quiz
  if (collection.length === 0 && isGuest) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <Card className='max-w-md mx-auto'>
          <CardContent className='pt-6 text-center space-y-4'>
            <div className='text-6xl'>🌸</div>
            <h2 className='text-2xl font-bold'>Start Your Collection</h2>
            <p className='text-muted-foreground'>
              Take our fragrance quiz to discover your perfect matches and build
              your collection.
            </p>
            <Button asChild className='w-full'>
              <a href='/quiz'>
                <Sparkles className='w-4 h-4 mr-2' />
                Take the Quiz
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare dashboard props
  const dashboardProps = {
    user: user
      ? {
          id: user.id,
          email: user.email,
          firstName: user.user_metadata?.first_name || 'User',
        }
      : {
          id: guestSessionId || 'guest',
          email: null,
          firstName: 'Guest',
        },
    initialCollection: collection,
    collectionStats: processedStats,
    engagementData: null, // Guest users don't have engagement data
    searchParams: resolvedSearchParams,
    hasCollectionError: false,
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Guest User Upgrade Banner */}
      {isGuest && collection.length > 0 && (
        <div className='bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3'>
          <div className='max-w-7xl mx-auto px-4 flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <Sparkles className='w-5 h-5' />
              <span className='font-medium'>
                You have {collection.length} saved fragrances! Create an account
                to unlock advanced features.
              </span>
            </div>
            <div className='flex items-center space-x-2'>
              <Button size='sm' variant='secondary' asChild>
                <a href='/auth/login'>
                  <LogIn className='w-4 h-4 mr-1' />
                  Sign In
                </a>
              </Button>
              <Button
                size='sm'
                className='bg-white text-purple-600 hover:bg-gray-100'
                asChild
              >
                <a href='/auth/signup'>
                  <UserPlus className='w-4 h-4 mr-1' />
                  Create Account
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='py-8'>
            <div className='md:flex md:items-center md:justify-between'>
              <div className='flex-1 min-w-0'>
                <h1 className='text-3xl font-bold text-gray-900 sm:text-4xl'>
                  {isGuest ? 'Your Saved Matches' : 'My Collection'}
                </h1>
                <p className='mt-2 text-lg text-gray-600'>
                  {isGuest
                    ? 'Your quiz recommendations are saved here. Create an account to unlock more features!'
                    : 'Manage your fragrance collection and discover new favorites'}
                </p>
              </div>

              {/* Collection Stats */}
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
                {!isGuest && (
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-green-600'>
                      {processedStats.completion_rate}%
                    </div>
                    <div className='text-sm text-gray-500'>Complete</div>
                  </div>
                )}
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

      {/* Guest Conversion Footer */}
      {isGuest && collection.length > 0 && (
        <div className='bg-white border-t border-gray-200 py-8'>
          <div className='max-w-4xl mx-auto px-4 text-center'>
            <div className='space-y-4'>
              <h3 className='text-xl font-bold text-gray-900'>
                Unlock Your Full Collection Experience
              </h3>
              <p className='text-gray-600'>
                Create a free account to get advanced insights, personalized
                recommendations, and never lose your collection.
              </p>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm'>
                <div className='flex items-center space-x-2 text-gray-700'>
                  <div className='w-2 h-2 bg-green-500 rounded-full' />
                  <span>Advanced analytics & insights</span>
                </div>
                <div className='flex items-center space-x-2 text-gray-700'>
                  <div className='w-2 h-2 bg-blue-500 rounded-full' />
                  <span>Personalized recommendations</span>
                </div>
                <div className='flex items-center space-x-2 text-gray-700'>
                  <div className='w-2 h-2 bg-purple-500 rounded-full' />
                  <span>Collection sharing & community</span>
                </div>
              </div>

              <div className='flex items-center justify-center space-x-3'>
                <Button size='lg' asChild>
                  <a href='/auth/signup'>
                    <UserPlus className='w-4 h-4 mr-2' />
                    Create Free Account
                  </a>
                </Button>
                <Button variant='outline' size='lg' asChild>
                  <a href='/auth/login'>
                    <LogIn className='w-4 h-4 mr-2' />
                    Already Have Account?
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
