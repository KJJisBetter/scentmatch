'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, Heart, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecommendationFeedbackProps {
  fragrance: {
    fragrance_id: string;
    name: string;
    brand?: string;
    match_percentage?: number;
  };
  recommendationContext: {
    section: string;
    position: number;
    algorithm_version: string;
  };
  onFeedbackSubmit: (feedback: any) => void;
  enableImplicitTracking?: boolean;
  showDetailedOptions?: boolean;
  variant?: 'inline' | 'overlay' | 'compact';
  className?: string;
}

/**
 * RecommendationFeedback Component
 * 
 * Comprehensive feedback collection for recommendation learning
 * Implements research-backed patterns:
 * - Explicit feedback with clear visual states
 * - Implicit signal collection (view time, interaction depth)
 * - Progressive disclosure of detailed feedback options
 * - Mobile-optimized touch interactions
 * - Accessibility-compliant feedback mechanisms
 */
export function RecommendationFeedback({
  fragrance,
  recommendationContext,
  onFeedbackSubmit,
  enableImplicitTracking = true,
  showDetailedOptions = false,
  variant = 'inline',
  className
}: RecommendationFeedbackProps) {
  const [feedback, setFeedback] = useState<any>(null);
  const [viewStartTime] = useState(Date.now());
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  const [interactionData, setInteractionData] = useState({
    view_duration: 0,
    scroll_depth: 0,
    details_clicked: false,
    explanation_viewed: false,
    hover_time: 0
  });

  const componentRef = useRef<HTMLDivElement>(null);
  const hoverStartTime = useRef<number>(0);

  // Track implicit signals
  useEffect(() => {
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

  // Track hover time for implicit signals
  const handleMouseEnter = () => {
    if (enableImplicitTracking) {
      hoverStartTime.current = Date.now();
    }
  };

  const handleMouseLeave = () => {
    if (enableImplicitTracking && hoverStartTime.current > 0) {
      const hoverDuration = Date.now() - hoverStartTime.current;
      setInteractionData(prev => ({
        ...prev,
        hover_time: prev.hover_time + hoverDuration
      }));
    }
  };

  // Handle explicit feedback submission
  const handleExplicitFeedback = async (feedbackType: string, value?: any) => {
    const feedbackData = {
      fragrance_id: fragrance.fragrance_id,
      feedback_type: feedbackType,
      value: value,
      context: recommendationContext,
      implicit_signals: enableImplicitTracking ? interactionData : null,
      timestamp: new Date().toISOString()
    };

    setFeedback(feedbackData);
    onFeedbackSubmit(feedbackData);

    // Show confirmation briefly
    setTimeout(() => {
      if (feedbackType !== 'detailed') {
        setFeedback(null);
      }
    }, 2000);
  };

  // Handle detailed feedback
  const handleDetailedFeedback = (category: string, rating: any) => {
    const detailedFeedback = {
      fragrance_id: fragrance.fragrance_id,
      feedback_type: 'detailed_rating',
      category: category,
      rating: rating,
      context: recommendationContext,
      timestamp: new Date().toISOString()
    };

    onFeedbackSubmit(detailedFeedback);
  };

  // Compact variant for space-constrained areas
  if (variant === 'compact') {
    return (
      <div 
        ref={componentRef}
        className={cn('flex items-center space-x-1', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Button
          variant={feedback?.feedback_type === 'like' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleExplicitFeedback('like')}
          className="w-8 h-8 p-0"
          aria-label={`Like ${fragrance.name}`}
        >
          <ThumbsUp className="h-3 w-3" />
        </Button>
        
        <Button
          variant={feedback?.feedback_type === 'dislike' ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => handleExplicitFeedback('dislike')}
          className="w-8 h-8 p-0"
          aria-label={`Dislike ${fragrance.name}`}
        >
          <ThumbsDown className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  // Overlay variant for modal/drawer contexts
  if (variant === 'overlay') {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Overlay feedback content */}
        <div className="text-center">
          <h4 className="font-medium mb-2">How do you feel about this recommendation?</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Your feedback helps us improve future recommendations
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => handleExplicitFeedback('love')}
            className="flex-col h-20 space-y-2"
          >
            <Heart className="h-6 w-6 text-red-500" />
            <span className="text-sm">Love it!</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleExplicitFeedback('like')}
            className="flex-col h-20 space-y-2"
          >
            <ThumbsUp className="h-6 w-6 text-green-500" />
            <span className="text-sm">Like it</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleExplicitFeedback('not_interested')}
            className="flex-col h-20 space-y-2"
          >
            <ThumbsDown className="h-6 w-6 text-orange-500" />
            <span className="text-sm">Not interested</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleExplicitFeedback('wrong_style')}
            className="flex-col h-20 space-y-2"
          >
            <X className="h-6 w-6 text-red-500" />
            <span className="text-sm">Wrong style</span>
          </Button>
        </div>

        {feedback && (
          <div className="text-center p-3 bg-green-100 rounded-lg">
            <span className="text-sm text-green-800">
              Thanks! We'll use this to improve your recommendations.
            </span>
          </div>
        )}
      </div>
    );
  }

  // Default inline variant
  return (
    <div 
      ref={componentRef}
      className={cn('space-y-3', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Quick Feedback Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant={feedback?.feedback_type === 'like' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleExplicitFeedback('like')}
            disabled={!!feedback && feedback.feedback_type !== 'like'}
            className="flex items-center space-x-1"
            aria-label={`Like ${fragrance.name}`}
          >
            <ThumbsUp className="h-4 w-4" />
            <span className="text-xs">Like</span>
          </Button>
          
          <Button
            variant={feedback?.feedback_type === 'dislike' ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => handleExplicitFeedback('dislike')}
            disabled={!!feedback && feedback.feedback_type !== 'dislike'}
            className="flex items-center space-x-1"
            aria-label={`Dislike ${fragrance.name}`}
          >
            <ThumbsDown className="h-4 w-4" />
            <span className="text-xs">Pass</span>
          </Button>
        </div>

        {/* Detailed Feedback Toggle */}
        {showDetailedOptions && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetailedFeedback(!showDetailedFeedback)}
            className="text-xs text-muted-foreground"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {showDetailedFeedback ? 'Less' : 'More'} options
          </Button>
        )}
      </div>

      {/* Detailed Feedback Options */}
      {showDetailedOptions && showDetailedFeedback && (
        <div className="p-3 bg-muted/50 rounded-lg space-y-3">
          <h5 className="text-sm font-medium">Tell us more (optional)</h5>
          
          {/* Intensity Feedback */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Intensity preference:</label>
            <div className="flex space-x-1">
              {['too_light', 'just_right', 'too_strong'].map(option => (
                <Button
                  key={option}
                  variant="outline"
                  size="sm"
                  onClick={() => handleDetailedFeedback('intensity', option)}
                  className="text-xs flex-1"
                >
                  {option.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>

          {/* Price Reaction */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Price reaction:</label>
            <div className="flex space-x-1">
              {['expensive', 'reasonable', 'great_value'].map(option => (
                <Button
                  key={option}
                  variant="outline"
                  size="sm"
                  onClick={() => handleDetailedFeedback('price', option)}
                  className="text-xs flex-1"
                >
                  {option.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>

          {/* Note Preferences */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Note preferences:</label>
            <div className="flex flex-wrap gap-1">
              {['love_these_notes', 'dislike_these_notes', 'want_similar', 'too_sweet', 'too_woody', 'too_fresh'].map(option => (
                <Button
                  key={option}
                  variant="outline"
                  size="sm"
                  onClick={() => handleDetailedFeedback('notes', option)}
                  className="text-xs"
                >
                  {option.replace(/_/g, ' ')}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Confirmation */}
      {feedback && (
        <div className={cn(
          'p-2 rounded-lg text-center text-sm',
          feedback.feedback_type === 'like' && 'bg-green-100 text-green-800',
          feedback.feedback_type === 'dislike' && 'bg-red-100 text-red-800',
          !['like', 'dislike'].includes(feedback.feedback_type) && 'bg-blue-100 text-blue-800'
        )}>
          <div className="flex items-center justify-center space-x-2">
            <Sparkles className="h-4 w-4" />
            <span>
              {feedback.feedback_type === 'like' && 'Added to your preferences! 🎯'}
              {feedback.feedback_type === 'dislike' && 'Noted! We\'ll learn from this. 📝'}
              {feedback.feedback_type === 'detailed_rating' && 'Thanks for the details! 🔍'}
            </span>
          </div>
        </div>
      )}

      {/* Implicit Tracking Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && enableImplicitTracking && (
        <div className="text-xs text-muted-foreground space-y-1 opacity-50">
          <div>View time: {Math.round(interactionData.view_duration / 1000)}s</div>
          <div>Hover time: {Math.round(interactionData.hover_time / 1000)}s</div>
          <div>Details clicked: {interactionData.details_clicked ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
}