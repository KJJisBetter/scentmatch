'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';

export type ExperienceLevel = 'beginner' | 'enthusiast' | 'collector';
export type GenderPreference = 'women' | 'men' | 'unisex' | 'all';

interface ExperienceLevelSelectorProps {
  onSelectionComplete: (data: {
    gender_preference: GenderPreference;
    experience_level: ExperienceLevel;
  }) => void;
  initialGender?: GenderPreference;
  initialExperience?: ExperienceLevel;
}

/**
 * ExperienceLevelSelector Component
 *
 * Handles the two-step selection process:
 * 1. Gender preference for fragrance filtering
 * 2. Experience level for adaptive UI complexity
 */
export function ExperienceLevelSelector({
  onSelectionComplete,
  initialGender,
  initialExperience,
}: ExperienceLevelSelectorProps) {
  const [selectedGender, setSelectedGender] = useState<GenderPreference | null>(
    initialGender || null
  );
  const [selectedExperience, setSelectedExperience] =
    useState<ExperienceLevel | null>(initialExperience || null);

  // Gender selection options
  const genderOptions = [
    {
      value: 'women' as GenderPreference,
      text: 'Fragrances for women',
      emoji: '🌸',
      description: 'Typically floral, fruity, and elegant',
    },
    {
      value: 'men' as GenderPreference,
      text: 'Fragrances for men',
      emoji: '🌲',
      description: 'Typically woody, fresh, and bold',
    },
    {
      value: 'unisex' as GenderPreference,
      text: 'Unisex fragrances',
      emoji: '🌈',
      description: 'Gender-neutral scents for everyone',
    },
    {
      value: 'all' as GenderPreference,
      text: 'All fragrances',
      emoji: '✨',
      description: 'I like exploring everything',
    },
  ];

  // Experience level options
  const experienceOptions = [
    {
      value: 'beginner' as ExperienceLevel,
      text: 'New to fragrances',
      emoji: '🌱',
      description: 'Just getting started with scents',
    },
    {
      value: 'enthusiast' as ExperienceLevel,
      text: 'Some experience',
      emoji: '🌸',
      description: 'I know what I like and want to explore more',
    },
    {
      value: 'collector' as ExperienceLevel,
      text: 'Experienced collector',
      emoji: '🎭',
      description: 'I have a collection and deep knowledge',
    },
  ];

  const handleGenderSelect = (gender: GenderPreference) => {
    setSelectedGender(gender);

    // Track gender selection
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'gender_preference_selected', {
        gender_preference: gender,
      });
    }
  };

  const handleExperienceSelect = (experience: ExperienceLevel) => {
    setSelectedExperience(experience);

    if (selectedGender) {
      // Track experience selection
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'experience_level_selected', {
          experience_level: experience,
          gender_preference: selectedGender,
        });
      }

      // Complete selection
      onSelectionComplete({
        gender_preference: selectedGender,
        experience_level: experience,
      });
    }
  };

  // Gender selection screen (first step)
  if (!selectedGender) {
    return (
      <div className='max-w-2xl mx-auto'>
        <Card>
          <CardContent className='py-8'>
            <div className='text-center mb-8'>
              <h2 className='text-2xl font-semibold mb-2'>
                What gender fragrances interest you most?
              </h2>
              <p className='text-muted-foreground'>
                This helps us show the most relevant options
              </p>
            </div>

            <div className='space-y-4'>
              {genderOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleGenderSelect(option.value)}
                  className='w-full p-6 text-left border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group transform hover:scale-[1.02] active:scale-[0.98]'
                >
                  <div className='flex items-start space-x-4'>
                    <div className='text-3xl'>{option.emoji}</div>
                    <div className='flex-1'>
                      <div className='font-semibold text-lg group-hover:text-purple-700 mb-1'>
                        {option.text}
                      </div>
                      <div className='text-muted-foreground text-sm'>
                        {option.description}
                      </div>
                    </div>
                    <ChevronRight className='w-5 h-5 text-gray-400 group-hover:text-purple-500 mt-1' />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className='mt-6 text-center text-sm text-muted-foreground'>
          <p>
            🎯 Personalized matching • 🧪 Try samples risk-free • ✨ Find your
            signature scent
          </p>
        </div>
      </div>
    );
  }

  // Experience level selection screen (second step)
  return (
    <div className='max-w-2xl mx-auto'>
      <Card>
        <CardContent className='py-8'>
          <div className='text-center mb-8'>
            <h2 className='text-2xl font-semibold mb-2'>
              How familiar are you with fragrances?
            </h2>
            <p className='text-muted-foreground'>
              This helps us customize your experience
            </p>
          </div>

          <div className='space-y-4'>
            {experienceOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleExperienceSelect(option.value)}
                className='w-full p-6 text-left border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group transform hover:scale-[1.02] active:scale-[0.98]'
              >
                <div className='flex items-start space-x-4'>
                  <div className='text-3xl'>{option.emoji}</div>
                  <div className='flex-1'>
                    <div className='font-semibold text-lg group-hover:text-purple-700 mb-1'>
                      {option.text}
                    </div>
                    <div className='text-muted-foreground text-sm'>
                      {option.description}
                    </div>
                  </div>
                  <ChevronRight className='w-5 h-5 text-gray-400 group-hover:text-purple-500 mt-1' />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className='mt-6 text-center text-sm text-muted-foreground'>
        <p>
          🎯 Get personalized recommendations • 🧪 Try samples risk-free • ✨
          Find your signature scent
        </p>
      </div>
    </div>
  );
}
