import { cn } from '@/lib/utils';
import { SkeletonBase, SkeletonText, SkeletonImage, SkeletonButton, SkeletonCard } from './base-skeleton';

/**
 * Fragrance Card Skeleton
 * 
 * Skeleton component matching the structure of fragrance cards
 * used throughout the application for collections, recommendations,
 * and search results.
 */

interface FragranceCardSkeletonProps {
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  className?: string;
}

export function FragranceCardSkeleton({ 
  variant = 'default',
  showActions = true,
  className 
}: FragranceCardSkeletonProps) {
  return (
    <SkeletonCard className={className}>
      {/* Fragrance Image */}
      <SkeletonImage aspectRatio="square" className="mb-4" />
      
      {/* Fragrance Details */}
      <div className="space-y-2">
        {/* Brand Name */}
        <SkeletonText width="1/2" />
        
        {/* Fragrance Name */}
        <SkeletonText width="3/4" />
        
        {/* Scent Family (if detailed variant) */}
        {variant === 'detailed' && (
          <SkeletonText width="1/3" />
        )}
        
        {/* Price/Sample Info */}
        {variant !== 'compact' && (
          <SkeletonText width="1/4" />
        )}
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="mt-4 space-y-2">
          <SkeletonButton className="w-full" />
          <div className="flex space-x-2">
            <SkeletonButton size="sm" className="flex-1" />
            <SkeletonButton size="sm" className="flex-1" />
          </div>
        </div>
      )}

      {/* Rating (if detailed variant) */}
      {variant === 'detailed' && (
        <div className="mt-3 flex items-center space-x-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBase key={i} className="h-4 w-4 rounded" />
          ))}
        </div>
      )}
    </SkeletonCard>
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
        <FragranceCardSkeleton key={i} variant={variant} />
      ))}
    </div>
  );
}