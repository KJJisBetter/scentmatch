'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  genderPreferenceSchema,
  type GenderPreferenceFormData,
} from '@/lib/quiz/form-schemas';

export type GenderPreference = 'men' | 'women';

interface GenderPreferenceSelectorProps {
  onGenderSelect: (gender: GenderPreference) => void;
  selectedGender?: GenderPreference;
}

/**
 * Gender Preference Selector Component
 *
 * Uses React Hook Form with zod validation for robust form handling.
 * Maintains natural, inclusive language for fragrance gender preferences.
 */
export function GenderPreferenceSelector({
  onGenderSelect,
  selectedGender,
}: GenderPreferenceSelectorProps) {
  const form = useForm<GenderPreferenceFormData>({
    resolver: zodResolver(genderPreferenceSchema),
    defaultValues: {
      gender: selectedGender,
    },
  });

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

  const onSubmit = (data: GenderPreferenceFormData) => {
    onGenderSelect(data.gender);
  };

  const handleGenderClick = (gender: GenderPreference) => {
    form.setValue('gender', gender);
    form.handleSubmit(onSubmit)();
  };

  const watchedGender = form.watch('gender');

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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name='gender'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className='space-y-4'>
                    {genderOptions.map(option => {
                      const isSelected = watchedGender === option.id;

                      return (
                        <button
                          key={option.id}
                          type='button'
                          onClick={() => handleGenderClick(option.id)}
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
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      <div className='mt-6 text-center'>
        <p className='text-xs text-muted-foreground'>
          Remember: Many fragrances work beautifully for everyone regardless of
          traditional marketing
        </p>
      </div>
    </div>
  );
}
