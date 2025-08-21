'use client';

import React, { Suspense, useState, useEffect } from 'react';
import {
  RecommendationSkeleton,
  RecommendationStreamingSkeleton,
} from '@/components/ui/skeletons';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Card, CardContent } from '@/components/ui/card';

interface RecommendationsStreamingProps {
  userId: string;
  initialRecommendations?: any[];
  categories?: string[];
  onRecommendationInteraction?: (
    fragranceId: string,
    type: 'like' | 'dislike' | 'save'
  ) => void;
  className?: string;
}

// Progressive loading component that simulates streaming recommendations
function ProgressiveRecommendations({
  userId,
  initialRecommendations = [],
  categories = ['trending', 'personalized', 'similar', 'discovery'],
  onRecommendationInteraction,
}: {
  userId: string;
  initialRecommendations: any[];
  categories: string[];
  onRecommendationInteraction?: (
    fragranceId: string,
    type: 'like' | 'dislike' | 'save'
  ) => void;
}) {
  const [loadedCategories, setLoadedCategories] = useState<string[]>([]);
  const [categoryRecommendations, setCategoryRecommendations] = useState<
    Record<string, any[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadRecommendationsProgressively = async () => {
      // Start with initial recommendations if available
      if (initialRecommendations.length > 0) {
        setCategoryRecommendations(prev => ({
          ...prev,
          initial: initialRecommendations.slice(0, 3),
        }));
        setLoadedCategories(['initial']);
      }

      // Progressive loading simulation - in real implementation,
      // this would be actual API calls to different recommendation engines
      for (let i = 0; i < categories.length; i++) {
        if (!mounted) break;

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 200 + i * 100));

        const category = categories[i];

        try {
          // Mock API call - replace with actual recommendation API
          const mockRecommendations = await fetchCategoryRecommendations(
            userId,
            category || ''
          );

          if (mounted) {
            setCategoryRecommendations(prev => ({
              ...prev,
              [category || 'default']: mockRecommendations,
            }));
            setLoadedCategories(prev => [...prev, category || 'default']);
          }
        } catch (error) {
          console.error(`Failed to load ${category} recommendations:`, error);
        }
      }

      if (mounted) {
        setIsLoading(false);
      }
    };

    loadRecommendationsProgressively();

    return () => {
      mounted = false;
    };
  }, [userId, categories, initialRecommendations]);

  if (isLoading && loadedCategories.length === 0) {
    return <RecommendationStreamingSkeleton />;
  }

  return (
    <div className='space-y-8'>
      {loadedCategories.map(category => (
        <RecommendationCategory
          key={category}
          category={category}
          recommendations={categoryRecommendations[category] || []}
          onInteraction={onRecommendationInteraction}
        />
      ))}

      {/* Show loading for remaining categories */}
      {isLoading && (
        <div className='space-y-6'>
          <RecommendationSkeleton variant='detailed' count={3} />
        </div>
      )}
    </div>
  );
}

function RecommendationCategory({
  category,
  recommendations,
  onInteraction,
}: {
  category: string;
  recommendations: any[];
  onInteraction?: (
    fragranceId: string,
    type: 'like' | 'dislike' | 'save'
  ) => void;
}) {
  const categoryTitles: Record<string, string> = {
    initial: 'Your Perfect Matches',
    trending: 'Trending in Your Style',
    personalized: 'Made for You',
    similar: 'More Like Your Favorites',
    discovery: 'New Discoveries',
  };

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className='space-y-4'>
      <h2 className='text-2xl font-semibold'>
        {categoryTitles[category] || category}
      </h2>

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {recommendations.map(rec => (
          <RecommendationCard
            key={rec.id}
            recommendation={rec}
            onInteraction={onInteraction}
          />
        ))}
      </div>
    </div>
  );
}

function RecommendationCard({
  recommendation,
  onInteraction,
}: {
  recommendation: any;
  onInteraction?: (
    fragranceId: string,
    type: 'like' | 'dislike' | 'save'
  ) => void;
}) {
  const handleInteraction = (type: 'like' | 'dislike' | 'save') => {
    onInteraction?.(recommendation.id, type);
  };

  return (
    <Card className='overflow-hidden hover:shadow-lg transition-shadow'>
      <div className='aspect-square bg-muted relative'>
        {recommendation.image_url ? (
          <OptimizedImage
            src={recommendation.image_url}
            alt={`${recommendation.name} fragrance bottle`}
            className='absolute inset-0 w-full h-full object-cover'
            priority={false}
          />
        ) : (
          <div className='absolute inset-0 flex items-center justify-center text-muted-foreground'>
            <span className='text-4xl'>🌸</span>
          </div>
        )}

        {recommendation.match_score && (
          <div className='absolute top-4 right-4 bg-black/80 text-white px-2 py-1 rounded-full text-sm'>
            {Math.round(recommendation.match_score * 100)}% match
          </div>
        )}
      </div>

      <CardContent className='p-4'>
        <div className='space-y-3'>
          <div>
            <h3 className='font-semibold text-lg line-clamp-1'>
              {recommendation.name}
            </h3>
            <p className='text-muted-foreground text-sm'>
              {recommendation.brand}
            </p>
          </div>

          {recommendation.ai_description && (
            <p className='text-sm text-muted-foreground line-clamp-2'>
              {recommendation.ai_description}
            </p>
          )}

          {recommendation.top_notes && (
            <div className='flex flex-wrap gap-1'>
              {recommendation.top_notes
                .slice(0, 3)
                .map((note: string, index: number) => (
                  <span
                    key={index}
                    className='px-2 py-1 bg-muted rounded-full text-xs'
                  >
                    {note}
                  </span>
                ))}
            </div>
          )}

          <div className='flex space-x-2'>
            <button
              onClick={() => handleInteraction('like')}
              className='flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary/90'
            >
              Save to Wishlist
            </button>
            <button
              onClick={() => handleInteraction('save')}
              className='p-2 border border-border rounded-lg hover:bg-accent'
              aria-label='Learn more'
            >
              <span className='text-sm'>ℹ️</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Mock API function - replace with actual implementation
async function fetchCategoryRecommendations(
  userId: string,
  category: string
): Promise<any[]> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 100));

  // Mock data - replace with actual API response
  return Array.from({ length: 3 }, (_, i) => ({
    id: `${category}-${i}`,
    name: `Sample Fragrance ${i + 1}`,
    brand: 'Sample Brand',
    match_score: 0.85 + Math.random() * 0.15,
    ai_description:
      'A sophisticated blend that captures the essence of modern elegance.',
    top_notes: ['Bergamot', 'Rose', 'Sandalwood'],
    image_url: null,
  }));
}

export function RecommendationsStreaming({
  userId,
  initialRecommendations = [],
  categories = ['trending', 'personalized', 'similar', 'discovery'],
  onRecommendationInteraction,
  className = '',
}: RecommendationsStreamingProps) {
  return (
    <div className={className}>
      <Suspense fallback={<RecommendationStreamingSkeleton />}>
        <ProgressiveRecommendations
          userId={userId}
          initialRecommendations={initialRecommendations}
          categories={categories}
          onRecommendationInteraction={onRecommendationInteraction}
        />
      </Suspense>
    </div>
  );
}
