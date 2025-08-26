'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SearchSkeletonProps {
  variant?: 'grid' | 'list' | 'filters' | 'suggestions';
  count?: number;
  className?: string;
}

export function SearchSkeleton({
  variant = 'grid',
  count = 6,
  className = '',
}: SearchSkeletonProps) {
  if (variant === 'filters') {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className='space-y-3'>
          <Skeleton className='h-5 w-24' />
          <div className='space-y-2'>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className='flex items-center space-x-2'>
                <Skeleton 
                  className='h-4 w-4' 
                  data-testid="skeleton-checkbox"
                />
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-3 w-6 ml-auto' />
              </div>
            ))}
          </div>
        </div>

        <div className='space-y-3'>
          <Skeleton className='h-5 w-20' />
          <div className='grid grid-cols-2 gap-2'>
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className='h-8' />
            ))}
          </div>
        </div>

        <div className='space-y-3'>
          <Skeleton className='h-5 w-28' />
          <Skeleton className='h-32' />
        </div>
      </div>
    );
  }

  if (variant === 'suggestions') {
    return (
      <div className={cn(
        'absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50',
        className
      )}>
        <div className='p-3 space-y-2'>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className='flex items-center space-x-3 p-2'>
              <Skeleton className='h-4 w-4 rounded-full' />
              <Skeleton className='h-4 flex-1' />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <Card 
            key={i} 
            className='overflow-hidden'
            role="status"
            aria-label={`Loading search result ${i + 1}`}
            data-testid="skeleton-card"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <CardContent className='p-6' data-testid="skeleton-content">
              <div className='flex space-x-4'>
                <Skeleton 
                  className='h-24 w-24 rounded-lg flex-shrink-0' 
                  data-testid="skeleton-image"
                />
                <div className='flex-1 space-y-3'>
                  <div className='space-y-2'>
                    <Skeleton className='h-5 w-3/4' />
                    <Skeleton className='h-4 w-1/2' />
                  </div>
                  <div className='space-y-1'>
                    <Skeleton className='h-3 w-full' />
                    <Skeleton className='h-3 w-5/6' />
                  </div>
                  <div className='flex items-center space-x-4'>
                    <Skeleton className='h-4 w-16' />
                    <Skeleton className='h-4 w-20' />
                    <Skeleton className='h-8 w-24 ml-auto' />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Default grid variant
  return (
    <div className={cn('grid gap-6 md:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card 
          key={i} 
          className='overflow-hidden'
          role="status"
          aria-label={`Loading fragrance ${i + 1}`}
          data-testid="skeleton-card"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <div className='aspect-square bg-muted relative'>
            <Skeleton 
              className='absolute inset-0' 
              data-testid="skeleton-image"
            />
          </div>
          <CardContent className='p-4' data-testid="skeleton-content">
            <div className='space-y-3'>
              <div className='space-y-2'>
                <Skeleton className='h-5 w-3/4' />
                <Skeleton className='h-4 w-1/2' />
              </div>
              <div className='space-y-1'>
                <Skeleton className='h-3 w-full' />
                <Skeleton className='h-3 w-5/6' />
              </div>
              <div className='flex items-center justify-between pt-2'>
                <Skeleton className='h-4 w-16' />
                <Skeleton className='h-8 w-20' />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SearchResultsLoadingSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Results header skeleton */}
      <div 
        className='flex items-center justify-between'
        data-testid="skeleton-header"
      >
        <Skeleton 
          className='h-6 w-48' 
          data-testid="skeleton-result-count"
        />
        <Skeleton 
          className='h-8 w-32' 
          data-testid="skeleton-sort"
        />
      </div>

      {/* Search results skeleton */}
      <SearchSkeleton variant='grid' count={6} />

      {/* Pagination skeleton */}
      <div 
        className='flex justify-center space-x-2'
        data-testid="skeleton-pagination"
      >
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className='h-10 w-10' />
        ))}
      </div>
    </div>
  );
}