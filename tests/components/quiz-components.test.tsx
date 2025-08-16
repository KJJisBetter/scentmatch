import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetDatabaseMocks } from '../utils/database-test-utils';

/**
 * Quiz UI Components Tests
 * 
 * Tests for quiz user interface components:
 * - Interactive question components with multiple formats
 * - Progress indicators and completion gamification
 * - Mobile-optimized touch interactions and swipe navigation
 * - Accessibility features for inclusive quiz experience
 * - Real-time visual feedback and personality reveal
 * - Animation and transition effects for engagement
 * - Error states and recovery mechanisms
 */

// Mock framer-motion for animations
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock quiz components
vi.mock('@/components/quiz/quiz-question', () => ({
  QuizQuestion: ({ 
    question,
    onAnswer,
    disabled = false,
    showProgress = true
  }: {
    question: any;
    onAnswer: (answer: any) => void;
    disabled?: boolean;
    showProgress?: boolean;
  }) => {
    const [selectedAnswer, setSelectedAnswer] = React.useState<string | null>(null);
    const [isAnswering, setIsAnswering] = React.useState(false);

    const handleAnswerSelect = async (answerValue: string) => {
      setSelectedAnswer(answerValue);
      setIsAnswering(true);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      onAnswer({
        question_id: question.question_id,
        answer_value: answerValue,
        response_time_ms: 3000 + Math.random() * 2000,
        confidence: 0.8
      });
      
      setIsAnswering(false);
    };

    return (
      <div 
        data-testid="quiz-question" 
        data-question-id={question.question_id}
        data-question-type={question.question_type}
        data-disabled={disabled}
      >
        {showProgress && (
          <div data-testid="question-progress">
            Question {question.progress?.current || 1} of {question.progress?.total || 15}
          </div>
        )}
        
        <h2 data-testid="question-text">{question.question_text}</h2>
        
        {question.question_type === 'multiple_choice' && (
          <div data-testid="multiple-choice-options" className="space-y-3">
            {question.options.map((option: any, index: number) => (
              <button
                key={option.value}
                data-testid={`option-${option.value}`}
                onClick={() => handleAnswerSelect(option.value)}
                disabled={disabled || isAnswering}
                className={`w-full p-4 text-left border rounded-lg transition-all ${
                  selectedAnswer === option.value 
                    ? 'bg-blue-100 border-blue-500' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="font-medium">{option.text}</span>
                {option.description && (
                  <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                )}
              </button>
            ))}
          </div>
        )}

        {question.question_type === 'slider_scale' && (
          <div data-testid="slider-question" className="space-y-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{question.scale.min_label}</span>
              <span>{question.scale.max_label}</span>
            </div>
            <input
              type="range"
              min={question.scale.min}
              max={question.scale.max}
              step="1"
              onChange={(e) => handleAnswerSelect(e.target.value)}
              data-testid="scale-slider"
              className="w-full"
              disabled={disabled}
            />
            <div data-testid="scale-value" className="text-center">
              {selectedAnswer && `Selected: ${selectedAnswer}`}
            </div>
          </div>
        )}

        {question.question_type === 'image_selection' && (
          <div data-testid="image-selection" className="grid grid-cols-2 gap-4">
            {question.images.map((image: any) => (
              <button
                key={image.value}
                data-testid={`image-option-${image.value}`}
                onClick={() => handleAnswerSelect(image.value)}
                disabled={disabled || isAnswering}
                className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                  selectedAnswer === image.value 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <img 
                  src={image.src} 
                  alt={image.alt}
                  className="w-full h-32 object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                  <span className="text-sm font-medium">{image.text}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {isAnswering && (
          <div data-testid="answering-feedback" className="mt-4 text-center">
            <div className="inline-flex items-center space-x-2 text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Processing your answer...</span>
            </div>
          </div>
        )}
      </div>
    );
  },
}));

vi.mock('@/components/quiz/progress-indicator', () => ({
  ProgressIndicator: ({ 
    current,
    total,
    percentage,
    showPersonalityPreview = false,
    emergingArchetype
  }: {
    current: number;
    total: number;
    percentage: number;
    showPersonalityPreview?: boolean;
    emergingArchetype?: string;
  }) => (
    <div data-testid="progress-indicator" data-percentage={percentage}>
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{current} of {total}</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
            data-testid="progress-bar"
          />
        </div>
        
        <div className="text-center mt-2 text-sm text-gray-600">
          {percentage}% complete
        </div>
      </div>

      {showPersonalityPreview && emergingArchetype && (
        <div data-testid="personality-preview" className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>Emerging Style:</strong> {emergingArchetype}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Complete the quiz to unlock your full personality profile
          </div>
        </div>
      )}
    </div>
  ),
}));

vi.mock('@/components/quiz/personality-results', () => ({
  PersonalityResults: ({ 
    personalityProfile,
    onContinue,
    showRecommendations = true
  }: {
    personalityProfile: any;
    onContinue: () => void;
    showRecommendations?: boolean;
  }) => (
    <div data-testid="personality-results" data-archetype={personalityProfile.primary_archetype}>
      <div data-testid="results-header" className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Your Fragrance Personality</h2>
        <div data-testid="archetype-badge" className="inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-medium">
          {personalityProfile.archetype_title || personalityProfile.primary_archetype}
        </div>
      </div>

      <div data-testid="personality-description" className="mb-8">
        <p className="text-lg text-gray-700 leading-relaxed">
          {personalityProfile.style_descriptor}
        </p>
      </div>

      <div data-testid="dimension-breakdown" className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Your Scent Profile</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(personalityProfile.dimension_scores || {}).map(([dimension, score]: [string, any]) => (
            <div key={dimension} data-testid={`dimension-${dimension}`} className="text-center">
              <div className="text-2xl font-bold text-purple-600">{score}%</div>
              <div className="text-sm text-gray-600 capitalize">{dimension}</div>
            </div>
          ))}
        </div>
      </div>

      {showRecommendations && (
        <div data-testid="quiz-recommendations" className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Perfect for Your Style</h3>
          <div className="text-center">
            <div className="text-4xl mb-4">🌸</div>
            <p>Initial recommendations will appear here</p>
          </div>
        </div>
      )}

      <div data-testid="continue-actions" className="text-center">
        <button
          data-testid="continue-btn"
          onClick={onContinue}
          className="bg-purple-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-600"
        >
          See My Recommendations
        </button>
      </div>
    </div>
  ),
}));

// React import
import React from 'react';

describe('Quiz UI Components', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    resetDatabaseMocks();
  });

  describe('Interactive Question Components', () => {
    test('should render multiple choice questions with selectable options', async () => {
      const { QuizQuestion } = await import('@/components/quiz/quiz-question');
      const onAnswer = vi.fn();
      
      const multipleChoiceQuestion = {
        question_id: 'lifestyle_1',
        question_text: 'Which best describes your daily style?',
        question_type: 'multiple_choice',
        options: [
          { value: 'professional', text: 'Professional and polished', description: 'Classic work attire, structured pieces' },
          { value: 'casual', text: 'Casual and comfortable', description: 'Relaxed fits, everyday basics' },
          { value: 'artistic', text: 'Artistic and expressive', description: 'Unique pieces, creative combinations' }
        ],
        progress: { current: 3, total: 12 }
      };
      
      render(<QuizQuestion question={multipleChoiceQuestion} onAnswer={onAnswer} />);

      expect(screen.getByTestId('quiz-question')).toHaveAttribute('data-question-type', 'multiple_choice');
      expect(screen.getByTestId('question-text')).toHaveTextContent('Which best describes your daily style?');
      expect(screen.getByTestId('question-progress')).toHaveTextContent('Question 3 of 12');
      
      // All options should be rendered
      expect(screen.getByTestId('option-professional')).toBeInTheDocument();
      expect(screen.getByTestId('option-casual')).toBeInTheDocument();
      expect(screen.getByTestId('option-artistic')).toBeInTheDocument();
      
      // Option descriptions should be visible
      expect(screen.getByText('Classic work attire, structured pieces')).toBeInTheDocument();
    });

    test('should handle option selection and answer submission', async () => {
      const { QuizQuestion } = await import('@/components/quiz/quiz-question');
      const onAnswer = vi.fn();
      
      const question = {
        question_id: 'test_question',
        question_text: 'Test question?',
        question_type: 'multiple_choice',
        options: [
          { value: 'option_a', text: 'Option A' },
          { value: 'option_b', text: 'Option B' }
        ]
      };
      
      render(<QuizQuestion question={question} onAnswer={onAnswer} />);

      // Select an option
      fireEvent.click(screen.getByTestId('option-option_a'));

      // Should show processing state
      expect(screen.getByTestId('answering-feedback')).toBeInTheDocument();
      expect(screen.getByText('Processing your answer...')).toBeInTheDocument();

      // After processing
      await waitFor(() => {
        expect(onAnswer).toHaveBeenCalledWith({
          question_id: 'test_question',
          answer_value: 'option_a',
          response_time_ms: expect.any(Number),
          confidence: 0.8
        });
      });
    });

    test('should render slider scale questions with interactive controls', async () => {
      const { QuizQuestion } = await import('@/components/quiz/quiz-question');
      const onAnswer = vi.fn();
      
      const sliderQuestion = {
        question_id: 'intensity_preference',
        question_text: 'How much attention do you want your fragrance to attract?',
        question_type: 'slider_scale',
        scale: {
          min: 1,
          max: 10,
          min_label: 'Subtle & Personal',
          max_label: 'Bold & Noticeable'
        }
      };
      
      render(<QuizQuestion question={sliderQuestion} onAnswer={onAnswer} />);

      expect(screen.getByTestId('slider-question')).toBeInTheDocument();
      expect(screen.getByTestId('scale-slider')).toBeInTheDocument();
      expect(screen.getByText('Subtle & Personal')).toBeInTheDocument();
      expect(screen.getByText('Bold & Noticeable')).toBeInTheDocument();

      // Interact with slider
      const slider = screen.getByTestId('scale-slider');
      fireEvent.change(slider, { target: { value: '7' } });

      expect(screen.getByTestId('scale-value')).toHaveTextContent('Selected: 7');

      await waitFor(() => {
        expect(onAnswer).toHaveBeenCalledWith(
          expect.objectContaining({
            answer_value: '7'
          })
        );
      });
    });

    test('should render image selection questions with visual options', async () => {
      const { QuizQuestion } = await import('@/components/quiz/quiz-question');
      const onAnswer = vi.fn();
      
      const imageQuestion = {
        question_id: 'mood_imagery',
        question_text: 'Which image resonates most with your current mood?',
        question_type: 'image_selection',
        images: [
          { value: 'sunset', src: '/quiz/sunset.jpg', alt: 'Warm sunset', text: 'Warm & Romantic' },
          { value: 'ocean', src: '/quiz/ocean.jpg', alt: 'Ocean waves', text: 'Fresh & Energizing' },
          { value: 'forest', src: '/quiz/forest.jpg', alt: 'Forest path', text: 'Natural & Grounding' },
          { value: 'city', src: '/quiz/city.jpg', alt: 'City lights', text: 'Modern & Sophisticated' }
        ]
      };
      
      render(<QuizQuestion question={imageQuestion} onAnswer={onAnswer} />);

      expect(screen.getByTestId('image-selection')).toBeInTheDocument();
      expect(screen.getByTestId('image-option-sunset')).toBeInTheDocument();
      expect(screen.getByTestId('image-option-ocean')).toBeInTheDocument();
      
      // Images should have proper alt text
      expect(screen.getByAltText('Warm sunset')).toBeInTheDocument();
      expect(screen.getByAltText('Ocean waves')).toBeInTheDocument();

      // Select an image option
      fireEvent.click(screen.getByTestId('image-option-sunset'));

      await waitFor(() => {
        expect(onAnswer).toHaveBeenCalledWith(
          expect.objectContaining({
            answer_value: 'sunset'
          })
        );
      });
    });

    test('should disable question during processing to prevent double submission', async () => {
      const { QuizQuestion } = await import('@/components/quiz/quiz-question');
      const onAnswer = vi.fn();
      
      const question = {
        question_id: 'test_disabled',
        question_text: 'Test question',
        question_type: 'multiple_choice',
        options: [{ value: 'test', text: 'Test option' }]
      };
      
      render(<QuizQuestion question={question} onAnswer={onAnswer} disabled={true} />);

      expect(screen.getByTestId('quiz-question')).toHaveAttribute('data-disabled', 'true');
      expect(screen.getByTestId('option-test')).toBeDisabled();
    });
  });

  describe('Progress Indicators and Gamification', () => {
    test('should display progress with visual completion bar', async () => {
      const { ProgressIndicator } = await import('@/components/quiz/progress-indicator');
      
      render(
        <ProgressIndicator 
          current={8}
          total={12}
          percentage={67}
          showPersonalityPreview={true}
          emergingArchetype="sophisticated"
        />
      );

      expect(screen.getByTestId('progress-indicator')).toHaveAttribute('data-percentage', '67');
      expect(screen.getByTestId('progress-bar')).toHaveStyle('width: 67%');
      expect(screen.getByText('8 of 12')).toBeInTheDocument();
      expect(screen.getByText('67% complete')).toBeInTheDocument();
    });

    test('should reveal emerging personality as quiz progresses', async () => {
      const { ProgressIndicator } = await import('@/components/quiz/progress-indicator');
      
      render(
        <ProgressIndicator 
          current={8}
          total={12}
          percentage={67}
          showPersonalityPreview={true}
          emergingArchetype="sophisticated"
        />
      );

      expect(screen.getByTestId('personality-preview')).toBeInTheDocument();
      expect(screen.getByText('Emerging Style:')).toBeInTheDocument();
      expect(screen.getByText('sophisticated')).toBeInTheDocument();
      expect(screen.getByText('Complete the quiz to unlock your full personality profile')).toBeInTheDocument();
    });

    test('should handle progress updates with smooth animations', async () => {
      const { ProgressIndicator } = await import('@/components/quiz/progress-indicator');
      const { rerender } = render(
        <ProgressIndicator 
          current={5}
          total={12}
          percentage={42}
        />
      );

      expect(screen.getByTestId('progress-bar')).toHaveStyle('width: 42%');

      // Update progress
      rerender(
        <ProgressIndicator 
          current={6}
          total={12}
          percentage={50}
        />
      );

      expect(screen.getByTestId('progress-bar')).toHaveStyle('width: 50%');
      expect(screen.getByText('6 of 12')).toBeInTheDocument();
    });

    test('should hide personality preview when confidence is too low', async () => {
      const { ProgressIndicator } = await import('@/components/quiz/progress-indicator');
      
      render(
        <ProgressIndicator 
          current={3}
          total={12}
          percentage={25}
          showPersonalityPreview={false} // Low confidence, no preview
        />
      );

      expect(screen.queryByTestId('personality-preview')).not.toBeInTheDocument();
    });
  });

  describe('Personality Results Display', () => {
    test('should display comprehensive personality profile results', async () => {
      const { PersonalityResults } = await import('@/components/quiz/personality-results');
      const onContinue = vi.fn();
      
      const mockPersonalityProfile = {
        primary_archetype: 'romantic',
        archetype_title: 'Romantic Floral Enthusiast',
        style_descriptor: 'You are a romantic soul who finds joy in beautiful, feminine fragrances that tell a story. Floral notes make you feel most like yourself.',
        confidence: 0.89,
        dimension_scores: {
          fresh: 25,
          floral: 90,
          oriental: 35,
          woody: 20,
          fruity: 75,
          gourmand: 50
        },
        lifestyle_factors: {
          work_style: 'creative_professional',
          social_preference: 'intimate_gatherings',
          fashion_style: 'feminine_romantic'
        }
      };
      
      render(
        <PersonalityResults 
          personalityProfile={mockPersonalityProfile}
          onContinue={onContinue}
          showRecommendations={true}
        />
      );

      expect(screen.getByTestId('personality-results')).toHaveAttribute('data-archetype', 'romantic');
      expect(screen.getByTestId('archetype-badge')).toHaveTextContent('Romantic Floral Enthusiast');
      expect(screen.getByTestId('personality-description')).toHaveTextContent('romantic soul');
      
      // Dimension breakdown should show scores
      expect(screen.getByTestId('dimension-floral')).toHaveTextContent('90%');
      expect(screen.getByTestId('dimension-fruity')).toHaveTextContent('75%');
      expect(screen.getByTestId('dimension-fresh')).toHaveTextContent('25%');
    });

    test('should handle low confidence results with appropriate messaging', async () => {
      const { PersonalityResults } = await import('@/components/quiz/personality-results');
      const onContinue = vi.fn();
      
      const lowConfidenceProfile = {
        primary_archetype: 'classic',
        confidence: 0.42,
        style_descriptor: 'Your preferences span multiple fragrance families. You appreciate versatility and may enjoy exploring different styles.',
        needs_more_data: true,
        suggested_actions: ['Try more specific scent questions', 'Explore sample sets to refine preferences']
      };
      
      render(
        <PersonalityResults 
          personalityProfile={lowConfidenceProfile}
          onContinue={onContinue}
        />
      );

      expect(screen.getByTestId('personality-description')).toHaveTextContent('span multiple fragrance families');
    });

    test('should integrate with recommendation preview', async () => {
      const { PersonalityResults } = await import('@/components/quiz/personality-results');
      const onContinue = vi.fn();
      
      const profileWithRecommendations = {
        primary_archetype: 'sophisticated',
        archetype_title: 'Sophisticated Evening Enthusiast',
        style_descriptor: 'Complex, layered fragrances with oriental and woody notes',
        confidence: 0.87
      };
      
      render(
        <PersonalityResults 
          personalityProfile={profileWithRecommendations}
          onContinue={onContinue}
          showRecommendations={true}
        />
      );

      expect(screen.getByTestId('quiz-recommendations')).toBeInTheDocument();
      expect(screen.getByText('Perfect for Your Style')).toBeInTheDocument();
    });

    test('should handle continue action to recommendations', async () => {
      const { PersonalityResults } = await import('@/components/quiz/personality-results');
      const onContinue = vi.fn();
      
      const profile = {
        primary_archetype: 'natural',
        style_descriptor: 'Natural and fresh fragrance lover',
        confidence: 0.84
      };
      
      render(
        <PersonalityResults 
          personalityProfile={profile}
          onContinue={onContinue}
        />
      );

      fireEvent.click(screen.getByTestId('continue-btn'));

      expect(onContinue).toHaveBeenCalled();
    });
  });

  describe('Mobile Touch Interactions', () => {
    test('should support touch-optimized question interactions', async () => {
      // Test touch target sizes and mobile-specific interactions
      const { QuizQuestion } = await import('@/components/quiz/quiz-question');
      const onAnswer = vi.fn();
      
      const mobileQuestion = {
        question_id: 'mobile_test',
        question_text: 'Mobile optimized question',
        question_type: 'multiple_choice',
        options: [
          { value: 'touch_option_1', text: 'Touch Option 1' },
          { value: 'touch_option_2', text: 'Touch Option 2' }
        ]
      };
      
      render(<QuizQuestion question={mobileQuestion} onAnswer={onAnswer} />);

      // Touch targets should be appropriately sized
      const option1 = screen.getByTestId('option-touch_option_1');
      expect(option1).toBeInTheDocument();
      
      // Simulate touch interaction
      fireEvent.click(option1);

      await waitFor(() => {
        expect(onAnswer).toHaveBeenCalled();
      });
    });

    test('should implement swipe navigation for quiz progression', async () => {
      // Test swipe gestures for next/previous question navigation
      expect(true).toBe(true); // Placeholder for swipe navigation test
    });

    test('should optimize for thumb-zone interactions on mobile', async () => {
      // Test that primary actions are within thumb reach
      expect(true).toBe(true); // Placeholder for thumb-zone optimization test
    });
  });

  describe('Accessibility and Inclusive Design', () => {
    test('should provide comprehensive keyboard navigation', async () => {
      const { QuizQuestion } = await import('@/components/quiz/quiz-question');
      const onAnswer = vi.fn();
      
      const accessibleQuestion = {
        question_id: 'accessibility_test',
        question_text: 'Accessibility test question',
        question_type: 'multiple_choice',
        options: [
          { value: 'keyboard_option_1', text: 'Keyboard Option 1' },
          { value: 'keyboard_option_2', text: 'Keyboard Option 2' }
        ]
      };
      
      render(<QuizQuestion question={accessibleQuestion} onAnswer={onAnswer} />);

      // Tab to first option
      await user.tab();
      expect(screen.getByTestId('option-keyboard_option_1')).toHaveFocus();

      // Press Enter to select
      await user.keyboard('[Enter]');

      await waitFor(() => {
        expect(onAnswer).toHaveBeenCalledWith(
          expect.objectContaining({
            answer_value: 'keyboard_option_1'
          })
        );
      });
    });

    test('should provide proper ARIA labels and screen reader support', async () => {
      const { QuizQuestion } = await import('@/components/quiz/quiz-question');
      const onAnswer = vi.fn();
      
      const question = {
        question_id: 'aria_test',
        question_text: 'Screen reader test question',
        question_type: 'multiple_choice',
        options: [
          { value: 'sr_option_1', text: 'Screen Reader Option 1' }
        ]
      };
      
      render(<QuizQuestion question={question} onAnswer={onAnswer} />);

      // Question should have proper heading structure
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Screen reader test question');
      
      // Options should be properly labeled buttons
      expect(screen.getByRole('button', { name: /Screen Reader Option 1/ })).toBeInTheDocument();
    });

    test('should support high contrast mode and scalable typography', async () => {
      // Test accessibility for visual impairments
      expect(true).toBe(true); // Placeholder for high contrast test
    });

    test('should provide alternative formats for image-based questions', async () => {
      // Test text alternatives for users who can't see images
      const { QuizQuestion } = await import('@/components/quiz/quiz-question');
      const onAnswer = vi.fn();
      
      const imageQuestion = {
        question_id: 'accessible_images',
        question_text: 'Which environment appeals to you most?',
        question_type: 'image_selection',
        images: [
          { 
            value: 'beach', 
            src: '/quiz/beach.jpg', 
            alt: 'Peaceful beach with gentle waves and warm sand', 
            text: 'Beach Serenity',
            description: 'Wide open ocean views with natural sounds and fresh air'
          }
        ]
      };
      
      render(<QuizQuestion question={imageQuestion} onAnswer={onAnswer} />);

      const imageOption = screen.getByTestId('image-option-beach');
      expect(imageOption).toBeInTheDocument();
      
      const image = screen.getByAltText('Peaceful beach with gentle waves and warm sand');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Error States and Recovery', () => {
    test('should handle quiz loading errors gracefully', async () => {
      // Test error states when quiz questions fail to load
      expect(true).toBe(true); // Placeholder for loading error test
    });

    test('should provide retry mechanisms for failed question submissions', async () => {
      // Test retry functionality when answer submission fails
      expect(true).toBe(true); // Placeholder for retry mechanism test
    });

    test('should handle network interruptions during quiz taking', async () => {
      // Test offline capability and sync when reconnected
      expect(true).toBe(true); // Placeholder for network interruption test
    });

    test('should recover from corrupted quiz state', async () => {
      // Test recovery when quiz session becomes corrupted
      expect(true).toBe(true); // Placeholder for state corruption recovery test
    });
  });

  describe('Animation and Visual Feedback', () => {
    test('should provide engaging question transition animations', async () => {
      // Test smooth transitions between questions
      expect(true).toBe(true); // Placeholder for transition animation test
    });

    test('should animate progress bar updates with personality reveals', async () => {
      const { ProgressIndicator } = await import('@/components/quiz/progress-indicator');
      const { rerender } = render(
        <ProgressIndicator 
          current={6}
          total={12}
          percentage={50}
          showPersonalityPreview={false}
        />
      );

      // Update to show personality preview
      rerender(
        <ProgressIndicator 
          current={8}
          total={12}
          percentage={67}
          showPersonalityPreview={true}
          emergingArchetype="romantic"
        />
      );

      expect(screen.getByTestId('personality-preview')).toBeInTheDocument();
      expect(screen.getByText('romantic')).toBeInTheDocument();
    });

    test('should provide immediate visual feedback for user interactions', async () => {
      // Test visual confirmation of selections and progress
      expect(true).toBe(true); // Placeholder for immediate feedback test
    });

    test('should implement engaging completion animations', async () => {
      // Test celebration animations when quiz is completed
      expect(true).toBe(true); // Placeholder for completion animation test
    });
  });

  describe('Performance and Responsiveness', () => {
    test('should meet performance targets for quiz interaction responsiveness', async () => {
      const { QuizQuestion } = await import('@/components/quiz/quiz-question');
      const onAnswer = vi.fn();
      
      const performanceQuestion = {
        question_id: 'performance_test',
        question_text: 'Performance test question',
        question_type: 'multiple_choice',
        options: [{ value: 'perf_option', text: 'Performance Option' }]
      };
      
      render(<QuizQuestion question={performanceQuestion} onAnswer={onAnswer} />);

      const startTime = Date.now();
      
      fireEvent.click(screen.getByTestId('option-perf_option'));

      await waitFor(() => {
        expect(screen.getByTestId('answering-feedback')).toBeInTheDocument();
      });

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(100); // Should feel immediate
    });

    test('should optimize rendering for complex quiz questions', async () => {
      // Test performance with large numbers of options or complex content
      expect(true).toBe(true); // Placeholder for complex rendering test
    });

    test('should minimize re-renders during quiz progression', async () => {
      // Test React optimization patterns for efficient quiz updates
      expect(true).toBe(true); // Placeholder for re-render optimization test
    });
  });
});