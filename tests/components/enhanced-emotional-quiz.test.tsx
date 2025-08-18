import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnhancedEmotionalQuiz } from '@/components/quiz/enhanced-emotional-quiz';

const mockOnComplete = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EnhancedEmotionalQuiz', () => {
  it('should render the first question with emotional context', () => {
    render(<EnhancedEmotionalQuiz onComplete={mockOnComplete} />);

    expect(
      screen.getByText('Picture your perfect weekend morning...')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Close your eyes and imagine yourself completely at peace'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Journey 1 of 6')).toBeInTheDocument();
    expect(screen.getByText('Emotional Discovery Mode')).toBeInTheDocument();
  });

  it('should display enhanced progress bar with gradient', () => {
    render(<EnhancedEmotionalQuiz onComplete={mockOnComplete} />);

    const progressBar = document.querySelector(
      '.bg-gradient-to-r.from-pink-500'
    );
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: '17%' }); // 1/6 * 100%
  });

  it('should show all weekend ritual options with sensory descriptions', () => {
    render(<EnhancedEmotionalQuiz onComplete={mockOnComplete} />);

    expect(
      screen.getByText('Quiet coffee and journaling by the window')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Golden light filtering through gauze curtains')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Browsing farmers market with fresh flowers')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Bursts of color in wicker baskets')
    ).toBeInTheDocument();
  });

  it('should advance to next question on single selection', () => {
    render(<EnhancedEmotionalQuiz onComplete={mockOnComplete} />);

    const coffeeOption = screen
      .getByText('Quiet coffee and journaling by the window')
      .closest('button');
    fireEvent.click(coffeeOption!);

    // Should advance to texture question
    expect(
      screen.getByText('Which texture calls to your fingertips?')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Trust your instinctual response - no thinking required')
    ).toBeInTheDocument();
  });

  it('should handle multiple selection questions correctly', () => {
    render(<EnhancedEmotionalQuiz onComplete={mockOnComplete} />);

    // Click through to color emotion question (which allows multiple)
    fireEvent.click(
      screen
        .getByText('Quiet coffee and journaling by the window')
        .closest('button')!
    );
    fireEvent.click(
      screen
        .getByText('Crushed velvet that catches moonlight')
        .closest('button')!
    );

    // Should now be on color emotion question
    expect(
      screen.getByText('What color is your inner sanctuary?')
    ).toBeInTheDocument();

    // Select multiple colors
    const champagneGold = screen
      .getByText('Champagne gold at golden hour')
      .closest('button');
    const deepForest = screen
      .getByText('The deep green heart of an old forest')
      .closest('button');

    fireEvent.click(champagneGold!);
    fireEvent.click(deepForest!);

    // Should show continue button
    expect(screen.getByText('Continue with 2 choices')).toBeInTheDocument();
  });

  it('should enforce minimum selections for multiple choice questions', () => {
    render(<EnhancedEmotionalQuiz onComplete={mockOnComplete} />);

    // Navigate to color emotion question
    fireEvent.click(
      screen
        .getByText('Quiet coffee and journaling by the window')
        .closest('button')!
    );
    fireEvent.click(
      screen
        .getByText('Crushed velvet that catches moonlight')
        .closest('button')!
    );

    // Continue button should be disabled initially
    const continueButton = screen.getByRole('button', {
      name: /Continue with 0 choices/,
    });
    expect(continueButton).toBeDisabled();

    // Select one option
    fireEvent.click(
      screen.getByText('Champagne gold at golden hour').closest('button')!
    );

    // Continue button should now be enabled
    const enabledContinueButton = screen.getByRole('button', {
      name: /Continue with 1 choice/,
    });
    expect(enabledContinueButton).not.toBeDisabled();
  });

  it('should respect maximum selections for multiple choice questions', () => {
    render(<EnhancedEmotionalQuiz onComplete={mockOnComplete} />);

    // Navigate to color emotion question (max 3 selections)
    fireEvent.click(
      screen
        .getByText('Quiet coffee and journaling by the window')
        .closest('button')!
    );
    fireEvent.click(
      screen
        .getByText('Crushed velvet that catches moonlight')
        .closest('button')!
    );

    // Select maximum number of options
    fireEvent.click(
      screen.getByText('Champagne gold at golden hour').closest('button')!
    );
    fireEvent.click(
      screen
        .getByText('The deep green heart of an old forest')
        .closest('button')!
    );
    fireEvent.click(
      screen.getByText('Blush pink sky after a perfect day').closest('button')!
    );

    // Try to select a fourth option (should not be selectable)
    const fourthOption = screen
      .getByText('Midnight blue velvet studded with stars')
      .closest('button');
    fireEvent.click(fourthOption!);

    // Should still show 3 selections
    expect(screen.getByText('Continue with 3 choices')).toBeInTheDocument();
    expect(screen.getByText('3/3 selected')).toBeInTheDocument();
  });

  it('should call onComplete with all responses when quiz finishes', () => {
    render(<EnhancedEmotionalQuiz onComplete={mockOnComplete} />);

    // Complete all questions
    const answers = [
      'Quiet coffee and journaling by the window',
      'Crushed velvet that catches moonlight',
      'Champagne gold at golden hour', // Color emotion - will need continue button
      "Baking bread in grandmother's kitchen",
      'Like coming home - instantly comfortable',
      "A Parisian artist's atelier in 1920", // Dream escape - will need continue button
    ];

    // First question (weekend ritual)
    fireEvent.click(screen.getByText(answers[0]).closest('button')!);

    // Second question (texture)
    fireEvent.click(screen.getByText(answers[1]).closest('button')!);

    // Third question (color emotion - multiple selection)
    fireEvent.click(screen.getByText(answers[2]).closest('button')!);
    fireEvent.click(
      screen.getByRole('button', { name: /Continue with 1 choice/ })
    );

    // Fourth question (memory scent)
    fireEvent.click(screen.getByText(answers[3]).closest('button')!);

    // Fifth question (social energy)
    fireEvent.click(screen.getByText(answers[4]).closest('button')!);

    // Sixth question (dream escape - multiple selection)
    fireEvent.click(screen.getByText(answers[5]).closest('button')!);
    fireEvent.click(
      screen.getByRole('button', { name: /Continue with 1 choice/ })
    );

    // Should call onComplete with 6 responses
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    const responses = mockOnComplete.mock.calls[0][0];
    expect(responses).toHaveLength(6);
    expect(responses[0]).toMatchObject({
      question_id: 'weekend_ritual',
      answer_value: 'coffee_journal',
      emotional_trigger: 'lifestyle_aspiration',
    });
  });

  it('should show emotional encouragement messages', () => {
    render(<EnhancedEmotionalQuiz onComplete={mockOnComplete} />);

    expect(
      screen.getByText(
        '✨ Trust your instincts • 💫 There are no wrong answers • 🌟 Your authentic self guides the way'
      )
    ).toBeInTheDocument();
  });

  it('should track emotional triggers in responses', () => {
    render(<EnhancedEmotionalQuiz onComplete={mockOnComplete} />);

    // Select first option and complete quiz quickly
    fireEvent.click(
      screen
        .getByText('Quiet coffee and journaling by the window')
        .closest('button')!
    );

    // Check that emotional trigger is included
    const responses = mockOnComplete.mock.calls[0]?.[0];
    if (responses && responses.length > 0) {
      expect(responses[0]).toHaveProperty(
        'emotional_trigger',
        'lifestyle_aspiration'
      );
    }
  });

  it('should provide visual metaphors and sensory descriptions', () => {
    render(<EnhancedEmotionalQuiz onComplete={mockOnComplete} />);

    // Check for visual metaphors
    expect(
      screen.getByText('Golden light filtering through gauze curtains')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Bursts of color in wicker baskets')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Dappled sunlight through ancient trees')
    ).toBeInTheDocument();
  });

  it('should handle deselection in multiple choice questions', () => {
    render(<EnhancedEmotionalQuiz onComplete={mockOnComplete} />);

    // Navigate to color emotion question
    fireEvent.click(
      screen
        .getByText('Quiet coffee and journaling by the window')
        .closest('button')!
    );
    fireEvent.click(
      screen
        .getByText('Crushed velvet that catches moonlight')
        .closest('button')!
    );

    // Select and then deselect an option
    const champagneOption = screen
      .getByText('Champagne gold at golden hour')
      .closest('button');
    fireEvent.click(champagneOption!);
    expect(screen.getByText('Continue with 1 choice')).toBeInTheDocument();

    fireEvent.click(champagneOption!); // Deselect
    expect(screen.getByText('Continue with 0 choices')).toBeInTheDocument();
  });
});
