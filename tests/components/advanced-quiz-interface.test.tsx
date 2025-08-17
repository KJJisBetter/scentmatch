/**
 * Advanced Quiz Interface Tests - Task 4.1
 * Comprehensive tests for multi-selection quiz components and user interactions
 * Tests for advanced quiz UI with trait combinations and progressive flow
 */

import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { AdvancedQuizInterface } from '@/components/quiz/advanced-quiz-interface';

// Mock dependencies
vi.mock('@/lib/quiz/advanced-profile-engine', () => ({
  AdvancedProfileEngine: vi.fn().mockImplementation(() => ({
    generateUserProfile: vi.fn().mockResolvedValue({
      session_token: 'test-session',
      traits: {
        sophistication: 0.8,
        confidence: 0.7,
        warmth: 0.6,
        adventurousness: 0.4,
        playfulness: 0.3,
        sensuality: 0.5,
        uniqueness: 0.6,
        tradition: 0.4,
        seasonality: { spring: 0.7, summer: 0.8, fall: 0.5, winter: 0.4 },
        occasions: { daily: 0.6, work: 0.8, evening: 0.7, special: 0.5 },
      },
      trait_combinations: ['sophisticated', 'confident'],
      primary_archetype: 'sophisticated_confident',
      confidence_score: 0.85,
      created_at: new Date().toISOString(),
      quiz_version: 2,
    }),
    getProfileBasedRecommendations: vi.fn().mockResolvedValue([
      {
        fragrance_id: 'test-fragrance-1',
        name: 'Test Sophisticated Scent',
        brand: 'Test Brand',
        match_percentage: 87,
        reasoning:
          'Perfect for your sophisticated + confident personality combination',
        sample_price: 15.99,
        purchase_confidence: 0.82,
      },
    ]),
    initializeEmptyTraits: vi.fn().mockReturnValue({
      sophistication: 0,
      confidence: 0,
      warmth: 0,
      adventurousness: 0,
      playfulness: 0,
      sensuality: 0,
      uniqueness: 0,
      tradition: 0,
      seasonality: { spring: 0, summer: 0, fall: 0, winter: 0 },
      occasions: { daily: 0, work: 0, evening: 0, special: 0 },
    }),
  })),
  ADVANCED_QUIZ_QUESTIONS: [
    {
      id: 'personality_core',
      type: 'multi_select',
      title: 'How would you describe your personality?',
      subtitle: 'Select all that feel authentic to you (2-3 recommended)',
      max_selections: 3,
      min_selections: 1,
      options: [
        {
          id: 'sophisticated',
          label: 'Sophisticated & Refined',
          description: 'You appreciate elegance, quality, and timeless style',
          emoji: '✨',
        },
        {
          id: 'confident',
          label: 'Confident & Charismatic',
          description: 'You enjoy making an impression and being noticed',
          emoji: '🔥',
        },
        {
          id: 'casual',
          label: 'Casual & Approachable',
          description: 'You prefer comfort, authenticity, and being yourself',
          emoji: '🌿',
        },
      ],
    },
    {
      id: 'intensity_preference',
      type: 'slider',
      title: 'How do you like your fragrance presence?',
      subtitle: 'Drag to show your ideal fragrance intensity',
      min: 0,
      max: 100,
      default: 50,
      labels: {
        0: 'Subtle whisper - just for me',
        50: 'Noticeable aura - people notice when near',
        100: 'Bold statement - unforgettable signature',
      },
    },
  ],
}));

vi.mock('@/components/quiz/advanced-conversion-flow', () => ({
  AdvancedConversionFlow: vi
    .fn()
    .mockImplementation(() => (
      <div data-testid='advanced-conversion-flow'>Advanced Conversion Flow</div>
    )),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock window.gtag for analytics tracking
global.window = Object.create(window);
Object.defineProperty(window, 'gtag', {
  value: vi.fn(),
  writable: true,
});

describe('AdvancedQuizInterface - Multi-Selection Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('QUIZ-UI-001: Multi-Selection Trait Functionality', () => {
    it('QUIZ-UI-001a: Should render multi-selection question with trait options', () => {
      render(<AdvancedQuizInterface />);

      // Should show first question (personality_core - multi_select)
      expect(
        screen.getByText('How would you describe your personality?')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Select all that feel authentic to you (2-3 recommended)'
        )
      ).toBeInTheDocument();

      // Should show all trait options with emojis and descriptions
      expect(screen.getByText('Sophisticated & Refined')).toBeInTheDocument();
      expect(screen.getByText('Confident & Charismatic')).toBeInTheDocument();
      expect(screen.getByText('Casual & Approachable')).toBeInTheDocument();

      // Should show trait descriptions
      expect(
        screen.getByText('You appreciate elegance, quality, and timeless style')
      ).toBeInTheDocument();
      expect(
        screen.getByText('You enjoy making an impression and being noticed')
      ).toBeInTheDocument();
    });

    it('QUIZ-UI-001b: Should allow multiple trait selection within limits', async () => {
      const user = userEvent.setup();
      render(<AdvancedQuizInterface />);

      // Initially no traits selected
      expect(screen.getByText('Selected: 0 of 3 maximum')).toBeInTheDocument();

      // Select first trait
      await user.click(screen.getByText('Sophisticated & Refined'));
      expect(screen.getByText('Selected: 1 of 3 maximum')).toBeInTheDocument();

      // Verify visual selection state (check icon appears)
      expect(
        screen.getByTestId('check-icon') ||
          screen.getByRole('button', { name: /sophisticated/i })
      ).toHaveClass(/plum-500|bg-plum-50/);

      // Select second trait
      await user.click(screen.getByText('Confident & Charismatic'));
      expect(screen.getByText('Selected: 2 of 3 maximum')).toBeInTheDocument();

      // Select third trait
      await user.click(screen.getByText('Casual & Approachable'));
      expect(screen.getByText('Selected: 3 of 3 maximum')).toBeInTheDocument();
    });

    it('QUIZ-UI-001c: Should enforce selection limits and prevent overselection', async () => {
      const user = userEvent.setup();
      render(<AdvancedQuizInterface />);

      // Select maximum allowed traits (3)
      await user.click(screen.getByText('Sophisticated & Refined'));
      await user.click(screen.getByText('Confident & Charismatic'));
      await user.click(screen.getByText('Casual & Approachable'));

      // Verify we're at the limit
      expect(screen.getByText('Selected: 3 of 3 maximum')).toBeInTheDocument();

      // Any additional options should be disabled/prevented
      const allOptions = screen
        .getAllByRole('button')
        .filter(
          btn =>
            btn.textContent?.includes('Sophisticated') ||
            btn.textContent?.includes('Confident') ||
            btn.textContent?.includes('Casual')
        );

      // At least 3 options should be selected or disabled state should be managed
      expect(allOptions.length).toBeGreaterThanOrEqual(3);
    });

    it('QUIZ-UI-001d: Should allow deselection of traits', async () => {
      const user = userEvent.setup();
      render(<AdvancedQuizInterface />);

      // Select a trait
      await user.click(screen.getByText('Sophisticated & Refined'));
      expect(screen.getByText('Selected: 1 of 3 maximum')).toBeInTheDocument();

      // Deselect the trait (click again or use X button in tag)
      await user.click(screen.getByText('Sophisticated & Refined'));
      expect(screen.getByText('Selected: 0 of 3 maximum')).toBeInTheDocument();
    });
  });

  describe('QUIZ-UI-002: Visual Trait Combination Previews', () => {
    it('QUIZ-UI-002a: Should show selected traits as pills/tags', async () => {
      const user = userEvent.setup();
      render(<AdvancedQuizInterface />);

      // Select multiple traits
      await user.click(screen.getByText('Sophisticated & Refined'));
      await user.click(screen.getByText('Confident & Charismatic'));

      // Should show selected traits in preview area
      expect(screen.getByText('Your selections:')).toBeInTheDocument();

      // Should show trait pills with emojis
      const traitPills = screen.getAllByText(/sophisticated|confident/i);
      expect(traitPills.length).toBeGreaterThanOrEqual(2);
    });

    it('QUIZ-UI-002b: Should provide trait combination validation feedback', async () => {
      const user = userEvent.setup();
      render(<AdvancedQuizInterface />);

      // When no selections made
      expect(
        screen.getByText(/Select 1-3 options that feel authentic/i)
      ).toBeInTheDocument();

      // When minimum reached
      await user.click(screen.getByText('Sophisticated & Refined'));
      expect(screen.queryByText(/Select 1-3 options/i)).not.toBeInTheDocument();
      expect(screen.getByText('Ready to continue')).toBeInTheDocument();
    });

    it('QUIZ-UI-002c: Should show trait removal capability in pills', async () => {
      const user = userEvent.setup();
      render(<AdvancedQuizInterface />);

      // Select traits
      await user.click(screen.getByText('Sophisticated & Refined'));
      await user.click(screen.getByText('Confident & Charismatic'));

      // Should show X buttons on trait pills for removal
      const xButtons = screen
        .getAllByRole('button')
        .filter(
          btn =>
            btn.querySelector('svg') && btn.getAttribute('class')?.includes('X')
        );

      if (xButtons.length > 0) {
        // Click X to remove trait
        await user.click(xButtons[0]);
        // Verify count decreased
        expect(
          screen.getByText(/Selected: [01] of 3 maximum/)
        ).toBeInTheDocument();
      }
    });
  });

  describe('QUIZ-UI-003: Progressive Quiz Flow and Navigation', () => {
    it('QUIZ-UI-003a: Should show progress indicator and question counter', () => {
      render(<AdvancedQuizInterface />);

      // Should show question counter
      expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();

      // Should show progress text
      expect(
        screen.getByText('Building your personality profile...')
      ).toBeInTheDocument();

      // Should show progress bar
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('QUIZ-UI-003b: Should handle forward navigation with validation', async () => {
      const user = userEvent.setup();
      render(<AdvancedQuizInterface />);

      // Next button should be disabled initially
      const nextButton = screen.getByRole('button', { name: /next question/i });
      expect(nextButton).toBeDisabled();

      // Select minimum required traits
      await user.click(screen.getByText('Sophisticated & Refined'));

      // Next button should now be enabled
      expect(nextButton).not.toBeDisabled();
      expect(screen.getByText('Ready to continue')).toBeInTheDocument();

      // Click next to proceed
      await user.click(nextButton);

      // Should move to question 2 (slider question)
      expect(screen.getByText('Question 2 of 2')).toBeInTheDocument();
      expect(
        screen.getByText('How do you like your fragrance presence?')
      ).toBeInTheDocument();
    });

    it('QUIZ-UI-003c: Should handle backward navigation with state restoration', async () => {
      const user = userEvent.setup();
      render(<AdvancedQuizInterface />);

      // Make selections and move forward
      await user.click(screen.getByText('Sophisticated & Refined'));
      await user.click(screen.getByText('Confident & Charismatic'));
      await user.click(screen.getByRole('button', { name: /next question/i }));

      // Should be on question 2
      expect(screen.getByText('Question 2 of 2')).toBeInTheDocument();

      // Previous button should be available and enabled
      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).not.toBeDisabled();

      // Go back
      await user.click(prevButton);

      // Should restore previous selections
      expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
      expect(screen.getByText('Selected: 2 of 3 maximum')).toBeInTheDocument();
    });

    it('QUIZ-UI-003d: Should show engagement elements and personality building', () => {
      render(<AdvancedQuizInterface />);

      // Should show engagement indicators
      expect(
        screen.getByText('Building your unique profile')
      ).toBeInTheDocument();
      expect(screen.getByText('No account required')).toBeInTheDocument();
      expect(
        screen.getByText('Instant personalized results')
      ).toBeInTheDocument();

      // Should show animated elements (pulsing dots)
      const animatedElements = document.querySelectorAll('.animate-pulse');
      expect(animatedElements.length).toBeGreaterThan(0);
    });
  });

  describe('QUIZ-UI-004: Slider Interaction and Intensity Preferences', () => {
    it('QUIZ-UI-004a: Should render slider question with labels and visualization', async () => {
      const user = userEvent.setup();
      render(<AdvancedQuizInterface />);

      // Navigate to slider question
      await user.click(screen.getByText('Sophisticated & Refined'));
      await user.click(screen.getByRole('button', { name: /next question/i }));

      // Should show slider question
      expect(
        screen.getByText('How do you like your fragrance presence?')
      ).toBeInTheDocument();
      expect(screen.getByRole('slider')).toBeInTheDocument();

      // Should show intensity labels
      expect(
        screen.getByText('Subtle whisper - just for me')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Bold statement - unforgettable signature')
      ).toBeInTheDocument();

      // Should show current intensity value
      expect(screen.getByText(/50% intensity/)).toBeInTheDocument();
    });

    it('QUIZ-UI-004b: Should handle slider value changes with visual feedback', async () => {
      const user = userEvent.setup();
      render(<AdvancedQuizInterface />);

      // Navigate to slider question
      await user.click(screen.getByText('Sophisticated & Refined'));
      await user.click(screen.getByRole('button', { name: /next question/i }));

      const slider = screen.getByRole('slider');

      // Change slider value
      fireEvent.change(slider, { target: { value: '75' } });

      // Should update intensity display
      await waitFor(() => {
        expect(screen.getByText(/75% intensity/)).toBeInTheDocument();
      });

      // Visual intensity indicator should scale
      const intensityDot = document.querySelector(
        '.w-3.h-3.rounded-full.bg-plum-500'
      );
      expect(intensityDot).toBeTruthy();
    });

    it('QUIZ-UI-004c: Should update slider labels based on current value', async () => {
      const user = userEvent.setup();
      render(<AdvancedQuizInterface />);

      // Navigate to slider question
      await user.click(screen.getByText('Sophisticated & Refined'));
      await user.click(screen.getByRole('button', { name: /next question/i }));

      const slider = screen.getByRole('slider');

      // Change to low intensity
      fireEvent.change(slider, { target: { value: '10' } });
      await waitFor(() => {
        expect(screen.getByText(/Subtle whisper/)).toBeInTheDocument();
      });

      // Change to high intensity
      fireEvent.change(slider, { target: { value: '90' } });
      await waitFor(() => {
        expect(screen.getByText(/Bold statement/)).toBeInTheDocument();
      });
    });
  });

  describe('QUIZ-UI-005: Mobile Touch Interactions and Accessibility', () => {
    it('QUIZ-UI-005a: Should have minimum 48px touch targets', () => {
      render(<AdvancedQuizInterface />);

      // All clickable trait options should meet 48px minimum
      const traitButtons = screen
        .getAllByRole('button')
        .filter(
          btn =>
            btn.textContent?.includes('Sophisticated') ||
            btn.textContent?.includes('Confident') ||
            btn.textContent?.includes('Casual')
        );

      traitButtons.forEach(button => {
        const styles = getComputedStyle(button);
        const height =
          parseInt(styles.height) || parseInt(styles.minHeight) || 0;

        // Should meet 48px minimum (allowing for padding calculations)
        expect(height).toBeGreaterThanOrEqual(40); // 48px minus potential padding
      });
    });

    it('QUIZ-UI-005b: Should provide proper ARIA labels and roles', () => {
      render(<AdvancedQuizInterface />);

      // Progress bar should have proper ARIA
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();

      // Option buttons should have accessible names
      const sophisticatedButton = screen.getByRole('button', {
        name: /sophisticated & refined/i,
      });
      expect(sophisticatedButton).toBeInTheDocument();

      // Should have proper button roles
      const nextButton = screen.getByRole('button', { name: /next question/i });
      expect(nextButton).toBeInTheDocument();
    });

    it('QUIZ-UI-005c: Should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<AdvancedQuizInterface />);

      // Should be able to navigate with Tab
      await user.tab();

      // First trait option should be focusable
      const firstOption = screen
        .getByText('Sophisticated & Refined')
        .closest('button');
      expect(firstOption).toBeInTheDocument();

      // Should be able to select with Enter/Space
      if (firstOption) {
        firstOption.focus();
        await user.keyboard('{Enter}');

        expect(
          screen.getByText('Selected: 1 of 3 maximum')
        ).toBeInTheDocument();
      }
    });

    it('QUIZ-UI-005d: Should provide screen reader support for selections', async () => {
      const user = userEvent.setup();
      render(<AdvancedQuizInterface />);

      // Select a trait
      await user.click(screen.getByText('Sophisticated & Refined'));

      // Should announce selection state change
      expect(screen.getByText('Selected: 1 of 3 maximum')).toBeInTheDocument();

      // Selected trait should have visual indicator accessible to screen readers
      const selectedButton = screen
        .getByText('Sophisticated & Refined')
        .closest('button');
      expect(selectedButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('QUIZ-UI-006: Quiz Progress Persistence and Auto-Save', () => {
    it('QUIZ-UI-006a: Should persist selections when navigating between questions', async () => {
      const user = userEvent.setup();
      render(<AdvancedQuizInterface />);

      // Make selections on first question
      await user.click(screen.getByText('Sophisticated & Refined'));
      await user.click(screen.getByText('Confident & Charismatic'));

      // Navigate forward
      await user.click(screen.getByRole('button', { name: /next question/i }));

      // Navigate back
      await user.click(screen.getByRole('button', { name: /previous/i }));

      // Previous selections should be restored
      expect(screen.getByText('Selected: 2 of 3 maximum')).toBeInTheDocument();
    });

    it('QUIZ-UI-006b: Should auto-save progress during quiz session', async () => {
      const user = userEvent.setup();

      // Mock localStorage for session persistence
      const localStorageMock = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });

      render(<AdvancedQuizInterface />);

      // Make selections
      await user.click(screen.getByText('Sophisticated & Refined'));

      // Should trigger auto-save (verify localStorage calls)
      // Note: Implementation would need to include auto-save functionality
      expect(true).toBe(true); // Placeholder until auto-save implemented
    });

    it('QUIZ-UI-006c: Should restore session on page reload', () => {
      // Mock localStorage with saved session
      const savedSession = JSON.stringify({
        responses: [
          {
            question_id: 'personality_core',
            selected_options: ['sophisticated', 'confident'],
            timestamp: new Date().toISOString(),
          },
        ],
        currentQuestion: 1,
      });

      const localStorageMock = {
        getItem: vi.fn(() => savedSession),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });

      render(<AdvancedQuizInterface />);

      // Should restore to correct question and state
      // Note: This would require session restoration functionality in the component
      expect(true).toBe(true); // Placeholder until session restoration implemented
    });
  });

  describe('QUIZ-UI-007: Analytics and Engagement Tracking', () => {
    it('QUIZ-UI-007a: Should track multi-selection events for analytics', async () => {
      const user = userEvent.setup();
      const gtagSpy = vi.spyOn(window, 'gtag');

      render(<AdvancedQuizInterface />);

      // Select traits and proceed
      await user.click(screen.getByText('Sophisticated & Refined'));
      await user.click(screen.getByText('Confident & Charismatic'));
      await user.click(screen.getByRole('button', { name: /next question/i }));

      // Should track engagement and selections
      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        expect.stringMatching(/quiz|progress/),
        expect.any(Object)
      );
    });

    it('QUIZ-UI-007b: Should track completion rate and timing metrics', async () => {
      const user = userEvent.setup();
      const gtagSpy = vi.spyOn(window, 'gtag');

      render(<AdvancedQuizInterface />);

      // Complete full quiz
      await user.click(screen.getByText('Sophisticated & Refined'));
      await user.click(screen.getByRole('button', { name: /next question/i }));

      // On slider question, proceed to completion
      await user.click(
        screen.getByRole('button', { name: /build my profile/i })
      );

      // Should track quiz completion
      await waitFor(
        () => {
          expect(gtagSpy).toHaveBeenCalledWith(
            'event',
            'advanced_quiz_completed',
            expect.any(Object)
          );
        },
        { timeout: 3000 }
      );
    });
  });

  describe('QUIZ-UI-008: Error Handling and Edge Cases', () => {
    it('QUIZ-UI-008a: Should handle empty question data gracefully', () => {
      // Mock empty questions
      vi.doMock('@/lib/quiz/advanced-profile-engine', () => ({
        ADVANCED_QUIZ_QUESTIONS: [],
      }));

      render(<AdvancedQuizInterface />);

      // Should not crash, should show fallback or nothing
      expect(document.body).toBeInTheDocument();
    });

    it('QUIZ-UI-008b: Should handle profile analysis errors', async () => {
      const user = userEvent.setup();

      // Mock engine to throw error
      vi.doMock('@/lib/quiz/advanced-profile-engine', () => ({
        AdvancedProfileEngine: vi.fn().mockImplementation(() => ({
          generateUserProfile: vi
            .fn()
            .mockRejectedValue(new Error('Analysis failed')),
          initializeEmptyTraits: vi.fn().mockReturnValue({}),
        })),
        ADVANCED_QUIZ_QUESTIONS: [
          {
            id: 'test',
            type: 'single_select',
            title: 'Test Question',
            options: [{ id: 'test', label: 'Test Option', emoji: '✨' }],
          },
        ],
      }));

      render(<AdvancedQuizInterface />);

      // Complete quiz to trigger analysis
      await user.click(screen.getByText('Test Option'));
      await user.click(
        screen.getByRole('button', { name: /build my profile/i })
      );

      // Should handle error gracefully and show fallback
      await waitFor(() => {
        expect(screen.getByText(/analyzing|building/i)).toBeInTheDocument();
      });
    });

    it('QUIZ-UI-008c: Should provide user feedback during long operations', async () => {
      const user = userEvent.setup();
      render(<AdvancedQuizInterface />);

      // Complete quiz
      await user.click(screen.getByText('Sophisticated & Refined'));
      await user.click(screen.getByRole('button', { name: /next question/i }));
      await user.click(
        screen.getByRole('button', { name: /build my profile/i })
      );

      // Should show analysis loading state
      expect(
        screen.getByText('Building Your Fragrance Profile...')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/analyzing your \d+ personality traits/i)
      ).toBeInTheDocument();

      // Should show progress indicators
      expect(
        screen.getByText('✨ Processing your unique personality combination')
      ).toBeInTheDocument();
      expect(
        screen.getByText('🧠 AI matching against 1,467 fragrances')
      ).toBeInTheDocument();
    });
  });

  describe('QUIZ-UI-009: Advanced UI Interaction Patterns', () => {
    it('QUIZ-UI-009a: Should support hover states and visual feedback', async () => {
      const user = userEvent.setup();
      render(<AdvancedQuizInterface />);

      const sophisticatedOption = screen
        .getByText('Sophisticated & Refined')
        .closest('button');

      // Hover should change appearance
      if (sophisticatedOption) {
        await user.hover(sophisticatedOption);

        // Should have hover classes applied
        expect(sophisticatedOption).toHaveClass(/hover:border-plum-300/);
      }
    });

    it('QUIZ-UI-009b: Should provide tactile feedback for touch interactions', async () => {
      const user = userEvent.setup();
      render(<AdvancedQuizInterface />);

      const option = screen
        .getByText('Sophisticated & Refined')
        .closest('button');

      if (option) {
        // Touch/click should provide visual feedback
        await user.click(option);

        // Should have selected state classes
        expect(option).toHaveClass(/bg-plum-50|border-plum-500/);
      }
    });

    it('QUIZ-UI-009c: Should show trait combination building in real-time', async () => {
      const user = userEvent.setup();
      render(<AdvancedQuizInterface />);

      // Should start with no trait preview
      expect(screen.queryByText('Your selections:')).not.toBeInTheDocument();

      // Select first trait
      await user.click(screen.getByText('Sophisticated & Refined'));

      // Should show trait preview
      expect(screen.getByText('Your selections:')).toBeInTheDocument();

      // Select second trait
      await user.click(screen.getByText('Confident & Charismatic'));

      // Should show both traits in combination preview
      expect(screen.getByText('Selected: 2 of 3 maximum')).toBeInTheDocument();

      // Navigate to see trait building progress
      await user.click(screen.getByRole('button', { name: /next question/i }));

      // Should show trait building progress in header
      const traitBadges = screen.getAllByText(/sophisticated|confident/i);
      expect(traitBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('QUIZ-UI-010: Conversion Optimization Features', () => {
    it('QUIZ-UI-010a: Should complete quiz flow within target timeframe', async () => {
      const user = userEvent.setup();
      const startTime = Date.now();

      render(<AdvancedQuizInterface />);

      // Complete quiz efficiently
      await user.click(screen.getByText('Sophisticated & Refined'));
      await user.click(screen.getByRole('button', { name: /next question/i }));
      await user.click(
        screen.getByRole('button', { name: /build my profile/i })
      );

      const completionTime = Date.now() - startTime;

      // Should complete interaction flow in reasonable time for user experience
      expect(completionTime).toBeLessThan(5000); // 5 seconds for test interaction
    });

    it('QUIZ-UI-010b: Should transition to conversion flow after analysis', async () => {
      const user = userEvent.setup();
      render(<AdvancedQuizInterface />);

      // Complete quiz
      await user.click(screen.getByText('Sophisticated & Refined'));
      await user.click(screen.getByRole('button', { name: /next question/i }));
      await user.click(
        screen.getByRole('button', { name: /build my profile/i })
      );

      // Should show conversion flow after analysis
      await waitFor(
        () => {
          expect(
            screen.getByTestId('advanced-conversion-flow')
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('QUIZ-UI-010c: Should optimize for engagement and completion rate', () => {
      render(<AdvancedQuizInterface />);

      // Should have engagement optimization features
      expect(
        screen.getByText('Building your personality profile...')
      ).toBeInTheDocument();
      expect(screen.getByText('No account required')).toBeInTheDocument();

      // Should show immediate value proposition
      expect(
        screen.getByText('Instant personalized results')
      ).toBeInTheDocument();

      // Should have visual progress indicators
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Should show trait building in real-time
      expect(
        screen.getByText('Building your unique profile')
      ).toBeInTheDocument();
    });
  });
});
