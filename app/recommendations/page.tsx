import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createServerSupabase } from '@/lib/supabase';
import { RecommendationsSystem } from '@/components/recommendations/recommendations-system';
import { RecommendationSkeleton } from '@/components/ui/skeletons';

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

async function getUserRecommendationData() {
  const supabase = await createServerSupabase();

  try {
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await (supabase as any).auth.getUser();

    if (authError || !user) {
      redirect('/auth/signin?redirect=/recommendations');
    }

    // Fetch user profile and collection for personalization context
    const { data: userProfile, error: profileError } = await (supabase as any)
      .from('user_profiles')
      .select(
        `
        id,
        email,
        experience_level,
        favorite_accords,
        disliked_accords,
        privacy_settings
      `
      )
      .eq('id', user.id)
      .single();

    // Get collection stats for recommendation tuning
    const { data: collectionStats, error: statsError } = await (
      supabase as any
    ).rpc('get_collection_insights', {
      target_user_id: user.id,
    });

    // Get user preferences from interactions for initial personalization
    const { data: recentInteractions, error: interactionsError } = await (
      supabase as any
    )
      .from('user_fragrance_interactions')
      .select(
        `
        fragrance_id,
        interaction_type,
        created_at
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get initial recommendations (cached if available)
    const { data: initialRecommendations, error: recError } = await (
      supabase as any
    ).rpc('get_personalized_recommendations', {
      target_user_id: user.id,
      max_results: 20,
      include_owned: false,
    });

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', profileError);
    }

    if (statsError && statsError.code !== '42883') {
      console.error('Error fetching collection stats:', statsError);
    }

    return {
      user,
      userProfile,
      collectionStats: collectionStats || {
        total_fragrances: 0,
        diversity_score: 0,
        dominant_families: [],
      },
      recentInteractions: recentInteractions || [],
      initialRecommendations: initialRecommendations || [],
    };
  } catch (error) {
    console.error('Error fetching recommendation data:', error);
    redirect('/auth/signin?redirect=/recommendations');
  }
}

export default async function RecommendationsPage() {
  const {
    user,
    userProfile,
    collectionStats,
    recentInteractions,
    initialRecommendations,
  } = await getUserRecommendationData();

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-50 via-cream-50 to-amber-50'>
      {/* Page Container */}
      <div className='container mx-auto px-4 py-6 max-w-7xl'>
        {/* Page Header */}
        <div className='mb-8 text-center'>
          <h1 className='text-4xl font-serif font-bold text-foreground mb-4'>
            Your Personal Recommendations
          </h1>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
            Discover fragrances perfectly matched to your taste using our
            advanced AI recommendation engine
          </p>

          {/* Quick Stats */}
          <div className='flex items-center justify-center space-x-8 mt-6 text-sm text-muted-foreground'>
            <div className='flex items-center space-x-2'>
              <div className='w-2 h-2 bg-green-500 rounded-full' />
              <span>
                AI Confidence:{' '}
                {Math.round((collectionStats.diversity_score || 0.5) * 100)}%
              </span>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='w-2 h-2 bg-blue-500 rounded-full' />
              <span>
                Collection: {collectionStats.total_fragrances || 0} fragrances
              </span>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='w-2 h-2 bg-purple-500 rounded-full' />
              <span>
                Learning from {recentInteractions.length} recent interactions
              </span>
            </div>
          </div>
        </div>

        {/* Cold Start Experience */}
        {(!collectionStats || collectionStats.total_fragrances === 0) && (
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
        )}

        {/* Main Recommendations System */}
        <Suspense
          fallback={<RecommendationSkeleton variant='analysis' count={4} />}
        >
          <RecommendationsSystem
            userId={user.id}
            userProfile={userProfile}
            collectionStats={collectionStats}
            recentInteractions={recentInteractions}
            initialRecommendations={initialRecommendations}
          />
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
