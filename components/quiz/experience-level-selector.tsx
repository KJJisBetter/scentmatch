'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';

export type ExperienceLevel = 'beginner' | 'enthusiast' | 'collector';

interface ExperienceLevelSelectorProps {
  onLevelSelect: (level: ExperienceLevel) => void;
  selectedLevel?: ExperienceLevel;
}

/**
 * Experience Level Selector Component
 *
 * Natural, conversational language for selecting fragrance experience level.
 * Uses first-person perspective and approachable descriptions.
 */
export function ExperienceLevelSelector({
  onLevelSelect,
  selectedLevel,
}: ExperienceLevelSelectorProps) {
  const experienceLevels = [
    {
      id: 'beginner' as ExperienceLevel,
      display_name: 'New to Fragrances',
      description: "I'm just starting to explore different scents",
      emoji: '🌱',
      badge_color: 'bg-green-100 text-green-800',
      button_style: 'hover:border-green-300 hover:bg-green-50',
    },
    {
      id: 'enthusiast' as ExperienceLevel,
      display_name: 'Fragrance Lover',
      description: 'I enjoy fragrances and know some of my preferences',
      emoji: '🌸',
      badge_color: 'bg-purple-100 text-purple-800',
      button_style: 'hover:border-purple-300 hover:bg-purple-50',
    },
    {
      id: 'collector' as ExperienceLevel,
      display_name: 'Fragrance Collector',
      description: 'I have an extensive collection and deep knowledge',
      emoji: '🎭',
      badge_color: 'bg-indigo-100 text-indigo-800',
      button_style: 'hover:border-indigo-300 hover:bg-indigo-50',
    },
  ];

  return (
    <div className='max-w-2xl mx-auto'>
      <div className='text-center mb-8'>
        <h2 className='text-2xl font-semibold mb-4'>
          What's your experience with fragrances?
        </h2>
        <p className='text-muted-foreground'>
          This helps us ask the right questions for you
        </p>
      </div>

      <div className='space-y-4'>
        {experienceLevels.map(level => {
          const isSelected = selectedLevel === level.id;

          return (
            <button
              key={level.id}
              onClick={() => onLevelSelect(level.id)}
              className={`w-full p-6 text-left border-2 rounded-lg transition-all duration-200 group transform hover:scale-[1.02] active:scale-[0.98] ${
                isSelected
                  ? 'border-purple-500 bg-purple-50'
                  : `border-gray-200 ${level.button_style}`
              }`}
              data-testid={`experience-${level.id}`}
            >
              <div className='flex items-center space-x-4'>
                <div className='text-3xl'>{level.emoji}</div>
                <div className='flex-1'>
                  <div className='flex items-center space-x-3 mb-2'>
                    <h3
                      className={`text-lg font-semibold ${
                        isSelected
                          ? 'text-purple-700'
                          : 'group-hover:text-purple-700'
                      }`}
                    >
                      {level.display_name}
                    </h3>
                    <Badge className={level.badge_color}>
                      {level.id === 'beginner'
                        ? '4 questions'
                        : level.id === 'enthusiast'
                          ? '6 questions'
                          : '8-10 questions'}
                    </Badge>
                  </div>
                  <p
                    className={`text-sm ${
                      isSelected
                        ? 'text-purple-600'
                        : 'text-muted-foreground group-hover:text-purple-600'
                    }`}
                  >
                    {level.description}
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

      <div className='mt-8 text-center'>
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <p className='text-sm text-blue-800'>
            💡 <strong>Don't worry!</strong> You can always change your mind.
            We'll adjust the questions to match your comfort level.
          </p>
        </div>
      </div>
    </div>
  );
}
