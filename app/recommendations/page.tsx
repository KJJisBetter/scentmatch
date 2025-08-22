import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createServerSupabase } from '@/lib/supabase/server';
import { RecommendationSkeleton } from '@/components/ui/skeletons';
import dynamic from 'next/dynamic';

// Dynamic import for large recommendations system (750 lines) - significant bundle reduction
const RecommendationsSystem = dynamic(
  () => import('@/components/recommendations/recommendations-system').then(mod => ({ default: mod.RecommendationsSystem })),
  {
    loading: () => <RecommendationSkeleton variant='analysis' count={4} />,
  }
);

/**
 * AI-Powered Recommendations Page
 *
 * Route: /recommendations
 * Features:
 * - Personalized fragrance recommendations using hybrid AI algorithms
 * - Themed recommendation sections (perfect matches, trending, adventurous, seasonal)
 * - Interactive preference refinement with real-time updates
 * - Explainable AI with transparency and user control
 * - Sample-first conversion optimization
 * - Mobile-first responsive design with swipe feedback
 * - Performance optimization for sub-100ms recommendation generation
 */

export const metadata: Metadata = {
  title: 'Personal Recommendations - ScentMatch',
  description:
    'Discover your next favorite fragrance with AI-powered personalized recommendations tailored to your unique taste.',
  keywords:
    'fragrance recommendations, AI perfume discovery, personalized scents, fragrance matching, scent recommendations',
  openGraph: {
    title: 'AI-Powered Fragrance Recommendations - ScentMatch',
    description:
      'Discover fragrances perfectly matched to your taste with our advanced AI recommendation engine.',
    type: 'website',
    images: [
      {
        url: '/og-recommendations.jpg',
        width: 1200,
        height: 630,
        alt: 'ScentMatch AI Recommendations',
      },
    ],
  },
  robots: {
    index: false, // Personalized pages shouldn't be indexed
    follow: false,
  },
};

// Streaming Server Components for Progressive Loading
async function UserQuickStats({ userId }: { userId: string }) {
  const supabase = await createServerSupabase();
  
  // Fast collection count query
  const { data: collectionStats } = await (supabase as any)
    .from('user_collections')
    .select('collection_type')
    .eq('user_id', userId);

  const totalOwned = collectionStats?.filter((c: any) => c.collection_type === 'owned')?.length || 0;
  const totalWishlist = collectionStats?.filter((c: any) => c.collection_type === 'wishlist')?.length || 0;
  
  return (
    <div className='flex items-center justify-center space-x-8 mt-6 text-sm text-muted-foreground'>
      <div className='flex items-center space-x-2'>
        <div className='w-2 h-2 bg-green-500 rounded-full' />
        <span>AI Confidence: High</span>
      </div>
      <div className='flex items-center space-x-2'>
        <div className='w-2 h-2 bg-blue-500 rounded-full' />
        <span>Collection: {totalOwned} fragrances</span>
      </div>
      <div className='flex items-center space-x-2'>
        <div className='w-2 h-2 bg-purple-500 rounded-full' />
        <span>Wishlist: {totalWishlist} items</span>
      </div>
    </div>
  );
}

async function ColdStartExperience({ userId }: { userId: string }) {
  const supabase = await createServerSupabase();
  
  // Check if user has any collection items
  const { data: hasItems } = await (supabase as any)
    .from('user_collections')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (hasItems) {
    return null; // Don't show cold start if user has items
  }

  return (
    <div className='mb-12 p-8 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl text-center'>
      <div className='text-4xl mb-4'>🌟</div>
      <h2 className='text-2xl font-bold mb-4'>Welcome to ScentMatch!</h2>
      <p className='text-lg text-muted-foreground mb-6'>
        Let us help you discover your signature scent. Our AI will learn
        your preferences as you explore.
      </p>
      <div className='flex flex-col sm:flex-row gap-4 justify-center'>
        <button className='px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90'>
          Take Fragrance Quiz
        </button>
        <button className='px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent'>
          Browse Popular Fragrances
        </button>
      </div>
    </div>
  );
}

async function StreamingRecommendationsSystem({ userId }: { userId: string }) {
  const supabase = await createServerSupabase();
  
  // Get user profile and preferences for personalization
  const { data: userProfile } = await (supabase as any)
    .from('user_profiles')
    .select(`
      id,
      email,
      experience_level,
      favorite_accords,
      disliked_accords,
      privacy_settings
    `)
    .eq('id', userId)
    .single();

  // Get recent interactions for AI learning context
  const { data: recentInteractions } = await (supabase as any)
    .from('user_fragrance_interactions')
    .select(`
      fragrance_id,
      interaction_type,
      created_at
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  // Get initial recommendations (this will be the slowest query)
  const { data: initialRecommendations } = await (supabase as any).rpc('get_personalized_recommendations', {
    target_user_id: userId,
    max_results: 20,
    include_owned: false,
  });

  return (
    <RecommendationsSystem
      userId={userId}
      userProfile={userProfile}
      collectionStats={{
        total_fragrances: 0,
        diversity_score: 0.5,
        dominant_families: [],
      }}
      recentInteractions={recentInteractions || []}
      initialRecommendations={initialRecommendations || []}
    />
  );
}

// Skeleton Components for Progressive Loading
function QuickStatsSkeleton() {
  return (
    <div className='flex items-center justify-center space-x-8 mt-6 text-sm text-muted-foreground'>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className='flex items-center space-x-2'>
          <div className='w-2 h-2 bg-gray-300 animate-pulse rounded-full' />
          <div className='h-4 bg-gray-200 animate-pulse rounded w-20'></div>
        </div>
      ))}
    </div>
  );
}

function ColdStartSkeleton() {
  return (
    <div className='mb-12 p-8 bg-gray-100 animate-pulse rounded-xl text-center'>
      <div className='h-12 w-12 bg-gray-300 rounded-full mx-auto mb-4'></div>
      <div className='h-6 bg-gray-300 rounded w-1/2 mx-auto mb-4'></div>
      <div className='h-4 bg-gray-300 rounded w-3/4 mx-auto mb-6'></div>
      <div className='flex flex-col sm:flex-row gap-4 justify-center'>
        <div className='h-12 bg-gray-300 rounded w-40'></div>
        <div className='h-12 bg-gray-300 rounded w-40'></div>
      </div>
    </div>
  );
}

export default async function RecommendationsPage() {
  const supabase = await createServerSupabase();
  
  // Only verify authentication - don't load heavy data blocking the page
  const { data: { user }, error: authError } = await (supabase as any).auth.getUser();

  if (authError || !user) {
    redirect('/auth/signin?redirect=/recommendations');
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-50 via-cream-50 to-amber-50'>
      {/* Page Container */}
      <div className='container mx-auto px-4 py-6 max-w-7xl'>
        {/* Page Header - loads immediately */}
        <div className='mb-8 text-center'>
          <h1 className='text-4xl font-serif font-bold text-foreground mb-4'>
            Your Personal Recommendations
          </h1>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
            Discover fragrances perfectly matched to your taste using our
            advanced AI recommendation engine
          </p>

          {/* Quick Stats - stream in first (fast query) */}
          <Suspense fallback={<QuickStatsSkeleton />}>
            <UserQuickStats userId={user.id} />
          </Suspense>
        </div>

        {/* Cold Start Experience - stream in second (medium query) */}
        <Suspense fallback={<ColdStartSkeleton />}>
          <ColdStartExperience userId={user.id} />
        </Suspense>

        {/* Main Recommendations System - stream in last (slowest AI query) */}
        <Suspense fallback={<RecommendationSkeleton variant='analysis' count={4} />}>
          <StreamingRecommendationsSystem userId={user.id} />
        </Suspense>

        {/* Trust and Transparency Footer */}
        <div className='mt-16 p-6 bg-card rounded-xl border'>
          <div className='text-center'>
            <h3 className='text-lg font-semibold mb-4'>
              How Our AI Recommendations Work
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground'>
              <div>
                <div className='text-2xl mb-2'>🧠</div>
                <h4 className='font-medium text-foreground mb-2'>
                  Advanced AI Analysis
                </h4>
                <p>
                  Our hybrid algorithm analyzes scent profiles, your collection,
                  and preferences from thousands of fragrance enthusiasts.
                </p>
              </div>
              <div>
                <div className='text-2xl mb-2'>🔒</div>
                <h4 className='font-medium text-foreground mb-2'>
                  Privacy First
                </h4>
                <p>
                  Your data stays private. You control what we learn and can
                  adjust or reset preferences anytime.
                </p>
              </div>
              <div>
                <div className='text-2xl mb-2'>📈</div>
                <h4 className='font-medium text-foreground mb-2'>
                  Gets Better Over Time
                </h4>
                <p>
                  Every interaction improves our understanding of your taste.
                  The more you use ScentMatch, the better your recommendations
                  become.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton for Suspense boundary
function RecommendationsSystemSkeleton() {
  return (
    <div className='space-y-12'>
      {/* Preference Controls Skeleton */}
      <div className='p-6 bg-card rounded-xl border'>
        <div
          className='h-6 bg-muted animate-pulse rounded mb-4'
          style={{ width: '200px' }}
        />
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='space-y-2'>
              <div
                className='h-4 bg-muted animate-pulse rounded'
                style={{ width: '120px' }}
              />
              <div className='h-8 bg-muted animate-pulse rounded' />
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation Sections Skeletons */}
      {[
        'Perfect Matches',
        'Trending in Your Style',
        'Adventurous Picks',
        'Seasonal Favorites',
      ].map(sectionTitle => (
        <div key={sectionTitle} className='space-y-6'>
          <div
            className='h-8 bg-muted animate-pulse rounded'
            style={{ width: '250px' }}
          />
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className='bg-card rounded-xl border p-6'>
                <div className='aspect-square bg-muted animate-pulse rounded-lg mb-4' />
                <div className='space-y-2'>
                  <div
                    className='h-5 bg-muted animate-pulse rounded'
                    style={{ width: '80%' }}
                  />
                  <div
                    className='h-4 bg-muted animate-pulse rounded'
                    style={{ width: '60%' }}
                  />
                  <div
                    className='h-4 bg-muted animate-pulse rounded'
                    style={{ width: '40%' }}
                  />
                </div>
                <div className='mt-4 space-y-2'>
                  <div className='h-10 bg-muted animate-pulse rounded' />
                  <div className='flex space-x-2'>
                    <div className='h-8 w-16 bg-muted animate-pulse rounded' />
                    <div className='h-8 w-16 bg-muted animate-pulse rounded' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Enable ISR for recommendations page (refresh every 10 minutes)
export const revalidate = 600;
