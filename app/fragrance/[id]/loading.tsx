/**
 * Loading State for Fragrance Detail Pages
 * Fallback states for dynamic content (SCE-63)
 * Spec: @.agent-os/specs/2025-08-22-beginner-experience-optimization/
 */

import { Skeleton } from '@/components/ui/skeleton'

export default function FragranceLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center gap-2 text-sm mb-2">
            <Skeleton className="h-4 w-12" />
            <span className="text-muted-foreground">/</span>
            <Skeleton className="h-4 w-16" />
            <span className="text-muted-foreground">/</span>
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Title area skeleton */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-20 rounded-full" /> {/* Family badge */}
            <Skeleton className="h-8 w-48" /> {/* Fragrance name */}
            <Skeleton className="h-6 w-20" /> {/* Brand name */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content skeleton */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* AI Description Section skeleton */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-6 w-48" />
              </div>

              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>

            {/* Battle Points skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-56" />
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="text-center p-4 border border-border rounded-lg">
                    <Skeleton className="h-8 w-8 mx-auto mb-2 rounded" />
                    <Skeleton className="h-8 w-12 mx-auto mb-2" />
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="border border-border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar skeleton */}
          <div className="space-y-6">
            {/* Try This Fragrance Card */}
            <div className="border border-border rounded-lg p-6 bg-card">
              <Skeleton className="h-6 w-36 mb-4" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>

                <Skeleton className="h-10 w-full rounded-lg" /> {/* Button */}
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>

            {/* Fragrance Stats Card */}
            <div className="border border-border rounded-lg p-6 bg-card">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-3" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}