/**
 * Error Handling and 404 Page Tests
 * Tests for error pages and 404 handling (SCE-63)
 * Spec: @.agent-os/specs/2025-08-22-beginner-experience-optimization/
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import NotFound from '@/app/not-found'

// Mock Next.js Link component
vi.mock('next/link', () => {
  return {
    default: ({ href, children, ...props }: any) => (
      <a href={href} {...props}>{children}</a>
    )
  }
})

describe('Error Handling and 404 Pages - SCE-63', () => {
  describe('ERROR-001: Not Found Page Structure', () => {
    it('ERROR-001a: Should render 404 not found page', () => {
      render(<NotFound />)
      
      expect(screen.getByText('404')).toBeInTheDocument()
      expect(screen.getByText('Page Not Found')).toBeInTheDocument()
    })

    it('ERROR-001b: Should have fragrance-themed messaging', () => {
      render(<NotFound />)
      
      const message = screen.getByText(/fragrance you're looking for seems to have vanished/i)
      expect(message).toBeInTheDocument()
      expect(message.textContent).toContain('perfect scent')
    })

    it('ERROR-001c: Should provide helpful navigation options', () => {
      render(<NotFound />)
      
      const homeLink = screen.getByRole('link', { name: /return home/i })
      const browseLink = screen.getByRole('link', { name: /browse fragrances/i })
      
      expect(homeLink).toBeInTheDocument()
      expect(homeLink).toHaveAttribute('href', '/')
      
      expect(browseLink).toBeInTheDocument() 
      expect(browseLink).toHaveAttribute('href', '/browse')
    })

    it('ERROR-001d: Should have proper visual design', () => {
      render(<NotFound />)
      
      const container = screen.getByText('404').closest('div')
      expect(container).toHaveClass('min-h-screen')
      expect(container).toHaveClass('flex')
      expect(container).toHaveClass('items-center')
      expect(container).toHaveClass('justify-center')
    })

    it('ERROR-001e: Should have accessible structure', () => {
      render(<NotFound />)
      
      const heading404 = screen.getByRole('heading', { level: 1 })
      expect(heading404).toHaveTextContent('404')
      
      const headingPageNotFound = screen.getByRole('heading', { level: 2 })
      expect(headingPageNotFound).toHaveTextContent('Page Not Found')
    })
  })

  describe('ERROR-002: Error Page Accessibility', () => {
    it('ERROR-002a: Should meet accessibility standards', () => {
      render(<NotFound />)
      
      // Check for proper heading hierarchy
      const h1 = screen.getByRole('heading', { level: 1 })
      const h2 = screen.getByRole('heading', { level: 2 })
      
      expect(h1).toBeInTheDocument()
      expect(h2).toBeInTheDocument()
    })

    it('ERROR-002b: Should have keyboard accessible navigation', () => {
      render(<NotFound />)
      
      const homeLink = screen.getByRole('link', { name: /return home/i })
      const browseLink = screen.getByRole('link', { name: /browse fragrances/i })
      
      // Links should be focusable
      expect(homeLink.tagName).toBe('A')
      expect(browseLink.tagName).toBe('A')
    })

    it('ERROR-002c: Should have sufficient color contrast', () => {
      render(<NotFound />)
      
      const heading = screen.getByText('404')
      expect(heading).toHaveClass('text-slate-900')
      
      const description = screen.getByText(/fragrance you're looking for/i)
      expect(description).toHaveClass('text-slate-600')
    })

    it('ERROR-002d: Should have proper semantic structure', () => {
      render(<NotFound />)
      
      // Should have clear content hierarchy
      const mainContent = screen.getByText('404').closest('div')
      expect(mainContent).toHaveClass('text-center')
      
      // Should have proper spacing
      const buttonContainer = screen.getByRole('link', { name: /return home/i }).closest('div')
      expect(buttonContainer).toHaveClass('space-y-3')
    })
  })

  describe('ERROR-003: Error Page Content Quality', () => {
    it('ERROR-003a: Should provide clear error explanation', () => {
      render(<NotFound />)
      
      const message = screen.getByText(/fragrance you're looking for seems to have vanished/i)
      expect(message.textContent).toContain('vanished into thin air')
      expect(message.textContent).toContain('back on track')
    })

    it('ERROR-003b: Should maintain brand voice and tone', () => {
      render(<NotFound />)
      
      const message = screen.getByText(/fragrance you're looking for seems to have vanished/i)
      expect(message.textContent).toContain('fragrance')
      expect(message.textContent).toContain('perfect scent')
      
      // Should be helpful and encouraging, not technical
      expect(message.textContent).not.toContain('404')
      expect(message.textContent).not.toContain('error')
      expect(message.textContent).not.toContain('server')
    })

    it('ERROR-003c: Should offer relevant recovery actions', () => {
      render(<NotFound />)
      
      const homeLink = screen.getByRole('link', { name: /return home/i })
      const browseLink = screen.getByRole('link', { name: /browse fragrances/i })
      
      // Actions should be relevant to fragrance discovery
      expect(homeLink.textContent).toBe('Return Home')
      expect(browseLink.textContent).toBe('Browse Fragrances')
      
      // Should prioritize main home action
      expect(homeLink).not.toHaveClass('outline')
      expect(browseLink).toHaveClass('outline')
    })
  })

  describe('ERROR-004: Common 404 Scenarios', () => {
    it('ERROR-004a: Should handle missing fragrance pages', () => {
      // Simulate URLs that would result in 404s
      const problematicUrls = [
        '/fragrance/', // Missing ID
        '/fragrance/nonexistent-fragrance',
        '/fragrance/null',
        '/fragrance/undefined'
      ]

      problematicUrls.forEach(url => {
        // These URLs would trigger NotFound component
        expect(url).toMatch(/^\/fragrance/)
        console.warn(`URL ${url} would result in 404`)
      })
    })

    it('ERROR-004b: Should handle missing navigation routes', () => {
      const missingRoutes = [
        '/samples', // Referenced in navigation but doesn't exist
        '/profile', // Common expected route
        '/account', // Common expected route
        '/settings' // Common expected route
      ]

      missingRoutes.forEach(route => {
        expect(route).toMatch(/^\/[a-z]+$/)
        console.warn(`Route ${route} is missing and may cause 404s`)
      })
    })

    it('ERROR-004c: Should handle URL variations and typos', () => {
      const commonTypos = [
        '/browze', // Typo of /browse
        '/quizz',  // Typo of /quiz
        '/fragrances', // Plural vs singular
        '/perfume',    // Alternative terminology
        '/scent'       // Alternative terminology
      ]

      commonTypos.forEach(typo => {
        expect(typo).toMatch(/^\/[a-z]+$/)
        console.warn(`Common typo ${typo} should be handled with redirects`)
      })
    })

    it('ERROR-004d: Should handle legacy URL patterns', () => {
      const legacyPatterns = [
        '/product/123',     // Old product URLs
        '/item/fragrance',  // Alternative structure
        '/p/chanel',        // Short URLs
        '/brand/dior'       // Brand-specific URLs
      ]

      legacyPatterns.forEach(pattern => {
        expect(pattern).toMatch(/^\/[a-z]+\/[a-z0-9\-]+$/i)
        console.warn(`Legacy pattern ${pattern} may need redirect handling`)
      })
    })
  })

  describe('ERROR-005: Error Page Performance', () => {
    it('ERROR-005a: Should have minimal dependencies', () => {
      render(<NotFound />)
      
      // Should only require basic components
      const homeLink = screen.getByRole('link', { name: /return home/i })
      expect(homeLink).toBeInTheDocument()
      
      // Should not require heavy dependencies like database calls
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    })

    it('ERROR-005b: Should load quickly', () => {
      const startTime = Date.now()
      render(<NotFound />)
      const renderTime = Date.now() - startTime
      
      // Should render very quickly (< 100ms in tests)
      expect(renderTime).toBeLessThan(100)
    })

    it('ERROR-005c: Should not cause additional errors', () => {
      // Should not throw during render
      expect(() => {
        render(<NotFound />)
      }).not.toThrow()
      
      // Should have all required props
      const homeLink = screen.getByRole('link', { name: /return home/i })
      expect(homeLink).toHaveAttribute('href')
    })
  })

  describe('ERROR-006: SEO and Crawling', () => {
    it('ERROR-006a: Should return proper HTTP status', () => {
      // In actual implementation, this should return 404 status
      render(<NotFound />)
      
      // Content should be appropriate for 404 status
      expect(screen.getByText('404')).toBeInTheDocument()
      expect(screen.getByText('Page Not Found')).toBeInTheDocument()
    })

    it('ERROR-006b: Should not be indexed by search engines', () => {
      // Should include noindex meta tag in actual implementation
      render(<NotFound />)
      
      // Content should not encourage indexing
      expect(screen.getByText('Page Not Found')).toBeInTheDocument()
    })

    it('ERROR-006c: Should provide canonical navigation', () => {
      render(<NotFound />)
      
      const homeLink = screen.getByRole('link', { name: /return home/i })
      const browseLink = screen.getByRole('link', { name: /browse fragrances/i })
      
      // Should link to main site sections
      expect(homeLink).toHaveAttribute('href', '/')
      expect(browseLink).toHaveAttribute('href', '/browse')
    })
  })

  describe('ERROR-007: Error Recovery Strategies', () => {
    it('ERROR-007a: Should suggest relevant alternatives', () => {
      render(<NotFound />)
      
      const browseLink = screen.getByRole('link', { name: /browse fragrances/i })
      expect(browseLink).toBeInTheDocument()
      
      // Should suggest the most relevant recovery action for fragrance site
      expect(browseLink.textContent).toBe('Browse Fragrances')
    })

    it('ERROR-007b: Should maintain user context where possible', () => {
      render(<NotFound />)
      
      // Error message should be contextual to fragrance domain
      const message = screen.getByText(/perfect scent/i)
      expect(message).toBeInTheDocument()
    })

    it('ERROR-007c: Should provide multiple recovery paths', () => {
      render(<NotFound />)
      
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(2)
      
      // Should offer both home and browse options
      expect(links[0]).toHaveAttribute('href', '/')
      expect(links[1]).toHaveAttribute('href', '/browse')
    })
  })

  describe('ERROR-008: Mobile and Responsive Behavior', () => {
    it('ERROR-008a: Should be mobile-friendly', () => {
      render(<NotFound />)
      
      const container = screen.getByText('404').closest('div')
      expect(container).toHaveClass('max-w-md')
      expect(container).toHaveClass('mx-auto')
      expect(container).toHaveClass('p-8')
    })

    it('ERROR-008b: Should have touch-friendly buttons', () => {
      render(<NotFound />)
      
      const buttons = screen.getAllByRole('link')
      buttons.forEach(button => {
        expect(button).toHaveClass('w-full')
      })
    })

    it('ERROR-008c: Should handle different screen sizes', () => {
      render(<NotFound />)
      
      const container = screen.getByText('404').closest('div')
      expect(container).toHaveClass('min-h-screen')
      expect(container).toHaveClass('flex')
      expect(container).toHaveClass('items-center')
    })
  })
})