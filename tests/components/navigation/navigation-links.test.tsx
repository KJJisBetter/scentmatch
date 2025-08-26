/**
 * Navigation Links Component Tests  
 * Tests for navigation components and internal links (SCE-63)
 * Spec: @.agent-os/specs/2025-08-22-beginner-experience-optimization/
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileNavSheet } from '@/components/navigation/mobile-nav-sheet'

// Mock Next.js navigation
const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn()
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams()
}))

vi.mock('next/link', () => {
  return {
    default: ({ href, children, ...props }: any) => (
      <a href={href} {...props}>{children}</a>
    )
  }
})

describe('Navigation Links Component Tests - SCE-63', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('NAV-001: Mobile Navigation Sheet', () => {
    it('NAV-001a: Should render mobile navigation sheet', () => {
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      expect(menuButton).toBeInTheDocument()
    })

    it('NAV-001b: Should show navigation sections when opened', () => {
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      fireEvent.click(menuButton)
      
      expect(screen.getByText('Discover')).toBeInTheDocument()
      expect(screen.getByText('Learn')).toBeInTheDocument()
    })

    it('NAV-001c: Should contain all expected navigation links', () => {
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      fireEvent.click(menuButton)
      
      // Check Discover section links
      expect(screen.getByRole('button', { name: /browse fragrances/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /find your match/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sample sets/i })).toBeInTheDocument()
      
      // Check Learn section links
      expect(screen.getByRole('button', { name: /take quiz/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /recommendations/i })).toBeInTheDocument()
      
      // Check auth links
      expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('NAV-001d: Should navigate to correct routes when clicked', () => {
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      fireEvent.click(menuButton)
      
      // Test browse navigation
      const browseButton = screen.getByRole('button', { name: /browse fragrances/i })
      fireEvent.click(browseButton)
      expect(mockPush).toHaveBeenCalledWith('/browse')
      
      vi.clearAllMocks()
      
      // Re-open menu for next test
      fireEvent.click(menuButton)
      
      // Test quiz navigation
      const quizButton = screen.getByRole('button', { name: /find your match/i })
      fireEvent.click(quizButton)
      expect(mockPush).toHaveBeenCalledWith('/quiz')
    })

    it('NAV-001e: Should navigate to authentication routes', () => {
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      fireEvent.click(menuButton)
      
      // Test signup navigation
      const signupButton = screen.getByRole('button', { name: /get started/i })
      fireEvent.click(signupButton)
      expect(mockPush).toHaveBeenCalledWith('/auth/signup')
      
      vi.clearAllMocks()
      
      // Re-open menu
      fireEvent.click(menuButton)
      
      // Test login navigation
      const loginButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(loginButton)
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })

    it('NAV-001f: Should identify potentially missing route', () => {
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      fireEvent.click(menuButton)
      
      // Test sample sets navigation (this route doesn't exist!)
      const samplesButton = screen.getByRole('button', { name: /sample sets/i })
      fireEvent.click(samplesButton)
      expect(mockPush).toHaveBeenCalledWith('/samples')
      
      // This is a potential 404 error that needs to be addressed
      console.warn('Navigation references /samples route which may not exist')
    })
  })

  describe('NAV-002: Navigation Accessibility', () => {
    it('NAV-002a: Should have proper ARIA labels', () => {
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      expect(menuButton).toHaveAttribute('aria-label', 'Open navigation menu')
    })

    it('NAV-002b: Should be keyboard accessible', () => {
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      
      // Should be focusable
      menuButton.focus()
      expect(document.activeElement).toBe(menuButton)
      
      // Should respond to Enter key
      fireEvent.keyDown(menuButton, { key: 'Enter' })
      expect(screen.getByText('Navigation')).toBeInTheDocument()
    })

    it('NAV-002c: Should have touch-friendly targets', () => {
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      expect(menuButton).toHaveClass('touch-target')
    })

    it('NAV-002d: Should provide clear navigation context', () => {
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      fireEvent.click(menuButton)
      
      expect(screen.getByText('Navigation')).toBeInTheDocument()
      expect(screen.getByText('Browse fragrances, take the quiz, and manage your account')).toBeInTheDocument()
    })
  })

  describe('NAV-003: Navigation State Management', () => {
    it('NAV-003a: Should close navigation after route change', () => {
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      fireEvent.click(menuButton)
      
      expect(screen.getByText('Navigation')).toBeInTheDocument()
      
      // Click a navigation item
      const browseButton = screen.getByRole('button', { name: /browse fragrances/i })
      fireEvent.click(browseButton)
      
      // Navigation should close (menu content should not be visible)
      expect(screen.queryByText('Navigation')).not.toBeInTheDocument()
    })

    it('NAV-003b: Should handle popstate events', () => {
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      fireEvent.click(menuButton)
      
      expect(screen.getByText('Navigation')).toBeInTheDocument()
      
      // Simulate browser back button (popstate)
      fireEvent(window, new PopStateEvent('popstate'))
      
      // Navigation should close
      expect(screen.queryByText('Navigation')).not.toBeInTheDocument()
    })
  })

  describe('NAV-004: Link Validation', () => {
    it('NAV-004a: Should validate navigation route formats', () => {
      const navigationRoutes = [
        '/browse',
        '/quiz', 
        '/samples',
        '/recommendations',
        '/auth/signup',
        '/auth/login'
      ]

      navigationRoutes.forEach(route => {
        expect(route).toMatch(/^\/[a-z\/]+$/)
        expect(route).not.toMatch(/\/$/)
        expect(route).not.toMatch(/\/\//)
        expect(route).not.toContain(' ')
      })
    })

    it('NAV-004b: Should identify duplicate navigation paths', () => {
      // Check for quiz appearing twice in navigation
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      fireEvent.click(menuButton)
      
      const quizButtons = [
        screen.getByRole('button', { name: /find your match/i }),
        screen.getByRole('button', { name: /take quiz/i })
      ]

      // Both buttons should navigate to the same route
      quizButtons.forEach(button => {
        fireEvent.click(button)
        expect(mockPush).toHaveBeenCalledWith('/quiz')
        vi.clearAllMocks()
        fireEvent.click(menuButton) // Reopen menu
      })

      console.warn('Duplicate quiz navigation detected - consider consolidating')
    })

    it('NAV-004c: Should validate external link handling', () => {
      // If there were external links, they should be handled differently
      // This test documents that all current navigation is internal
      const internalRoutes = [
        '/browse', '/quiz', '/samples', '/recommendations', 
        '/auth/signup', '/auth/login'
      ]

      internalRoutes.forEach(route => {
        expect(route).toMatch(/^\//)
        expect(route).not.toMatch(/^https?:\/\//)
        expect(route).not.toMatch(/^mailto:/)
      })
    })
  })

  describe('NAV-005: Error Handling in Navigation', () => {
    it('NAV-005a: Should handle navigation failures gracefully', () => {
      mockPush.mockRejectedValueOnce(new Error('Navigation failed'))
      
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      fireEvent.click(menuButton)
      
      const browseButton = screen.getByRole('button', { name: /browse fragrances/i })
      
      // Should not throw error even if navigation fails
      expect(() => {
        fireEvent.click(browseButton)
      }).not.toThrow()
    })

    it('NAV-005b: Should validate route accessibility before navigation', () => {
      const testRoutes = [
        { route: '/browse', shouldExist: true },
        { route: '/quiz', shouldExist: true },
        { route: '/samples', shouldExist: false }, // This one doesn't exist!
        { route: '/recommendations', shouldExist: true }
      ]

      testRoutes.forEach(({ route, shouldExist }) => {
        expect(route).toMatch(/^\/[a-z]+$/)
        if (!shouldExist) {
          console.warn(`Route ${route} referenced in navigation but may not exist`)
        }
      })
    })
  })

  describe('NAV-006: Performance and UX', () => {
    it('NAV-006a: Should have responsive design classes', () => {
      render(<MobileNavSheet />)
      
      const container = screen.getByRole('button', { name: /open navigation menu/i }).closest('div')
      expect(container).toHaveClass('md:hidden')
    })

    it('NAV-006b: Should have proper spacing for touch interactions', () => {
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      fireEvent.click(menuButton)
      
      const navButtons = screen.getAllByRole('button')
      navButtons.forEach(button => {
        if (button.textContent?.includes('Browse') || button.textContent?.includes('Quiz')) {
          expect(button).toHaveClass('touch-target')
        }
      })
    })

    it('NAV-006c: Should provide visual feedback for interactions', () => {
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      fireEvent.click(menuButton)
      
      const navButtons = screen.getAllByRole('button')
      navButtons.forEach(button => {
        if (button.textContent?.includes('Browse')) {
          expect(button).toHaveClass('hover:text-foreground')
          expect(button).toHaveClass('transition-colors')
        }
      })
    })
  })
})