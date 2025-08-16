/**
 * Quiz Flow Integration Tests
 * Tests the complete user journey from quiz start to recommendations and account creation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuizInterface } from '@/components/quiz/quiz-interface';

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock Supabase client
vi.mock('@/lib/supabase-client', () => ({
  createClientSupabase: () => ({
    auth: {
      signUp: vi.fn(() => Promise.resolve({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null,
      })),
      signIn: vi.fn(() => Promise.resolve({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null,
      })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  }),
}));

describe('Quiz Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Quiz Completion Flow', () => {
    it('should guide user through all quiz questions', async () => {
      render(<QuizInterface />);
      
      // Should start with first question
      expect(screen.getByText(/How would you describe your personal style/)).toBeInTheDocument();
      
      // Select an option and proceed
      const professionalOption = screen.getByText(/Professional & Sophisticated/);
      fireEvent.click(professionalOption);
      
      const nextButton = screen.getByText(/Next Question/);
      fireEvent.click(nextButton);
      
      // Should proceed to next question
      await waitFor(() => {
        expect(screen.getByText(/When do you most want to smell amazing/)).toBeInTheDocument();
      });
    });

    it('should show progress indicator throughout quiz', async () => {
      render(<QuizInterface />);
      
      // Should show progress at start
      expect(screen.getByText(/Question 1 of/)).toBeInTheDocument();
      
      // Progress should update as user proceeds
      const option = screen.getByText(/Professional & Sophisticated/);
      fireEvent.click(option);
      
      const nextButton = screen.getByText(/Next Question/);
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Question 2 of/)).toBeInTheDocument();
      });
    });

    it('should enable back navigation between questions', async () => {
      render(<QuizInterface />);
      
      // Answer first question
      const option = screen.getByText(/Professional & Sophisticated/);
      fireEvent.click(option);
      
      const nextButton = screen.getByText(/Next Question/);
      fireEvent.click(nextButton);
      
      // Should show back button on subsequent questions
      await waitFor(() => {
        const backButton = screen.getByText(/Previous/);
        expect(backButton).toBeInTheDocument();
        
        fireEvent.click(backButton);
      });
      
      // Should return to first question
      await waitFor(() => {
        expect(screen.getByText(/How would you describe your personal style/)).toBeInTheDocument();
      });
    });
  });

  describe('Quiz to Recommendations Flow', () => {
    it('should show analysis loading state after quiz completion', async () => {
      render(<QuizInterface />);
      
      // Complete all quiz questions (mock the full flow)
      const questions = [
        /Professional & Sophisticated/,
        /At work & professional events/,
        /Warm & Mysterious/,
        /Rich & Complex/,
        /Samples first/,
      ];

      for (let i = 0; i < questions.length; i++) {
        const option = screen.getByText(questions[i]);
        fireEvent.click(option);
        
        if (i < questions.length - 1) {
          const nextButton = screen.getByText(/Next Question/);
          fireEvent.click(nextButton);
          await waitFor(() => {
            expect(screen.getByText(/Question.*of/)).toBeInTheDocument();
          });
        }
      }
      
      // Complete the quiz
      const completeButton = screen.getByText(/Get My Recommendations/);
      fireEvent.click(completeButton);
      
      // Should show analyzing state
      await waitFor(() => {
        expect(screen.getByText(/Analyzing your fragrance personality/)).toBeInTheDocument();
      });
    });

    it('should display personalized results with personality type', async () => {
      render(<QuizInterface />);
      
      // Mock completing the quiz (simplified for test)
      const completeButton = screen.getByText(/Get Started/);
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        // Should show personality results
        expect(screen.getByText(/Your Fragrance Personality/)).toBeInTheDocument();
        expect(screen.getByText(/Based on your responses/)).toBeInTheDocument();
      });
    });

    it('should show recommended fragrances with sample options', async () => {
      render(<QuizInterface />);
      
      // Complete quiz and wait for results
      const startButton = screen.getByText(/Get Started/);
      fireEvent.click(startButton);
      
      await waitFor(() => {
        // Should show fragrance recommendations
        expect(screen.getByText(/Perfect Matches for You/)).toBeInTheDocument();
        expect(screen.getByText(/Try Sample/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Account Creation Conversion', () => {
    it('should prompt account creation after showing recommendations', async () => {
      render(<QuizInterface />);
      
      // Complete quiz flow
      const startButton = screen.getByText(/Get Started/);
      fireEvent.click(startButton);
      
      await waitFor(() => {
        // Should show account creation prompt
        expect(screen.getByText(/Save Your Results/)).toBeInTheDocument();
        expect(screen.getByText(/Create account to unlock/)).toBeInTheDocument();
      });
    });

    it('should handle account creation with email and password', async () => {
      render(<QuizInterface />);
      
      // Navigate to account creation
      const startButton = screen.getByText(/Get Started/);
      fireEvent.click(startButton);
      
      await waitFor(() => {
        const createAccountButton = screen.getByText(/Create Free Account/);
        fireEvent.click(createAccountButton);
      });
      
      await waitFor(() => {
        // Should show account form
        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        
        expect(emailInput).toBeInTheDocument();
        expect(passwordInput).toBeInTheDocument();
        
        // Test form interaction
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        
        expect(emailInput).toHaveValue('test@example.com');
        expect(passwordInput).toHaveValue('password123');
      });
    });

    it('should handle successful account creation', async () => {
      render(<QuizInterface />);
      
      // Mock successful account creation flow
      const startButton = screen.getByText(/Get Started/);
      fireEvent.click(startButton);
      
      await waitFor(() => {
        const createButton = screen.getByText(/Create Free Account/);
        fireEvent.click(createButton);
      });
      
      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByText(/Create Account/);
        
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);
      });
      
      // Should show success state
      await waitFor(() => {
        expect(screen.getByText(/Welcome to ScentMatch/)).toBeInTheDocument();
        expect(screen.getByText(/Your account has been created/)).toBeInTheDocument();
      });
    });
  });

  describe('Guest User Experience', () => {
    it('should allow guest users to continue without account', async () => {
      render(<QuizInterface />);
      
      // Complete quiz
      const startButton = screen.getByText(/Get Started/);
      fireEvent.click(startButton);
      
      await waitFor(() => {
        // Should offer guest continuation option
        const continueGuestButton = screen.getByText(/Continue as Guest/);
        expect(continueGuestButton).toBeInTheDocument();
        
        fireEvent.click(continueGuestButton);
      });
      
      await waitFor(() => {
        // Should show guest limitations but still provide value
        expect(screen.getByText(/Guest Access/)).toBeInTheDocument();
        expect(screen.getByText(/limited recommendations/)).toBeInTheDocument();
      });
    });

    it('should show clear value proposition for creating account', async () => {
      render(<QuizInterface />);
      
      const startButton = screen.getByText(/Get Started/);
      fireEvent.click(startButton);
      
      await waitFor(() => {
        // Should clearly explain account benefits
        expect(screen.getByText(/Save your fragrance preferences/)).toBeInTheDocument();
        expect(screen.getByText(/Get unlimited recommendations/)).toBeInTheDocument();
        expect(screen.getByText(/Track your collection/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle quiz analysis errors gracefully', async () => {
      // Mock analysis error
      vi.mock('@/lib/quiz/mvp-personality-engine', () => ({
        MVPPersonalityEngine: class {
          analyzeQuizResponses() {
            throw new Error('Analysis failed');
          }
        }
      }));
      
      render(<QuizInterface />);
      
      const startButton = screen.getByText(/Get Started/);
      fireEvent.click(startButton);
      
      await waitFor(() => {
        // Should show error recovery options
        expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
        expect(screen.getByText(/Try again/)).toBeInTheDocument();
      });
    });

    it('should handle account creation errors', async () => {
      // Mock account creation error
      vi.mocked(require('@/lib/supabase-client').createClientSupabase).mockReturnValue({
        auth: {
          signUp: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Email already exists' },
          })),
        },
      });
      
      render(<QuizInterface />);
      
      // Navigate through quiz to account creation
      const startButton = screen.getByText(/Get Started/);
      fireEvent.click(startButton);
      
      await waitFor(() => {
        const createButton = screen.getByText(/Create Free Account/);
        fireEvent.click(createButton);
      });
      
      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByText(/Create Account/);
        
        fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);
      });
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Email already exists/)).toBeInTheDocument();
      });
    });
  });

  describe('Conversion Optimization', () => {
    it('should track quiz completion analytics', async () => {
      const analyticsTracker = vi.fn();
      window.gtag = analyticsTracker;
      
      render(<QuizInterface />);
      
      const startButton = screen.getByText(/Get Started/);
      fireEvent.click(startButton);
      
      await waitFor(() => {
        // Analytics should be called for quiz completion
        expect(analyticsTracker).toHaveBeenCalledWith('event', 'quiz_completed', expect.any(Object));
      });
    });

    it('should provide multiple conversion touchpoints', async () => {
      render(<QuizInterface />);
      
      const startButton = screen.getByText(/Get Started/);
      fireEvent.click(startButton);
      
      await waitFor(() => {
        // Should have multiple ways to convert
        expect(screen.getByText(/Create Free Account/)).toBeInTheDocument();
        expect(screen.getByText(/Continue as Guest/)).toBeInTheDocument();
        expect(screen.getByText(/Save Results/)).toBeInTheDocument();
      });
    });
  });
});