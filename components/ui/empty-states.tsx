/**
 * Empty States Components
 * Consistent empty state handling for SCE-64
 * Spec: @.agent-os/specs/2025-08-22-beginner-experience-optimization/
 */

import { SearchX, Package, Filter, Heart, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface EmptyStateProps {
  className?: string
  children?: React.ReactNode
}

export interface EmptySearchStateProps extends EmptyStateProps {
  query: string
  onRetrySearch?: () => void
}

export interface EmptyBrowseStateProps extends EmptyStateProps {
  category?: 'men' | 'women' | 'unisex' | string
  onExplore?: () => void
  onTakeQuiz?: () => void
  isLoading?: boolean
}

export interface EmptyFilterStateProps extends EmptyStateProps {
  activeFilters: string[]
  onClearFilters?: () => void
}

export interface EmptyCollectionStateProps extends EmptyStateProps {
  type: 'collection' | 'wishlist' | 'favorites'
  onBrowse?: () => void
}

export interface LoadingStateProps extends EmptyStateProps {
  message?: string
}

export interface ErrorStateProps extends EmptyStateProps {
  message: string
  type?: 'network' | 'server' | 'generic'
  onRetry?: () => void
}

const EmptyStateBase = ({ 
  children, 
  className = '' 
}: EmptyStateProps) => (
  <div 
    className={`empty-state flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
    role="region"
    aria-live="polite"
    aria-label="Empty state"
  >
    {children}
  </div>
)

export const EmptySearchState = ({ 
  query, 
  onRetrySearch,
  className = '' 
}: EmptySearchStateProps) => (
  <EmptyStateBase className={`empty-search ${className}`}>
    <SearchX className="empty-state-icon w-16 h-16 text-gray-400 mb-4" role="img" aria-hidden="true" />
    <h3 className="empty-state-title text-lg font-semibold text-gray-900 mb-2">
      No fragrances found
    </h3>
    {query && (
      <p className="text-gray-700 mb-2">
        for "<span className="font-medium">{query}</span>"
      </p>
    )}
    <div className="empty-state-description text-gray-600 mb-6 max-w-md">
      {query ? (
        <>
          <p>We couldn't find any fragrances matching your search.</p>
          <p className="mt-2">Try searching for:</p>
          <ul className="text-sm mt-2 space-y-1">
            <li>• Popular brands like Chanel, Dior, Tom Ford</li>
            <li>• Fragrance families like fresh, woody, floral</li>
            <li>• Specific notes like vanilla, citrus, rose</li>
          </ul>
        </>
      ) : (
        <p>Try searching for fragrances, brands, or fragrance families.</p>
      )}
    </div>
    {onRetrySearch && (
      <Button onClick={onRetrySearch} variant="outline">
        Try Different Search
      </Button>
    )}
  </EmptyStateBase>
)

export const EmptyBrowseState = ({ 
  category,
  onExplore,
  onTakeQuiz,
  isLoading = false,
  className = '' 
}: EmptyBrowseStateProps) => (
  <EmptyStateBase className={`empty-browse ${className}`}>
    <Package className="empty-state-icon w-16 h-16 text-gray-400 mb-4" role="img" aria-hidden="true" />
    <h3 className="empty-state-title text-lg font-semibold text-gray-900 mb-2" role="heading">
      {category ? `No ${category}'s fragrances available` : 'No fragrances available'}
    </h3>
    <div className="empty-state-description text-gray-600 mb-6 max-w-md">
      <p>We're currently updating our fragrance collection.</p>
      <p className="mt-2">Try browsing a different category or take our quiz to find personalized recommendations.</p>
    </div>
    <div className="flex flex-col sm:flex-row gap-3">
      <Button 
        onClick={onExplore} 
        disabled={isLoading}
        aria-label="Explore all fragrances"
      >
        Explore All Fragrances
      </Button>
      <Button 
        onClick={onTakeQuiz} 
        variant="outline"
        disabled={isLoading}
        aria-label="Take quiz"
      >
        Take Quiz
      </Button>
    </div>
  </EmptyStateBase>
)

export const EmptyFilterState = ({ 
  activeFilters,
  onClearFilters,
  className = '' 
}: EmptyFilterStateProps) => (
  <EmptyStateBase className={`empty-filter ${className}`}>
    <Filter className="empty-state-icon w-16 h-16 text-gray-400 mb-4" role="img" aria-hidden="true" />
    <h3 className="empty-state-title text-lg font-semibold text-gray-900 mb-2">
      No fragrances match your filters
    </h3>
    <div className="empty-state-description text-gray-600 mb-6 max-w-md">
      {activeFilters.length > 0 ? (
        <>
          <p>Your current filters:</p>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {activeFilters.map(filter => (
              <span 
                key={filter}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
              >
                {filter}
              </span>
            ))}
          </div>
          <p className="mt-3">Try removing some filters or browse all fragrances.</p>
        </>
      ) : (
        <p>Adjust your filters to see more results.</p>
      )}
    </div>
    {activeFilters.length > 0 && onClearFilters && (
      <Button onClick={onClearFilters} variant="outline">
        Clear Filters
      </Button>
    )}
  </EmptyStateBase>
)

export const EmptyCollectionState = ({ 
  type,
  onBrowse,
  className = '' 
}: EmptyCollectionStateProps) => {
  const typeLabels = {
    collection: 'collection',
    wishlist: 'wishlist', 
    favorites: 'favorites'
  }
  
  const typeMessages = {
    collection: 'Start building your fragrance collection by discovering new scents.',
    wishlist: 'Add fragrances you want to try to your wishlist.',
    favorites: 'Mark fragrances you love as favorites.'
  }
  
  return (
    <EmptyStateBase className={`empty-collection ${className}`}>
      <Heart className="empty-state-icon w-16 h-16 text-gray-400 mb-4" role="img" aria-hidden="true" />
      <h3 className="empty-state-title text-lg font-semibold text-gray-900 mb-2">
        Your {typeLabels[type]} is empty
      </h3>
      <div className="empty-state-description text-gray-600 mb-6 max-w-md">
        <p>{typeMessages[type]}</p>
        <p className="mt-2">Discover fragrances that match your preferences and style.</p>
      </div>
      <Button onClick={onBrowse}>
        Browse Fragrances
      </Button>
    </EmptyStateBase>
  )
}

export const LoadingState = ({ 
  message = 'Loading fragrances...',
  className = '' 
}: LoadingStateProps) => (
  <EmptyStateBase className={`loading ${className}`}>
    <Loader2 className="loading-spinner w-8 h-8 text-gray-400 mb-4 animate-spin" role="status" />
    <p className="text-gray-600">{message}</p>
  </EmptyStateBase>
)

export const ErrorState = ({ 
  message,
  type = 'generic',
  onRetry,
  className = '' 
}: ErrorStateProps) => {
  const typeMessages = {
    network: 'Check your internet connection and try again.',
    server: 'Our servers are temporarily unavailable.',
    generic: 'Something went wrong while loading fragrances.'
  }
  
  return (
    <EmptyStateBase className={`error ${className}`}>
      <AlertCircle className="empty-state-icon w-16 h-16 text-red-400 mb-4" role="img" aria-hidden="true" />
      <h3 className="empty-state-title text-lg font-semibold text-gray-900 mb-2">
        {message}
      </h3>
      <div className="empty-state-description text-gray-600 mb-6 max-w-md">
        <p>{typeMessages[type]}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </EmptyStateBase>
  )
}