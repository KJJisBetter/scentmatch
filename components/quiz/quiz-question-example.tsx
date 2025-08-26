/**
 * QuizQuestion Usage Examples
 * 
 * This file demonstrates how to use the QuizQuestion component
 * with all supported question types and beginner-friendly features.
 */

import React, { useState } from 'react';
import { QuizQuestion } from './quiz-question';
import { QuizQuestionData, QuizAnswerResponse } from './quiz-question-types';

// Example question data for all supported types
export const exampleQuestions: QuizQuestionData[] = [
  // Single Choice Question
  {
    id: 'fragrance-experience',
    type: 'single-choice',
    text: 'How would you describe your experience with fragrances?',
    subtext: 'This helps us personalize your recommendations',
    options: [
      {
        value: 'beginner',
        text: 'Just getting started',
        emoji: '🌱',
        tooltip: 'Perfect! We\'ll guide you through the basics and help you discover what you love.',
      },
      {
        value: 'some-experience',
        text: 'I have some favorites',
        emoji: '🌸',
        tooltip: 'Great! We can help you explore similar scents and branch out into new territories.',
      },
      {
        value: 'experienced',
        text: 'I love trying new scents',
        emoji: '🎭',
        tooltip: 'Excellent! We\'ll show you unique and complex fragrances you might not have discovered.',
      },
    ],
    fragranceTerms: [
      {
        term: 'Fragrance Family',
        definition: 'Groups of scents with similar characteristics, like floral, woody, or fresh.',
      },
      {
        term: 'Notes',
        definition: 'Individual scent components that you smell, like vanilla, rose, or sandalwood.',
      },
    ],
  },

  // Multiple Choice Question
  {
    id: 'preferred-occasions',
    type: 'multiple-choice',
    text: 'When do you most want to wear fragrance?',
    subtext: 'Select all that apply - you can choose multiple occasions',
    options: [
      {
        value: 'work',
        text: 'Work & professional settings',
        emoji: '💼',
        tooltip: 'Professional fragrances are typically lighter and more subtle.',
      },
      {
        value: 'dates',
        text: 'Dates & romantic evenings',
        emoji: '💕',
        tooltip: 'Romantic fragrances often feature floral, warm, or sensual notes.',
      },
      {
        value: 'everyday',
        text: 'Everyday casual wear',
        emoji: '☀️',
        tooltip: 'Everyday scents are fresh, clean, and comfortable for regular use.',
      },
      {
        value: 'special-events',
        text: 'Special occasions & parties',
        emoji: '🎉',
        tooltip: 'Special occasion fragrances can be bolder and more memorable.',
      },
    ],
  },

  // Scale Question
  {
    id: 'intensity-preference',
    type: 'scale',
    text: 'How strong do you prefer your fragrance?',
    subtext: 'Move the slider to show your preference',
    scaleConfig: {
      min: 1,
      max: 5,
      step: 1,
      labels: [
        { value: 1, label: 'Very Light' },
        { value: 2, label: 'Light' },
        { value: 3, label: 'Moderate' },
        { value: 4, label: 'Strong' },
        { value: 5, label: 'Very Strong' },
      ],
    },
    fragranceTerms: [
      {
        term: 'Sillage',
        definition: 'How far your fragrance travels - the "scent trail" you leave behind.',
      },
      {
        term: 'Longevity',
        definition: 'How long a fragrance lasts on your skin, from a few hours to all day.',
      },
    ],
  },

  // Text Input Question
  {
    id: 'describe-ideal-scent',
    type: 'text-input',
    text: 'Describe your ideal fragrance in a few words',
    subtext: 'Think about moods, memories, or feelings you want your scent to evoke',
    textConfig: {
      placeholder: 'e.g., "fresh like a garden after rain" or "warm and cozy like a coffee shop"',
      maxLength: 200,
    },
    fragranceTerms: [
      {
        term: 'Scent Memory',
        definition: 'How certain smells can trigger specific memories or emotions.',
      },
      {
        term: 'Signature Scent',
        definition: 'A fragrance that becomes uniquely associated with you.',
      },
    ],
  },
];

// Example component demonstrating usage
export function QuizQuestionExample() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswerResponse[]>([]);

  const currentQuestion = exampleQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / exampleQuestions.length) * 100;

  if (!currentQuestion) {
    return null;
  }

  const handleAnswer = (answer: QuizAnswerResponse) => {
    setAnswers([...answers, answer]);
    
    // Move to next question or finish
    if (currentQuestionIndex < exampleQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      console.log('Quiz completed!', { answers: [...answers, answer] });
      // Handle quiz completion
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
  };

  if (currentQuestionIndex >= exampleQuestions.length) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Quiz Complete!</h2>
        <p className="text-muted-foreground mb-6">
          You've answered all {exampleQuestions.length} questions.
        </p>
        <button
          onClick={resetQuiz}
          className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
        >
          Try Again
        </button>
        
        {/* Display collected answers */}
        <div className="mt-8 text-left">
          <h3 className="text-lg font-semibold mb-4">Your Answers:</h3>
          <div className="space-y-2">
            {answers.map((answer, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded">
                <div className="font-medium">{answer.questionId}</div>
                <div className="text-sm text-muted-foreground">
                  {JSON.stringify(answer.answer)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <QuizQuestion
      question={currentQuestion}
      onAnswer={handleAnswer}
      progress={progress}
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={exampleQuestions.length}
    />
  );
}

// Export individual question examples for testing
export const singleChoiceExample = exampleQuestions[0];
export const multipleChoiceExample = exampleQuestions[1];
export const scaleExample = exampleQuestions[2];
export const textInputExample = exampleQuestions[3];