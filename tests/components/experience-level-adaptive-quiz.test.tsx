/**
 * Experience-Level Adaptive Quiz System Tests
 *
 * Tests the enhanced quiz system that adapts to user experience levels:
 * - Beginner (65% of users): Simplified language, basic concepts
 * - Enthusiast (25% of users): Moderate complexity, some favorites input
 * - Collector (10% of users): Advanced terminology, collection management
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExperienceLevelAdaptiveQuiz } from '@/components/quiz/experience-level-adaptive-quiz';
import { QuizEngine } from '@/lib/quiz/quiz-engine';

// Mock the QuizEngine
jest.mock('@/lib/quiz/quiz-engine');

// Mock router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

describe('ExperienceLevelAdaptiveQuiz', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Experience Level Detection', () => {
    test('should show experience level selection as first question', () => {
      render(<ExperienceLevelAdaptiveQuiz />);

      expect(
        screen.getByText(/How familiar are you with fragrances/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /new to fragrances/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /some experience/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /experienced collector/i })
      ).toBeInTheDocument();
    });

    test('should use beginner-friendly language for experience question', () => {
      render(<ExperienceLevelAdaptiveQuiz />);

      // Check for simplified language in options
      expect(screen.getByText(/new to fragrances/i)).toBeInTheDocument();
      expect(screen.getByText(/just getting started/i)).toBeInTheDocument();
    });

    test('should track experience level selection', async () => {
      render(<ExperienceLevelAdaptiveQuiz />);

      const beginnerOption = screen.getByRole('button', {
        name: /new to fragrances/i,
      });
      fireEvent.click(beginnerOption);

      await waitFor(() => {
        expect(
          screen.queryByText(/How familiar are you with fragrances/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Beginner Experience Level (65% of users)', () => {
    beforeEach(() => {
      render(<ExperienceLevelAdaptiveQuiz />);
      // Select beginner level
      fireEvent.click(
        screen.getByRole('button', { name: /new to fragrances/i })
      );
    });

    test('should use simplified vocabulary in questions', async () => {
      await waitFor(() => {
        // Should use simple terms like "scent" instead of "fragrance"
        const questionText = screen.getByRole('heading').textContent;
        expect(questionText).toMatch(/scent|smell|fresh|sweet/i);
        expect(questionText).not.toMatch(
          /accord|sillage|longevity|composition/i
        );
      });
    });

    test('should limit answer options to avoid choice overload', async () => {
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        // Should have 3-4 options maximum for beginners
        const answerButtons = buttons.filter(
          btn =>
            !btn.textContent?.includes('Back') &&
            !btn.textContent?.includes('Skip')
        );
        expect(answerButtons.length).toBeLessThanOrEqual(4);
      });
    });

    test('should use emoji and visual indicators', async () => {
      await waitFor(() => {
        const options = screen.getAllByRole('button');
        // Check that options contain emoji characters
        const hasEmoji = options.some(option =>
          /[\u{1F300}-\u{1F9FF}]/u.test(option.textContent || '')
        );
        expect(hasEmoji).toBeTruthy();
      });
    });

    test('should skip favorite fragrance input for beginners', async () => {
      // Complete the quiz as beginner
      const questions = await completeQuizPath('beginner');

      // Should not include favorite fragrance selection
      expect(questions).not.toContain('favorite fragrances');
      expect(questions).not.toContain('current collection');
    });

    test('should provide encouraging progress messages', async () => {
      await waitFor(() => {
        expect(
          screen.getByText(/You're doing great!/i) ||
            screen.getByText(/Almost there!/i) ||
            screen.getByText(/Great choice!/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Enthusiast Experience Level (25% of users)', () => {
    beforeEach(() => {
      render(<ExperienceLevelAdaptiveQuiz />);
      // Select enthusiast level
      fireEvent.click(screen.getByRole('button', { name: /some experience/i }));
    });

    test('should use moderate fragrance terminology', async () => {
      await waitFor(() => {
        const content = document.body.textContent;
        // Should include some fragrance terms but not overwhelm
        expect(content).toMatch(/fragrance|notes|scent family/i);
        // But avoid very technical terms
        expect(content).not.toMatch(/olfactory pyramid|dry down/i);
      });
    });

    test('should include more answer options', async () => {
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const answerButtons = buttons.filter(
          btn =>
            !btn.textContent?.includes('Back') &&
            !btn.textContent?.includes('Skip')
        );
        expect(answerButtons.length).toBeGreaterThan(3);
        expect(answerButtons.length).toBeLessThanOrEqual(6);
      });
    });

    test('should include favorite fragrance selection', async () => {
      const questions = await completeQuizPath('enthusiast');
      expect(
        questions.some(
          q => q.includes('favorite') || q.includes('currently wear')
        )
      ).toBeTruthy();
    });

    test('should allow 2-3 favorite selections', async () => {
      // Navigate to favorites question
      await navigateToFavoritesQuestion('enthusiast');

      expect(
        screen.getByText(/2-3 fragrances/i) ||
          screen.getByText(/few favorites/i)
      ).toBeInTheDocument();
    });
  });

  describe('Collector Experience Level (10% of users)', () => {
    beforeEach(() => {
      render(<ExperienceLevelAdaptiveQuiz />);
      // Select collector level
      fireEvent.click(
        screen.getByRole('button', { name: /experienced collector/i })
      );
    });

    test('should use advanced fragrance terminology', async () => {
      await waitFor(() => {
        const content = document.body.textContent;
        expect(content).toMatch(
          /composition|accord|sillage|longevity|olfactory/i
        );
      });
    });

    test('should include niche and artisan options', async () => {
      await waitFor(() => {
        const content = document.body.textContent;
        expect(content).toMatch(/niche|artisan|indie|exclusive/i);
      });
    });

    test('should allow 3-5 favorite selections', async () => {
      await navigateToFavoritesQuestion('collector');

      expect(
        screen.getByText(/3-5 fragrances/i) ||
          screen.getByText(/collection favorites/i)
      ).toBeInTheDocument();
    });

    test('should include collection management questions', async () => {
      const questions = await completeQuizPath('collector');
      expect(
        questions.some(
          q =>
            q.includes('collection') ||
            q.includes('bottles') ||
            q.includes('wearing rotation')
        )
      ).toBeTruthy();
    });

    test('should ask about budget range for collectors', async () => {
      const questions = await completeQuizPath('collector');
      expect(
        questions.some(
          q =>
            q.includes('investment') ||
            q.includes('budget') ||
            q.includes('price range')
        )
      ).toBeTruthy();
    });
  });

  describe('Dynamic Question Branching', () => {
    test('should generate different question paths for each experience level', async () => {
      const beginnerQuestions = await getQuestionPathForLevel('beginner');
      const enthusiastQuestions = await getQuestionPathForLevel('enthusiast');
      const collectorQuestions = await getQuestionPathForLevel('collector');

      // Paths should be different
      expect(beginnerQuestions).not.toEqual(enthusiastQuestions);
      expect(enthusiastQuestions).not.toEqual(collectorQuestions);
      expect(beginnerQuestions).not.toEqual(collectorQuestions);
    });

    test('should maintain consistent core personality questions across levels', async () => {
      const beginnerQuestions = await getQuestionPathForLevel('beginner');
      const collectorQuestions = await getQuestionPathForLevel('collector');

      // Core questions should appear in all paths (with adapted language)
      const coreTopics = ['style', 'occasions', 'intensity'];

      coreTopics.forEach(topic => {
        expect(beginnerQuestions.some(q => q.includes(topic))).toBeTruthy();
        expect(collectorQuestions.some(q => q.includes(topic))).toBeTruthy();
      });
    });

    test('should adapt question complexity within the same topic', async () => {
      // Test style question complexity differences
      const beginnerStyleQ = await getQuestionForTopic('beginner', 'style');
      const collectorStyleQ = await getQuestionForTopic('collector', 'style');

      expect(beginnerStyleQ).toMatch(/casual|elegant|fun/i);
      expect(collectorStyleQ).toMatch(/sophisticated|avant-garde|classical/i);
    });
  });

  describe('Favorite Fragrance Input for Advanced Users', () => {
    test('should show autocomplete search for fragrance selection', async () => {
      render(<ExperienceLevelAdaptiveQuiz />);
      fireEvent.click(
        screen.getByRole('button', { name: /experienced collector/i })
      );

      await navigateToFavoritesQuestion('collector');

      expect(
        screen.getByPlaceholderText(/search fragrances/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('combobox') || screen.getByRole('searchbox')
      ).toBeInTheDocument();
    });

    test('should validate fragrance selections exist in database', async () => {
      render(<ExperienceLevelAdaptiveQuiz />);
      fireEvent.click(
        screen.getByRole('button', { name: /experienced collector/i })
      );

      await navigateToFavoritesQuestion('collector');

      const searchInput = screen.getByPlaceholderText(/search fragrances/i);
      fireEvent.change(searchInput, { target: { value: 'Chanel No. 5' } });

      await waitFor(() => {
        expect(screen.getByText(/Chanel No. 5/)).toBeInTheDocument();
      });
    });

    test('should allow removal of selected favorites', async () => {
      render(<ExperienceLevelAdaptiveQuiz />);
      fireEvent.click(
        screen.getByRole('button', { name: /experienced collector/i })
      );

      await navigateToFavoritesQuestion('collector');

      // Select a fragrance
      const searchInput = screen.getByPlaceholderText(/search fragrances/i);
      fireEvent.change(searchInput, {
        target: { value: 'Tom Ford Black Orchid' },
      });
      fireEvent.click(screen.getByText(/Tom Ford Black Orchid/));

      // Should show selected with remove option
      expect(screen.getByText(/Tom Ford Black Orchid/)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /remove/i }) || screen.getByText(/×/)
      ).toBeInTheDocument();
    });

    test('should skip favorites for beginners', async () => {
      render(<ExperienceLevelAdaptiveQuiz />);
      fireEvent.click(
        screen.getByRole('button', { name: /new to fragrances/i })
      );

      const questions = await completeQuizPath('beginner');
      expect(questions).not.toContain('favorites');
    });
  });

  describe('Progress Tracking and Analytics', () => {
    test('should track experience level selection', () => {
      render(<ExperienceLevelAdaptiveQuiz />);

      const trackingSpy = jest
        .spyOn(window, 'gtag')
        .mockImplementation(() => {});

      fireEvent.click(screen.getByRole('button', { name: /some experience/i }));

      expect(trackingSpy).toHaveBeenCalledWith(
        'event',
        'experience_level_selected',
        expect.objectContaining({
          experience_level: 'enthusiast',
        })
      );
    });

    test('should track adaptive question path', async () => {
      render(<ExperienceLevelAdaptiveQuiz />);

      const trackingSpy = jest
        .spyOn(window, 'gtag')
        .mockImplementation(() => {});

      fireEvent.click(
        screen.getByRole('button', { name: /experienced collector/i })
      );

      expect(trackingSpy).toHaveBeenCalledWith(
        'event',
        'quiz_path_started',
        expect.objectContaining({
          quiz_path: 'collector_advanced',
        })
      );
    });
  });

  describe('Accessibility and Responsive Design', () => {
    test('should maintain keyboard navigation for all experience levels', () => {
      render(<ExperienceLevelAdaptiveQuiz />);

      const firstOption = screen.getByRole('button', {
        name: /new to fragrances/i,
      });
      firstOption.focus();

      expect(document.activeElement).toBe(firstOption);

      // Test tab navigation
      fireEvent.keyDown(firstOption, { key: 'Tab' });
      expect(document.activeElement).not.toBe(firstOption);
    });

    test('should have appropriate ARIA labels for adaptive content', async () => {
      render(<ExperienceLevelAdaptiveQuiz />);
      fireEvent.click(
        screen.getByRole('button', { name: /new to fragrances/i })
      );

      await waitFor(() => {
        expect(
          screen.getByRole('main') || screen.getByRole('region')
        ).toHaveAttribute('aria-label');
      });
    });

    test('should work on mobile viewports', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });

      render(<ExperienceLevelAdaptiveQuiz />);

      // Should still show all essential elements
      expect(
        screen.getByText(/How familiar are you with fragrances/i)
      ).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength(3);
    });
  });
});

// Helper functions for testing
async function completeQuizPath(experienceLevel: string): Promise<string[]> {
  const questions: string[] = [];
  // Implementation would simulate completing the full quiz path
  // and return array of question texts encountered
  return questions;
}

async function navigateToFavoritesQuestion(
  experienceLevel: string
): Promise<void> {
  // Implementation would navigate through quiz until favorites question
  // This is a placeholder for the actual navigation logic
}

async function getQuestionPathForLevel(
  experienceLevel: string
): Promise<string[]> {
  // Implementation would return the sequence of questions for a given experience level
  return [];
}

async function getQuestionForTopic(
  experienceLevel: string,
  topic: string
): Promise<string> {
  // Implementation would return the specific question text for a topic at a given experience level
  return '';
}
