'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Fragrance Card Skeleton
 * 
 * Skeleton component matching the exact structure of fragrance cards
 * used throughout the application with staggered animations and 
 * responsive layouts.
 */

interface FragranceCardSkeletonProps {
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  className?: string;
  delay?: number;
}

export function FragranceCardSkeleton({ 
  variant = 'default',
  showActions = true,
  className,
  delay = 0
}: FragranceCardSkeletonProps) {
  return (
    <Card 
      className={cn('overflow-hidden', className)}
      role="status"
      aria-label="Loading fragrance details"
      data-testid="skeleton-card"
      style={{ animationDelay: `${delay}s` }}
    >
      <CardContent className="p-0">
        {/* Fragrance Image */}
        <div className="aspect-square bg-muted relative">
          <Skeleton 
            className="absolute inset-0" 
            data-testid="skeleton-image"
          />
          
          {/* Badge overlays for detailed variant */}
          {variant === 'detailed' && (
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              <Skeleton className="w-24 h-5 rounded-full" />
              <Skeleton className="w-16 h-5 rounded-full" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-3" data-testid="skeleton-content">
          <div className="space-y-2">
            {/* Brand Name */}
            <Skeleton 
              className="h-4 w-1/2" 
              data-testid="skeleton-brand"
            />
            
            {/* Fragrance Name */}
            <Skeleton 
              className="h-5 w-3/4" 
              data-testid="skeleton-name"
            />
            
            {/* Concentration (detailed variant) */}
            {variant === 'detailed' && (
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-8 rounded-full" />
              </div>
            )}
          </div>

          {/* Scent Family and Social Proof (detailed variant) */}
          {variant === 'detailed' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton 
                className="h-3 w-1/3" 
                data-testid="skeleton-scent-family"
              />
            </div>
          )}
          
          {/* Price/Sample Info (not compact) */}
          {variant !== 'compact' && (
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-20" />
              <div className="flex items-center space-x-1">
                <Skeleton className="h-3 w-3" />
                <Skeleton 
                  className="h-4 w-8" 
                  data-testid="skeleton-price"
                />
                <Skeleton className="h-3 w-8" />
              </div>
            </div>
          )}

          {/* Rating (detailed variant) */}
          {variant === 'detailed' && (
            <div className="flex space-x-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton 
                  key={i} 
                  className="w-4 h-4" 
                  data-testid="skeleton-star"
                />
              ))}
            </div>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="space-y-2" data-testid="skeleton-actions">
              <Skeleton className="w-full h-9" />
              {variant !== 'compact' && (
                <div className="flex space-x-2">
                  <Skeleton className="flex-1 h-8" />
                  <Skeleton className="w-12 h-8" />
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function FragranceGridSkeleton({ 
  count = 8,
  variant = 'default',
  className 
}: {
  count?: number;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}) {
  return (
    <div className={cn(
      'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
      className
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <FragranceCardSkeleton 
          key={i} 
          variant={variant} 
          delay={i * 0.1}
        />
      ))}
    </div>
  );
}