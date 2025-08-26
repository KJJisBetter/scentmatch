/**
 * Empty States Component Tests
 * Tests for consistent empty state components - SCE-64
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  EmptySearchState,
  EmptyBrowseState,
  EmptyFilterState,
  EmptyCollectionState,
  LoadingState,
  ErrorState
} from '@/components/ui/empty-states'

describe('Empty State Components', () => {
  describe('EmptySearchState', () => {
    it('should render for empty search with query', () => {
      render(<EmptySearchState query="rose perfume" />)
      
      expect(screen.getByText(/no fragrances found/i)).toBeInTheDocument()
      expect(screen.getByText(/rose perfume/)).toBeInTheDocument()
    })

    it('should render without query', () => {
      render(<EmptySearchState query="" />)
      
      expect(screen.getByText(/no fragrances found/i)).toBeInTheDocument()
    })

    it('should show retry button when callback provided', () => {
      const mockRetry = vi.fn()
      render(<EmptySearchState query="test" onRetrySearch={mockRetry} />)
      
      expect(screen.getByRole('button', { name: /try different search/i })).toBeInTheDocument()
    })

    it('should have proper accessibility attributes', () => {
      render(<EmptySearchState query="test" />)
      
      expect(screen.getByRole('region')).toHaveAttribute('aria-live', 'polite')
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument()
    })
  })

  describe('EmptyBrowseState', () => {
    it('should render for general browse empty', () => {
      render(<EmptyBrowseState />)
      
      expect(screen.getByText(/no fragrances available/i)).toBeInTheDocument()
    })

    it('should render with specific category', () => {
      render(<EmptyBrowseState category="men" />)
      
      expect(screen.getByText(/no men's fragrances/i)).toBeInTheDocument()
    })

    it('should show action buttons', () => {
      const mockExplore = vi.fn()
      const mockQuiz = vi.fn()
      render(
        <EmptyBrowseState 
          onExplore={mockExplore} 
          onTakeQuiz={mockQuiz} 
        />
      )
      
      expect(screen.getByRole('button', { name: /explore all fragrances/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /take quiz/i })).toBeInTheDocument()
    })

    it('should disable buttons when loading', () => {
      render(<EmptyBrowseState isLoading={true} onExplore={vi.fn()} />)
      
      expect(screen.getByRole('button', { name: /explore all fragrances/i })).toBeDisabled()
    })
  })

  describe('EmptyFilterState', () => {
    it('should render active filters', () => {
      render(<EmptyFilterState activeFilters={['woody', 'fresh']} />)
      
      expect(screen.getByText('woody')).toBeInTheDocument()
      expect(screen.getByText('fresh')).toBeInTheDocument()
    })

    it('should show clear filters button when callback provided', () => {
      const mockClear = vi.fn()
      render(<EmptyFilterState activeFilters={['oriental']} onClearFilters={mockClear} />)
      
      expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument()
    })

    it('should handle empty filters array', () => {
      render(<EmptyFilterState activeFilters={[]} />)
      
      expect(screen.getByText(/adjust your filters/i)).toBeInTheDocument()
    })

    it('should call onClearFilters when button clicked', () => {
      const mockClear = vi.fn()
      render(
        <EmptyFilterState 
          activeFilters={['spicy']} 
          onClearFilters={mockClear}
        />
      )
      
      const clearButton = screen.getByRole('button', { name: /clear filters/i })
      clearButton.click()
      
      expect(mockClear).toHaveBeenCalledTimes(1)
    })

    it('should call onClearFilters when button clicked', () => {
      const mockClear = vi.fn()
      render(
        <EmptyFilterState 
          activeFilters={['woody']} 
          onClearFilters={mockClear}
        />
      )
      
      expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument()
    })
  })

  describe('EmptyCollectionState', () => {
    it('should render for empty personal collection', () => {
      render(<EmptyCollectionState type="collection" />)
      
      expect(screen.getByText(/your collection is empty/i)).toBeInTheDocument()
    })

    it('should render for empty wishlist', () => {
      render(<EmptyCollectionState type="wishlist" />)
      
      expect(screen.getByText(/your wishlist is empty/i)).toBeInTheDocument()
    })

    it('should render for empty favorites', () => {
      render(<EmptyCollectionState type="favorites" />)
      
      expect(screen.getByRole('heading')).toHaveTextContent(/favorites/i)
    })
  })

  describe('LoadingState', () => {
    it('should render loading spinner', () => {
      render(<LoadingState />)
      
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should render with custom message', () => {
      const message = 'Loading your fragrances...'
      render(<LoadingState message={message} />)
      
      expect(screen.getByText(message)).toBeInTheDocument()
    })

    it('should have loading animation class', () => {
      const { container } = render(<LoadingState />)
      
      expect(container.querySelector('.loading-spinner')).toBeInTheDocument()
    })
  })

  describe('ErrorState', () => {
    it('should render error message', () => {
      const error = 'Failed to load fragrances'
      render(<ErrorState message={error} />)
      
      expect(screen.getByText(error)).toBeInTheDocument()
    })

    it('should show retry button when callback provided', () => {
      const mockRetry = vi.fn()
      render(<ErrorState message="Error" onRetry={mockRetry} />)
      
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })

    it('should call onRetry when retry button clicked', () => {
      const mockRetry = vi.fn()
      render(<ErrorState message="Error" onRetry={mockRetry} />)
      
      const retryButton = screen.getByRole('button', { name: /try again/i })
      retryButton.click()
      
      expect(mockRetry).toHaveBeenCalledTimes(1)
    })

    it('should show different messages by error type', () => {
      render(<ErrorState message="Network Error" type="network" />)
      
      expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument()
    })

    it('should have proper error styling', () => {
      const { container } = render(<ErrorState message="Error" />)
      
      expect(container.querySelector('.error')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<EmptySearchState query="test" />)
      
      const emptyState = screen.getByRole('region')
      expect(emptyState).toHaveAttribute('aria-live', 'polite')
      expect(emptyState).toHaveAttribute('aria-label', 'Empty state')
    })

    it('should have proper heading hierarchy', () => {
      render(<EmptyBrowseState />)
      
      expect(screen.getByRole('heading')).toBeInTheDocument()
    })

    it('should have proper icon accessibility', () => {
      render(<LoadingState />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toBeInTheDocument()
    })
  })
})
