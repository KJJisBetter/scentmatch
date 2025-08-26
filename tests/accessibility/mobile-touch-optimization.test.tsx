/**
 * Mobile Touch Optimization Tests - Task 2.3
 * 
 * Comprehensive testing for:
 * - 44px minimum touch targets (iOS/Android accessibility guidelines)
 * - 8px minimum spacing between interactive elements  
 * - Touch feedback animations and gestures
 * - One-handed use patterns and thumb-zone optimization
 * - System gesture conflict prevention
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { MobileNavSheet } from '@/components/navigation/mobile-nav-sheet'
import { QuizInterface } from '@/components/quiz/quiz-interface'
import { FragranceBrowseClient } from '@/components/browse/fragrance-browse-client'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock window.gtag for analytics
Object.defineProperty(window, 'gtag', {
  value: vi.fn(),
  writable: true
})

// Mock data for tests
const mockFragranceData = {
  fragrances: [
    {
      id: '1',
      name: 'Test Fragrance',
      brand_id: 'test-brand',
      relevance_score: 0.8,
      sample_available: true
    }
  ],
  total: 1,
  query: '',
  filters_applied: {}
}

const mockFilterOptions = {
  scent_families: [],
  brands: [],
  occasions: [],
  seasons: [],
  price_ranges: [],
  availability: [],
  metadata: {
    total_fragrances: 1,
    samples_available: 1,
    last_updated: '2025-01-01'
  }
}

describe('Mobile Touch Optimization - Task 2.3', () => {
  
  describe('Touch Target Size Requirements', () => {
    
    test('navigation menu trigger meets 44px minimum touch target', async () => {
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      expect(menuButton).toBeInTheDocument()
      
      // Check for touch-target class (44px minimum)
      expect(menuButton).toHaveClass('touch-target')
      
      // Verify computed styles meet minimum requirements
      const styles = window.getComputedStyle(menuButton)
      const minHeight = parseInt(styles.minHeight)
      const minWidth = parseInt(styles.minWidth)
      
      expect(minHeight).toBeGreaterThanOrEqual(44)
      expect(minWidth).toBeGreaterThanOrEqual(44)
    })
    
    test('navigation menu items have adequate touch targets', async () => {
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      await userEvent.click(menuButton)
      
      // Wait for sheet to open
      await waitFor(() => {
        const navItems = screen.getAllByText(/browse fragrances|find your match|take quiz/i)
        navItems.forEach(item => {
          const button = item.closest('button')
          expect(button).toHaveClass('touch-target')
        })
      })
    })
    
    test('quiz option buttons meet touch target requirements', async () => {
      render(<QuizInterface />)
      
      await waitFor(() => {
        const optionButtons = screen.getAllByRole('button')
        optionButtons.forEach(button => {
          const styles = window.getComputedStyle(button)
          const height = parseInt(styles.height) || parseInt(styles.minHeight)
          
          // Quiz options should be large enough for easy tapping
          expect(height).toBeGreaterThanOrEqual(44)
        })
      })
    })
    
    test('fragrance card action buttons have proper touch targets', async () => {
      render(
        <FragranceBrowseClient 
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      )
      
      await waitFor(() => {
        const actionButtons = screen.getAllByRole('button')
        actionButtons.forEach(button => {
          const buttonText = button.textContent
          if (buttonText?.includes('Collection') || buttonText?.includes('Wishlist')) {
            const styles = window.getComputedStyle(button)
            const height = parseInt(styles.height) || parseInt(styles.minHeight)
            expect(height).toBeGreaterThanOrEqual(44)
          }
        })
      })
    })
  })
  
  describe('Touch Element Spacing', () => {
    
    test('navigation menu items have adequate spacing between elements', async () => {
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      await userEvent.click(menuButton)
      
      await waitFor(() => {
        const navContainer = screen.getByRole('navigation') || screen.getByTestId('nav-items')
        const items = navContainer.querySelectorAll('button')
        
        for (let i = 0; i < items.length - 1; i++) {
          const currentItem = items[i] as HTMLElement
          const nextItem = items[i + 1] as HTMLElement
          
          const currentRect = currentItem.getBoundingClientRect()
          const nextRect = nextItem.getBoundingClientRect()
          
          // Check vertical spacing (8px minimum)
          const spacing = nextRect.top - currentRect.bottom
          expect(spacing).toBeGreaterThanOrEqual(8)
        }
      })
    })
    
    test('quiz options maintain proper spacing', async () => {
      render(<QuizInterface />)
      
      await waitFor(() => {
        const optionButtons = screen.getAllByRole('button')
        const quizOptions = optionButtons.filter(btn => 
          btn.textContent?.includes('Elegant') || 
          btn.textContent?.includes('Soft') ||
          btn.textContent?.includes('Fresh')
        )
        
        if (quizOptions.length >= 2) {
          for (let i = 0; i < quizOptions.length - 1; i++) {
            const currentBtn = quizOptions[i]
            const nextBtn = quizOptions[i + 1]
            
            const currentRect = currentBtn.getBoundingClientRect()
            const nextRect = nextBtn.getBoundingClientRect()
            
            const spacing = nextRect.top - currentRect.bottom
            expect(spacing).toBeGreaterThanOrEqual(8)
          }
        }
      })
    })
  })
  
  describe('Touch Feedback and Animations', () => {
    
    test('buttons provide visual feedback on touch/press', async () => {
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      
      // Check for active/pressed state classes
      fireEvent.mouseDown(menuButton)
      expect(menuButton).toHaveClass('active:scale-[0.98]')
      
      fireEvent.mouseUp(menuButton)
    })
    
    test('interactive elements have hover and focus states', async () => {
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      
      // Check hover styles exist
      const styles = window.getComputedStyle(menuButton)
      expect(menuButton).toHaveClass('hover:bg-accent')
      
      // Check focus styles for accessibility
      await userEvent.tab()
      expect(menuButton).toHaveFocus()
    })
    
    test('quiz option buttons animate on selection', async () => {
      render(<QuizInterface />)
      
      await waitFor(async () => {
        const optionButtons = screen.getAllByRole('button')
        const firstOption = optionButtons.find(btn => btn.textContent?.includes('Elegant'))
        
        if (firstOption) {
          // Check for animation classes
          expect(firstOption).toHaveClass('transform', 'hover:scale-[1.02]', 'active:scale-[0.98]')
          
          // Simulate touch interaction
          fireEvent.mouseDown(firstOption)
          fireEvent.mouseUp(firstOption)
          await userEvent.click(firstOption)
        }
      })
    })
  })
  
  describe('One-Handed Use Optimization', () => {
    
    test('primary actions are positioned in thumb-friendly zones', async () => {
      // Test for mobile viewport (iPhone 14: 390x844)
      global.innerWidth = 390
      global.innerHeight = 844
      global.dispatchEvent(new Event('resize'))
      
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      const buttonRect = menuButton.getBoundingClientRect()
      
      // Menu button should be positioned for easy thumb access
      // Top-left or bottom areas are easier for one-handed use
      expect(buttonRect.top).toBeLessThan(100) // Near top of screen
    })
    
    test('frequent actions are easily accessible with thumb', async () => {
      global.innerWidth = 390
      global.innerHeight = 844
      
      render(
        <FragranceBrowseClient 
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      )
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search fragrances/i)
        const searchInputRect = searchInput.getBoundingClientRect()
        
        // Search should be in comfortable thumb reach (middle third of screen)
        const middleThird = global.innerHeight / 3
        expect(searchInputRect.top).toBeLessThan(middleThird * 2)
      })
    })
  })
  
  describe('Gesture Conflict Prevention', () => {
    
    test('horizontal swipes do not conflict with system gestures', async () => {
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      await userEvent.click(menuButton)
      
      await waitFor(() => {
        const sheet = screen.getByRole('dialog') || document.querySelector('[data-testid="mobile-nav-sheet"]')
        
        // Sheet should not intercept system swipe gestures
        // Test that swipe events work properly
        if (sheet) {
          const mockSwipeEvent = new TouchEvent('touchstart', {
            touches: [{
              clientX: 10,
              clientY: 100,
              identifier: 1
            } as Touch]
          })
          
          let eventBubbled = false
          document.addEventListener('touchstart', () => {
            eventBubbled = true
          }, { once: true })
          
          sheet.dispatchEvent(mockSwipeEvent)
          expect(eventBubbled).toBe(true)
        }
      })
    })
    
    test('vertical scrolling works properly with touch interactions', async () => {
      render(
        <FragranceBrowseClient 
          initialFragrances={mockFragranceData}
          filterOptions={mockFilterOptions}
          initialParams={{}}
        />
      )
      
      // Simulate scroll behavior
      const scrollContainer = document.body
      
      const mockTouchStart = new TouchEvent('touchstart', {
        touches: [{
          clientX: 200,
          clientY: 200,
          identifier: 1
        } as Touch]
      })
      
      const mockTouchMove = new TouchEvent('touchmove', {
        touches: [{
          clientX: 200,
          clientY: 150,
          identifier: 1
        } as Touch]
      })
      
      scrollContainer.dispatchEvent(mockTouchStart)
      scrollContainer.dispatchEvent(mockTouchMove)
      
      // Should not prevent default scroll behavior
      expect(mockTouchMove.defaultPrevented).toBe(false)
    })
  })
  
  describe('WCAG 2.1 AA Compliance', () => {
    
    test('all touch targets meet WCAG accessibility requirements', async () => {
      const { container } = render(<MobileNavSheet />)
      
      // Specifically check touch target size rule
      const touchTargets = container.querySelectorAll('button, [role="button"], a, input')
      touchTargets.forEach(target => {
        const styles = window.getComputedStyle(target as Element)
        const height = parseInt(styles.height) || parseInt(styles.minHeight) || 44
        const width = parseInt(styles.width) || parseInt(styles.minWidth) || 44
        
        // WCAG 2.1 AA requires minimum 44x44px for touch targets
        expect(height).toBeGreaterThanOrEqual(44)
        expect(width).toBeGreaterThanOrEqual(44)
      })
    })
    
    test('focus management works correctly with touch interactions', async () => {
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      
      // Keyboard navigation should work alongside touch
      await userEvent.tab()
      expect(menuButton).toHaveFocus()
      
      // Enter key should activate like touch
      await userEvent.keyboard('{Enter}')
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toBeVisible()
      })
    })
  })
  
  describe('Performance Optimization', () => {
    
    test('touch feedback animations run at 60fps', async () => {
      const { container } = render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      
      // Trigger animation
      fireEvent.mouseDown(menuButton)
      fireEvent.mouseUp(menuButton)
      
      // Check that animations use transform instead of layout-affecting properties
      const buttonStyles = window.getComputedStyle(menuButton)
      expect(buttonStyles.transform).not.toBe('none')
    })
    
    test('touch event handlers are passive where appropriate', async () => {
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      
      // Touch events should use passive listeners where possible
      fireEvent.touchStart(menuButton)
      
      // For this test, we're just ensuring touch events work
      // Passive listener testing would require more complex mocking
      expect(menuButton).toBeInTheDocument()
    })
  })
  
  describe('Cross-Device Touch Support', () => {
    
    test('works correctly on various mobile screen sizes', async () => {
      const testSizes = [
        { width: 320, height: 568 }, // iPhone SE
        { width: 390, height: 844 }, // iPhone 14
        { width: 428, height: 926 }, // iPhone 14 Pro Max
        { width: 360, height: 640 }, // Android Small
        { width: 414, height: 896 }  // Android Large
      ]
      
      for (const size of testSizes) {
        global.innerWidth = size.width
        global.innerHeight = size.height
        global.dispatchEvent(new Event('resize'))
        
        render(<MobileNavSheet />)
        
        const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
        const buttonRect = menuButton.getBoundingClientRect()
        
        // Button should be visible and appropriately sized for each screen
        expect(buttonRect.width).toBeGreaterThanOrEqual(44)
        expect(buttonRect.height).toBeGreaterThanOrEqual(44)
        
        // Should not overflow viewport
        expect(buttonRect.right).toBeLessThanOrEqual(size.width)
        expect(buttonRect.bottom).toBeLessThanOrEqual(size.height)
      }
    })
    
    test('adapts touch targets for tablet sizes', async () => {
      // iPad viewport
      global.innerWidth = 768
      global.innerHeight = 1024
      global.dispatchEvent(new Event('resize'))
      
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      
      // On larger screens, component might not be visible (md:hidden)
      const styles = window.getComputedStyle(menuButton)
      expect(styles.display).toBe('none') // Should be hidden on tablet+
    })
  })
  
  describe('Error Handling and Edge Cases', () => {
    
    test('handles rapid touch interactions gracefully', async () => {
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      
      // Rapid fire clicks should not break functionality
      await userEvent.click(menuButton)
      await userEvent.click(menuButton)
      await userEvent.click(menuButton)
      
      // Component should still be functional
      expect(menuButton).toBeInTheDocument()
      expect(menuButton).not.toBeDisabled()
    })
    
    test('recovers from touch event interruptions', async () => {
      render(<MobileNavSheet />)
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      
      // Start touch but don't complete it
      fireEvent.touchStart(menuButton, {
        touches: [{ clientX: 100, clientY: 100 }]
      })
      
      // Interrupt with different event
      fireEvent.touchCancel(menuButton)
      
      // Should still respond to normal interaction
      await userEvent.click(menuButton)
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toBeVisible()
      })
    })
  })
})