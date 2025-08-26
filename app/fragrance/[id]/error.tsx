/**
 * Error State for Fragrance Detail Pages
 * Fallback error handling for dynamic content (SCE-63)
 * Spec: @.agent-os/specs/2025-08-22-beginner-experience-optimization/
 */

'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft, Search, RotateCcw } from 'lucide-react'
import Link from 'next/link'

interface FragranceErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function FragranceError({
  error,
  reset,
}: FragranceErrorProps) {
  useEffect(() => {
    // Log error for monitoring
    console.error('Fragrance page error:', error)
  }, [error])

  // Determine error type for better messaging
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network')
  const isNotFound = error.message.includes('not found') || error.message.includes('404')
  const isServerError = error.message.includes('500') || error.message.includes('server')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-8 bg-card rounded-xl shadow-lg border border-border">
        <div className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isNotFound ? 'Fragrance Not Found' : 
             isNetworkError ? 'Connection Problem' :
             isServerError ? 'Server Error' :
             'Something Went Wrong'}
          </h1>

          <p className="text-muted-foreground mb-6">
            {isNotFound ? 
              'This fragrance might have been discontinued or the link is broken.' :
             isNetworkError ?
              'Check your internet connection and try again.' :
             isServerError ?
              'Our servers are having issues. Please try again in a moment.' :
              'We encountered an unexpected error while loading this fragrance.'}
          </p>

          <div className="space-y-3">
            {/* Primary action based on error type */}
            {isNetworkError || isServerError ? (
              <Button onClick={reset} className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            ) : (
              <Button asChild className="w-full">
                <Link href="/browse" className="flex items-center justify-center gap-2">
                  <Search className="h-4 w-4" />
                  Find Similar Fragrances
                </Link>
              </Button>
            )}

            {/* Secondary actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" asChild>
                <Link href="/browse" className="flex items-center justify-center gap-1">
                  <Search className="h-3 w-3" />
                  Browse
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link href="/" className="flex items-center justify-center gap-1">
                  <ArrowLeft className="h-3 w-3" />
                  Home
                </Link>
              </Button>
            </div>

            {/* Additional help for not found errors */}
            {isNotFound && (
              <div className="pt-4 border-t border-border/40">
                <p className="text-sm text-muted-foreground mb-3">Looking for a specific fragrance?</p>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href="/quiz">
                      Take Our Quiz
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Error details for development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="text-sm text-muted-foreground cursor-pointer">
                Error Details (Development)
              </summary>
              <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto max-h-32">
                {error.message}
                {error.digest && `\nDigest: ${error.digest}`}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}