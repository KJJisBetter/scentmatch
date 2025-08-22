/**
 * Enhanced Quiz Flow Integration Tests - SCE-70
 * 
 * Tests the complete quiz flow including the new context collection step
 * and verifies end-to-end functionality with context-aware recommendations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedQuizFlow } from '@/components/quiz/enhanced-quiz-flow';

// Mock the recommendation engine
vi.mock('@/lib/quiz/working-recommendation-engine', () => ({
  WorkingRecommendationEngine: vi.fn().mockImplementation(() => ({
    generateRecommendations: vi.fn().mockResolvedValue({
      success: true,
      recommendations: [
        {
          id: '1',
          name: 'Test Fragrance 1',
          brand: 'Test Brand',
          match_percentage: 95,
          ai_insight: '✅ Perfect since you mentioned Sauvage!\n🔄 Similar fresh energy but unique',
          reasoning: 'Great match for your preferences',
          confidence_level: 'high',
          why_recommended: 'Fresh and clean like you wanted',
          sample_available: true,
          sample_price_usd: 15
        },
        {
          id: '2',
          name: 'Test Fragrance 2',
          brand: 'Test Brand',
          match_percentage: 90,
          ai_insight: '🌿 Building on your Sauvage interest\n⚡ Different but equally appealing',
          reasoning: 'Complements your style',
          confidence_level: 'high',
          why_recommended: 'Sophisticated choice',
          sample_available: true,
          sample_price_usd: 12
        },
        {
          id: '3',
          name: 'Test Fragrance 3',
          brand: 'Test Brand',
          match_percentage: 85,
          ai_insight: '💡 Since you like fresh scents\n🎯 Perfect daily wear option',
          reasoning: 'Great for everyday use',
          confidence_level: 'medium',
          why_recommended: 'Versatile and appealing',
          sample_available: true,
          sample_price_usd: 10
        }
      ],
      quiz_session_token: 'test-session',
      total_processing_time_ms: 1500,
      recommendation_method: 'json_matching'
    })
  }))
}));

// Mock the quiz data
vi.mock('@/lib/quiz/natural-quiz-data', () => ({
  getNaturalQuizData: vi.fn(() => ({
    experience_level: 'beginner',
    questions: [
      {
        id: 'test_question',
        text: 'What scents do you like?',
        options: [
          { value: 'fresh', text: 'Fresh & clean', emoji: '🌿' },
          { value: 'woody', text: 'Warm & woody', emoji: '🌲' }
        ],
        allowMultiple: false
      }
    ],
    estimated_time_minutes: 2
  }))
}));

// Mock UI components that have complex behavior
vi.mock('@/components/ui/command', () => ({
  Command: ({ children }: { children: React.ReactNode }) => <div data-testid="command">{children}</div>,
  CommandInput: ({ onValueChange, ...props }: any) => (
    <input 
      {...props} 
      data-testid="command-input"
      onChange={(e) => onValueChange?.(e.target.value)}
    />
  ),
  CommandList: ({ children }: { children: React.ReactNode }) => <div data-testid="command-list">{children}</div>,
  CommandEmpty: ({ children }: { children: React.ReactNode }) => <div data-testid="command-empty">{children}</div>,
  CommandGroup: ({ children }: { children: React.ReactNode }) => <div data-testid="command-group">{children}</div>,
  CommandItem: ({ children, onSelect }: any) => (
    <button data-testid="command-item" onClick={() => onSelect?.()}>{children}</button>
  ),
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children, open }: any) => <div data-testid="popover" style={{ display: open ? 'block' : 'none' }}>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="popover-trigger">{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div data-testid="popover-content">{children}</div>,
}));

// Mock analytics
const mockGtag = vi.fn();
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true
});

describe('Enhanced Quiz Flow Integration', () => {
  const mockOnConversionReady = vi.fn();

  beforeEach(() => {
    mockOnConversionReady.mockClear();
    mockGtag.mockClear();
  });

  describe('Complete Quiz Flow with Context', () => {
    it('completes the full quiz flow with beginner context collection', async () => {
      const user = userEvent.setup();
      
      render(<EnhancedQuizFlow onConversionReady={mockOnConversionReady} />);

      // Step 1: Gender selection
      expect(screen.getByText(/how would you like your recommendations/i)).toBeInTheDocument();
      await user.click(screen.getByText(/for men/i));

      // Step 2: Experience level selection
      expect(screen.getByText(/how would you describe yourself with fragrances/i)).toBeInTheDocument();
      await user.click(screen.getByText(/just getting started/i));

      // Step 3: Context collection (new step)
      expect(screen.getByText(/any fragrances you've heard about/i)).toBeInTheDocument();
      
      // Select Sauvage
      const sauvageButton = screen.getByRole('button', { name: /sauvage dior/i });
      await user.click(sauvageButton);
      
      // Continue to quiz
      const continueButton = screen.getByText(/continue to quiz questions/i);
      await user.click(continueButton);

      // Step 4: Quiz questions
      expect(screen.getByText(/what scents do you like/i)).toBeInTheDocument();
      await user.click(screen.getByText(/fresh & clean/i));

      // Step 5: Results with context-aware recommendations
      await waitFor(() => {
        expect(screen.getByText(/test fragrance 1/i)).toBeInTheDocument();
      });

      // Verify context-aware insights are displayed
      expect(screen.getByText(/perfect since you mentioned sauvage/i)).toBeInTheDocument();
    });

    it('completes quiz flow with advanced user collection context', async () => {
      const user = userEvent.setup();
      
      render(<EnhancedQuizFlow onConversionReady={mockOnConversionReady} />);

      // Step 1: Gender selection
      await user.click(screen.getByText(/for men/i));

      // Step 2: Experience level selection - choose experienced
      await user.click(screen.getByText(/love trying new things/i));

      // Step 3: Context collection for advanced users
      expect(screen.getByText(/what fragrances do you currently own/i)).toBeInTheDocument();
      
      // Add context notes instead of fragrances for this test
      const notesInput = screen.getByPlaceholderText(/I prefer lighter scents/i);
      await user.type(notesInput, 'I own several niche fragrances and prefer woody scents');
      
      const continueButton = screen.getByText(/continue to quiz questions/i);
      await user.click(continueButton);

      // Step 4: Quiz questions
      await user.click(screen.getByText(/fresh & clean/i));

      // Step 5: Results
      await waitFor(() => {
        expect(screen.getByText(/test fragrance 1/i)).toBeInTheDocument();
      });
    });

    it('tracks analytics events throughout the flow', async () => {
      const user = userEvent.setup();
      
      render(<EnhancedQuizFlow onConversionReady={mockOnConversionReady} />);

      // Gender selection tracking
      await user.click(screen.getByText(/for men/i));
      expect(mockGtag).toHaveBeenCalledWith('event', 'quiz_gender_selected', expect.objectContaining({
        gender_preference: 'men'
      }));

      // Experience level tracking
      await user.click(screen.getByText(/just getting started/i));
      expect(mockGtag).toHaveBeenCalledWith('event', 'quiz_experience_selected', expect.objectContaining({
        experience_level: 'beginner'
      }));

      // Context collection tracking
      const sauvageButton = screen.getByRole('button', { name: /sauvage dior/i });
      await user.click(sauvageButton);
      await user.click(screen.getByText(/continue to quiz questions/i));
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'quiz_context_collected', expect.objectContaining({
        experience_level: 'beginner',
        known_fragrances_count: 1
      }));
    });

    it('handles context data in recommendation generation', async () => {
      const user = userEvent.setup();
      
      render(<EnhancedQuizFlow onConversionReady={mockOnConversionReady} />);

      // Complete flow quickly
      await user.click(screen.getByText(/for men/i));
      await user.click(screen.getByText(/just getting started/i));
      
      // Add specific context
      await user.click(screen.getByRole('button', { name: /sauvage dior/i }));
      await user.click(screen.getByText(/continue to quiz questions/i));
      await user.click(screen.getByText(/fresh & clean/i));

      await waitFor(() => {
        expect(screen.getByText(/test fragrance 1/i)).toBeInTheDocument();
      });

      // Verify the WorkingRecommendationEngine was called with context data
      const { WorkingRecommendationEngine } = await import('@/lib/quiz/working-recommendation-engine');
      const mockEngine = new WorkingRecommendationEngine();
      
      expect(mockEngine.generateRecommendations).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            question_id: 'user_context',
            answer_metadata: expect.objectContaining({
              known_fragrances: ['Sauvage by Dior']
            })
          })
        ]),
        expect.any(String)
      );
    });

    it('calls onConversionReady with enhanced data including context', async () => {
      const user = userEvent.setup();
      
      render(<EnhancedQuizFlow onConversionReady={mockOnConversionReady} />);

      // Complete full flow
      await user.click(screen.getByText(/for men/i));
      await user.click(screen.getByText(/just getting started/i));
      await user.click(screen.getByRole('button', { name: /sauvage dior/i }));
      await user.click(screen.getByText(/continue to quiz questions/i));
      await user.click(screen.getByText(/fresh & clean/i));

      await waitFor(() => {
        expect(mockOnConversionReady).toHaveBeenCalledWith(expect.objectContaining({
          recommendations: expect.arrayContaining([
            expect.objectContaining({
              name: 'Test Fragrance 1',
              ai_insight: expect.stringContaining('Sauvage')
            })
          ]),
          gender_preference: 'men',
          experience_level: 'beginner'
        }));
      });
    });
  });

  describe('Context Collection Validation', () => {
    it('requires context input before proceeding', async () => {
      const user = userEvent.setup();
      
      render(<EnhancedQuizFlow onConversionReady={mockOnConversionReady} />);

      await user.click(screen.getByText(/for men/i));
      await user.click(screen.getByText(/just getting started/i));

      // Should be on context collection step
      expect(screen.getByText(/any fragrances you've heard about/i)).toBeInTheDocument();
      
      // Continue button should be disabled initially
      const continueButton = screen.getByText(/continue to quiz questions/i);
      expect(continueButton).toBeDisabled();

      // After selecting a fragrance, should be enabled
      await user.click(screen.getByRole('button', { name: /sauvage dior/i }));
      expect(continueButton).toBeEnabled();
    });

    it('allows proceeding with context notes instead of fragrance selections', async () => {
      const user = userEvent.setup();
      
      render(<EnhancedQuizFlow onConversionReady={mockOnConversionReady} />);

      await user.click(screen.getByText(/for men/i));
      await user.click(screen.getByText(/just getting started/i));

      const continueButton = screen.getByText(/continue to quiz questions/i);
      expect(continueButton).toBeDisabled();

      // Add context notes
      const notesInput = screen.getByPlaceholderText(/I prefer lighter scents/i);
      await user.type(notesInput, 'I prefer fresh, clean scents');

      expect(continueButton).toBeEnabled();
    });
  });

  describe('Error Handling', () => {
    it('handles recommendation generation errors gracefully', async () => {
      // Mock engine to throw error
      const { WorkingRecommendationEngine } = await import('@/lib/quiz/working-recommendation-engine');
      const mockEngine = new WorkingRecommendationEngine();
      vi.mocked(mockEngine.generateRecommendations).mockRejectedValueOnce(new Error('API Error'));

      const user = userEvent.setup();
      
      render(<EnhancedQuizFlow onConversionReady={mockOnConversionReady} />);

      // Complete flow
      await user.click(screen.getByText(/for men/i));
      await user.click(screen.getByText(/just getting started/i));
      await user.click(screen.getByRole('button', { name: /sauvage dior/i }));
      await user.click(screen.getByText(/continue to quiz questions/i));
      await user.click(screen.getByText(/fresh & clean/i));

      await waitFor(() => {
        // Should show error state or fallback
        expect(screen.getByText(/sorry, we couldn't generate recommendations/i)).toBeInTheDocument();
      });
    });

    it('handles malformed context data gracefully', async () => {
      const user = userEvent.setup();
      
      render(<EnhancedQuizFlow onConversionReady={mockOnConversionReady} />);

      // Complete flow normally - the context handling should be robust
      await user.click(screen.getByText(/for men/i));
      await user.click(screen.getByText(/just getting started/i));
      await user.click(screen.getByRole('button', { name: /sauvage dior/i }));
      await user.click(screen.getByText(/continue to quiz questions/i));
      await user.click(screen.getByText(/fresh & clean/i));

      await waitFor(() => {
        expect(screen.getByText(/test fragrance 1/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows appropriate loading state during recommendation generation', async () => {
      const user = userEvent.setup();
      
      render(<EnhancedQuizFlow onConversionReady={mockOnConversionReady} />);

      // Complete flow to trigger loading
      await user.click(screen.getByText(/for men/i));
      await user.click(screen.getByText(/just getting started/i));
      await user.click(screen.getByRole('button', { name: /sauvage dior/i }));
      await user.click(screen.getByText(/continue to quiz questions/i));
      await user.click(screen.getByText(/fresh & clean/i));

      // Should show loading state
      expect(screen.getByText(/finding your perfect matches/i)).toBeInTheDocument();
      expect(screen.getByText(/analyzing your beginner preferences/i)).toBeInTheDocument();
    });
  });

  describe('Step Navigation', () => {
    it('maintains proper step sequence with context collection', async () => {
      const user = userEvent.setup();
      
      render(<EnhancedQuizFlow onConversionReady={mockOnConversionReady} />);

      // Step 1: Gender
      expect(screen.getByText(/how would you like your recommendations/i)).toBeInTheDocument();
      await user.click(screen.getByText(/for men/i));

      // Step 2: Experience
      expect(screen.getByText(/how would you describe yourself/i)).toBeInTheDocument();
      expect(screen.queryByText(/any fragrances you've heard about/i)).not.toBeInTheDocument();
      await user.click(screen.getByText(/just getting started/i));

      // Step 3: Context (new step)
      expect(screen.getByText(/any fragrances you've heard about/i)).toBeInTheDocument();
      expect(screen.queryByText(/what scents do you like/i)).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /sauvage dior/i }));
      await user.click(screen.getByText(/continue to quiz questions/i));

      // Step 4: Quiz
      expect(screen.getByText(/what scents do you like/i)).toBeInTheDocument();
      expect(screen.queryByText(/any fragrances you've heard about/i)).not.toBeInTheDocument();
    });
  });
});