/**
 * Dynamic Content Fallback Components
 * Proper fallback states for dynamic content (SCE-63)
 * Spec: @.agent-os/specs/2025-08-22-beginner-experience-optimization/
 */

'use client'

import { useState, useEffect, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, RotateCcw, Wifi, WifiOff, Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export interface DynamicContentWrapperProps {
  children: ReactNode
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  fallback?: ReactNode
  loadingComponent?: ReactNode
  errorComponent?: ReactNode
  timeout?: number // Auto-retry timeout in ms
}

export interface FragranceDataFallbackProps {
  fragranceId: string
  error?: Error | null
  onRetry?: () => void
  onNavigateHome?: () => void
  onNavigateBrowse?: () => void
}

export interface NetworkStatusProps {
  onRetry?: () => void
}

/**
 * Wrapper component for dynamic content with comprehensive fallback handling
 */
export function DynamicContentWrapper({
  children,
  isLoading = false,
  error = null,
  onRetry,
  fallback,
  loadingComponent,
  errorComponent,
  timeout = 30000 // 30 second timeout
}: DynamicContentWrapperProps) {
  const [hasTimedOut, setHasTimedOut] = useState(false)
  
  useEffect(() => {
    if (isLoading && timeout > 0) {
      const timer = setTimeout(() => {
        setHasTimedOut(true)
      }, timeout)
      
      return () => clearTimeout(timer)
    }
  }, [isLoading, timeout])

  // Reset timeout when loading state changes
  useEffect(() => {
    if (!isLoading) {
      setHasTimedOut(false)
    }
  }, [isLoading])

  // Show error state
  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>
    }
    
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Content Loading Failed
        </h3>
        <p className="text-muted-foreground mb-4 max-w-sm">
          {error.message || 'An unexpected error occurred while loading this content.'}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    )
  }

  // Show timeout state
  if (hasTimedOut) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <WifiOff className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Loading Timeout
        </h3>
        <p className="text-muted-foreground mb-4 max-w-sm">
          This is taking longer than expected. Check your connection and try again.
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        )}
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>
    }
    
    return fallback || <DefaultLoadingFallback />
  }

  // Show content
  return <>{children}</>
}

/**
 * Default loading fallback for generic content
 */
export function DefaultLoadingFallback() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

/**
 * Specific fallback for fragrance data loading failures
 */
export function FragranceDataFallback({
  fragranceId,
  error,
  onRetry,
  onNavigateHome,
  onNavigateBrowse
}: FragranceDataFallbackProps) {
  const isNotFound = error?.message.includes('not found') || error?.message.includes('404')
  const isNetworkError = error?.message.includes('fetch') || error?.message.includes('network')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-8 bg-card rounded-xl shadow-lg border border-border">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            {isNetworkError ? (
              <WifiOff className="w-8 h-8 text-muted-foreground" />
            ) : (
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            )}
          </div>

          <h1 className="text-xl font-bold text-foreground mb-2">
            {isNotFound ? 'Fragrance Not Available' : 
             isNetworkError ? 'Connection Issue' :
             'Loading Problem'}
          </h1>

          <p className="text-muted-foreground mb-6">
            {isNotFound ? 
              `We couldn't find a fragrance with ID "${fragranceId}". It may have been removed or the link is incorrect.` :
             isNetworkError ?
              'Unable to connect to our servers. Please check your internet connection.' :
              'There was a problem loading this fragrance. Please try again.'}
          </p>

          <div className="space-y-3">
            {(isNetworkError || !isNotFound) && onRetry && (
              <Button onClick={onRetry} className="w-full">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={onNavigateBrowse}>
                <Search className="w-4 h-4 mr-1" />
                Browse
              </Button>
              
              <Button variant="outline" onClick={onNavigateHome}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Home
              </Button>
            </div>

            {isNotFound && (
              <div className="pt-4 border-t border-border/40">
                <p className="text-sm text-muted-foreground mb-2">
                  Try searching for this fragrance:
                </p>
                <Button variant="ghost" size="sm" asChild className="w-full">
                  <Link href={`/browse?search=${encodeURIComponent(fragranceId.replace(/-/g, ' '))}`}>
                    Search for "{fragranceId.replace(/-/g, ' ')}"
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Network status indicator component
 */
export function NetworkStatus({ onRetry }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    setIsOnline(navigator.onLine)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-destructive text-destructive-foreground p-3 rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">No internet connection</span>
        </div>
        {onRetry && (
          <Button size="sm" variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Content skeleton specifically for fragrance cards
 */
export function FragranceCardSkeleton() {
  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <Skeleton className="h-32 w-full mb-3 rounded" />
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-3" />
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-20 rounded" />
      </div>
    </div>
  )
}

/**
 * Content skeleton for search results
 */
export function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <FragranceCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

/**
 * Content skeleton for recommendation lists
 */
export function RecommendationsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-5 w-48 mx-auto" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <FragranceCardSkeleton />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Enhanced error boundary for catching client-side errors
 */
export function DynamicContentErrorBoundary({
  children,
  fallback,
  onError
}: {
  children: ReactNode
  fallback?: (error: Error) => ReactNode
  onError?: (error: Error) => void
}) {
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = new Error(event.message)
      setError(error)
      onError?.(error)
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = new Error(String(event.reason))
      setError(error)
      onError?.(error)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [onError])

  if (error) {
    if (fallback) {
      return <>{fallback(error)}</>
    }
    
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <AlertCircle className="w-8 h-8 text-destructive mb-3" />
        <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
        <p className="text-muted-foreground text-sm mb-4">
          {error.message || 'An unexpected error occurred'}
        </p>
        <Button 
          onClick={() => setError(null)} 
          variant="outline" 
          size="sm"
        >
          Try Again
        </Button>
      </div>
    )
  }

  return <>{children}</>
}