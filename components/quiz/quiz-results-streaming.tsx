'use client';

import React, { Suspense } from 'react';
import { QuizSkeleton } from '@/components/ui/skeletons';
import { FragranceRecommendationDisplay } from './fragrance-recommendation-display';

interface QuizResultsStreamingProps {
  recommendations: any[];
  isGenerating: boolean;
  onSampleOrder: (fragranceId: string) => void;
  onLearnMore: (fragranceId: string) => void;
  onSaveToFavorites: (fragranceId: string) => void;
  className?: string;
}

// Async component for heavy AI processing simulation
async function RecommendationResults({
  recommendations,
  onSampleOrder,
  onLearnMore,
  onSaveToFavorites,
}: {
  recommendations: any[];
  onSampleOrder: (fragranceId: string) => void;
  onLearnMore: (fragranceId: string) => void;
  onSaveToFavorites: (fragranceId: string) => void;
}) {
  // Simulate progressive loading by adding a small delay
  // In real implementation, this would be the actual async data fetching
  await new Promise(resolve => setTimeout(resolve, 100));

  return (
    <div className='max-w-6xl mx-auto'>
      <FragranceRecommendationDisplay
        recommendations={recommendations}
        onSampleOrder={onSampleOrder}
        onLearnMore={onLearnMore}
        onSaveToFavorites={onSaveToFavorites}
      />
    </div>
  );
}

function RecommendationsFallback() {
  return <QuizSkeleton variant='recommendations' />;
}

export function QuizResultsStreaming({
  recommendations,
  isGenerating,
  onSampleOrder,
  onLearnMore,
  onSaveToFavorites,
  className = '',
}: QuizResultsStreamingProps) {
  if (isGenerating) {
    return <QuizSkeleton variant='analyzing' className={className} />;
  }

  if (recommendations.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className='text-muted-foreground'>
          Sorry, we couldn't generate recommendations at this time. Please try
          again.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Suspense fallback={<RecommendationsFallback />}>
        <RecommendationResults
          recommendations={recommendations}
          onSampleOrder={onSampleOrder}
          onLearnMore={onLearnMore}
          onSaveToFavorites={onSaveToFavorites}
        />
      </Suspense>
    </div>
  );
}
