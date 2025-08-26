'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';

interface QuizSkeletonProps {
  variant?: 'loading' | 'analyzing' | 'recommendations';
  className?: string;
}

export function QuizSkeleton({
  variant = 'loading',
  className = '',
}: QuizSkeletonProps) {
  if (variant === 'analyzing') {
    return (
      <Card
        className={`max-w-2xl mx-auto ${className}`}
        role='status'
        aria-label='Analyzing quiz responses and generating recommendations'
      >
        <CardContent className='text-center py-12'>
          <div className='relative mb-6'>
            <div className='animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto' />
            <Sparkles className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-purple-500' />
          </div>
          <h3 className='text-xl font-semibold mb-2'>
            Creating Your Personalized Fragrance Profile...
          </h3>
          <p className='text-muted-foreground mb-4'>
            Analyzing your responses and finding perfect matches
          </p>
          <div className='text-sm text-muted-foreground space-y-2'>
            <p>🧠 Analyzing your fragrance personality from quiz responses</p>
            <p>💾 Storing your preferences for personalized recommendations</p>  
            <p>🎯 Matching your profile against our fragrance database</p>
            <p>✨ Generating educational explanations for your experience level</p>
            <p>🎨 Preparing your top 3 personalized matches</p>
          </div>
          
          {/* Loading progress indicator */}
          <div className='mt-6'>
            <div className='text-xs text-muted-foreground mb-2'>This may take 15-30 seconds for the best results</div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div className='bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full animate-pulse w-2/3'></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'recommendations') {
    return (
      <div className={`max-w-6xl mx-auto space-y-8 ${className}`}>
        {/* Header skeleton */}
        <div className='text-center space-y-4'>
          <Skeleton className='h-8 w-96 mx-auto' />
          <Skeleton className='h-5 w-64 mx-auto' />
        </div>

        {/* Recommendations grid skeleton */}
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {[1, 2, 3].map(i => (
            <Card key={i} className='overflow-hidden'>
              <div className='aspect-square bg-muted relative'>
                <Skeleton className='absolute inset-0' />
              </div>
              <CardContent className='p-6'>
                <div className='space-y-3'>
                  <Skeleton className='h-6 w-3/4' />
                  <Skeleton className='h-4 w-1/2' />
                  <div className='space-y-2'>
                    <Skeleton className='h-3 w-full' />
                    <Skeleton className='h-3 w-5/6' />
                    <Skeleton className='h-3 w-4/5' />
                  </div>
                  <div className='flex space-x-2 pt-3'>
                    <Skeleton className='h-10 flex-1' />
                    <Skeleton className='h-10 w-20' />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Default loading skeleton
  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      <Card>
        <CardContent className='p-8'>
          <div className='space-y-6'>
            <div className='space-y-2'>
              <Skeleton className='h-6 w-3/4' />
              <Skeleton className='h-4 w-1/2' />
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <Skeleton className='h-32 rounded-lg' />
              <Skeleton className='h-32 rounded-lg' />
            </div>
            <div className='flex justify-between'>
              <Skeleton className='h-10 w-24' />
              <Skeleton className='h-10 w-32' />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
