'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface RecommendationSkeletonProps {
  variant?: 'detailed' | 'compact' | 'carousel' | 'analysis';
  count?: number;
  className?: string;
}

export function RecommendationSkeleton({
  variant = 'detailed',
  count = 3,
  className = '',
}: RecommendationSkeletonProps) {
  if (variant === 'analysis') {
    return (
      <div className={`space-y-8 ${className}`}>
        {/* Analysis header */}
        <div className='text-center space-y-4'>
          <Skeleton className='h-8 w-80 mx-auto' />
          <Skeleton className='h-5 w-64 mx-auto' />
        </div>

        {/* AI insights card */}
        <Card>
          <CardContent className='p-6'>
            <div className='space-y-4'>
              <div className='flex items-center space-x-3'>
                <Skeleton className='h-6 w-6 rounded-full' />
                <Skeleton className='h-6 w-48' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-5/6' />
                <Skeleton className='h-4 w-4/5' />
              </div>
              <div className='grid gap-4 md:grid-cols-3'>
                {[1, 2, 3].map(i => (
                  <div key={i} className='space-y-2'>
                    <Skeleton className='h-4 w-20' />
                    <Skeleton className='h-6 w-full' />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <RecommendationSkeleton variant='detailed' count={count} />
      </div>
    );
  }

  if (variant === 'carousel') {
    return (
      <div className={`${className}`}>
        <div className='flex space-x-4 overflow-hidden'>
          {Array.from({ length: count }).map((_, i) => (
            <Card key={i} className='flex-shrink-0 w-72'>
              <div className='aspect-square bg-muted relative'>
                <Skeleton className='absolute inset-0' />
              </div>
              <CardContent className='p-4'>
                <div className='space-y-3'>
                  <Skeleton className='h-5 w-3/4' />
                  <Skeleton className='h-4 w-1/2' />
                  <div className='space-y-1'>
                    <Skeleton className='h-3 w-full' />
                    <Skeleton className='h-3 w-4/5' />
                  </div>
                  <Skeleton className='h-10 w-full' />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className='overflow-hidden'>
            <CardContent className='p-4'>
              <div className='flex space-x-4'>
                <Skeleton className='h-16 w-16 rounded-lg flex-shrink-0' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-4 w-3/4' />
                  <Skeleton className='h-3 w-1/2' />
                  <div className='flex items-center space-x-2'>
                    <Skeleton className='h-6 w-20' />
                    <Skeleton className='h-6 w-16' />
                  </div>
                </div>
                <Skeleton className='h-8 w-8 rounded-full' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Default detailed variant
  return (
    <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className='overflow-hidden'>
          <div className='aspect-square bg-muted relative'>
            <Skeleton className='absolute inset-0' />
            {/* Match percentage badge */}
            <div className='absolute top-4 right-4'>
              <Skeleton className='h-8 w-16 rounded-full' />
            </div>
          </div>
          <CardContent className='p-6'>
            <div className='space-y-4'>
              {/* Title and brand */}
              <div className='space-y-2'>
                <Skeleton className='h-6 w-3/4' />
                <Skeleton className='h-4 w-1/2' />
              </div>

              {/* Description */}
              <div className='space-y-2'>
                <Skeleton className='h-3 w-full' />
                <Skeleton className='h-3 w-5/6' />
                <Skeleton className='h-3 w-4/5' />
              </div>

              {/* Notes */}
              <div className='space-y-2'>
                <Skeleton className='h-4 w-20' />
                <div className='flex flex-wrap gap-1'>
                  {[1, 2, 3, 4].map(j => (
                    <Skeleton key={j} className='h-6 w-16 rounded-full' />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className='flex space-x-2 pt-4'>
                <Skeleton className='h-10 flex-1' />
                <Skeleton className='h-10 w-20' />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function RecommendationStreamingSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Progressive loading indicator */}
      <div className='text-center space-y-3'>
        <div className='flex items-center justify-center space-x-2'>
          <div className='animate-pulse w-2 h-2 bg-purple-500 rounded-full' />
          <div className='animate-pulse w-2 h-2 bg-purple-400 rounded-full animation-delay-200' />
          <div className='animate-pulse w-2 h-2 bg-purple-300 rounded-full animation-delay-400' />
        </div>
        <Skeleton className='h-5 w-64 mx-auto' />
      </div>

      {/* Recommendations appearing progressively */}
      <RecommendationSkeleton variant='detailed' count={3} />
    </div>
  );
}
