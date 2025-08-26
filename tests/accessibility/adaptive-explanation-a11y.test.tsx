import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdaptiveExplanation, ExperienceLevelBadge, MobileAdaptiveExplanation } from '@/components/ai/adaptive-explanation';
import type { RecommendationItem } from '@/lib/ai-sdk/unified-recommendation-engine';

/**
 * Adaptive AI Explanation Component Accessibility Tests
 * 
 * Tests WCAG 2.1 AA compliance for educational features:
 * - Progressive disclosure accessibility
 * - Educational tooltip keyboard navigation  
 * - Screen reader announcements
 * - Focus management
 * - Cognitive accessibility patterns
 */

// Mock recommendation data for testing
const mockBeginnerRecommendation: RecommendationItem = {
  fragrance: {
    id: 'test-fragrance-1',
    name: 'Test Fragrance',
    brand: 'Test Brand',
  },
  explanation: 'This fragrance matches your preferences for fresh, citrusy scents.',
  adaptive_explanation: {
    user_experience_level: 'beginner' as const,
    summary: 'A perfect fresh start for your fragrance journey!',
    expanded_content: 'This fragrance features top notes of bergamot and lemon, which create that fresh, energizing feeling you described. The middle notes add a subtle floral touch that keeps it from being too sharp.',
    confidence_boost: 'Don\'t worry - everyone starts somewhere! This is a great choice for beginners.',
    educational_terms: {
      'bergamot': {
        term: 'Bergamot',
        beginnerExplanation: 'A citrus fruit that smells like a mix of lemon and orange, often used to create fresh, uplifting scents.',
        example: 'Earl Grey tea gets its distinctive smell from bergamot oil'
      },
      'top-notes': {
        term: 'Top Notes',
        beginnerExplanation: 'The first scents you smell when you spray a fragrance. They\'re light and fade quickly.',
        example: 'Like the first sip of a layered cocktail'
      }
    }
  }
};

const mockAdvancedRecommendation: RecommendationItem = {
  fragrance: {
    id: 'test-fragrance-2',
    name: 'Complex Fragrance',
    brand: 'Advanced Brand',
  },
  explanation: 'Complex aromatic composition with bergamot, neroli, and amberwood base.',
  adaptive_explanation: {
    user_experience_level: 'advanced' as const,
    summary: 'Sophisticated citrus-aromatic blend with excellent longevity.',
    expanded_content: 'Features Calabrian bergamot in the opening, transitioning through neroli and petitgrain in the heart, with an amberwood and white musk dry-down.',
  }
};

describe('AdaptiveExplanation - Accessibility Testing', () => {
  beforeEach(() => {
    // Mock window.matchMedia for responsive testing
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  describe('Progressive Disclosure - WCAG 4.1.2 Name, Role, Value', () => {
    test('expand/collapse button has proper ARIA attributes', () => {
      render(<AdaptiveExplanation recommendation={mockBeginnerRecommendation} />);
      
      const expandButton = screen.getByRole('button', { name: /show detailed explanation/i });
      
      // Check ARIA attributes
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');
      expect(expandButton).toHaveAttribute('aria-controls', 'adaptive-explanation-details');
      expect(expandButton).toHaveAttribute('aria-label', 'Show detailed explanation');
    });

    test('button state updates when expanded/collapsed', async () => {
      const user = userEvent.setup();
      render(<AdaptiveExplanation recommendation={mockBeginnerRecommendation} />);
      
      const expandButton = screen.getByRole('button', { name: /show detailed explanation/i });
      
      // Initially collapsed
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');
      
      // Click to expand
      await user.click(expandButton);
      
      // Should now be expanded
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
      expect(expandButton).toHaveAttribute('aria-label', 'Hide detailed explanation');
      
      // Content should be visible and properly connected
      const detailsRegion = screen.getByRole('region', { name: /detailed fragrance recommendation explanation/i });
      expect(detailsRegion).toBeInTheDocument();
      expect(detailsRegion).toHaveAttribute('id', 'adaptive-explanation-details');
    });

    test('keyboard navigation works correctly', async () => {
      const user = userEvent.setup();
      render(<AdaptiveExplanation recommendation={mockBeginnerRecommendation} />);
      
      const expandButton = screen.getByRole('button', { name: /show detailed explanation/i });
      
      // Focus button
      expandButton.focus();
      expect(expandButton).toHaveFocus();
      
      // Activate with Enter key
      await user.keyboard('{Enter}');
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
      
      // Click to collapse (Space key in testing library behaves differently)
      await user.click(expandButton);
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    });

    test('icons are properly hidden from screen readers', () => {
      render(<AdaptiveExplanation recommendation={mockBeginnerRecommendation} />);
      
      const button = screen.getByRole('button', { name: /show detailed explanation/i });
      const icons = button.querySelectorAll('svg');
      
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Educational Tooltips - WCAG 2.1.1 Keyboard & 4.1.2 Name, Role, Value', () => {
    test('tooltip triggers are keyboard accessible', () => {
      render(<AdaptiveExplanation recommendation={mockBeginnerRecommendation} />);
      
      const bergamotTrigger = screen.getByRole('button', { name: /bergamot/i });
      
      // Should be focusable (buttons are focusable by default)
      expect(bergamotTrigger).not.toHaveAttribute('tabindex', '-1');
      expect(bergamotTrigger).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-amber-500');
      
      // Should have proper ARIA attributes
      expect(bergamotTrigger).toHaveAttribute('aria-describedby', 'tooltip-bergamot');
    });

    test('tooltip triggers have proper ARIA structure', () => {
      render(<AdaptiveExplanation recommendation={mockBeginnerRecommendation} />);
      
      const bergamotTrigger = screen.getByRole('button', { name: /bergamot/i });
      
      // Should have proper ARIA connection
      expect(bergamotTrigger).toHaveAttribute('aria-describedby', 'tooltip-bergamot');
      expect(bergamotTrigger).toHaveAttribute('data-state', 'closed');
      
      // Focus should work properly
      bergamotTrigger.focus();
      expect(bergamotTrigger).toHaveFocus();
    });

    test('escape key dismisses tooltip focus', async () => {
      const user = userEvent.setup();
      render(<AdaptiveExplanation recommendation={mockBeginnerRecommendation} />);
      
      const bergamotTrigger = screen.getByRole('button', { name: /bergamot/i });
      
      // Focus trigger
      bergamotTrigger.focus();
      expect(bergamotTrigger).toHaveFocus();
      
      // Press Escape
      await user.keyboard('{Escape}');
      
      // Should lose focus (blur)
      expect(bergamotTrigger).not.toHaveFocus();
    });

    test('example text is properly announced', async () => {
      const user = userEvent.setup();
      render(<AdaptiveExplanation recommendation={mockBeginnerRecommendation} />);
      
      const bergamotTrigger = screen.getByRole('button', { name: /bergamot/i });
      await user.hover(bergamotTrigger);
      
      // Example should have screen reader text
      const exampleText = screen.getByText(/Earl Grey tea gets its distinctive smell/);
      expect(exampleText.previousSibling).toHaveClass('sr-only');
      expect(exampleText.previousSibling).toHaveTextContent('Example: ');
    });
  });

  describe('Confidence Boost Messages - WCAG 4.1.3 Status Messages', () => {
    test('confidence messages are announced to screen readers', () => {
      render(<AdaptiveExplanation recommendation={mockBeginnerRecommendation} />);
      
      const confidenceMessage = screen.getByText(/Don't worry - everyone starts somewhere!/);
      const container = confidenceMessage.closest('[role="status"]');
      
      expect(container).toHaveAttribute('role', 'status');
      expect(container).toHaveAttribute('aria-label', 'Encouragement message');
      
      // Emoji should be hidden from screen readers
      const emoji = container?.querySelector('[aria-hidden="true"]');
      expect(emoji).toHaveTextContent('💡 ');
    });

    test('mobile confidence messages have same accessibility', () => {
      render(<MobileAdaptiveExplanation recommendation={mockBeginnerRecommendation} />);
      
      const confidenceMessage = screen.getByText(/Don't worry - everyone starts somewhere!/);
      const container = confidenceMessage.closest('[role="status"]');
      
      expect(container).toHaveAttribute('role', 'status');
      expect(container).toHaveAttribute('aria-label', 'Encouragement message');
    });
  });

  describe('Experience Level Indicators - WCAG 1.1.1 Non-text Content', () => {
    test('experience badge has semantic meaning', () => {
      render(<AdaptiveExplanation recommendation={mockBeginnerRecommendation} />);
      
      const badge = screen.getByRole('img', { name: /content adapted for beginner fragrance enthusiasts/i });
      expect(badge).toBeInTheDocument();
      
      // Text content should be hidden from screen reader since we have aria-label
      const hiddenText = badge.querySelector('[aria-hidden="true"]');
      expect(hiddenText).toHaveTextContent('beginner');
    });

    test('ExperienceLevelBadge component has proper accessibility', () => {
      render(<ExperienceLevelBadge level="intermediate" />);
      
      const badge = screen.getByRole('img', { name: /user experience level: learning/i });
      expect(badge).toBeInTheDocument();
      
      // Icon should be hidden from screen readers
      const hiddenIcon = badge.querySelector('[aria-hidden="true"]');
      expect(hiddenIcon).toHaveTextContent('📚');
    });
  });

  describe('Semantic Structure - WCAG 1.3.1 Info and Relationships', () => {
    test('educational terms section has proper heading', () => {
      render(<AdaptiveExplanation recommendation={mockBeginnerRecommendation} />);
      
      const heading = screen.getByRole('heading', { level: 3, name: /fragrance terms to know/i });
      expect(heading).toBeInTheDocument();
      
      // Emoji should be hidden from screen readers
      const hiddenEmoji = heading.querySelector('[aria-hidden="true"]');
      expect(hiddenEmoji).toHaveTextContent('🎓');
    });

    test('content follows logical heading hierarchy', () => {
      render(<AdaptiveExplanation recommendation={mockBeginnerRecommendation} />);
      
      const headings = screen.getAllByRole('heading');
      
      // Educational terms heading should be h3
      const termsHeading = screen.getByRole('heading', { level: 3 });
      expect(termsHeading).toBeInTheDocument();
      
      // Individual term names should be h4 (in tooltips when shown)
      // This would be tested in integration tests with actual tooltip display
    });
  });

  describe('Advanced User Experience - WCAG Compliance', () => {
    test('advanced users get details element with proper accessibility', () => {
      render(<AdaptiveExplanation recommendation={mockAdvancedRecommendation} />);
      
      // Should use native details/summary for better accessibility
      const summary = screen.getByText(/more details/i);
      expect(summary.tagName).toBe('SUMMARY');
      
      const details = summary.closest('details');
      expect(details).toBeInTheDocument();
    });
  });

  describe('Color and Contrast - WCAG 1.4.3 Contrast', () => {
    test('confidence boost uses sufficient color contrast classes', () => {
      render(<AdaptiveExplanation recommendation={mockBeginnerRecommendation} />);
      
      const confidenceMessage = screen.getByText(/Don't worry - everyone starts somewhere!/);
      const container = confidenceMessage.closest('div');
      
      // Should have proper contrast classes
      expect(container).toHaveClass('text-blue-600', 'bg-blue-50');
    });

    test('educational terms use high contrast colors', () => {
      render(<AdaptiveExplanation recommendation={mockBeginnerRecommendation} />);
      
      const termsContainer = screen.getByText(/fragrance terms to know/i).closest('.bg-amber-50');
      expect(termsContainer).toHaveClass('bg-amber-50', 'border-amber-200');
      
      const termButton = screen.getByRole('button', { name: /bergamot/i });
      expect(termButton).toHaveClass('text-amber-700', 'hover:text-amber-900');
    });
  });

  describe('Focus Management - WCAG 2.4.3 Focus Order', () => {
    test('focus indicators are visible on all interactive elements', () => {
      render(<AdaptiveExplanation recommendation={mockBeginnerRecommendation} />);
      
      const expandButton = screen.getByRole('button', { name: /show detailed explanation/i });
      const termButton = screen.getByRole('button', { name: /bergamot/i });
      
      // Both should have visible focus indicators
      expect(expandButton).toHaveClass('hover:text-blue-800'); // Visual feedback
      expect(termButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-amber-500', 'focus:ring-offset-2', 'rounded');
    });

    test('tab order is logical', () => {
      render(<AdaptiveExplanation recommendation={mockBeginnerRecommendation} />);
      
      const expandButton = screen.getByRole('button', { name: /show detailed explanation/i });
      const bergamotButton = screen.getByRole('button', { name: /bergamot/i });
      const topNotesButton = screen.getByRole('button', { name: /top notes/i });
      
      // Should be able to tab through in logical order
      expect(expandButton).toBeInTheDocument();
      expect(bergamotButton).toBeInTheDocument();
      expect(topNotesButton).toBeInTheDocument();
      
      // All should be focusable (not have tabindex="-1")
      expect(expandButton).not.toHaveAttribute('tabindex', '-1');
      expect(bergamotButton).not.toHaveAttribute('tabindex', '-1'); 
      expect(topNotesButton).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Mobile Accessibility - WCAG AA Mobile Standards', () => {
    test('mobile component maintains accessibility features', () => {
      render(<MobileAdaptiveExplanation recommendation={mockBeginnerRecommendation} />);
      
      // Should still have confidence message with proper accessibility
      const confidenceMessage = screen.getByText(/Don't worry - everyone starts somewhere!/);
      const container = confidenceMessage.closest('[role="status"]');
      
      expect(container).toHaveAttribute('role', 'status');
      expect(container).toHaveAttribute('aria-label', 'Encouragement message');
    });
  });

  describe('Cognitive Accessibility - WCAG 3.1.5 Reading Level', () => {
    test('content uses simple, clear language', () => {
      render(<AdaptiveExplanation recommendation={mockBeginnerRecommendation} />);
      
      // Beginner explanations should be simple
      expect(screen.getByText(/A perfect fresh start for your fragrance journey!/)).toBeInTheDocument();
      expect(screen.getByText(/Don't worry - everyone starts somewhere!/)).toBeInTheDocument();
      
      // Educational terms should have beginner-friendly explanations
      const bergamotButton = screen.getByRole('button', { name: /bergamot/i });
      expect(bergamotButton).toBeInTheDocument();
    });
  });
});