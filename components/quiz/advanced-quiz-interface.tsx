'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronLeft, Sparkles, Check, X } from 'lucide-react';
import {
  AdvancedProfileEngine,
  ADVANCED_QUIZ_QUESTIONS,
  UserProfile,
} from '@/lib/quiz/advanced-profile-engine';
import { AdvancedConversionFlow } from './advanced-conversion-flow';

/**
 * Advanced Quiz Interface - Multi-Dimensional Personality Profiling
 *
 * Research-backed implementation featuring:
 * - Progressive Personality Mapping (hook → narrow → refine → convert)
 * - Multi-trait selection with visual feedback
 * - 12-dimension personality vector generation
 * - Conversion-optimized flow (40%+ conversion target)
 */

export function AdvancedQuizInterface() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [sliderValue, setSliderValue] = useState(50);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileRecommendations, setProfileRecommendations] = useState<any[]>(
    []
  );
  const router = useRouter();

  const currentQ = ADVANCED_QUIZ_QUESTIONS[currentQuestion];
  const progress =
    ((currentQuestion + 1) / ADVANCED_QUIZ_QUESTIONS.length) * 100;
  const isLastQuestion = currentQuestion === ADVANCED_QUIZ_QUESTIONS.length - 1;

  // Multi-selection handlers
  const handleOptionToggle = useCallback(
    (optionId: string) => {
      const currentQ = ADVANCED_QUIZ_QUESTIONS[currentQuestion];
      if (!currentQ) return;

      setSelectedOptions(prev => {
        if (currentQ.type === 'single_select') {
          return [optionId]; // Replace for single select
        } else {
          // Multi-select with limits
          if (prev.includes(optionId)) {
            return prev.filter(id => id !== optionId);
          } else {
            if (prev.length >= (currentQ.max_selections || 3)) {
              // Remove oldest if at limit
              return [...prev.slice(1), optionId];
            }
            return [...prev, optionId];
          }
        }
      });
    },
    [currentQuestion]
  );

  // Progress to next question
  const analyzeAdvancedProfile = async (allResponses: any[]) => {
    setIsAnalyzing(true);

    try {
      // Track quiz completion
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'advanced_quiz_completed', {
          total_questions: ADVANCED_QUIZ_QUESTIONS.length,
          completion_time: Date.now() - (responses[0]?.timestamp || Date.now()),
          trait_selections: allResponses
            .flatMap(r => r.selected_options || [r.selected_option])
            .filter(Boolean),
        });
      }

      const engine = new AdvancedProfileEngine();
      const profile = await engine.generateUserProfile(allResponses);

      if (profile.confidence_score > 0.6) {
        const recommendations = await engine.getProfileBasedRecommendations(
          profile,
          12
        );

        setUserProfile(profile);
        setProfileRecommendations(recommendations);
      } else {
        // Handle low confidence with additional questions or fallback
        throw new Error('Profile confidence too low, need more data');
      }

      setShowResults(true);
    } catch (error) {
      console.error('Advanced profile analysis error:', error);

      // Fallback to simplified profile
      setUserProfile({
        session_token: `fallback-${Date.now()}`,
        traits: new AdvancedProfileEngine().initializeEmptyTraits(),
        trait_combinations: ['balanced'],
        primary_archetype: 'balanced_explorer',
        confidence_score: 0.6,
        created_at: new Date().toISOString(),
        quiz_version: 2,
      });
      setShowResults(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNext = useCallback(async () => {
    if (!currentQ) return;

    // Create response object
    const response: any = {
      question_id: currentQ.id,
      question_type: currentQ.type,
      timestamp: new Date().toISOString(),
    };

    if (currentQ.type === 'multi_select') {
      if (selectedOptions.length < (currentQ.min_selections || 1)) {
        return; // Don't proceed if minimum not met
      }
      response.selected_options = selectedOptions;
    } else if (currentQ.type === 'single_select') {
      if (selectedOptions.length === 0) return;
      response.selected_option = selectedOptions[0];
    } else if (currentQ.type === 'slider') {
      response.value = sliderValue;
    }

    const updatedResponses = [...responses, response];
    setResponses(updatedResponses);

    // Track quiz progress analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'advanced_quiz_progress', {
        question_id: currentQ.id,
        question_number: currentQuestion + 1,
        total_questions: ADVANCED_QUIZ_QUESTIONS.length,
        selections: selectedOptions,
        engagement_time: Date.now() - (response.start_time || Date.now()),
      });
    }

    if (isLastQuestion) {
      // Complete quiz and analyze
      await analyzeAdvancedProfile(updatedResponses);
    } else {
      // Move to next question
      setCurrentQuestion(prev => prev + 1);
      setSelectedOptions([]);
      setSliderValue(50);
    }
  }, [
    currentQ,
    selectedOptions,
    sliderValue,
    responses,
    currentQuestion,
    isLastQuestion,
    analyzeAdvancedProfile,
  ]);

  // Go back to previous question
  const handlePrevious = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);

      // Restore previous selections
      const prevResponse = responses[currentQuestion - 1];
      if (prevResponse) {
        if (prevResponse.selected_options) {
          setSelectedOptions(prevResponse.selected_options);
        } else if (prevResponse.selected_option) {
          setSelectedOptions([prevResponse.selected_option]);
        } else if (prevResponse.value !== undefined) {
          setSliderValue(prevResponse.value);
        }
      }

      // Remove the current question's response
      setResponses(prev => prev.slice(0, -1));
    }
  }, [currentQuestion, responses]);

  // Loading state during analysis
  if (isAnalyzing) {
    return (
      <Card className='max-w-2xl mx-auto'>
        <CardContent className='text-center py-12'>
          <div className='relative mb-6'>
            <div className='animate-spin w-16 h-16 border-4 border-plum-500 border-t-transparent rounded-full mx-auto' />
            <Sparkles className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-plum-500' />
          </div>
          <h3 className='text-2xl font-semibold mb-4'>
            Building Your Fragrance Profile...
          </h3>
          <p className='text-muted-foreground mb-6'>
            Analyzing your{' '}
            {
              responses
                .flatMap(r => r.selected_options || [r.selected_option])
                .filter(Boolean).length
            }{' '}
            personality traits
          </p>
          <div className='text-sm text-muted-foreground space-y-2'>
            <p>✨ Processing your unique personality combination</p>
            <p>🧠 AI matching against 1,467 fragrances</p>
            <p>🎯 Personalizing recommendations for maximum satisfaction</p>
            <p>💎 Calculating purchase confidence scores</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show results and conversion flow
  if (showResults && userProfile) {
    return (
      <AdvancedConversionFlow
        userProfile={userProfile}
        recommendations={profileRecommendations}
        quizResponses={responses}
      />
    );
  }

  if (!currentQ) return null;

  // Determine if user can proceed
  const canProceed =
    currentQ.type === 'multi_select'
      ? selectedOptions.length >= (currentQ.min_selections || 1)
      : currentQ.type === 'single_select'
        ? selectedOptions.length > 0
        : true; // Slider always allows proceed

  return (
    <div className='max-w-3xl mx-auto space-y-8'>
      {/* Enhanced Progress Bar with Personality Building Visualization */}
      <div className='space-y-4'>
        <div className='flex justify-between text-sm text-muted-foreground'>
          <span>
            Question {currentQuestion + 1} of {ADVANCED_QUIZ_QUESTIONS.length}
          </span>
          <span>Building your personality profile...</span>
        </div>
        <Progress value={progress} className='h-3' />

        {/* Trait Combination Preview */}
        {responses.length > 0 && (
          <div className='flex flex-wrap gap-2 justify-center'>
            {responses
              .flatMap(r => r.selected_options || [r.selected_option])
              .filter(Boolean)
              .slice(0, 6) // Show max 6 for space
              .map((trait, index) => (
                <Badge
                  key={`trait-${index}`}
                  variant='secondary'
                  className='text-xs'
                >
                  {trait.replace('_', ' ')}
                </Badge>
              ))}
            {responses
              .flatMap(r => r.selected_options || [r.selected_option])
              .filter(Boolean).length > 6 && (
              <Badge variant='outline' className='text-xs'>
                +
                {responses
                  .flatMap(r => r.selected_options || [r.selected_option])
                  .filter(Boolean).length - 6}{' '}
                more
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Question Card */}
      <Card>
        <CardContent className='py-8'>
          <div className='text-center mb-8'>
            <h2 className='text-2xl font-semibold text-foreground mb-2'>
              {currentQ.title}
            </h2>
            {currentQ.subtitle && (
              <p className='text-muted-foreground'>{currentQ.subtitle}</p>
            )}
          </div>

          {/* Multi-Selection Options */}
          {(currentQ.type === 'multi_select' ||
            currentQ.type === 'single_select') && (
            <div className='space-y-4'>
              {currentQ.options?.map(option => {
                const isSelected = selectedOptions.includes(option.id);
                const isAtLimit =
                  currentQ.type === 'multi_select' &&
                  selectedOptions.length >= (currentQ.max_selections || 3) &&
                  !isSelected;

                return (
                  <button
                    key={option.id}
                    onClick={() => !isAtLimit && handleOptionToggle(option.id)}
                    disabled={isAtLimit}
                    className={`
                      w-full p-4 text-left border-2 rounded-lg transition-all duration-200 group
                      ${
                        isSelected
                          ? 'border-plum-500 bg-plum-50 shadow-md'
                          : 'border-border hover:border-plum-300 hover:bg-plum-25'
                      }
                      ${isAtLimit ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01] active:scale-[0.99]'}
                    `}
                  >
                    <div className='flex items-center space-x-4'>
                      {/* Option Icon/Emoji */}
                      <div className='text-3xl flex-shrink-0'>
                        {option.emoji}
                      </div>

                      {/* Option Content */}
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center space-x-2 mb-1'>
                          <span
                            className={`font-semibold ${
                              isSelected
                                ? 'text-plum-700'
                                : 'text-foreground group-hover:text-plum-600'
                            }`}
                          >
                            {option.label}
                          </span>
                          {isSelected && (
                            <div className='flex-shrink-0 w-6 h-6 bg-plum-500 rounded-full flex items-center justify-center'>
                              <Check className='w-4 h-4 text-white' />
                            </div>
                          )}
                        </div>
                        <p
                          className={`text-sm ${
                            isSelected
                              ? 'text-plum-600'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {option.description}
                        </p>
                      </div>

                      {/* Selection Indicator */}
                      <div className='flex-shrink-0'>
                        {!isSelected && !isAtLimit && (
                          <ChevronRight className='w-5 h-5 text-muted-foreground group-hover:text-plum-500' />
                        )}
                        {isAtLimit && !isSelected && (
                          <X className='w-5 h-5 text-muted-foreground' />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Multi-selection guidance */}
              {currentQ.type === 'multi_select' && (
                <div className='text-center text-sm text-muted-foreground mt-6'>
                  <p>
                    Selected: <strong>{selectedOptions.length}</strong> of{' '}
                    {currentQ.max_selections || 3} maximum
                  </p>
                  {selectedOptions.length === 0 && (
                    <p className='text-plum-600 mt-2'>
                      💡 Select {currentQ.min_selections || 1}-
                      {currentQ.max_selections || 3} options that feel authentic
                      to you
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Slider Question */}
          {currentQ.type === 'slider' && (
            <div className='space-y-6'>
              <div className='px-4'>
                <Slider
                  value={[sliderValue]}
                  onValueChange={value => setSliderValue(value[0])}
                  max={100}
                  min={0}
                  step={5}
                  className='w-full'
                />
              </div>

              {/* Slider Labels */}
              <div className='flex justify-between text-xs text-muted-foreground px-2'>
                <span className='text-left max-w-[30%]'>
                  {currentQ.labels?.[0]}
                </span>
                <span className='text-center max-w-[40%] font-medium text-foreground'>
                  {Object.entries(currentQ.labels || {}).find(
                    ([key]) => Math.abs(parseInt(key) - sliderValue) <= 12
                  )?.[1] || 'Perfect balance'}
                </span>
                <span className='text-right max-w-[30%]'>
                  {currentQ.labels?.[100]}
                </span>
              </div>

              {/* Current intensity visualization */}
              <div className='text-center'>
                <div className='inline-flex items-center space-x-2 bg-plum-50 px-4 py-2 rounded-full'>
                  <div
                    className='w-3 h-3 rounded-full bg-plum-500'
                    style={{
                      opacity: sliderValue / 100,
                      transform: `scale(${0.5 + (sliderValue / 100) * 0.5})`,
                    }}
                  />
                  <span className='text-sm font-medium text-plum-700'>
                    {sliderValue}% intensity
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Controls */}
      <div className='flex justify-between items-center'>
        <Button
          variant='outline'
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className='flex items-center space-x-2'
        >
          <ChevronLeft className='w-4 h-4' />
          <span>Previous</span>
        </Button>

        <div className='text-center'>
          <p className='text-xs text-muted-foreground'>
            {canProceed
              ? 'Ready to continue'
              : currentQ.type === 'multi_select'
                ? `Select ${(currentQ.min_selections || 1) - selectedOptions.length} more`
                : 'Please make a selection'}
          </p>
        </div>

        <Button
          onClick={handleNext}
          disabled={!canProceed}
          className='flex items-center space-x-2 bg-plum-600 hover:bg-plum-700'
        >
          <span>{isLastQuestion ? 'Build My Profile' : 'Next Question'}</span>
          <ChevronRight className='w-4 h-4' />
        </Button>
      </div>

      {/* Selected Traits Preview for Multi-Select */}
      {currentQ.type === 'multi_select' && selectedOptions.length > 0 && (
        <Card className='bg-plum-25 border-plum-200'>
          <CardContent className='py-4'>
            <div className='text-center'>
              <p className='text-sm text-plum-700 mb-3'>Your selections:</p>
              <div className='flex flex-wrap gap-2 justify-center'>
                {selectedOptions.map(optionId => {
                  const option = currentQ.options?.find(o => o.id === optionId);
                  return (
                    <Badge
                      key={optionId}
                      variant='default'
                      className='bg-plum-100 text-plum-800 border-plum-300 flex items-center space-x-1'
                    >
                      <span>{option?.emoji}</span>
                      <span>{option?.label}</span>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleOptionToggle(optionId);
                        }}
                        className='ml-1 hover:bg-plum-200 rounded-full p-0.5'
                      >
                        <X className='w-3 h-3' />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Engagement Elements */}
      <div className='text-center text-sm text-muted-foreground'>
        <div className='flex items-center justify-center space-x-6'>
          <div className='flex items-center space-x-1'>
            <div className='w-2 h-2 bg-plum-500 rounded-full animate-pulse' />
            <span>Building your unique profile</span>
          </div>
          <div className='flex items-center space-x-1'>
            <div className='w-2 h-2 bg-gold-500 rounded-full' />
            <span>No account required</span>
          </div>
          <div className='flex items-center space-x-1'>
            <div className='w-2 h-2 bg-cream-500 rounded-full' />
            <span>Instant personalized results</span>
          </div>
        </div>
      </div>
    </div>
  );
}
