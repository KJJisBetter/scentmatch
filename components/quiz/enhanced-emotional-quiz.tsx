'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, CheckCircle, Sparkles, Heart } from 'lucide-react';

interface QuizQuestion {
  id: string;
  text: string;
  subtitle?: string;
  emotionalTrigger: string;
  allowMultiple?: boolean;
  minSelections?: number;
  maxSelections?: number;
  options: Array<{
    value: string;
    text: string;
    emoji: string;
    visualMetaphor?: string;
    sensoryDescription?: string;
  }>;
}

interface EnhancedEmotionalQuizProps {
  onComplete: (responses: any[]) => void;
}

export function EnhancedEmotionalQuiz({
  onComplete,
}: EnhancedEmotionalQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [currentSelections, setCurrentSelections] = useState<string[]>([]);

  // Emotionally-resonant questions using psychology and synesthesia
  const questions: QuizQuestion[] = [
    {
      id: 'weekend_ritual',
      text: 'Picture your perfect weekend morning...',
      subtitle: 'Close your eyes and imagine yourself completely at peace',
      emotionalTrigger: 'lifestyle_aspiration',
      options: [
        {
          value: 'coffee_journal',
          text: 'Quiet coffee and journaling by the window',
          emoji: '☕',
          visualMetaphor: 'Golden light filtering through gauze curtains',
          sensoryDescription: 'Warm, contemplative, soft',
        },
        {
          value: 'farmers_market',
          text: 'Browsing farmers market with fresh flowers',
          emoji: '🌻',
          visualMetaphor: 'Bursts of color in wicker baskets',
          sensoryDescription: 'Fresh, vibrant, alive',
        },
        {
          value: 'trail_adventure',
          text: 'Hiking a hidden trail no one knows about',
          emoji: '🌲',
          visualMetaphor: 'Dappled sunlight through ancient trees',
          sensoryDescription: 'Earthy, mysterious, grounding',
        },
        {
          value: 'city_exploration',
          text: 'Discovering a new neighborhood café',
          emoji: '🏙️',
          visualMetaphor: 'Urban energy meets intimate spaces',
          sensoryDescription: 'Sophisticated, curious, dynamic',
        },
        {
          value: 'creative_flow',
          text: 'Lost in a creative project for hours',
          emoji: '🎨',
          visualMetaphor: 'Colors bleeding into each other',
          sensoryDescription: 'Imaginative, intense, passionate',
        },
      ],
    },
    {
      id: 'texture_affinity',
      text: 'Which texture calls to your fingertips?',
      subtitle: 'Trust your instinctual response - no thinking required',
      emotionalTrigger: 'sensory_memory',
      options: [
        {
          value: 'velvet_crush',
          text: 'Crushed velvet that catches moonlight',
          emoji: '🌙',
          sensoryDescription: 'Luxurious, mysterious, seductive',
        },
        {
          value: 'ocean_glass',
          text: 'Sea glass worn smooth by waves',
          emoji: '🌊',
          sensoryDescription: 'Clean, refreshing, timeless',
        },
        {
          value: 'warm_wood',
          text: 'Sun-warmed driftwood on the beach',
          emoji: '🌅',
          sensoryDescription: 'Natural, grounding, comfortable',
        },
        {
          value: 'silk_whisper',
          text: 'Silk that whispers when you move',
          emoji: '✨',
          sensoryDescription: 'Elegant, refined, graceful',
        },
        {
          value: 'leather_story',
          text: 'Well-loved leather with stories to tell',
          emoji: '📖',
          sensoryDescription: 'Rich, bold, adventurous',
        },
      ],
    },
    {
      id: 'color_emotion',
      text: 'What color is your inner sanctuary?',
      subtitle: 'The place in your mind where you feel most yourself',
      emotionalTrigger: 'self_identity',
      allowMultiple: true,
      minSelections: 1,
      maxSelections: 3,
      options: [
        {
          value: 'champagne_gold',
          text: 'Champagne gold at golden hour',
          emoji: '🥂',
          visualMetaphor: 'Liquid light dancing in crystal',
        },
        {
          value: 'deep_forest',
          text: 'The deep green heart of an old forest',
          emoji: '🌿',
          visualMetaphor: 'Ancient secrets and fresh growth',
        },
        {
          value: 'blush_sunset',
          text: 'Blush pink sky after a perfect day',
          emoji: '🌸',
          visualMetaphor: 'Gentle warmth and soft dreams',
        },
        {
          value: 'midnight_velvet',
          text: 'Midnight blue velvet studded with stars',
          emoji: '⭐',
          visualMetaphor: 'Infinite possibility and quiet power',
        },
        {
          value: 'pearl_mist',
          text: 'Pearl mist over calm water',
          emoji: '🤍',
          visualMetaphor: 'Pure potential and serene clarity',
        },
        {
          value: 'amber_fire',
          text: 'Amber glow of a perfect fire',
          emoji: '🔥',
          visualMetaphor: 'Passionate warmth and magnetic energy',
        },
      ],
    },
    {
      id: 'memory_scent',
      text: 'What memory makes you smile without trying?',
      subtitle: 'The scent of a moment that lives in your heart',
      emotionalTrigger: 'nostalgic_resonance',
      options: [
        {
          value: 'grandmother_kitchen',
          text: "Baking bread in grandmother's kitchen",
          emoji: '🍞',
          sensoryDescription: 'Warm, comforting, unconditional love',
        },
        {
          value: 'first_garden',
          text: 'Rain on the garden after a dry spell',
          emoji: '🌧️',
          sensoryDescription: 'Fresh, renewing, hopeful',
        },
        {
          value: 'library_secrets',
          text: 'Old books in a hidden library corner',
          emoji: '📚',
          sensoryDescription: 'Mysterious, intellectual, timeless',
        },
        {
          value: 'ocean_freedom',
          text: 'Salt air and endless ocean horizons',
          emoji: '🌊',
          sensoryDescription: 'Free, expansive, adventurous',
        },
        {
          value: 'evening_jasmine',
          text: 'Jasmine blooming outside your window',
          emoji: '🌼',
          sensoryDescription: 'Romantic, intoxicating, dreamy',
        },
        {
          value: 'winter_cabin',
          text: 'Woodsmoke from a cozy cabin fireplace',
          emoji: '🏔️',
          sensoryDescription: 'Cozy, grounding, intimate',
        },
      ],
    },
    {
      id: 'social_energy',
      text: 'How do you want people to feel when you enter a room?',
      subtitle: 'Your invisible signature - what energy do you bring?',
      emotionalTrigger: 'social_identity',
      options: [
        {
          value: 'warm_embrace',
          text: 'Like coming home - instantly comfortable',
          emoji: '🤗',
          sensoryDescription: 'Approachable, nurturing, genuine',
        },
        {
          value: 'magnetic_mystery',
          text: 'Intrigued and wanting to know more',
          emoji: '🔮',
          sensoryDescription: 'Mysterious, captivating, alluring',
        },
        {
          value: 'confident_grace',
          text: 'Inspired by quiet confidence',
          emoji: '👑',
          sensoryDescription: 'Elegant, self-assured, refined',
        },
        {
          value: 'playful_joy',
          text: 'Uplifted by infectious positive energy',
          emoji: '🌟',
          sensoryDescription: 'Joyful, spontaneous, energizing',
        },
        {
          value: 'authentic_depth',
          text: 'Drawn to your authentic, thoughtful presence',
          emoji: '🌙',
          sensoryDescription: 'Thoughtful, genuine, deep',
        },
      ],
    },
    {
      id: 'dream_escape',
      text: 'If you could step into any world for a day...',
      subtitle: 'Where does your soul want to wander?',
      emotionalTrigger: 'aspirational_fantasy',
      allowMultiple: true,
      minSelections: 1,
      maxSelections: 2,
      options: [
        {
          value: 'parisian_atelier',
          text: "A Parisian artist's atelier in 1920",
          emoji: '🎭',
          visualMetaphor: 'Bohemian elegance and creative passion',
        },
        {
          value: 'secret_garden',
          text: 'A secret garden that blooms eternally',
          emoji: '🌺',
          visualMetaphor: 'Hidden beauty and natural magic',
        },
        {
          value: 'mountain_monastery',
          text: 'A peaceful monastery high in the mountains',
          emoji: '⛩️',
          visualMetaphor: 'Spiritual clarity and ancient wisdom',
        },
        {
          value: 'venetian_masquerade',
          text: 'An elegant Venetian masquerade ball',
          emoji: '🎪',
          visualMetaphor: 'Mysterious luxury and timeless romance',
        },
        {
          value: 'forest_cottage',
          text: 'A cottage where forest spirits visit for tea',
          emoji: '🧚',
          visualMetaphor: 'Whimsical magic and natural harmony',
        },
        {
          value: 'starship_library',
          text: 'A library on a ship sailing between stars',
          emoji: '🚀',
          visualMetaphor: 'Infinite knowledge and boundless adventure',
        },
      ],
    },
  ];

  const handleAnswerSelect = (answer: string) => {
    const question = questions[currentQuestion];
    if (!question) return;

    if (question.allowMultiple) {
      const isSelected = currentSelections.includes(answer);
      let newSelections: string[];

      if (isSelected) {
        newSelections = currentSelections.filter(s => s !== answer);
      } else {
        if (currentSelections.length < (question.maxSelections || 3)) {
          newSelections = [...currentSelections, answer];
        } else {
          return;
        }
      }
      setCurrentSelections(newSelections);
    } else {
      // Single selection - proceed immediately
      const newResponse = {
        question_id: question.id,
        answer_value: answer,
        emotional_trigger: question.emotionalTrigger,
        timestamp: new Date().toISOString(),
      };

      const updatedResponses = [...responses, newResponse];
      setResponses(updatedResponses);
      setCurrentSelections([]);

      if (currentQuestion >= questions.length - 1) {
        onComplete(updatedResponses);
      } else {
        setCurrentQuestion(currentQuestion + 1);
      }
    }
  };

  const handleMultipleSelectionContinue = () => {
    const question = questions[currentQuestion];
    if (!question || !question.allowMultiple) return;

    if (currentSelections.length < (question.minSelections || 1)) {
      return;
    }

    const newResponse = {
      question_id: question.id,
      answer_value: currentSelections.join(','),
      answer_metadata: { selections: currentSelections },
      emotional_trigger: question.emotionalTrigger,
      timestamp: new Date().toISOString(),
    };

    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);
    setCurrentSelections([]);

    if (currentQuestion >= questions.length - 1) {
      onComplete(updatedResponses);
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const question = questions[currentQuestion];
  if (!question) return null;

  const progressPercent = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className='max-w-2xl mx-auto'>
      {/* Enhanced Progress Bar with Emotional Journey */}
      <div className='mb-8'>
        <div className='flex justify-between text-sm text-muted-foreground mb-2'>
          <span>
            <Heart className='w-4 h-4 inline mr-1' />
            Journey {currentQuestion + 1} of {questions.length}
          </span>
          <span>{Math.round(progressPercent)}% complete</span>
        </div>
        <div className='w-full bg-gradient-to-r from-pink-100 to-purple-100 rounded-full h-3'>
          <div
            className='bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-500 shadow-sm'
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className='text-center mt-2'>
          <Badge
            variant='outline'
            className='px-3 py-1 text-xs bg-gradient-to-r from-pink-50 to-purple-50'
          >
            <Sparkles className='w-3 h-3 mr-1' />
            Emotional Discovery Mode
          </Badge>
        </div>
      </div>

      {/* Enhanced Question Card with Emotional Context */}
      <Card className='shadow-lg border-0 bg-gradient-to-br from-white to-purple-50/50'>
        <CardContent className='py-8 px-6'>
          <div className='text-center mb-8'>
            <h2 className='text-2xl font-semibold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
              {question.text}
            </h2>
            {question.subtitle && (
              <p className='text-muted-foreground italic text-lg leading-relaxed'>
                {question.subtitle}
              </p>
            )}
          </div>

          <div className='space-y-4'>
            {question.options.map(option => {
              const isSelected =
                question.allowMultiple &&
                currentSelections.includes(option.value);

              return (
                <button
                  key={option.value}
                  onClick={() => handleAnswerSelect(option.value)}
                  className={`w-full p-6 text-left border-2 rounded-xl transition-all duration-300 group transform hover:scale-[1.02] active:scale-[0.98] ${
                    isSelected
                      ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 shadow-md'
                      : 'border-gray-200 hover:border-purple-300 hover:shadow-lg hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50'
                  }`}
                >
                  <div className='flex items-start space-x-4'>
                    <div className='text-3xl flex-shrink-0'>{option.emoji}</div>
                    <div className='flex-1 min-w-0'>
                      <div
                        className={`font-semibold text-lg mb-1 ${
                          isSelected
                            ? 'text-purple-700'
                            : 'group-hover:text-purple-700 text-gray-800'
                        }`}
                      >
                        {option.text}
                      </div>
                      {(option.visualMetaphor || option.sensoryDescription) && (
                        <div className='text-sm text-muted-foreground italic'>
                          {option.visualMetaphor || option.sensoryDescription}
                        </div>
                      )}
                    </div>
                    {question.allowMultiple ? (
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-purple-500 border-purple-500'
                            : 'border-gray-300 group-hover:border-purple-400'
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle className='w-4 h-4 text-white' />
                        )}
                      </div>
                    ) : (
                      <ChevronRight className='w-5 h-5 text-gray-400 group-hover:text-purple-500 flex-shrink-0' />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Enhanced Continue Button for Multiple Selection */}
          {question.allowMultiple && (
            <div className='mt-8 text-center'>
              <Button
                onClick={handleMultipleSelectionContinue}
                disabled={
                  currentSelections.length < (question.minSelections || 1)
                }
                className='px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300'
              >
                <Heart className='w-4 h-4 mr-2' />
                Continue with {currentSelections.length}{' '}
                {currentSelections.length === 1 ? 'choice' : 'choices'}
              </Button>
              <p className='text-xs text-muted-foreground mt-3'>
                {currentSelections.length}/{question.maxSelections || 3}{' '}
                selected
                {question.minSelections &&
                  ` (minimum ${question.minSelections})`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emotional Encouragement */}
      <div className='mt-6 text-center text-sm text-muted-foreground'>
        <p className='bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-medium'>
          ✨ Trust your instincts • 💫 There are no wrong answers • 🌟 Your
          authentic self guides the way
        </p>
      </div>
    </div>
  );
}
