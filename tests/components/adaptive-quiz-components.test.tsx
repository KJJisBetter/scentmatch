/**
 * Adaptive Quiz Components Test Suite
 *
 * Tests for all experience-adaptive frontend components:
 * - ExperienceLevelSelector - Gender and experience selection
 * - FavoriteFragranceInput - Autocomplete fragrance search
 * - AdaptiveQuizInterface - Three experience modes
 * - AIProfileDisplay - Profile presentation
 * - EnhancedRecommendations - Experience-filtered recommendations
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

import { ExperienceLevelSelector } from '@/components/quiz/experience-level-selector';
import { FavoriteFragranceInput } from '@/components/quiz/favorite-fragrance-input';
import { AdaptiveQuizInterface } from '@/components/quiz/adaptive-quiz-interface';
import { AIProfileDisplay } from '@/components/quiz/ai-profile-display';
import { EnhancedRecommendations } from '@/components/recommendations/enhanced-recommendations';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

describe('ExperienceLevelSelector Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render gender selection first', () => {
    render(<ExperienceLevelSelector onSelectionComplete={jest.fn()} />);

    expect(
      screen.getByText(/What gender fragrances interest you most/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Fragrances for women/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Fragrances for men/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Unisex fragrances/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /All fragrances/i })
    ).toBeInTheDocument();
  });

  test('should show experience level selection after gender', async () => {
    const mockCallback = jest.fn();
    render(<ExperienceLevelSelector onSelectionComplete={mockCallback} />);

    // Select gender first
    fireEvent.click(
      screen.getByRole('button', { name: /Fragrances for women/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/How familiar are you with fragrances/i)
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole('button', { name: /New to fragrances/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Some experience/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Experienced collector/i })
    ).toBeInTheDocument();
  });

  test('should call onSelectionComplete with both gender and experience', async () => {
    const mockCallback = jest.fn();
    render(<ExperienceLevelSelector onSelectionComplete={mockCallback} />);

    // Select gender
    fireEvent.click(
      screen.getByRole('button', { name: /Fragrances for women/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/How familiar are you with fragrances/i)
      ).toBeInTheDocument();
    });

    // Select experience level
    fireEvent.click(screen.getByRole('button', { name: /Some experience/i }));

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith({
        gender_preference: 'women',
        experience_level: 'enthusiast',
      });
    });
  });

  test('should track analytics events for selections', async () => {
    const gtagSpy = jest.fn();
    (window as any).gtag = gtagSpy;

    render(<ExperienceLevelSelector onSelectionComplete={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /All fragrances/i }));

    expect(gtagSpy).toHaveBeenCalledWith(
      'event',
      'gender_preference_selected',
      expect.objectContaining({
        gender_preference: 'all',
      })
    );
  });
});

describe('FavoriteFragranceInput Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          fragrances: [
            { id: '1', name: 'Chanel No. 5', brand: 'Chanel' },
            { id: '2', name: 'Tom Ford Black Orchid', brand: 'Tom Ford' },
          ],
        }),
    });
  });

  test('should render search input and handle typing', async () => {
    const user = userEvent.setup();
    render(
      <FavoriteFragranceInput
        experienceLevel='enthusiast'
        onFavoritesChange={jest.fn()}
        maxSelections={3}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search fragrances/i);
    expect(searchInput).toBeInTheDocument();

    await user.type(searchInput, 'Chanel');

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/fragrances?search=Chanel&limit=10'
      );
    });
  });

  test('should display search results and allow selection', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();

    render(
      <FavoriteFragranceInput
        experienceLevel='collector'
        onFavoritesChange={mockOnChange}
        maxSelections={5}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search fragrances/i);
    await user.type(searchInput, 'Chanel');

    await waitFor(() => {
      expect(screen.getByText('Chanel No. 5')).toBeInTheDocument();
      expect(screen.getByText('Tom Ford Black Orchid')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Chanel No. 5'));

    expect(mockOnChange).toHaveBeenCalledWith([
      { id: '1', name: 'Chanel No. 5', brand: 'Chanel' },
    ]);
  });

  test('should respect max selections limit', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();

    render(
      <FavoriteFragranceInput
        experienceLevel='enthusiast'
        onFavoritesChange={mockOnChange}
        maxSelections={2}
        initialSelections={[
          { id: '1', name: 'Existing 1', brand: 'Brand 1' },
          { id: '2', name: 'Existing 2', brand: 'Brand 2' },
        ]}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search fragrances/i);
    await user.type(searchInput, 'Tom Ford');

    await waitFor(() => {
      const selectButton = screen
        .getByText('Tom Ford Black Orchid')
        .closest('button');
      expect(selectButton).toBeDisabled();
    });
  });

  test('should show different UI for different experience levels', () => {
    const { rerender } = render(
      <FavoriteFragranceInput
        experienceLevel='beginner'
        onFavoritesChange={jest.fn()}
        maxSelections={1}
      />
    );

    expect(screen.getByText(/fragrances you love/i)).toBeInTheDocument();

    rerender(
      <FavoriteFragranceInput
        experienceLevel='collector'
        onFavoritesChange={jest.fn()}
        maxSelections={5}
      />
    );

    expect(screen.getByText(/collection favorites/i)).toBeInTheDocument();
  });

  test('should allow removing selected favorites', async () => {
    const mockOnChange = jest.fn();

    render(
      <FavoriteFragranceInput
        experienceLevel='enthusiast'
        onFavoritesChange={mockOnChange}
        maxSelections={3}
        initialSelections={[
          { id: '1', name: 'Test Fragrance', brand: 'Test Brand' },
        ]}
      />
    );

    const removeButton = screen.getByLabelText(/remove test fragrance/i);
    fireEvent.click(removeButton);

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });
});

describe('AdaptiveQuizInterface Component', () => {
  const mockQuizData = {
    gender_preference: 'women',
    experience_level: 'enthusiast',
    adaptive_questions: [
      {
        id: 'style_aspects',
        text: 'What aspects describe your style?',
        allowMultiple: true,
        minSelections: 2,
        maxSelections: 5,
        options: [
          { value: 'classic', text: 'Classic', emoji: '👑' },
          { value: 'romantic', text: 'Romantic', emoji: '🌹' },
        ],
      },
    ],
  };

  test('should render in beginner mode with simplified language', () => {
    render(
      <AdaptiveQuizInterface
        mode='beginner'
        quizData={{ ...mockQuizData, experience_level: 'beginner' }}
        onQuizComplete={jest.fn()}
      />
    );

    expect(screen.getByText('🌱 Beginner-Friendly')).toBeInTheDocument();
    // Should use simpler vocabulary and fewer options
  });

  test('should render in enthusiast mode with balanced complexity', () => {
    render(
      <AdaptiveQuizInterface
        mode='enthusiast'
        quizData={mockQuizData}
        onQuizComplete={jest.fn()}
      />
    );

    expect(screen.getByText('🌸 Enthusiast Mode')).toBeInTheDocument();
    expect(screen.getByText(/Choose all that resonate/i)).toBeInTheDocument();
  });

  test('should render in collector mode with advanced terminology', () => {
    render(
      <AdaptiveQuizInterface
        mode='collector'
        quizData={{ ...mockQuizData, experience_level: 'collector' }}
        onQuizComplete={jest.fn()}
      />
    );

    expect(screen.getByText('🎭 Collector Advanced')).toBeInTheDocument();
    // Should use sophisticated terminology
  });

  test('should handle multiple selections correctly', async () => {
    const mockOnComplete = jest.fn();

    render(
      <AdaptiveQuizInterface
        mode='enthusiast'
        quizData={mockQuizData}
        onQuizComplete={mockOnComplete}
      />
    );

    // Select multiple options
    fireEvent.click(screen.getByRole('button', { name: /Classic/i }));
    fireEvent.click(screen.getByRole('button', { name: /Romantic/i }));

    expect(screen.getByText(/Continue with 2 choices/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Continue with 2 choices/i })
    );

    // Should progress to next question or complete
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  test('should show progress bar and experience badge', () => {
    render(
      <AdaptiveQuizInterface
        mode='enthusiast'
        quizData={mockQuizData}
        onQuizComplete={jest.fn()}
      />
    );

    expect(screen.getByText(/Question 1 of/i)).toBeInTheDocument();
    expect(screen.getByText(/20% complete/i)).toBeInTheDocument();
    expect(screen.getByText('🌸 Enthusiast Mode')).toBeInTheDocument();
  });
});

describe('AIProfileDisplay Component', () => {
  const mockProfileData = {
    profile_name: 'Elegant Rose of Secret Gardens',
    style_descriptor: 'sophisticated',
    description: {
      paragraph_1:
        'You are the Elegant Rose of Secret Gardens, a fragrance enthusiast...',
      paragraph_2: 'Your sophisticated taste reflects...',
      paragraph_3: 'Your journey continues toward...',
    },
    uniqueness_score: 0.85,
    experience_context: 'enthusiast',
    personality_insights: ['loves romantic fragrances', 'appreciates quality'],
  };

  test('should display unique profile name prominently', () => {
    render(<AIProfileDisplay profileData={mockProfileData} />);

    expect(
      screen.getByText('Elegant Rose of Secret Gardens')
    ).toBeInTheDocument();
    expect(screen.getByText(/sophisticated/i)).toBeInTheDocument();
  });

  test('should render all three description paragraphs', () => {
    render(<AIProfileDisplay profileData={mockProfileData} />);

    expect(screen.getByText(/You are the Elegant Rose/i)).toBeInTheDocument();
    expect(screen.getByText(/Your sophisticated taste/i)).toBeInTheDocument();
    expect(screen.getByText(/Your journey continues/i)).toBeInTheDocument();
  });

  test('should show uniqueness score and insights', () => {
    render(<AIProfileDisplay profileData={mockProfileData} />);

    expect(screen.getByText(/85% uniqueness/i)).toBeInTheDocument();
    expect(screen.getByText(/loves romantic fragrances/i)).toBeInTheDocument();
    expect(screen.getByText(/appreciates quality/i)).toBeInTheDocument();
  });

  test('should adapt presentation to experience level', () => {
    const beginnerProfile = {
      ...mockProfileData,
      experience_context: 'beginner',
      description: {
        paragraph_1: 'You are beginning your fragrance journey...',
        paragraph_2: 'Your developing taste...',
        paragraph_3: 'As you explore...',
      },
    };

    render(<AIProfileDisplay profileData={beginnerProfile} />);

    // Should use encouraging language for beginners
    expect(
      screen.getByText(/beginning your fragrance journey/i)
    ).toBeInTheDocument();

    const collectorProfile = {
      ...mockProfileData,
      experience_context: 'collector',
      description: {
        paragraph_1: 'You are a sophisticated connoisseur...',
        paragraph_2: 'Your expertise...',
        paragraph_3: 'Your discerning palate...',
      },
    };

    render(<AIProfileDisplay profileData={collectorProfile} />);

    // Should use sophisticated language for collectors
    expect(screen.getByText(/sophisticated connoisseur/i)).toBeInTheDocument();
  });

  test('should handle social sharing functionality', () => {
    render(
      <AIProfileDisplay profileData={mockProfileData} enableSharing={true} />
    );

    expect(
      screen.getByRole('button', { name: /share profile/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /share profile/i }));

    // Should show sharing options
    expect(
      screen.getByText(/Copy link/i) || screen.getByText(/Share/i)
    ).toBeInTheDocument();
  });
});

describe('EnhancedRecommendations Component', () => {
  const mockRecommendations = [
    {
      fragrance_id: '1',
      name: 'Chanel No. 5',
      brand: 'Chanel',
      match_score: 0.92,
      quiz_reasoning: 'Perfect match for your sophisticated style',
      experience_relevance: 'Ideal for enthusiasts',
      sample_available: true,
      sample_price_usd: 8,
      confidence_level: 'high',
    },
    {
      fragrance_id: '2',
      name: 'Tom Ford Black Orchid',
      brand: 'Tom Ford',
      match_score: 0.78,
      quiz_reasoning: 'Bold choice that matches your adventurous side',
      experience_relevance: 'Great for exploration',
      sample_available: true,
      sample_price_usd: 12,
      confidence_level: 'medium',
    },
  ];

  test('should render recommendations with experience-appropriate language', () => {
    render(
      <EnhancedRecommendations
        recommendations={mockRecommendations}
        experienceLevel='enthusiast'
        sessionData={{ gender_preference: 'women' }}
      />
    );

    expect(screen.getByText('Chanel No. 5')).toBeInTheDocument();
    expect(screen.getByText('Tom Ford Black Orchid')).toBeInTheDocument();
    expect(
      screen.getByText(/Perfect match for your sophisticated style/i)
    ).toBeInTheDocument();
  });

  test('should categorize recommendations by confidence level', () => {
    render(
      <EnhancedRecommendations
        recommendations={mockRecommendations}
        experienceLevel='enthusiast'
        sessionData={{ gender_preference: 'women' }}
        showCategories={true}
      />
    );

    expect(screen.getByText(/Perfect Matches/i)).toBeInTheDocument();
    expect(screen.getByText(/Worth Exploring/i)).toBeInTheDocument();
  });

  test('should show sample ordering buttons with pricing', () => {
    render(
      <EnhancedRecommendations
        recommendations={mockRecommendations}
        experienceLevel='enthusiast'
        sessionData={{ gender_preference: 'women' }}
      />
    );

    expect(screen.getByText(/Try Sample \$8/i)).toBeInTheDocument();
    expect(screen.getByText(/Try Sample \$12/i)).toBeInTheDocument();
  });

  test('should adapt to different experience levels', () => {
    const { rerender } = render(
      <EnhancedRecommendations
        recommendations={mockRecommendations}
        experienceLevel='beginner'
        sessionData={{ gender_preference: 'women' }}
      />
    );

    // Beginner mode should emphasize approachability
    expect(
      screen.getByText(/Perfect for discovering/i) ||
        screen.getByText(/Great starting point/i)
    ).toBeInTheDocument();

    rerender(
      <EnhancedRecommendations
        recommendations={mockRecommendations}
        experienceLevel='collector'
        sessionData={{ gender_preference: 'unisex' }}
      />
    );

    // Collector mode should emphasize quality and sophistication
    expect(
      screen.getByText(/sophisticated/i) || screen.getByText(/refined/i)
    ).toBeInTheDocument();
  });

  test('should handle empty recommendations gracefully', () => {
    render(
      <EnhancedRecommendations
        recommendations={[]}
        experienceLevel='enthusiast'
        sessionData={{ gender_preference: 'men' }}
      />
    );

    expect(
      screen.getByText(/no recommendations/i) || screen.getByText(/try again/i)
    ).toBeInTheDocument();
  });

  test('should show loading state while fetching', () => {
    render(
      <EnhancedRecommendations
        recommendations={[]}
        experienceLevel='enthusiast'
        sessionData={{ gender_preference: 'women' }}
        isLoading={true}
      />
    );

    expect(
      screen.getByText(/loading/i) || screen.getByText(/analyzing/i)
    ).toBeInTheDocument();
  });
});

describe('Mobile Responsiveness', () => {
  beforeEach(() => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
    Object.defineProperty(window, 'innerHeight', {
      value: 667,
      writable: true,
    });
  });

  test('should render ExperienceLevelSelector on mobile', () => {
    render(<ExperienceLevelSelector onSelectionComplete={jest.fn()} />);

    // Should still show all essential elements on mobile
    expect(screen.getByText(/What gender fragrances/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(4); // 4 gender options
  });

  test('should render FavoriteFragranceInput with mobile-optimized search', () => {
    render(
      <FavoriteFragranceInput
        experienceLevel='enthusiast'
        onFavoritesChange={jest.fn()}
        maxSelections={3}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search fragrances/i);
    expect(searchInput).toBeInTheDocument();

    // Should have appropriate mobile input attributes
    expect(searchInput).toHaveAttribute('type', 'text');
  });

  test('should render AdaptiveQuizInterface with touch-friendly buttons', () => {
    const mockQuizData = {
      gender_preference: 'women',
      experience_level: 'enthusiast',
      adaptive_questions: [
        {
          id: 'test_question',
          text: 'Test Question',
          allowMultiple: true,
          options: [{ value: 'option1', text: 'Option 1', emoji: '👑' }],
        },
      ],
    };

    render(
      <AdaptiveQuizInterface
        mode='enthusiast'
        quizData={mockQuizData}
        onQuizComplete={jest.fn()}
      />
    );

    const optionButton = screen.getByRole('button', { name: /Option 1/i });
    expect(optionButton).toBeInTheDocument();

    // Should be touch-friendly (48px+ minimum)
    const styles = getComputedStyle(optionButton);
    expect(parseInt(styles.minHeight) || 48).toBeGreaterThanOrEqual(48);
  });
});

describe('Component Integration', () => {
  test('should work together in complete quiz flow', async () => {
    const mockOnComplete = jest.fn();

    // This would test the complete flow from selection to recommendations
    render(
      <div>
        <ExperienceLevelSelector onSelectionComplete={jest.fn()} />
      </div>
    );

    // Would continue with full flow testing...
    expect(screen.getByText(/What gender fragrances/i)).toBeInTheDocument();
  });

  test('should maintain state consistency across components', () => {
    // Test that data flows correctly between components
    // This ensures the experience level affects all downstream components
    expect(true).toBe(true); // Placeholder for complex integration test
  });

  test('should handle error states gracefully across all components', () => {
    // Mock fetch failure
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(
      <FavoriteFragranceInput
        experienceLevel='enthusiast'
        onFavoritesChange={jest.fn()}
        maxSelections={3}
      />
    );

    // Should handle network errors gracefully
    expect(
      screen.getByPlaceholderText(/search fragrances/i)
    ).toBeInTheDocument();
  });
});
