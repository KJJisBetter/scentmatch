import { cn } from '@/lib/utils';
import { SkeletonBase, SkeletonText, SkeletonButton, SkeletonCard } from './base-skeleton';

/**
 * Dashboard Skeleton Components
 * 
 * Skeleton components for dashboard pages, stats displays,
 * and overview sections.
 */

export function DashboardHeaderSkeleton() {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        <div>
          <SkeletonBase className="h-8 w-64 mb-2" />
          <SkeletonBase className="h-4 w-96" />
        </div>
        <SkeletonButton className="w-20" />
      </div>
    </div>
  );
}

export function StatsGridSkeleton({ 
  columns = 4,
  className 
}: { 
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const gridClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-3', 
    4: 'grid-cols-2 md:grid-cols-4',
  }[columns];

  return (
    <div className={cn(`grid ${gridClass} gap-4`, className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <SkeletonCard key={i} className="p-4">
          <SkeletonBase className="h-6 w-8 mb-1" />
          <SkeletonBase className="h-4 w-20" />
        </SkeletonCard>
      ))}
    </div>
  );
}

export function DashboardCardsSkeleton({ 
  count = 3,
  className 
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i}>
          <div className="space-y-4">
            {/* Card Header */}
            <div>
              <SkeletonBase className="h-5 w-32 mb-2" />
              <SkeletonBase className="h-4 w-48" />
            </div>
            
            {/* Card Content */}
            <SkeletonButton className="w-full" />
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

export function QuickActionsSkeleton() {
  return (
    <div className="flex items-center space-x-3">
      <SkeletonButton size="sm" className="w-28" />
      <SkeletonButton size="sm" className="w-32" />
    </div>
  );
}

export function ActivityFeedSkeleton({ 
  items = 5,
  className 
}: {
  items?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 bg-card rounded-lg border">
          <SkeletonBase className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <SkeletonBase className="h-4 w-2/3 mb-1" />
            <SkeletonBase className="h-3 w-1/3" />
          </div>
          <SkeletonBase className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}