'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { QuizSkeleton } from '@/components/ui/skeletons/quiz-skeleton';
import { EnhancedQuizFlow } from './enhanced-quiz-flow';
import { cn } from '@/lib/utils';

interface ProgressiveQuizFlowProps {
  initialGender?: 'men' | 'women' | 'unisex';
  onConversionReady?: (results: any) => void;
  className?: string;
}

/**
 * Progressive Quiz Flow Component - Task 2.2
 * 
 * Implements progressive loading for the quiz experience with:
 * - Skeleton loading during question transitions
 * - Smooth opacity transitions from loading to content
 * - Staggered animations for quiz options
 * - Performance measurement and optimization
 */
export function ProgressiveQuizFlow({
  initialGender,
  onConversionReady,
  className
}: ProgressiveQuizFlowProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionLoading, setCurrentQuestionLoading] = useState(false);
  const [transitionState, setTransitionState] = useState<'loading' | 'transitioning' | 'loaded'>('loading');

  // Performance measurement
  useEffect(() => {
    // Mark the start of content loading
    if (typeof performance !== 'undefined') {
      performance.mark('quiz-content-start');
    }

    // Simulate initial load time to show skeleton
    const loadTimer = setTimeout(() => {
      setTransitionState('transitioning');
      
      // Measure time to first contentful paint
      if (typeof performance !== 'undefined') {
        performance.mark('quiz-content-end');
        performance.measure('quiz-first-contentful-paint', 'quiz-content-start', 'quiz-content-end');
        
        // Log performance metric
        const measure = performance.getEntriesByName('quiz-first-contentful-paint')[0];
        if (measure) {
          console.log(`Quiz FCP: ${measure.duration}ms`);
        }
      }

      // Smooth transition to content
      setTimeout(() => {
        setIsLoading(false);
        setTransitionState('loaded');
      }, 300);
    }, 800); // Show skeleton for minimum 800ms for perceived performance

    return () => clearTimeout(loadTimer);
  }, []);

  // Handle question transitions with progressive loading
  const handleQuestionTransition = () => {
    setCurrentQuestionLoading(true);
    
    // Brief loading state for smooth transitions
    setTimeout(() => {
      setCurrentQuestionLoading(false);
    }, 200);
  };

  const handleConversionReady = (results: any) => {
    // Add transition loading before calling parent
    setCurrentQuestionLoading(true);
    
    setTimeout(() => {
      if (onConversionReady) {
        onConversionReady(results);
      }
      setCurrentQuestionLoading(false);
    }, 400);
  };

  // Show skeleton during initial loading
  if (isLoading || transitionState === 'loading') {
    return (
      <div className={cn('relative', className)}>
        <QuizSkeleton 
          variant="loading"
          data-testid="quiz-skeleton"
        />
        
        {/* Optional: Subtle loading indicator */}
        <div className="absolute top-4 right-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            <span>Loading your quiz...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show transitioning state with fade effect
  if (transitionState === 'transitioning') {
    return (
      <div className={cn('relative opacity-0 animate-fade-in', className)}>
        <QuizSkeleton 
          variant="loading"
          data-testid="quiz-skeleton"
        />
      </div>
    );
  }

  // Show loaded content with progressive enhancements
  return (
    <div className={cn(
      'relative opacity-0 animate-fade-in',
      transitionState === 'loaded' && 'opacity-100',
      className
    )}>
      {/* Question transition loading overlay */}
      {currentQuestionLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <Card className="p-6">
            <CardContent className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Processing your answer...</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Quiz Flow with Progressive Loading */}
      <Suspense fallback={<QuizSkeleton variant="loading" />}>
        <div data-testid="quiz-content" className="animate-fade-in">
          <EnhancedQuizFlow
            initialGender={initialGender}
            onConversionReady={handleConversionReady}
            onQuestionTransition={handleQuestionTransition}
          />
        </div>
      </Suspense>
    </div>
  );
}

/**
 * Quiz Options with Staggered Loading
 * 
 * Component for displaying quiz options with progressive loading animations
 */
export function QuizOptionsProgressive({ 
  options, 
  onSelect, 
  isLoading = false 
}: {
  options: Array<{ value: string; text: string; emoji: string }>;
  onSelect: (value: string) => void;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            data-testid="skeleton-option"
            className="w-full p-4 border-2 rounded-lg animate-pulse bg-gray-100"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center space-x-4">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-5 flex-1" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {options.map((option, index) => (
        <button
          key={option.value}
          onClick={() => onSelect(option.value)}
          className="w-full p-4 text-left border-2 rounded-lg transition-all duration-200 group transform hover:scale-[1.02] active:scale-[0.98] border-gray-200 hover:border-purple-300 hover:bg-purple-50 opacity-0 animate-fade-in"
          style={{ 
            animationDelay: `${index * 0.1}s`,
            minHeight: '64px' // Prevent layout shift
          }}
          data-testid="quiz-option"
        >
          <div className="flex items-center space-x-4">
            <div className="text-2xl" role="img" aria-label={`${option.text} icon`}>
              {option.emoji}
            </div>
            <div className="flex-1">
              <span className="font-medium group-hover:text-purple-700">
                {option.text}
              </span>
            </div>
            <div className="w-5 h-5 text-gray-400 group-hover:text-purple-500">
              →
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

/**
 * Quiz Progress Bar with Smooth Transitions
 */
export function ProgressiveQuizProgress({ 
  current, 
  total, 
  isTransitioning = false 
}: {
  current: number;
  total: number;
  isTransitioning?: boolean;
}) {
  const progressPercent = (current / total) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between text-sm text-muted-foreground mb-2">
        <span>Question {current} of {total}</span>
        <span>{Math.round(progressPercent)}% complete</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-500 ease-out',
            'bg-gradient-to-r from-purple-500 to-pink-500',
            isTransitioning && 'animate-pulse'
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}