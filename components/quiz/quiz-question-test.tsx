/**
 * QuizQuestion Test Component
 * 
 * Simple test to verify the QuizQuestion component works correctly
 * with all question types and features.
 */

'use client';

import React, { useState } from 'react';
import { QuizQuestion } from './quiz-question';
import { QuizQuestionData, QuizAnswerResponse } from './quiz-question-types';

const testQuestion: QuizQuestionData = {
  id: 'test-single-choice',
  type: 'single-choice',
  text: 'What type of fragrance appeals to you most?',
  subtext: 'Choose the option that best describes your preference',
  options: [
    {
      value: 'fresh-clean',
      text: 'Fresh & Clean',
      emoji: '🌿',
      tooltip: 'Light, airy scents that feel crisp and refreshing, like ocean breeze or fresh laundry.',
    },
    {
      value: 'floral-romantic',
      text: 'Floral & Romantic',
      emoji: '🌸',
      tooltip: 'Beautiful flower-based scents like rose, jasmine, or peony that feel feminine and elegant.',
    },
    {
      value: 'warm-cozy',
      text: 'Warm & Cozy',
      emoji: '🤗',
      tooltip: 'Comforting scents with vanilla, amber, or sandalwood that feel like a warm hug.',
    },
  ],
  fragranceTerms: [
    {
      term: 'EDP',
      definition: 'Eau de Parfum - a concentration that typically lasts 4-6 hours on skin.',
    },
    {
      term: 'Top Notes',
      definition: 'The first scents you smell when applying fragrance, usually lasting 5-15 minutes.',
    },
  ],
};

export function QuizQuestionTest() {
  const [answer, setAnswer] = useState<QuizAnswerResponse | null>(null);

  const handleAnswer = (response: QuizAnswerResponse) => {
    setAnswer(response);
    console.log('Quiz answer received:', response);
  };

  if (answer) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Answer Received!</h2>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <p className="text-green-800">
            <strong>Question:</strong> {testQuestion.text}
          </p>
          <p className="text-green-800 mt-2">
            <strong>Your Answer:</strong> {JSON.stringify(answer.answer)}
          </p>
        </div>
        <button
          onClick={() => setAnswer(null)}
          className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">QuizQuestion Component Test</h1>
        <p className="text-muted-foreground">
          Testing the QuizQuestion component with beginner-friendly features
        </p>
      </div>
      
      <QuizQuestion
        question={testQuestion}
        onAnswer={handleAnswer}
        progress={25}
        questionNumber={1}
        totalQuestions={4}
      />
    </div>
  );
}