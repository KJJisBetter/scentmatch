'use client';

import React, { useState, Suspense } from 'react';
import { EnhancedQuizFlow } from '@/components/quiz/enhanced-quiz-flow';
import { ConversionFlow } from '@/components/quiz/conversion-flow';
import { QuizSkeleton } from '@/components/ui/skeletons';

/**
 * Fragrance Personality Quiz Page
 *
 * Enhanced quiz with adaptive complexity and improved UX:
 * - Gender preference selection
 * - Experience level selection (beginner/enthusiast/collector)
 * - Adaptive quiz questions based on experience
 * - Direct 3-recommendation results with AI insights
 */

export default function QuizPage() {
  const [showConversion, setShowConversion] = useState(false);
  const [conversionData, setConversionData] = useState<any>(null);
  const [storedGender, setStoredGender] = useState<string | null>(null);

  // Check for stored gender preference from redirect
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('quiz-gender-preference');
      if (stored) {
        setStoredGender(stored);
        // Clear the stored preference
        localStorage.removeItem('quiz-gender-preference');
      }
    }
  }, []);

  const handleConversionReady = (results: any) => {
    setConversionData(results);
    setShowConversion(true);
  };

  const handleAccountCreated = (userData: any) => {
    console.log('Account created:', userData);
    // Handle successful account creation
  };

  const handleConversionComplete = (result: any) => {
    console.log('Conversion complete:', result);
    // Handle conversion completion
  };

  if (showConversion && conversionData) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50'>
        <div className='container mx-auto px-4 py-8'>
          <ConversionFlow
            quizResults={conversionData}
            onAccountCreated={handleAccountCreated}
            onConversionComplete={handleConversionComplete}
          />
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50'>
      <div className='container mx-auto px-4 py-8'>
        {/* Quiz Header */}
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-serif font-bold text-foreground mb-4'>
            Discover Your Fragrance Personality
          </h1>
          <p className='text-xl text-muted-foreground mb-6'>
            Answer a few questions to find fragrances perfectly matched to your
            style
          </p>

          <div className='flex items-center justify-center space-x-6 text-sm text-muted-foreground'>
            <div className='flex items-center space-x-2'>
              <div className='w-2 h-2 bg-purple-500 rounded-full' />
              <span>2-8 minutes</span>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='w-2 h-2 bg-pink-500 rounded-full' />
              <span>No account required</span>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='w-2 h-2 bg-amber-500 rounded-full' />
              <span>3 perfect matches</span>
            </div>
          </div>
        </div>

        {/* Enhanced Quiz Flow with Suspense */}
        <Suspense fallback={<QuizSkeleton />}>
          <EnhancedQuizFlow
            onConversionReady={handleConversionReady}
            initialGender={storedGender as any}
          />
        </Suspense>

        {/* Trust Signals */}
        <div className='mt-12 text-center'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground'>
            <div>
              <div className='text-2xl mb-2'>🎯</div>
              <h3 className='font-medium text-foreground mb-1'>
                Adaptive Questions
              </h3>
              <p>
                Questions adjust to your experience level - simple for
                beginners, detailed for experts
              </p>
            </div>
            <div>
              <div className='text-2xl mb-2'>🧪</div>
              <h3 className='font-medium text-foreground mb-1'>
                3 Perfect Matches
              </h3>
              <p>
                Get exactly 3 high-quality recommendations with clear
                explanations
              </p>
            </div>
            <div>
              <div className='text-2xl mb-2'>🔒</div>
              <h3 className='font-medium text-foreground mb-1'>
                Privacy First
              </h3>
              <p>
                No account required. Your data is automatically deleted after 24
                hours
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
