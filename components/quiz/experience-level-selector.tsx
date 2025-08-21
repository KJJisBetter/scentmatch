'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  experienceLevelSchema,
  type ExperienceLevelFormData,
} from '@/lib/quiz/form-schemas';

export type ExperienceLevel = 'beginner' | 'enthusiast' | 'experienced';

interface ExperienceLevelSelectorProps {
  onLevelSelect: (level: ExperienceLevel) => void;
  selectedLevel?: ExperienceLevel;
}

/**
 * Experience Level Selector Component
 *
 * Uses React Hook Form with zod validation for robust form handling.
 * Natural, conversational language for selecting fragrance experience level.
 */
export function ExperienceLevelSelector({
  onLevelSelect,
  selectedLevel,
}: ExperienceLevelSelectorProps) {
  const form = useForm<ExperienceLevelFormData>({
    resolver: zodResolver(experienceLevelSchema),
    defaultValues: {
      experience: selectedLevel,
    },
  });

  const experienceLevels = [
    {
      id: 'beginner' as ExperienceLevel,
      display_name: 'Just getting started',
      description: "I'm new to fragrances and want to learn",
      emoji: '🌱',
      badge_color: 'bg-green-100 text-green-800',
      button_style: 'hover:border-green-300 hover:bg-green-50',
    },
    {
      id: 'enthusiast' as ExperienceLevel,
      display_name: 'I have my favorites',
      description: 'I know what I like but want to discover more',
      emoji: '🌸',
      badge_color: 'bg-purple-100 text-purple-800',
      button_style: 'hover:border-purple-300 hover:bg-purple-50',
    },
    {
      id: 'experienced' as ExperienceLevel,
      display_name: 'Love trying new things',
      description: 'I enjoy exploring different fragrances and styles',
      emoji: '🎭',
      badge_color: 'bg-indigo-100 text-indigo-800',
      button_style: 'hover:border-indigo-300 hover:bg-indigo-50',
    },
  ];

  const onSubmit = (data: ExperienceLevelFormData) => {
    onLevelSelect(data.experience);
  };

  const handleLevelClick = (level: ExperienceLevel) => {
    form.setValue('experience', level);
    form.handleSubmit(onSubmit)();
  };

  const watchedExperience = form.watch('experience');

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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name='experience'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className='space-y-4'>
                    {experienceLevels.map(level => {
                      const isSelected = watchedExperience === level.id;

                      return (
                        <button
                          key={level.id}
                          type='button'
                          onClick={() => handleLevelClick(level.id)}
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
                                    ? '3 questions'
                                    : '5-6 questions'}
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
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

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
