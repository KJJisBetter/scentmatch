'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CollectionSkeletonProps {
  className?: string;
}

/**
 * Collection Skeleton Component
 * 
 * Loading skeleton for the collection dashboard matching the exact structure
 * of the real collection dashboard with staggered animations.
 */
export function CollectionSkeleton({ className }: CollectionSkeletonProps) {
  return (
    <div 
      className={cn('space-y-8', className)}
      role="status"
      aria-label="Loading collection dashboard"
    >
      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card 
            key={i}
            data-testid="skeleton-stats-card"
            style={{ animationDelay: `${(i - 1) * 0.1}s` }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Skeleton 
                  className="w-4 h-4" 
                  data-testid="skeleton-icon"
                />
                <Skeleton className="w-24 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton 
                className="w-12 h-8 mb-2" 
                data-testid="skeleton-stat-value"
              />
              <Skeleton 
                className="w-16 h-3" 
                data-testid="skeleton-stat-label"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Main Collection Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Search and Filters Skeleton */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Search Bar */}
                <Skeleton 
                  className="w-full h-10" 
                  data-testid="skeleton-search"
                />
                
                {/* Filter Buttons */}
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton 
                      key={i} 
                      className="w-20 h-8" 
                      data-testid="skeleton-filter"
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collection Grid Skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card 
                key={i}
                data-testid="skeleton-collection-item"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <CardContent className="p-0">
                  {/* Image Skeleton */}
                  <Skeleton 
                    className="w-full aspect-square rounded-t-lg" 
                    data-testid="skeleton-image"
                  />
                  
                  {/* Content Skeleton */}
                  <div className="p-4 space-y-3">
                    <div>
                      <Skeleton 
                        className="w-full h-5 mb-1" 
                        data-testid="skeleton-title"
                      />
                      <Skeleton 
                        className="w-2/3 h-4" 
                        data-testid="skeleton-brand"
                      />
                    </div>
                    
                    {/* Tags */}
                    <div className="flex space-x-2">
                      <Skeleton className="w-16 h-5" />
                      <Skeleton className="w-20 h-5" />
                    </div>
                    
                    {/* Rating */}
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Skeleton 
                          key={star} 
                          className="w-4 h-4" 
                          data-testid="skeleton-star"
                        />
                      ))}
                    </div>
                    
                    {/* Action Buttons */}
                    <div data-testid="skeleton-actions">
                      <Skeleton className="w-full h-9 mb-2" />
                      <div className="flex space-x-2">
                        <Skeleton className="flex-1 h-8" />
                        <Skeleton className="flex-1 h-8" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions */}
          <Card data-testid="skeleton-quick-actions">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Skeleton className="w-5 h-5" />
                <Skeleton className="w-24 h-5" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-full h-9" />
              ))}
            </CardContent>
          </Card>

          {/* Progress Card */}
          <Card data-testid="skeleton-progress">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Skeleton className="w-5 h-5" />
                <Skeleton className="w-20 h-5" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <Skeleton className="w-16 h-4" />
                <Skeleton className="w-16 h-5" />
              </div>
              <Skeleton className="w-full h-2" />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card data-testid="skeleton-recent-activity">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Skeleton className="w-5 h-5" />
                <Skeleton className="w-24 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="w-full h-4 mb-1" />
                      <Skeleton className="w-1/2 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}