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
          <div className='space-y-3' aria-hidden='true'>
            <Skeleton className='h-6 w-64 mx-auto' />
            <Skeleton className='h-4 w-48 mx-auto' />
          </div>
          <div className='text-sm text-muted-foreground space-y-2 mt-6'>
            <div className='flex items-center justify-center space-x-2'>
              <Skeleton className='h-4 w-4 rounded-full' />
              <Skeleton className='h-4 w-32' />
            </div>
            <div className='flex items-center justify-center space-x-2'>
              <Skeleton className='h-4 w-4 rounded-full' />
              <Skeleton className='h-4 w-40' />
            </div>
            <div className='flex items-center justify-center space-x-2'>
              <Skeleton className='h-4 w-4 rounded-full' />
              <Skeleton className='h-4 w-36' />
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
