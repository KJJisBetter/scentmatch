'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';

export type GenderPreference = 'men' | 'women';

interface GenderPreferenceSelectorProps {
  onGenderSelect: (gender: GenderPreference) => void;
  selectedGender?: GenderPreference;
}

/**
 * Gender Preference Selector Component
 *
 * Uses natural, inclusive language for fragrance gender preferences.
 * Fixed "uninex" typo and improved conversational tone.
 */
export function GenderPreferenceSelector({
  onGenderSelect,
  selectedGender,
}: GenderPreferenceSelectorProps) {
  const genderOptions = [
    {
      id: 'women' as GenderPreference,
      display_name: 'For Women',
      description: 'Show me fragrances typically worn by women',
      emoji: '🌺',
      color: 'hover:border-pink-300 hover:bg-pink-50',
    },
    {
      id: 'men' as GenderPreference,
      display_name: 'For Men',
      description: 'Show me fragrances typically worn by men',
      emoji: '🌲',
      color: 'hover:border-blue-300 hover:bg-blue-50',
    },
  ];

  return (
    <div className='max-w-2xl mx-auto'>
      <div className='text-center mb-8'>
        <h2 className='text-2xl font-semibold mb-4'>
          What type of fragrances interest you?
        </h2>
        <p className='text-muted-foreground'>
          Both categories include unisex fragrances you can explore
        </p>
      </div>

      <div className='space-y-4'>
        {genderOptions.map(option => {
          const isSelected = selectedGender === option.id;

          return (
            <button
              key={option.id}
              onClick={() => onGenderSelect(option.id)}
              className={`w-full p-6 text-left border-2 rounded-lg transition-all duration-200 group transform hover:scale-[1.02] active:scale-[0.98] ${
                isSelected
                  ? 'border-purple-500 bg-purple-50'
                  : `border-gray-200 ${option.color}`
              }`}
              data-testid={`gender-${option.id}`}
            >
              <div className='flex items-center space-x-4'>
                <div className='text-3xl'>{option.emoji}</div>
                <div className='flex-1'>
                  <h3
                    className={`text-lg font-semibold mb-1 ${
                      isSelected
                        ? 'text-purple-700'
                        : 'group-hover:text-purple-700'
                    }`}
                  >
                    {option.display_name}
                  </h3>
                  <p
                    className={`text-sm ${
                      isSelected
                        ? 'text-purple-600'
                        : 'text-muted-foreground group-hover:text-purple-600'
                    }`}
                  >
                    {option.description}
                  </p>
                </div>
                <ChevronRight
                  className={`w-5 h-5 transition-colors ${
                    isSelected
                      ? 'text-purple-500'
                      : 'text-gray-400 group-hover:text-purple-500'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className='mt-6 text-center'>
        <p className='text-xs text-muted-foreground'>
          Remember: Many fragrances work beautifully for everyone regardless of
          traditional marketing
        </p>
      </div>
    </div>
  );
}
