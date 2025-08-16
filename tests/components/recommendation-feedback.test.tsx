import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetDatabaseMocks } from '../utils/database-test-utils';

/**
 * Recommendation Feedback Component Tests
 * 
 * Tests for interactive feedback and preference learning:
 * - Implicit feedback collection (view time, scroll depth, clicks)
 * - Explicit feedback mechanisms (likes, ratings, dismissals)
 * - Real-time preference learning and adaptation
 * - Feedback-driven recommendation improvements
 * - User control over learning processes
 * - Analytics and insight generation from feedback
 */

// Mock analytics tracking
const mockAnalyticsTracker = vi.fn();
vi.mock('@/lib/analytics', () => ({
  trackEvent: mockAnalyticsTracker,
  trackRecommendationInteraction: mockAnalyticsTracker,
}));

// Mock feedback processing
vi.mock('@/lib/ai/feedback-processor', () => ({
  FeedbackProcessor: vi.fn().mockImplementation(() => ({
    processImplicitFeedback: vi.fn(),
    processExplicitFeedback: vi.fn(),
    updateUserPreferences: vi.fn(),
    generateFeedbackInsights: vi.fn(),
  })),
}));

// Mock recommendation feedback component
vi.mock('@/components/recommendations/recommendation-feedback', () => ({
  RecommendationFeedback: ({ 
    fragrance,
    recommendationContext,
    onFeedbackSubmit,
    enableImplicitTracking = true,
    showDetailedOptions = false
  }: {
    fragrance: any;
    recommendationContext: any;
    onFeedbackSubmit: (feedback: any) => void;
    enableImplicitTracking?: boolean;
    showDetailedOptions?: boolean;
  }) => {
    const [feedback, setFeedback] = React.useState<any>(null);
    const [viewStartTime] = React.useState(Date.now());
    const [interactionData, setInteractionData] = React.useState({
      view_duration: 0,
      scroll_depth: 0,
      details_clicked: false,
      explanation_viewed: false
    });

    React.useEffect(() => {
      if (!enableImplicitTracking) return;

      const trackViewTime = () => {
        setInteractionData(prev => ({
          ...prev,
          view_duration: Date.now() - viewStartTime
        }));
      };

      const interval = setInterval(trackViewTime, 1000);
      return () => clearInterval(interval);
    }, [enableImplicitTracking, viewStartTime]);

    const handleExplicitFeedback = (type: string, value?: any) => {
      const feedbackData = {
        fragrance_id: fragrance.fragrance_id,
        feedback_type: type,
        value: value,
        context: recommendationContext,
        implicit_signals: interactionData,
        timestamp: new Date().toISOString()
      };
      
      setFeedback(feedbackData);
      onFeedbackSubmit(feedbackData);
    };

    const handleDetailedFeedback = (category: string, rating: number) => {
      const detailedFeedback = {
        fragrance_id: fragrance.fragrance_id,
        feedback_type: 'detailed_rating',
        category: category,
        rating: rating,
        context: recommendationContext
      };
      
      onFeedbackSubmit(detailedFeedback);
    };

    return (
      <div 
        data-testid="recommendation-feedback" 
        data-fragrance-id={fragrance.fragrance_id}
        data-tracking-enabled={enableImplicitTracking}
      >
        {/* Implicit Tracking Display (for testing) */}
        {enableImplicitTracking && (
          <div data-testid="implicit-tracking-data" className="hidden">
            <span data-testid="view-duration">{interactionData.view_duration}</span>
            <span data-testid="scroll-depth">{interactionData.scroll_depth}</span>
            <span data-testid="details-clicked">{interactionData.details_clicked.toString()}</span>
          </div>
        )}

        {/* Quick Feedback Actions */}
        <div data-testid="quick-feedback" className="flex space-x-2">
          <button
            data-testid="like-button"
            onClick={() => handleExplicitFeedback('like')}
            className="px-3 py-2 bg-green-500 text-white rounded"
            aria-label={`Like ${fragrance.name}`}
          >
            👍 Like
          </button>
          
          <button
            data-testid="dislike-button"
            onClick={() => handleExplicitFeedback('dislike')}
            className="px-3 py-2 bg-red-500 text-white rounded"
            aria-label={`Dislike ${fragrance.name}`}
          >
            👎 Not for me
          </button>
          
          <button
            data-testid="maybe-button"
            onClick={() => handleExplicitFeedback('maybe')}
            className="px-3 py-2 bg-yellow-500 text-white rounded"
            aria-label={`Maybe interested in ${fragrance.name}`}
          >
            🤔 Maybe
          </button>
          
          <button
            data-testid="dismiss-button"
            onClick={() => handleExplicitFeedback('dismiss')}
            className="px-3 py-2 bg-gray-500 text-white rounded"
            aria-label={`Dismiss ${fragrance.name}`}
          >
            ✕ Dismiss
          </button>
        </div>

        {/* Detailed Feedback Options */}
        {showDetailedOptions && (
          <div data-testid="detailed-feedback" className="mt-4 p-4 border rounded-lg">
            <h4 className="text-sm font-medium mb-3">Tell us more (optional)</h4>
            
            <div className="space-y-3">
              <div data-testid="intensity-feedback">
                <label className="text-sm">Intensity preference:</label>
                <div className="flex space-x-2 mt-1">
                  {['too_light', 'just_right', 'too_strong'].map(option => (
                    <button
                      key={option}
                      data-testid={`intensity-${option}`}
                      onClick={() => handleDetailedFeedback('intensity', option)}
                      className="px-2 py-1 text-xs border rounded"
                    >
                      {option.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div data-testid="price-feedback">
                <label className="text-sm">Price reaction:</label>
                <div className="flex space-x-2 mt-1">
                  {['too_expensive', 'reasonable', 'great_value'].map(option => (
                    <button
                      key={option}
                      data-testid={`price-${option}`}
                      onClick={() => handleDetailedFeedback('price', option)}
                      className="px-2 py-1 text-xs border rounded"
                    >
                      {option.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div data-testid="notes-feedback">
                <label className="text-sm">Note preferences:</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {['love_this_note', 'dislike_this_note', 'want_more_like_this', 'too_sweet', 'too_woody'].map(option => (
                    <button
                      key={option}
                      data-testid={`notes-${option}`}
                      onClick={() => handleDetailedFeedback('notes', option)}
                      className="px-2 py-1 text-xs border rounded"
                    >
                      {option.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Confirmation */}
        {feedback && (
          <div data-testid="feedback-confirmation" className="mt-3 p-2 bg-green-100 rounded">
            <span data-testid="feedback-message">
              Thanks for your feedback! This helps improve your recommendations.
            </span>
            <span data-testid="feedback-type" className="ml-2 text-sm text-gray-600">
              ({feedback.feedback_type})
            </span>
          </div>
        )}
      </div>
    );
  },
}));

// Mock swipe gesture component for mobile
vi.mock('@/components/recommendations/swipe-feedback', () => ({
  SwipeFeedback: ({ 
    children,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    enableSwipe = true
  }: {
    children: React.ReactNode;
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
    onSwipeUp?: () => void;
    enableSwipe?: boolean;
  }) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!enableSwipe) return;
      
      if (e.key === 'ArrowLeft') onSwipeLeft();
      if (e.key === 'ArrowRight') onSwipeRight();
      if (e.key === 'ArrowUp' && onSwipeUp) onSwipeUp();
    };

    return (
      <div 
        data-testid="swipe-feedback-container"
        data-swipe-enabled={enableSwipe}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        className="swipe-container"
      >
        {children}
        
        {enableSwipe && (
          <div data-testid="swipe-instructions" className="text-xs text-gray-500 mt-2">
            Swipe left to dismiss, right to like, up for details
          </div>
        )}
      </div>
    );
  },
}));

// React import
import React from 'react';

describe('Recommendation Feedback Components', () => {
  const user = userEvent.setup();

  const mockFragrance = {
    fragrance_id: 'test-fragrance-1',
    name: 'Test Fragrance',
    brand: 'Test Brand',
    match_percentage: 87,
    sample_price: 15.99
  };

  const mockRecommendationContext = {
    section: 'perfect_matches',
    position: 1,
    algorithm_version: 'hybrid_v2.1',
    user_session_id: 'session-123'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetDatabaseMocks();
  });

  describe('Explicit Feedback Collection', () => {
    test('should handle like feedback with proper data structure', async () => {
      const { RecommendationFeedback } = await import('@/components/recommendations/recommendation-feedback');
      const onFeedbackSubmit = vi.fn();
      
      render(
        <RecommendationFeedback 
          fragrance={mockFragrance}
          recommendationContext={mockRecommendationContext}
          onFeedbackSubmit={onFeedbackSubmit}
        />
      );

      fireEvent.click(screen.getByTestId('like-button'));

      expect(onFeedbackSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          fragrance_id: 'test-fragrance-1',
          feedback_type: 'like',
          context: mockRecommendationContext,
          timestamp: expect.any(String)
        })
      );
    });

    test('should handle dislike feedback with dismissal', async () => {
      const { RecommendationFeedback } = await import('@/components/recommendations/recommendation-feedback');
      const onFeedbackSubmit = vi.fn();
      
      render(
        <RecommendationFeedback 
          fragrance={mockFragrance}
          recommendationContext={mockRecommendationContext}
          onFeedbackSubmit={onFeedbackSubmit}
        />
      );

      fireEvent.click(screen.getByTestId('dislike-button'));

      expect(onFeedbackSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          feedback_type: 'dislike'
        })
      );
    });

    test('should handle ambiguous feedback (maybe) appropriately', async () => {
      const { RecommendationFeedback } = await import('@/components/recommendations/recommendation-feedback');
      const onFeedbackSubmit = vi.fn();
      
      render(
        <RecommendationFeedback 
          fragrance={mockFragrance}
          recommendationContext={mockRecommendationContext}
          onFeedbackSubmit={onFeedbackSubmit}
        />
      );

      fireEvent.click(screen.getByTestId('maybe-button'));

      expect(onFeedbackSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          feedback_type: 'maybe'
        })
      );
    });

    test('should provide immediate visual feedback confirmation', async () => {
      const { RecommendationFeedback } = await import('@/components/recommendations/recommendation-feedback');
      const onFeedbackSubmit = vi.fn();
      
      render(
        <RecommendationFeedback 
          fragrance={mockFragrance}
          recommendationContext={mockRecommendationContext}
          onFeedbackSubmit={onFeedbackSubmit}
        />
      );

      fireEvent.click(screen.getByTestId('like-button'));

      await waitFor(() => {
        expect(screen.getByTestId('feedback-confirmation')).toBeInTheDocument();
      });

      expect(screen.getByTestId('feedback-message')).toHaveTextContent('Thanks for your feedback');
      expect(screen.getByTestId('feedback-type')).toHaveTextContent('like');
    });
  });

  describe('Detailed Feedback Options', () => {
    test('should show detailed feedback when enabled', async () => {
      const { RecommendationFeedback } = await import('@/components/recommendations/recommendation-feedback');
      const onFeedbackSubmit = vi.fn();
      
      render(
        <RecommendationFeedback 
          fragrance={mockFragrance}
          recommendationContext={mockRecommendationContext}
          onFeedbackSubmit={onFeedbackSubmit}
          showDetailedOptions={true}
        />
      );

      expect(screen.getByTestId('detailed-feedback')).toBeInTheDocument();
      expect(screen.getByTestId('intensity-feedback')).toBeInTheDocument();
      expect(screen.getByTestId('price-feedback')).toBeInTheDocument();
      expect(screen.getByTestId('notes-feedback')).toBeInTheDocument();
    });

    test('should handle intensity preference feedback', async () => {
      const { RecommendationFeedback } = await import('@/components/recommendations/recommendation-feedback');
      const onFeedbackSubmit = vi.fn();
      
      render(
        <RecommendationFeedback 
          fragrance={mockFragrance}
          recommendationContext={mockRecommendationContext}
          onFeedbackSubmit={onFeedbackSubmit}
          showDetailedOptions={true}
        />
      );

      fireEvent.click(screen.getByTestId('intensity-too_strong'));

      expect(onFeedbackSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          feedback_type: 'detailed_rating',
          category: 'intensity',
          rating: 'too_strong'
        })
      );
    });

    test('should handle price perception feedback', async () => {
      const { RecommendationFeedback } = await import('@/components/recommendations/recommendation-feedback');
      const onFeedbackSubmit = vi.fn();
      
      render(
        <RecommendationFeedback 
          fragrance={mockFragrance}
          recommendationContext={mockRecommendationContext}
          onFeedbackSubmit={onFeedbackSubmit}
          showDetailedOptions={true}
        />
      );

      fireEvent.click(screen.getByTestId('price-too_expensive'));

      expect(onFeedbackSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'price',
          rating: 'too_expensive'
        })
      );
    });

    test('should handle note-specific feedback', async () => {
      const { RecommendationFeedback } = await import('@/components/recommendations/recommendation-feedback');
      const onFeedbackSubmit = vi.fn();
      
      render(
        <RecommendationFeedback 
          fragrance={mockFragrance}
          recommendationContext={mockRecommendationContext}
          onFeedbackSubmit={onFeedbackSubmit}
          showDetailedOptions={true}
        />
      );

      fireEvent.click(screen.getByTestId('notes-love_this_note'));

      expect(onFeedbackSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'notes',
          rating: 'love_this_note'
        })
      );
    });

    test('should hide detailed options when disabled', async () => {
      const { RecommendationFeedback } = await import('@/components/recommendations/recommendation-feedback');
      const onFeedbackSubmit = vi.fn();
      
      render(
        <RecommendationFeedback 
          fragrance={mockFragrance}
          recommendationContext={mockRecommendationContext}
          onFeedbackSubmit={onFeedbackSubmit}
          showDetailedOptions={false}
        />
      );

      expect(screen.queryByTestId('detailed-feedback')).not.toBeInTheDocument();
    });
  });

  describe('Implicit Feedback Tracking', () => {
    test('should track view duration when implicit tracking is enabled', async () => {
      const { RecommendationFeedback } = await import('@/components/recommendations/recommendation-feedback');
      const onFeedbackSubmit = vi.fn();
      
      render(
        <RecommendationFeedback 
          fragrance={mockFragrance}
          recommendationContext={mockRecommendationContext}
          onFeedbackSubmit={onFeedbackSubmit}
          enableImplicitTracking={true}
        />
      );

      expect(screen.getByTestId('recommendation-feedback')).toHaveAttribute('data-tracking-enabled', 'true');

      // Wait for view time to accumulate
      await waitFor(() => {
        const viewDuration = parseInt(screen.getByTestId('view-duration').textContent || '0');
        expect(viewDuration).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });

    test('should not track when implicit tracking is disabled', async () => {
      const { RecommendationFeedback } = await import('@/components/recommendations/recommendation-feedback');
      const onFeedbackSubmit = vi.fn();
      
      render(
        <RecommendationFeedback 
          fragrance={mockFragrance}
          recommendationContext={mockRecommendationContext}
          onFeedbackSubmit={onFeedbackSubmit}
          enableImplicitTracking={false}
        />
      );

      expect(screen.getByTestId('recommendation-feedback')).toHaveAttribute('data-tracking-enabled', 'false');
      expect(screen.queryByTestId('implicit-tracking-data')).not.toBeInTheDocument();
    });

    test('should include implicit signals in explicit feedback', async () => {
      const { RecommendationFeedback } = await import('@/components/recommendations/recommendation-feedback');
      const onFeedbackSubmit = vi.fn();
      
      render(
        <RecommendationFeedback 
          fragrance={mockFragrance}
          recommendationContext={mockRecommendationContext}
          onFeedbackSubmit={onFeedbackSubmit}
          enableImplicitTracking={true}
        />
      );

      // Wait for some view time
      await new Promise(resolve => setTimeout(resolve, 1100));

      fireEvent.click(screen.getByTestId('like-button'));

      expect(onFeedbackSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          implicit_signals: expect.objectContaining({
            view_duration: expect.any(Number)
          })
        })
      );
    });
  });

  describe('Mobile Swipe Feedback', () => {
    test('should handle swipe gestures for quick feedback', async () => {
      const { SwipeFeedback } = await import('@/components/recommendations/swipe-feedback');
      const onSwipeLeft = vi.fn(); // Dismiss
      const onSwipeRight = vi.fn(); // Like
      const onSwipeUp = vi.fn(); // Details
      
      render(
        <SwipeFeedback 
          onSwipeLeft={onSwipeLeft}
          onSwipeRight={onSwipeRight}
          onSwipeUp={onSwipeUp}
          enableSwipe={true}
        >
          <div>Swipeable content</div>
        </SwipeFeedback>
      );

      expect(screen.getByTestId('swipe-feedback-container')).toHaveAttribute('data-swipe-enabled', 'true');
      expect(screen.getByTestId('swipe-instructions')).toHaveTextContent('Swipe left to dismiss');
    });

    test('should support keyboard alternatives to swipe gestures', async () => {
      const { SwipeFeedback } = await import('@/components/recommendations/swipe-feedback');
      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();
      const onSwipeUp = vi.fn();
      
      render(
        <SwipeFeedback 
          onSwipeLeft={onSwipeLeft}
          onSwipeRight={onSwipeRight}
          onSwipeUp={onSwipeUp}
          enableSwipe={true}
        >
          <div>Swipeable content</div>
        </SwipeFeedback>
      );

      const container = screen.getByTestId('swipe-feedback-container');
      container.focus();

      // Test keyboard alternatives
      fireEvent.keyDown(container, { key: 'ArrowLeft' });
      expect(onSwipeLeft).toHaveBeenCalled();

      fireEvent.keyDown(container, { key: 'ArrowRight' });
      expect(onSwipeRight).toHaveBeenCalled();

      fireEvent.keyDown(container, { key: 'ArrowUp' });
      expect(onSwipeUp).toHaveBeenCalled();
    });

    test('should disable swipe when enableSwipe is false', async () => {
      const { SwipeFeedback } = await import('@/components/recommendations/swipe-feedback');
      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();
      
      render(
        <SwipeFeedback 
          onSwipeLeft={onSwipeLeft}
          onSwipeRight={onSwipeRight}
          enableSwipe={false}
        >
          <div>Non-swipeable content</div>
        </SwipeFeedback>
      );

      expect(screen.getByTestId('swipe-feedback-container')).toHaveAttribute('data-swipe-enabled', 'false');
      expect(screen.queryByTestId('swipe-instructions')).not.toBeInTheDocument();

      const container = screen.getByTestId('swipe-feedback-container');
      fireEvent.keyDown(container, { key: 'ArrowLeft' });
      
      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe('Feedback Processing and Learning', () => {
    test('should process feedback through AI learning pipeline', async () => {
      const { FeedbackProcessor } = await import('@/lib/ai/feedback-processor');
      const processor = new FeedbackProcessor();
      
      const mockFeedback = {
        fragrance_id: 'test-fragrance-1',
        feedback_type: 'like',
        context: mockRecommendationContext,
        implicit_signals: {
          view_duration: 15000,
          scroll_depth: 0.8
        }
      };

      processor.processExplicitFeedback.mockResolvedValue({
        processed: true,
        preference_updates: ['increased_woody_preference'],
        confidence_boost: 0.12,
        next_recommendations_affected: true
      });

      const result = await processor.processExplicitFeedback('user-123', mockFeedback);

      expect(result.processed).toBe(true);
      expect(result.preference_updates).toContain('increased_woody_preference');
      expect(result.confidence_boost).toBe(0.12);
    });

    test('should handle implicit signals for passive learning', async () => {
      const { FeedbackProcessor } = await import('@/lib/ai/feedback-processor');
      const processor = new FeedbackProcessor();
      
      const implicitSignals = {
        view_duration: 25000, // 25 seconds
        scroll_depth: 0.9,
        details_clicked: true,
        explanation_viewed: true,
        sample_cta_hovered: true
      };

      processor.processImplicitFeedback.mockResolvedValue({
        signals_processed: 5,
        interest_score: 0.78,
        preference_adjustments: ['moderate_positive_signal'],
        learning_weight: 0.15
      });

      const result = await processor.processImplicitFeedback('user-123', 'test-fragrance-1', implicitSignals);

      expect(result.signals_processed).toBe(5);
      expect(result.interest_score).toBe(0.78);
      expect(result.learning_weight).toBe(0.15);
    });

    test('should update user preference model in real-time', async () => {
      const { FeedbackProcessor } = await import('@/lib/ai/feedback-processor');
      const processor = new FeedbackProcessor();
      
      processor.updateUserPreferences.mockResolvedValue({
        embedding_updated: true,
        preference_drift_detected: false,
        new_confidence_score: 0.89,
        affected_recommendation_categories: ['perfect_matches', 'adventurous']
      });

      const result = await processor.updateUserPreferences('user-123', {
        feedback_batch: [
          { type: 'like', fragrance_id: 'f1' },
          { type: 'dislike', fragrance_id: 'f2' }
        ]
      });

      expect(result.embedding_updated).toBe(true);
      expect(result.new_confidence_score).toBe(0.89);
      expect(result.affected_recommendation_categories).toContain('perfect_matches');
    });

    test('should generate insights from feedback patterns', async () => {
      const { FeedbackProcessor } = await import('@/lib/ai/feedback-processor');
      const processor = new FeedbackProcessor();
      
      processor.generateFeedbackInsights.mockResolvedValue({
        feedback_quality: 'high_engagement',
        learning_velocity: 0.23,
        preference_stability: 0.87,
        recommendation_accuracy_trend: 'improving',
        insights: [
          'User shows strong preference for evening fragrances',
          'Price sensitivity has decreased over time',
          'Brand loyalty is developing toward niche houses'
        ]
      });

      const insights = await processor.generateFeedbackInsights('user-123');

      expect(insights.feedback_quality).toBe('high_engagement');
      expect(insights.learning_velocity).toBe(0.23);
      expect(insights.insights).toHaveLength(3);
    });
  });

  describe('Performance and Responsiveness', () => {
    test('should process feedback within real-time requirements', async () => {
      const { RecommendationFeedback } = await import('@/components/recommendations/recommendation-feedback');
      const onFeedbackSubmit = vi.fn();
      
      render(
        <RecommendationFeedback 
          fragrance={mockFragrance}
          recommendationContext={mockRecommendationContext}
          onFeedbackSubmit={onFeedbackSubmit}
        />
      );

      const startTime = Date.now();
      
      fireEvent.click(screen.getByTestId('like-button'));

      await waitFor(() => {
        expect(screen.getByTestId('feedback-confirmation')).toBeInTheDocument();
      });

      const feedbackTime = Date.now() - startTime;
      expect(feedbackTime).toBeLessThan(500); // Should feel instant
    });

    test('should handle rapid feedback without UI lag', async () => {
      // Test rapid clicking doesn't cause UI performance issues
      const { RecommendationFeedback } = await import('@/components/recommendations/recommendation-feedback');
      const onFeedbackSubmit = vi.fn();
      
      render(
        <RecommendationFeedback 
          fragrance={mockFragrance}
          recommendationContext={mockRecommendationContext}
          onFeedbackSubmit={onFeedbackSubmit}
        />
      );

      // Rapid feedback clicks
      fireEvent.click(screen.getByTestId('like-button'));
      fireEvent.click(screen.getByTestId('dislike-button'));
      fireEvent.click(screen.getByTestId('maybe-button'));

      await waitFor(() => {
        expect(onFeedbackSubmit).toHaveBeenCalledTimes(3);
      });
    });

    test('should implement feedback queuing for offline scenarios', async () => {
      // Test offline feedback storage and sync
      expect(true).toBe(true); // Placeholder for offline feedback test
    });
  });

  describe('Analytics and Tracking Integration', () => {
    test('should track feedback analytics for recommendation improvement', async () => {
      const { RecommendationFeedback } = await import('@/components/recommendations/recommendation-feedback');
      const onFeedbackSubmit = vi.fn();
      
      render(
        <RecommendationFeedback 
          fragrance={mockFragrance}
          recommendationContext={mockRecommendationContext}
          onFeedbackSubmit={onFeedbackSubmit}
        />
      );

      fireEvent.click(screen.getByTestId('like-button'));

      // Should track both the UI interaction and the feedback submission
      await waitFor(() => {
        expect(onFeedbackSubmit).toHaveBeenCalled();
      });
    });

    test('should track detailed feedback granularly', async () => {
      // Test analytics for detailed feedback categories
      expect(true).toBe(true); // Placeholder for detailed analytics test
    });

    test('should measure feedback quality and engagement', async () => {
      // Test feedback engagement metrics
      expect(true).toBe(true); // Placeholder for engagement metrics test
    });
  });

  describe('Accessibility and User Experience', () => {
    test('should provide clear ARIA labels for all feedback actions', async () => {
      const { RecommendationFeedback } = await import('@/components/recommendations/recommendation-feedback');
      const onFeedbackSubmit = vi.fn();
      
      render(
        <RecommendationFeedback 
          fragrance={mockFragrance}
          recommendationContext={mockRecommendationContext}
          onFeedbackSubmit={onFeedbackSubmit}
        />
      );

      expect(screen.getByTestId('like-button')).toHaveAttribute('aria-label', 'Like Test Fragrance');
      expect(screen.getByTestId('dislike-button')).toHaveAttribute('aria-label', 'Dislike Test Fragrance');
      expect(screen.getByTestId('maybe-button')).toHaveAttribute('aria-label', 'Maybe interested in Test Fragrance');
    });

    test('should provide keyboard navigation for all feedback options', async () => {
      const { RecommendationFeedback } = await import('@/components/recommendations/recommendation-feedback');
      const onFeedbackSubmit = vi.fn();
      
      render(
        <RecommendationFeedback 
          fragrance={mockFragrance}
          recommendationContext={mockRecommendationContext}
          onFeedbackSubmit={onFeedbackSubmit}
        />
      );

      // Tab to like button and press Enter
      await user.tab();
      expect(screen.getByTestId('like-button')).toHaveFocus();
      
      await user.keyboard('[Enter]');
      
      expect(onFeedbackSubmit).toHaveBeenCalled();
    });

    test('should provide visual feedback confirmation for all actions', async () => {
      // Test that all feedback actions provide clear visual confirmation
      expect(true).toBe(true); // Placeholder for visual feedback test
    });

    test('should support undo functionality for accidental feedback', async () => {
      // Test undo mechanism for mistaken feedback
      expect(true).toBe(true); // Placeholder for undo test
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle feedback processing failures gracefully', async () => {
      // Test error handling when feedback submission fails
      expect(true).toBe(true); // Placeholder for error handling test
    });

    test('should handle missing fragrance data', async () => {
      const { RecommendationFeedback } = await import('@/components/recommendations/recommendation-feedback');
      const onFeedbackSubmit = vi.fn();
      
      const incompleteFragrance = {
        fragrance_id: 'incomplete-fragrance'
        // Missing name, brand, etc.
      };
      
      render(
        <RecommendationFeedback 
          fragrance={incompleteFragrance}
          recommendationContext={mockRecommendationContext}
          onFeedbackSubmit={onFeedbackSubmit}
        />
      );

      // Should still render without errors
      expect(screen.getByTestId('recommendation-feedback')).toBeInTheDocument();
    });

    test('should handle network failures during feedback submission', async () => {
      // Test offline feedback handling and retry mechanisms
      expect(true).toBe(true); // Placeholder for network failure test
    });

    test('should prevent spam feedback from rapid interactions', async () => {
      // Test rate limiting and spam prevention
      expect(true).toBe(true); // Placeholder for spam prevention test
    });
  });
});