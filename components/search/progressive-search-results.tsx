'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SearchSkeleton, SearchResultsLoadingSkeleton } from '@/components/ui/skeletons/search-skeleton';
import { FragranceCardSkeleton, FragranceGridSkeleton } from '@/components/ui/skeletons/fragrance-card-skeleton';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  name: string;
  brand_id: string;
  brand?: string;
  relevance_score: number;
  similarity_score?: number;
  sample_available?: boolean;
  sample_price_usd?: number;
  image_url?: string | null;
  scent_family?: string;
  gender?: string;
  in_collection?: boolean;
  in_wishlist?: boolean;
}

interface ProgressiveSearchResultsProps {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  error?: string | null;
  total?: number;
  onResultSelect: (result: SearchResult) => void;
  onPerformanceMetric?: (metric: { name: string; value: number }) => void;
  className?: string;
  variant?: 'grid' | 'list';
}

/**
 * Progressive Search Results Component - Task 2.2
 * 
 * Implements progressive loading for search results with:
 * - Skeleton loading during search
 * - Staggered card animations  
 * - Smooth transitions from loading to content
 * - Performance optimization for first contentful paint
 * - Error state handling with progressive recovery
 */
export function ProgressiveSearchResults({
  query,
  results,
  isLoading,
  error,
  total = 0,
  onResultSelect,
  onPerformanceMetric,
  className,
  variant = 'grid'
}: ProgressiveSearchResultsProps) {
  const [transitionState, setTransitionState] = useState<'loading' | 'transitioning' | 'loaded' | 'error'>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const [showRetryLoading, setShowRetryLoading] = useState(false);

  // Performance measurement setup
  useEffect(() => {
    if (!isLoading && results.length > 0) {
      // Mark content loaded for performance measurement
      if (typeof performance !== 'undefined') {
        performance.mark('search-content-start');
        
        // Measure first contentful paint after content renders
        requestAnimationFrame(() => {
          performance.mark('search-content-end');
          performance.measure('search-first-contentful-paint', 'search-content-start', 'search-content-end');
          
          const measure = performance.getEntriesByName('search-first-contentful-paint')[0];
          if (measure && onPerformanceMetric) {
            onPerformanceMetric({
              name: 'first-contentful-paint',
              value: measure.duration
            });
            console.log(`Search FCP: ${measure.duration}ms`);
          }
        });
      }
    }
  }, [isLoading, results, onPerformanceMetric]);

  // Handle loading state transitions
  useEffect(() => {
    if (error) {
      setTransitionState('error');
    } else if (isLoading) {
      setTransitionState('loading');
    } else if (results.length > 0) {
      setTransitionState('transitioning');
      // Brief transition period for smooth animation
      setTimeout(() => setTransitionState('loaded'), 200);
    } else {
      setTransitionState('loaded');
    }
  }, [isLoading, error, results.length]);

  // Layout shift prevention observer
  useEffect(() => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && (entry as any).value > 0.1) {
            console.warn('Layout shift detected:', (entry as any).value);
            if (onPerformanceMetric) {
              onPerformanceMetric({
                name: 'layout-shift',
                value: (entry as any).value
              });
            }
          }
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      return () => observer.disconnect();
    }
  }, [onPerformanceMetric]);

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setShowRetryLoading(true);
    setTransitionState('loading');
    
    // Simulate retry delay
    setTimeout(() => {
      setShowRetryLoading(false);
    }, 1000);
  }, []);

  const handleResultClick = useCallback((result: SearchResult) => {
    // Add click tracking for performance analysis
    if (onPerformanceMetric) {
      onPerformanceMetric({
        name: 'result-click-time',
        value: Date.now()
      });
    }
    onResultSelect(result);
  }, [onResultSelect, onPerformanceMetric]);

  // Loading state with full skeleton
  if (transitionState === 'loading' || showRetryLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <SearchResultsLoadingSkeleton />
        
        {/* Search context indicator */}
        {query && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-muted rounded-lg">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">
                Searching for "{query}"...
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Error state with retry option
  if (transitionState === 'error' && error) {
    return (
      <div className={cn('space-y-6', className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
        
        {/* Show skeleton during retry */}
        {retryCount > 0 && (
          <SearchSkeleton variant="grid" count={6} />
        )}
      </div>
    );
  }

  // Empty results state
  if (results.length === 0 && !isLoading && !error) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="space-y-4">
          <div className="text-6xl opacity-50">🔍</div>
          <h3 className="text-xl font-semibold">No results found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {query 
              ? `No fragrances found matching "${query}". Try different search terms or browse our collection.`
              : 'Start typing to search our fragrance collection.'
            }
          </p>
          {query && (
            <Button variant="outline" onClick={() => window.location.reload()}>
              Browse All Fragrances
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Loaded content with staggered animations
  return (
    <div 
      className={cn(
        'space-y-6 opacity-0 animate-fade-in',
        transitionState === 'loaded' && 'opacity-100',
        className
      )}
      data-testid="search-results"
    >
      {/* Results header with smooth transition */}
      <div 
        className="flex items-center justify-between animate-slide-in-from-top"
        data-testid="results-header"
      >
        <div>
          <h2 className="text-lg font-medium">
            {total > 0 ? (
              <>
                {total.toLocaleString()} fragrance{total !== 1 ? 's' : ''} found
                {query && ` for "${query}"`}
              </>
            ) : (
              'Search Results'
            )}
          </h2>
          {query && (
            <p className="text-sm text-muted-foreground mt-1">
              Showing {results.length} of {total} results
            </p>
          )}
        </div>
        
        {/* View toggle buttons could go here */}
      </div>

      {/* Progressive Results Grid/List */}
      {variant === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.map((result, index) => (
            <ProgressiveResultCard
              key={result.id}
              result={result}
              index={index}
              onClick={() => handleResultClick(result)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result, index) => (
            <ProgressiveResultListItem
              key={result.id}
              result={result}
              index={index}
              onClick={() => handleResultClick(result)}
            />
          ))}
        </div>
      )}

      {/* Load more indicator if needed */}
      {results.length < total && (
        <div className="text-center py-8">
          <Button variant="outline">
            Load More Results
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Progressive Result Card with staggered animation
 */
function ProgressiveResultCard({ 
  result, 
  index, 
  onClick 
}: { 
  result: SearchResult; 
  index: number; 
  onClick: () => void; 
}) {
  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 cursor-pointer opacity-0 animate-fade-in-up"
      style={{ 
        animationDelay: `${index * 0.1}s`,
        minHeight: '320px' // Prevent layout shift
      }}
      onClick={onClick}
      data-testid="result-card"
    >
      <CardContent className="p-0">
        {/* Image placeholder */}
        <div className="aspect-square bg-gradient-to-br from-purple-50 to-pink-50 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-50">
            🌸
          </div>
          
          {/* Status badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {result.sample_available && (
              <Badge className="bg-green-600 text-white text-xs">
                Sample Available
              </Badge>
            )}
            {result.in_collection && (
              <Badge className="bg-blue-600 text-white text-xs">
                Owned
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <p className="text-sm text-muted-foreground font-medium">
              {result.brand || result.brand_id}
            </p>
            <h3 className="font-medium text-foreground leading-tight line-clamp-2">
              {result.name}
            </h3>
          </div>

          {result.scent_family && (
            <Badge variant="secondary" className="text-xs">
              {result.scent_family}
            </Badge>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-muted-foreground">
              {Math.round(result.relevance_score * 100)}% match
            </div>
            <div className="text-xs text-purple-600 group-hover:text-purple-700">
              View Details →
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Progressive Result List Item for list view
 */
function ProgressiveResultListItem({ 
  result, 
  index, 
  onClick 
}: { 
  result: SearchResult; 
  index: number; 
  onClick: () => void; 
}) {
  return (
    <Card 
      className="group hover:shadow-md transition-all duration-300 cursor-pointer opacity-0 animate-fade-in-right"
      style={{ 
        animationDelay: `${index * 0.05}s`,
        minHeight: '120px' // Prevent layout shift
      }}
      onClick={onClick}
      data-testid="result-list-item"
    >
      <CardContent className="p-6">
        <div className="flex space-x-4">
          {/* Thumbnail */}
          <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg flex items-center justify-center text-2xl opacity-70">
            🌸
          </div>
          
          {/* Content */}
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-medium text-foreground group-hover:text-purple-700">
                {result.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {result.brand || result.brand_id}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {result.scent_family && (
                <Badge variant="secondary" className="text-xs">
                  {result.scent_family}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {Math.round(result.relevance_score * 100)}% match
              </span>
            </div>
          </div>
          
          {/* Action indicator */}
          <div className="flex items-center text-muted-foreground group-hover:text-purple-600">
            →
          </div>
        </div>
      </CardContent>
    </Card>
  );
}