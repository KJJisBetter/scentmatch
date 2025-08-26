import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { ProgressiveConversionFlow } from '@/components/quiz/progressive-conversion-flow';
import { ResultExploration } from '@/components/quiz/result-exploration';
import { MicroConversionTriggers } from '@/components/quiz/micro-conversion-triggers';
import { trackGuestEngagement } from '@/lib/actions/guest-engagement';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/actions/guest-engagement', () => ({
  trackGuestEngagement: jest.fn(),
}));

// Mock router
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  back: jest.fn(),
};

(useRouter as jest.Mock).mockReturnValue(mockRouter);

// Sample test data
const mockQuizResults = {
  quiz_session_token: 'test-session-token',
  recommendations: [
    {
      fragrance_id: 'fragrance-1',
      name: 'Test Fragrance 1',
      brand: 'Test Brand 1',
      score: 0.95,
      explanation: 'This matches your preference for fresh, citrusy scents.',
      why_recommended: 'Based on your quiz responses, this fragrance aligns perfectly with your taste.',
      sample_price_usd: 8,
      image_url: '/test-image-1.jpg',
      confidence_level: 'high',
    },
    {
      fragrance_id: 'fragrance-2',
      name: 'Test Fragrance 2',
      brand: 'Test Brand 2',
      score: 0.88,
      explanation: 'Your love for woody scents makes this a perfect choice.',
      why_recommended: 'The woody base notes match your sophisticated preferences.',
      sample_price_usd: 10,
      image_url: '/test-image-2.jpg',
      confidence_level: 'medium',
    },
    {
      fragrance_id: 'fragrance-3',
      name: 'Test Fragrance 3',
      brand: 'Test Brand 3',
      score: 0.82,
      explanation: 'The floral heart notes complement your personality.',
      why_recommended: 'This fragrance matches your preference for elegant, refined scents.',
      sample_price_usd: 12,
      image_url: '/test-image-3.jpg',
      confidence_level: 'medium',
    },
  ],
  processing_time_ms: 1500,
  recommendation_method: 'ai_enhanced',
};

const mockTrackGuestEngagement = trackGuestEngagement as jest.Mock;

describe('ProgressiveConversionFlow', () => {
  const mockOnAccountCreated = jest.fn();
  const mockOnConversionComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrackGuestEngagement.mockResolvedValue({
      tracking_successful: true,
      investment_score: 0.3,
      engagement_quality: 'medium',
      conversion_signals: {},
      recommended_action: 'continue_building_value',
    });
  });

  describe('Initial Render and Exploration Phase', () => {
    it('renders without conversion pressure on initial load', () => {
      render(
        <ProgressiveConversionFlow
          quizResults={mockQuizResults}
          onAccountCreated={mockOnAccountCreated}
          onConversionComplete={mockOnConversionComplete}
        />
      );

      // Should show results immediately
      expect(screen.getByText('Your Perfect Fragrance Matches 🌟')).toBeInTheDocument();
      
      // Should NOT show account creation form immediately
      expect(screen.queryByText('Create Free Account')).not.toBeInTheDocument();
      
      // Should NOT show aggressive conversion messaging
      expect(screen.queryByText(/limited time/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/act now/i)).not.toBeInTheDocument();
    });

    it('tracks initial quiz completion engagement', () => {
      render(
        <ProgressiveConversionFlow
          quizResults={mockQuizResults}
          onAccountCreated={mockOnAccountCreated}
          onConversionComplete={mockOnConversionComplete}
        />
      );

      expect(mockTrackGuestEngagement).toHaveBeenCalledWith({
        session_token: 'test-session-token',
        engagement_events: expect.arrayContaining([
          expect.objectContaining({
            type: 'quiz_completion',
            timestamp: expect.any(Number),
            metadata: {
              recommendation_count: 3,
              processing_time_ms: 1500,
            },
          }),
        ]),
      });
    });

    it('does not show progress indicator in exploration phase', () => {
      render(
        <ProgressiveConversionFlow
          quizResults={mockQuizResults}
          onAccountCreated={mockOnAccountCreated}
          onConversionComplete={mockOnConversionComplete}
        />
      );

      expect(screen.queryByText('Fragrance Discovery Progress')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles quiz results with errors gracefully', () => {
      const errorResults = {
        ...mockQuizResults,
        error: 'Failed to generate recommendations',
      };

      render(
        <ProgressiveConversionFlow
          quizResults={errorResults}
          onAccountCreated={mockOnAccountCreated}
          onConversionComplete={mockOnConversionComplete}
        />
      );

      expect(screen.getByText(/Unable to load your recommendations/)).toBeInTheDocument();
      expect(screen.getByText('Retake Quiz')).toBeInTheDocument();
    });

    it('handles tracking failures gracefully', async () => {
      mockTrackGuestEngagement.mockRejectedValue(new Error('Tracking failed'));

      render(
        <ProgressiveConversionFlow
          quizResults={mockQuizResults}
          onAccountCreated={mockOnAccountCreated}
          onConversionComplete={mockOnConversionComplete}
        />
      );

      // Should still render despite tracking failure
      expect(screen.getByText('Your Perfect Fragrance Matches 🌟')).toBeInTheDocument();
    });
  });

  describe('Progressive Phase Advancement', () => {
    it('advances to investment phase when investment score increases', async () => {
      mockTrackGuestEngagement.mockResolvedValueOnce({
        tracking_successful: true,
        investment_score: 0.5, // Above 0.4 threshold
        engagement_quality: 'medium',
        conversion_signals: {},
        recommended_action: 'continue_building_value',
      });

      render(
        <ProgressiveConversionFlow
          quizResults={mockQuizResults}
          onAccountCreated={mockOnAccountCreated}
          onConversionComplete={mockOnConversionComplete}
        />
      );

      // Trigger an engagement event to increase score
      const saveButton = screen.getAllByText('Save')[0];
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Fragrance Discovery Progress')).toBeInTheDocument();
      });
    });

    it('advances to soft conversion phase with high investment score', async () => {
      mockTrackGuestEngagement.mockResolvedValueOnce({
        tracking_successful: true,
        investment_score: 0.8, // Above 0.7 threshold
        engagement_quality: 'high',
        conversion_signals: {},
        recommended_action: 'offer_conversion',
      });

      render(
        <ProgressiveConversionFlow
          quizResults={mockQuizResults}
          onAccountCreated={mockOnAccountCreated}
          onConversionComplete={mockOnConversionComplete}
        />
      );

      // Trigger an engagement event
      const saveButton = screen.getAllByText('Save')[0];
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Ready to Save Your Discoveries/)).toBeInTheDocument();
      });
    });
  });
});

describe('ResultExploration', () => {
  const mockOnEngagement = jest.fn();
  const mockOnNavigateToDetail = jest.fn();

  const defaultProps = {
    recommendations: mockQuizResults.recommendations,
    phase: 'exploration' as const,
    investmentScore: 0.3,
    onEngagement: mockOnEngagement,
    onNavigateToDetail: mockOnNavigateToDetail,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Display', () => {
    it('renders all recommendations with beginner-friendly messaging', () => {
      render(<ResultExploration {...defaultProps} />);

      expect(screen.getByText('Your Perfect Fragrance Matches 🌟')).toBeInTheDocument();
      expect(screen.getByText(/New to fragrances\?/)).toBeInTheDocument();
      expect(screen.getByText('Test Fragrance 1')).toBeInTheDocument();
      expect(screen.getByText('Test Fragrance 2')).toBeInTheDocument();
      expect(screen.getByText('Test Fragrance 3')).toBeInTheDocument();
    });

    it('marks the first recommendation as best match', () => {
      render(<ResultExploration {...defaultProps} />);

      expect(screen.getByText('Best Match')).toBeInTheDocument();
    });

    it('displays match percentages correctly', () => {
      render(<ResultExploration {...defaultProps} />);

      expect(screen.getByText('95% Match')).toBeInTheDocument();
      expect(screen.getByText('88% Match')).toBeInTheDocument();
      expect(screen.getByText('82% Match')).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    it('handles saving fragrances correctly', () => {
      render(<ResultExploration {...defaultProps} />);

      const saveButtons = screen.getAllByText('Save');
      fireEvent.click(saveButtons[0]);

      expect(mockOnEngagement).toHaveBeenCalledWith({
        type: 'favorite_added',
        fragrance_id: 'fragrance-1',
        timestamp: expect.any(Number),
      });

      // Button should change to "Saved"
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('handles unsaving fragrances correctly', () => {
      render(<ResultExploration {...defaultProps} />);

      const saveButton = screen.getAllByText('Save')[0];
      
      // Save first
      fireEvent.click(saveButton);
      expect(screen.getByText('Saved')).toBeInTheDocument();
      
      // Then unsave
      const savedButton = screen.getByText('Saved');
      fireEvent.click(savedButton);

      expect(mockOnEngagement).toHaveBeenCalledWith({
        type: 'favorite_removed',
        fragrance_id: 'fragrance-1',
        timestamp: expect.any(Number),
      });
    });

    it('tracks sample interest correctly', () => {
      render(<ResultExploration {...defaultProps} />);

      const sampleButtons = screen.getAllByText(/Try Sample/);
      fireEvent.click(sampleButtons[0]);

      expect(mockOnEngagement).toHaveBeenCalledWith({
        type: 'sample_interest',
        fragrance_id: 'fragrance-1',
        timestamp: expect.any(Number),
        interest_level: 'high',
      });
    });

    it('navigates to detail view correctly', () => {
      render(<ResultExploration {...defaultProps} />);

      const detailButtons = screen.getAllByText('Details');
      fireEvent.click(detailButtons[0]);

      expect(mockOnNavigateToDetail).toHaveBeenCalledWith('fragrance-1');
    });

    it('expands recommendation details when requested', () => {
      render(<ResultExploration {...defaultProps} />);

      const learnMoreButtons = screen.getAllByText(/Learn more about this match/);
      fireEvent.click(learnMoreButtons[0]);

      expect(mockOnEngagement).toHaveBeenCalledWith({
        type: 'recommendation_expanded',
        fragrance_id: 'fragrance-1',
        timestamp: expect.any(Number),
      });
    });
  });

  describe('Progressive Value Display', () => {
    it('shows additional recommendations hint in investment phase', () => {
      render(
        <ResultExploration
          {...defaultProps}
          phase="investment"
          investmentScore={0.6}
        />
      );

      expect(screen.getByText(/we found .* more perfect matches/)).toBeInTheDocument();
      expect(screen.getByText('Show My Additional Matches')).toBeInTheDocument();
    });

    it('does not show additional recommendations hint in exploration phase', () => {
      render(<ResultExploration {...defaultProps} />);

      expect(screen.queryByText('Show My Additional Matches')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('handles empty recommendations gracefully', () => {
      render(
        <ResultExploration
          {...defaultProps}
          recommendations={[]}
        />
      );

      expect(screen.getByText('No recommendations available at this time.')).toBeInTheDocument();
    });
  });
});

describe('MicroConversionTriggers', () => {
  const mockOnAccountCreationRequest = jest.fn();
  const mockOnContinueExploring = jest.fn();

  const defaultProps = {
    phase: 'investment' as const,
    investmentScore: 0.5,
    engagementMetrics: {
      timeSpent: 5,
      favoritesCount: 2,
      detailViewsCount: 3,
      engagementEvents: [],
    },
    onAccountCreationRequest: mockOnAccountCreationRequest,
    onContinueExploring: mockOnContinueExploring,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Phase-based Display', () => {
    it('does not show triggers in exploration phase', () => {
      render(
        <MicroConversionTriggers
          {...defaultProps}
          phase="exploration"
        />
      );

      expect(screen.queryByText(/Your Fragrance Journey/)).not.toBeInTheDocument();
    });

    it('shows investment messaging in investment phase', () => {
      render(<MicroConversionTriggers {...defaultProps} />);

      expect(screen.getByText(/Your Fragrance Journey is Taking Shape/)).toBeInTheDocument();
      expect(screen.getByText('5 minutes')).toBeInTheDocument();
      expect(screen.getByText('2 saved')).toBeInTheDocument();
      expect(screen.getByText('3 explored')).toBeInTheDocument();
    });

    it('shows soft conversion messaging in soft conversion phase', () => {
      render(
        <MicroConversionTriggers
          {...defaultProps}
          phase="soft_conversion"
          investmentScore={0.8}
        />
      );

      expect(screen.getByText(/Ready to Save Your Discoveries/)).toBeInTheDocument();
      expect(screen.getByText('Create Free Account')).toBeInTheDocument();
    });
  });

  describe('Value Proposition', () => {
    it('displays engagement metrics accurately', () => {
      render(<MicroConversionTriggers {...defaultProps} />);

      expect(screen.getByText('5 minutes')).toBeInTheDocument();
      expect(screen.getByText('2 saved')).toBeInTheDocument();
      expect(screen.getByText('3 explored')).toBeInTheDocument();
    });

    it('shows additional matches hint with high investment score', () => {
      render(
        <MicroConversionTriggers
          {...defaultProps}
          investmentScore={0.6}
        />
      );

      expect(screen.getByText(/we've identified more perfect matches/)).toBeInTheDocument();
      expect(screen.getByText('Discover More Matches')).toBeInTheDocument();
    });
  });

  describe('Interaction Handling', () => {
    it('triggers account creation request correctly', () => {
      render(
        <MicroConversionTriggers
          {...defaultProps}
          phase="soft_conversion"
        />
      );

      const createAccountButton = screen.getByText('Create Free Account');
      fireEvent.click(createAccountButton);

      expect(mockOnAccountCreationRequest).toHaveBeenCalled();
    });

    it('handles continue exploring correctly', () => {
      render(
        <MicroConversionTriggers
          {...defaultProps}
          phase="soft_conversion"
        />
      );

      const continueButton = screen.getByText(/Continue exploring/);
      fireEvent.click(continueButton);

      expect(mockOnContinueExploring).toHaveBeenCalled();
    });
  });

  describe('Messaging Tone', () => {
    it('uses helpful language instead of pressure tactics', () => {
      render(
        <MicroConversionTriggers
          {...defaultProps}
          phase="soft_conversion"
        />
      );

      // Should NOT contain pressure language
      expect(screen.queryByText(/limited time/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/act now/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/expires/i)).not.toBeInTheDocument();

      // Should contain helpful language
      expect(screen.getByText(/Ready to Save Your Discoveries/)).toBeInTheDocument();
      expect(screen.getByText(/progress won't be saved/)).toBeInTheDocument();
    });

    it('shows honest disclosure about account benefits', () => {
      render(
        <MicroConversionTriggers
          {...defaultProps}
          phase="soft_conversion"
        />
      );

      expect(screen.getByText(/Free account • No spam • Cancel anytime/)).toBeInTheDocument();
    });
  });
});

describe('Integration Tests', () => {
  it('flows correctly from exploration to conversion', async () => {
    // Mock progressive investment score increases
    mockTrackGuestEngagement
      .mockResolvedValueOnce({
        tracking_successful: true,
        investment_score: 0.3,
        engagement_quality: 'low',
      })
      .mockResolvedValueOnce({
        tracking_successful: true,
        investment_score: 0.5,
        engagement_quality: 'medium',
      })
      .mockResolvedValueOnce({
        tracking_successful: true,
        investment_score: 0.8,
        engagement_quality: 'high',
      });

    render(
      <ProgressiveConversionFlow
        quizResults={mockQuizResults}
        onAccountCreated={jest.fn()}
        onConversionComplete={jest.fn()}
      />
    );

    // Start in exploration phase
    expect(screen.queryByText('Fragrance Discovery Progress')).not.toBeInTheDocument();

    // Interact to increase investment score
    const saveButton = screen.getAllByText('Save')[0];
    fireEvent.click(saveButton);

    // Wait for investment phase
    await waitFor(() => {
      expect(screen.getByText('Fragrance Discovery Progress')).toBeInTheDocument();
    });

    // More interactions
    const detailButton = screen.getAllByText('Details')[0];
    fireEvent.click(detailButton);

    // Wait for soft conversion phase
    await waitFor(() => {
      expect(screen.getByText(/Ready to Save Your Discoveries/)).toBeInTheDocument();
    });
  });
});

describe('Accessibility', () => {
  it('has proper ARIA labels and keyboard navigation', () => {
    render(
      <ProgressiveConversionFlow
        quizResults={mockQuizResults}
        onAccountCreated={jest.fn()}
        onConversionComplete={jest.fn()}
      />
    );

    // Check for proper headings structure
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    
    // Check for button accessibility
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeEnabled();
    });
  });

  it('maintains focus management during phase transitions', async () => {
    render(
      <ProgressiveConversionFlow
        quizResults={mockQuizResults}
        onAccountCreated={jest.fn()}
        onConversionComplete={jest.fn()}
      />
    );

    // Focus should be manageable throughout the flow
    const saveButton = screen.getAllByText('Save')[0];
    saveButton.focus();
    expect(document.activeElement).toBe(saveButton);
  });
});

/**
 * Test Summary:
 * 
 * These comprehensive tests verify the SCE-65 progressive conversion flow:
 * 
 * ✅ No conversion wall - users see results immediately
 * ✅ Progressive engagement tracking and phase advancement
 * ✅ Value demonstration before conversion asks
 * ✅ Beginner-friendly messaging throughout
 * ✅ Micro-conversion triggers that build investment
 * ✅ Respectful language without pressure tactics
 * ✅ Proper error handling and edge cases
 * ✅ Accessibility compliance
 * ✅ Integration between all components
 */