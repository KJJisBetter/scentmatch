'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronRight,
  Sparkles,
  Heart,
  Search,
  X,
  CheckCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ConversionFlow } from './conversion-flow';

export type ExperienceLevel = 'beginner' | 'enthusiast' | 'collector';

interface QuizQuestion {
  id: string;
  text: string;
  subtitle?: string;
  allowMultiple?: boolean;
  minSelections?: number;
  maxSelections?: number;
  options: Array<{
    value: string;
    text: string;
    emoji: string;
  }>;
  experienceLevel?: ExperienceLevel[];
}

interface FragranceOption {
  id: string;
  name: string;
  brand: string;
  popularity_score?: number;
}

/**
 * Experience-Level Adaptive Quiz Component
 *
 * Adapts quiz complexity and terminology based on user experience:
 * - Beginner (65%): Simplified language, basic concepts, visual aids
 * - Enthusiast (25%): Moderate complexity, some favorites input
 * - Collector (10%): Advanced terminology, collection management
 */
export function ExperienceLevelAdaptiveQuiz() {
  const [gender, setGender] = useState<string | null>(null);
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [currentSelections, setCurrentSelections] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFavorites, setSelectedFavorites] = useState<FragranceOption[]>(
    []
  );
  const [favoriteSearchQuery, setFavoriteSearchQuery] = useState('');
  const [availableFragrances, setAvailableFragrances] = useState<
    FragranceOption[]
  >([]);
  const [showFavoriteSearch, setShowFavoriteSearch] = useState(false);
  const [quizSessionToken] = useState(
    `adaptive-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );
  const [quizResults, setQuizResults] = useState<any>(null);
  const router = useRouter();

  // Gender selection question (always first)
  const genderQuestion = {
    id: 'gender_preference',
    text: 'What gender fragrances interest you most?',
    subtitle: 'This helps us show the most relevant options',
    options: [
      {
        value: 'women',
        text: 'Fragrances for women',
        emoji: '🌸',
        description: 'Typically floral, fruity, and elegant',
      },
      {
        value: 'men',
        text: 'Fragrances for men',
        emoji: '🌲',
        description: 'Typically woody, fresh, and bold',
      },
      {
        value: 'unisex',
        text: 'Unisex fragrances',
        emoji: '🌈',
        description: 'Gender-neutral scents for everyone',
      },
      {
        value: 'all',
        text: 'All fragrances',
        emoji: '✨',
        description: 'I like exploring everything',
      },
    ],
  };

  // Experience level detection question (second)
  const experienceLevelQuestion = {
    id: 'experience_level',
    text: 'How familiar are you with fragrances?',
    subtitle: 'This helps us customize your experience',
    options: [
      {
        value: 'beginner',
        text: 'New to fragrances',
        emoji: '🌱',
        description: 'Just getting started with scents',
      },
      {
        value: 'enthusiast',
        text: 'Some experience',
        emoji: '🌸',
        description: 'I know what I like and want to explore more',
      },
      {
        value: 'collector',
        text: 'Experienced collector',
        emoji: '🎭',
        description: 'I have a collection and deep knowledge',
      },
    ],
  };

  // Adaptive questions based on experience level
  const getAdaptiveQuestions = (level: ExperienceLevel): QuizQuestion[] => {
    const questionSets = {
      beginner: [
        {
          id: 'style_simple',
          text: 'How would you describe your fragrance style?',
          subtitle: 'Choose the style that feels most like you',
          allowMultiple: false,
          options: [
            { value: 'casual_relaxed', text: 'Casual & Relaxed', emoji: '😊' },
            {
              value: 'polished_professional',
              text: 'Polished & Professional',
              emoji: '💼',
            },
            {
              value: 'romantic_feminine',
              text: 'Romantic & Feminine',
              emoji: '💕',
            },
            { value: 'bold_confident', text: 'Bold & Confident', emoji: '✨' },
          ],
        },
        {
          id: 'occasions_simple',
          text: 'When do you most want to smell amazing?',
          subtitle: 'Choose your primary fragrance occasion',
          allowMultiple: false,
          options: [
            { value: 'everyday_casual', text: 'Every day', emoji: '☀️' },
            { value: 'work_professional', text: 'At work', emoji: '🏢' },
            { value: 'evening_special', text: 'Evening & dates', emoji: '🌙' },
            { value: 'social_gatherings', text: 'Social events', emoji: '🎉' },
          ],
        },
        {
          id: 'scent_preference_simple',
          text: 'Which scent type appeals to you most?',
          subtitle: 'Think about what draws you in',
          allowMultiple: false,
          options: [
            { value: 'fresh_clean', text: 'Fresh & Clean', emoji: '🌿' },
            { value: 'floral_pretty', text: 'Floral & Pretty', emoji: '🌺' },
            { value: 'sweet_fruity', text: 'Sweet & Fruity', emoji: '🍓' },
            { value: 'warm_cozy', text: 'Warm & Cozy', emoji: '🤗' },
          ],
        },
        {
          id: 'intensity_simple',
          text: 'How strong should your fragrance be?',
          subtitle: 'Consider your comfort level',
          allowMultiple: false,
          options: [
            { value: 'subtle_gentle', text: 'Subtle & Gentle', emoji: '🤫' },
            { value: 'moderate_noticed', text: 'Moderate', emoji: '👥' },
            {
              value: 'strong_memorable',
              text: 'Strong & Memorable',
              emoji: '💫',
            },
          ],
        },
      ],
      enthusiast: [
        {
          id: 'style_moderate',
          text: 'What aspects describe your fragrance style?',
          subtitle: 'Choose 2-3 that resonate most with you',
          allowMultiple: true,
          minSelections: 2,
          maxSelections: 3,
          options: [
            { value: 'casual_relaxed', text: 'Casual & Relaxed', emoji: '😊' },
            {
              value: 'polished_professional',
              text: 'Polished & Professional',
              emoji: '💼',
            },
            {
              value: 'romantic_feminine',
              text: 'Romantic & Feminine',
              emoji: '💕',
            },
            { value: 'bold_confident', text: 'Bold & Confident', emoji: '✨' },
            {
              value: 'classical_heritage',
              text: 'Classic & Timeless',
              emoji: '👑',
            },
            {
              value: 'avant_garde_modern',
              text: 'Modern & Unique',
              emoji: '🎨',
            },
          ],
        },
        {
          id: 'fragrance_families',
          text: 'Which fragrance families appeal to you?',
          subtitle: 'Select all families you enjoy or want to explore',
          allowMultiple: true,
          minSelections: 2,
          maxSelections: 4,
          options: [
            { value: 'fresh_citrus', text: 'Fresh Citrus', emoji: '🍋' },
            { value: 'floral_bouquet', text: 'Floral Bouquet', emoji: '🌸' },
            { value: 'oriental_spicy', text: 'Oriental Spicy', emoji: '🌶️' },
            { value: 'woody_earthy', text: 'Woody Earthy', emoji: '🌲' },
            { value: 'gourmand_sweet', text: 'Gourmand Sweet', emoji: '🍰' },
            { value: 'fresh_clean', text: 'Fresh Aquatic', emoji: '💧' },
          ],
        },
        {
          id: 'occasions_detailed',
          text: 'When do you want to make a fragrance impression?',
          subtitle: 'Choose all occasions that matter to you',
          allowMultiple: true,
          minSelections: 2,
          maxSelections: 4,
          options: [
            {
              value: 'work_professional',
              text: 'Professional settings',
              emoji: '💼',
            },
            {
              value: 'romantic_dates',
              text: 'Romantic occasions',
              emoji: '💕',
            },
            {
              value: 'social_gatherings',
              text: 'Social gatherings',
              emoji: '🎊',
            },
            { value: 'everyday_casual', text: 'Daily confidence', emoji: '☀️' },
            { value: 'evening_special', text: 'Special events', emoji: '🌟' },
          ],
        },
        {
          id: 'intensity_simple',
          text: 'What fragrance intensity do you prefer?',
          subtitle: 'Consider your lifestyle and preferences',
          allowMultiple: false,
          options: [
            {
              value: 'subtle_personal',
              text: 'Subtle & Personal',
              emoji: '🤫',
            },
            {
              value: 'moderate_noticeable',
              text: 'Moderate & Noticeable',
              emoji: '👥',
            },
            {
              value: 'strong_memorable',
              text: 'Strong & Memorable',
              emoji: '💫',
            },
          ],
        },
      ],
      collector: [
        {
          id: 'collection_style',
          text: 'How would you characterize your olfactory aesthetic?',
          subtitle: 'Choose the approach that defines your collection',
          allowMultiple: false,
          options: [
            {
              value: 'classical_heritage',
              text: 'Classical heritage compositions',
              emoji: '🏛️',
            },
            {
              value: 'avant_garde_modern',
              text: 'Avant-garde modern creations',
              emoji: '🎨',
            },
            {
              value: 'niche_artisanal',
              text: 'Niche artisanal expressions',
              emoji: '🎭',
            },
          ],
        },
        {
          id: 'composition_preferences',
          text: 'Which compositional elements resonate most?',
          subtitle: 'Select your preferred fragrance characteristics',
          allowMultiple: true,
          minSelections: 2,
          maxSelections: 3,
          options: [
            { value: 'fresh_citrus', text: 'Citrus complexity', emoji: '🍋' },
            { value: 'floral_bouquet', text: 'Floral artistry', emoji: '🌸' },
            { value: 'oriental_spicy', text: 'Oriental richness', emoji: '🌶️' },
            {
              value: 'woody_earthy',
              text: 'Woody sophistication',
              emoji: '🌲',
            },
          ],
        },
        {
          id: 'wearing_occasions',
          text: 'How do you approach fragrance wearing?',
          subtitle: 'Choose your wearing philosophy',
          allowMultiple: false,
          options: [
            {
              value: 'romantic_dates',
              text: 'Curated signature rotation',
              emoji: '👑',
            },
            {
              value: 'evening_special',
              text: 'Occasion-specific selection',
              emoji: '🎭',
            },
            {
              value: 'social_gatherings',
              text: 'Artistic exploration',
              emoji: '🎨',
            },
          ],
        },
        {
          id: 'investment_approach',
          text: 'What is your approach to fragrance acquisition?',
          subtitle: 'Choose your collection philosophy',
          allowMultiple: false,
          options: [
            {
              value: 'masterpiece_collecting',
              text: 'Collecting recognized masterpieces',
              emoji: '🏆',
            },
            {
              value: 'emerging_discovery',
              text: 'Discovering emerging talents',
              emoji: '🌟',
            },
            {
              value: 'limited_exclusive',
              text: 'Limited and exclusive releases',
              emoji: '💎',
            },
          ],
        },
      ],
    };

    return questionSets[level];
  };

  // Load fragrance options for advanced users
  useEffect(() => {
    if (experienceLevel === 'enthusiast' || experienceLevel === 'collector') {
      loadFragranceOptions();
    }
  }, [experienceLevel]);

  const loadFragranceOptions = async () => {
    try {
      const response = await fetch('/api/fragrances?limit=100&sort=rating');
      if (response.ok) {
        const data = await response.json();
        setAvailableFragrances(data.fragrances || []);
      }
    } catch (error) {
      console.error('Failed to load fragrance options:', error);
      // Keep trying with search results when user types
    }
  };

  const handleGenderSelect = (selectedGender: string) => {
    setGender(selectedGender);

    // Track gender selection
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'gender_preference_selected', {
        gender_preference: selectedGender,
        quiz_session: quizSessionToken,
      });
    }
  };

  const handleExperienceLevelSelect = (level: ExperienceLevel) => {
    setExperienceLevel(level);
    setCurrentQuestion(0);

    // Track experience level selection
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'experience_level_selected', {
        experience_level: level,
        gender_preference: gender,
        quiz_session: quizSessionToken,
      });
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (!experienceLevel) return;

    const questions = getAdaptiveQuestions(experienceLevel);
    const currentQ = questions[currentQuestion];
    if (!currentQ) return;

    if (currentQ.allowMultiple) {
      // Handle multiple selection
      const isSelected = currentSelections.includes(answer);
      let newSelections: string[];

      if (isSelected) {
        // Deselect if already selected
        newSelections = currentSelections.filter(s => s !== answer);
      } else {
        // Add selection if under max limit
        if (currentSelections.length < (currentQ.maxSelections || 3)) {
          newSelections = [...currentSelections, answer];
        } else {
          return; // Don't allow more selections
        }
      }

      setCurrentSelections(newSelections);
    } else {
      // Handle single selection (continue to next question immediately)
      const newResponse = {
        question_id: currentQ.id,
        answer_value: answer,
        experience_level: experienceLevel,
        timestamp: new Date().toISOString(),
      };

      const updatedResponses = [...responses, newResponse];
      setResponses(updatedResponses);
      setCurrentSelections([]); // Reset selections for next question

      // Track quiz progress
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'adaptive_quiz_question_answered', {
          question_number: currentQuestion + 1,
          question_id: currentQ.id,
          answer: answer,
          experience_level: experienceLevel,
          quiz_session: quizSessionToken,
        });
      }

      // Move to next question
      proceedToNextQuestion(updatedResponses);
    }
  };

  const handleMultipleSelectionContinue = () => {
    if (!experienceLevel) return;

    const questions = getAdaptiveQuestions(experienceLevel);
    const currentQ = questions[currentQuestion];
    if (!currentQ || !currentQ.allowMultiple) return;

    // Validate minimum selections
    if (currentSelections.length < (currentQ.minSelections || 1)) {
      return; // Don't continue if minimum not met
    }

    const newResponse = {
      question_id: currentQ.id,
      answer_value: currentSelections.join(','), // Join multiple selections
      answer_metadata: { selections: currentSelections },
      experience_level: experienceLevel,
      timestamp: new Date().toISOString(),
    };

    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);
    setCurrentSelections([]); // Reset for next question

    // Track multiple selection
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'adaptive_quiz_multiple_selection', {
        question_number: currentQuestion + 1,
        question_id: currentQ.id,
        selections: currentSelections,
        selection_count: currentSelections.length,
        experience_level: experienceLevel,
        quiz_session: quizSessionToken,
      });
    }

    proceedToNextQuestion(updatedResponses);
  };

  const proceedToNextQuestion = (updatedResponses: any[]) => {
    const questions = getAdaptiveQuestions(experienceLevel!);
    const isLastQuestion = currentQuestion >= questions.length - 1;
    const needsFavorites =
      (experienceLevel === 'enthusiast' || experienceLevel === 'collector') &&
      selectedFavorites.length === 0;

    if (isLastQuestion && needsFavorites) {
      setShowFavoriteSearch(true);
    } else if (isLastQuestion) {
      analyzeQuiz(updatedResponses);
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleFavoriteSearch = async (query: string) => {
    setFavoriteSearchQuery(query);

    // Search for fragrances if query is provided
    if (query.trim().length > 1) {
      try {
        const response = await fetch(
          `/api/fragrances?search=${encodeURIComponent(query)}&limit=10`
        );
        if (response.ok) {
          const data = await response.json();
          setAvailableFragrances(data.fragrances || []);
        }
      } catch (error) {
        console.error('Failed to search fragrances:', error);
      }
    }
  };

  const handleFavoriteSelect = (fragrance: FragranceOption) => {
    if (selectedFavorites.find(f => f.id === fragrance.id)) return;

    const maxFavorites = experienceLevel === 'collector' ? 5 : 3;
    if (selectedFavorites.length < maxFavorites) {
      setSelectedFavorites([...selectedFavorites, fragrance]);
      setFavoriteSearchQuery('');
    }
  };

  const handleFavoriteRemove = (fragranceId: string) => {
    setSelectedFavorites(selectedFavorites.filter(f => f.id !== fragranceId));
  };

  const completeFavoritesSelection = () => {
    // Add favorites to responses
    const favoritesResponse = {
      question_id: 'favorite_fragrances',
      answer_value: selectedFavorites.map(f => f.id).join(','),
      experience_level: experienceLevel,
      metadata: { selected_fragrances: selectedFavorites },
      timestamp: new Date().toISOString(),
    };

    const updatedResponses = [...responses, favoritesResponse];
    setResponses(updatedResponses);
    setShowFavoriteSearch(false);
    analyzeQuiz(updatedResponses);
  };

  const analyzeQuiz = async (allResponses: any[]) => {
    setIsAnalyzing(true);

    try {
      // Enhanced analysis with experience level context
      const analysisData = {
        responses: allResponses,
        experience_level: experienceLevel,
        selected_favorites: selectedFavorites,
        quiz_session_token: quizSessionToken,
      };

      const response = await fetch('/api/quiz/analyze-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisData),
      });

      if (response.ok) {
        const results = await response.json();
        console.log('Enhanced quiz results:', results);

        // Prepare results for ConversionFlow component
        const convertedResults = {
          personality_type:
            results.ai_profile?.profile_name ||
            results.personality_analysis?.personality_type ||
            'fragrance_lover',
          confidence: results.personality_analysis?.confidence_score || 0.8,
          quiz_session_token: quizSessionToken,
          recommendations: results.recommendations || [],
          ai_profile: results.ai_profile,
          personality_analysis: results.personality_analysis,
          experience_level: results.experience_level,
        };

        setQuizResults(convertedResults);
        setShowResults(true);
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Quiz analysis error:', error);
      // Fallback handling
      const fallbackResults = {
        personality_type: `${experienceLevel}_fragrance_lover`,
        confidence: 0.7,
        quiz_session_token: quizSessionToken,
        recommendations: [
          {
            fragrance_id: 'fallback-1',
            name: 'Sample Fragrance',
            brand: 'Popular Brand',
            match_percentage: '85',
            sample_price: '8',
          },
        ],
        ai_profile: {
          profile_name: 'Discovering Fragrance Explorer',
          description: 'Your fragrance journey is just beginning...',
        },
        experience_level: experienceLevel,
      };
      setQuizResults(fallbackResults);
      setShowResults(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAccountCreated = (userData: any) => {
    console.log('Account created for adaptive quiz user:', userData);
    // Track conversion success for adaptive quiz
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'adaptive_quiz_conversion_success', {
        experience_level: experienceLevel,
        personality_type: quizResults?.personality_type,
        quiz_session: quizSessionToken,
      });
    }
  };

  const handleConversionComplete = (result: any) => {
    console.log('Adaptive quiz conversion complete:', result);
    // Track business conversion metrics for adaptive quiz
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'adaptive_quiz_business_conversion', {
        experience_level: experienceLevel,
        conversion_type: result.account_created ? 'account' : 'guest',
        recommendations_unlocked: result.enhanced_recommendations_unlocked,
        quiz_session: quizSessionToken,
      });
    }
  };

  const filteredFragrances = availableFragrances
    .filter(
      fragrance =>
        fragrance.name
          .toLowerCase()
          .includes(favoriteSearchQuery.toLowerCase()) ||
        fragrance.brand
          .toLowerCase()
          .includes(favoriteSearchQuery.toLowerCase())
    )
    .slice(0, 8);

  const getProgressInfo = () => {
    if (!experienceLevel) return { current: 0, total: 1 };

    const questions = getAdaptiveQuestions(experienceLevel);
    const needsFavorites =
      experienceLevel === 'enthusiast' || experienceLevel === 'collector';
    const total = questions.length + (needsFavorites ? 1 : 0);
    const current = showFavoriteSearch ? questions.length : currentQuestion + 1;

    return { current: Math.min(current, total), total };
  };

  const progress = getProgressInfo();
  const progressPercent = (progress.current / progress.total) * 100;

  // Show loading state during analysis
  if (isAnalyzing) {
    return (
      <Card className='max-w-2xl mx-auto'>
        <CardContent className='text-center py-12'>
          <div className='relative mb-6'>
            <div className='animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto' />
            <Sparkles className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-purple-500' />
          </div>
          <h3 className='text-xl font-semibold mb-2'>
            Creating Your Personalized Profile...
          </h3>
          <p className='text-muted-foreground mb-4'>
            Analyzing your {experienceLevel} preferences
          </p>
          <div className='text-sm text-muted-foreground space-y-1'>
            <p>✨ Processing your style preferences</p>
            <p>🧠 AI matching with experience-level optimization</p>
            <p>🎯 Generating unique recommendations just for you</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Gender selection screen (first)
  if (!gender) {
    return (
      <div className='max-w-2xl mx-auto'>
        <Card>
          <CardContent className='py-8'>
            <div className='text-center mb-8'>
              <h2 className='text-2xl font-semibold mb-2'>
                {genderQuestion.text}
              </h2>
              <p className='text-muted-foreground'>{genderQuestion.subtitle}</p>
            </div>

            <div className='space-y-4'>
              {genderQuestion.options.map(option => (
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

  // Experience level selection screen (second)
  if (!experienceLevel) {
    return (
      <div className='max-w-2xl mx-auto'>
        <Card>
          <CardContent className='py-8'>
            <div className='text-center mb-8'>
              <h2 className='text-2xl font-semibold mb-2'>
                {experienceLevelQuestion.text}
              </h2>
              <p className='text-muted-foreground'>
                {experienceLevelQuestion.subtitle}
              </p>
            </div>

            <div className='space-y-4'>
              {experienceLevelQuestion.options.map(option => (
                <button
                  key={option.value}
                  onClick={() =>
                    handleExperienceLevelSelect(option.value as ExperienceLevel)
                  }
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

  // Favorite fragrance selection for advanced users
  if (showFavoriteSearch) {
    const maxFavorites = experienceLevel === 'collector' ? 5 : 3;
    const minFavorites = experienceLevel === 'collector' ? 2 : 1;

    return (
      <div className='max-w-2xl mx-auto'>
        {/* Progress Bar */}
        <div className='mb-8'>
          <div className='flex justify-between text-sm text-muted-foreground mb-2'>
            <span>
              Step {progress.current} of {progress.total}
            </span>
            <span>{Math.round(progressPercent)}% complete</span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className='bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300'
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <Card>
          <CardContent className='py-8'>
            <h2 className='text-2xl font-semibold text-center mb-2'>
              {experienceLevel === 'collector'
                ? 'Your Collection Favorites'
                : 'Fragrances You Love'}
            </h2>
            <p className='text-center text-muted-foreground mb-6'>
              {experienceLevel === 'collector'
                ? `Select 2-5 fragrances from your collection to enhance recommendations`
                : `Choose 1-3 fragrances you currently wear or love`}
            </p>

            {/* Search Input */}
            <div className='relative mb-6'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
              <Input
                type='text'
                placeholder='Search fragrances...'
                value={favoriteSearchQuery}
                onChange={e => handleFavoriteSearch(e.target.value)}
                className='pl-10'
                role='searchbox'
                aria-label='Search for fragrances'
              />
            </div>

            {/* Selected Favorites */}
            {selectedFavorites.length > 0 && (
              <div className='mb-6'>
                <h4 className='font-medium mb-3'>Selected Favorites:</h4>
                <div className='flex flex-wrap gap-2'>
                  {selectedFavorites.map(fragrance => (
                    <Badge
                      key={fragrance.id}
                      variant='secondary'
                      className='px-3 py-1 text-sm flex items-center gap-2'
                    >
                      <span>
                        {fragrance.brand} {fragrance.name}
                      </span>
                      <button
                        onClick={() => handleFavoriteRemove(fragrance.id)}
                        className='text-gray-500 hover:text-red-500'
                        aria-label={`Remove ${fragrance.name}`}
                      >
                        <X className='w-3 h-3' />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {favoriteSearchQuery && (
              <div className='mb-6'>
                <h4 className='font-medium mb-3'>Search Results:</h4>
                <div className='space-y-2 max-h-48 overflow-y-auto'>
                  {filteredFragrances.map(fragrance => (
                    <button
                      key={fragrance.id}
                      onClick={() => handleFavoriteSelect(fragrance)}
                      disabled={selectedFavorites.length >= maxFavorites}
                      className='w-full p-3 text-left border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <div className='font-medium'>
                        {fragrance.brand} - {fragrance.name}
                      </div>
                    </button>
                  ))}
                  {filteredFragrances.length === 0 && (
                    <p className='text-muted-foreground text-center py-4'>
                      No fragrances found matching "{favoriteSearchQuery}"
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className='flex gap-3'>
              {selectedFavorites.length >= minFavorites && (
                <Button onClick={completeFavoritesSelection} className='flex-1'>
                  <CheckCircle className='w-4 h-4 mr-2' />
                  Continue with {selectedFavorites.length}{' '}
                  {selectedFavorites.length === 1 ? 'favorite' : 'favorites'}
                </Button>
              )}
              <Button
                variant='outline'
                onClick={completeFavoritesSelection}
                className='px-6'
              >
                Skip for now
              </Button>
            </div>

            <p className='text-xs text-muted-foreground text-center mt-4'>
              {selectedFavorites.length}/{maxFavorites} selected
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show results with ConversionFlow
  if (showResults && quizResults) {
    return (
      <ConversionFlow
        quizResults={quizResults}
        onAccountCreated={handleAccountCreated}
        onConversionComplete={handleConversionComplete}
      />
    );
  }

  // Regular quiz questions
  const questions = getAdaptiveQuestions(experienceLevel);
  const question = questions[currentQuestion];
  if (!question) return null;

  return (
    <div className='max-w-2xl mx-auto'>
      {/* Progress Bar */}
      <div className='mb-8'>
        <div className='flex justify-between text-sm text-muted-foreground mb-2'>
          <span>
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span>{Math.round(progressPercent)}% complete</span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-2'>
          <div
            className='bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300'
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Experience Level Badge */}
      <div className='flex justify-center mb-4'>
        <Badge variant='outline' className='px-3 py-1'>
          {experienceLevel === 'beginner' && '🌱 Beginner-Friendly'}
          {experienceLevel === 'enthusiast' && '🌸 Enthusiast Mode'}
          {experienceLevel === 'collector' && '🎭 Collector Advanced'}
        </Badge>
      </div>

      {/* Question Card */}
      <Card>
        <CardContent className='py-8'>
          <h2 className='text-2xl font-semibold text-center mb-2'>
            {question.text}
          </h2>
          {question.subtitle && (
            <p className='text-center text-muted-foreground mb-8'>
              {question.subtitle}
            </p>
          )}

          <div className='space-y-4'>
            {question.options.map(option => {
              const isSelected =
                question.allowMultiple &&
                currentSelections.includes(option.value);

              return (
                <button
                  key={option.value}
                  onClick={() => handleAnswerSelect(option.value)}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-all duration-200 group transform hover:scale-[1.02] active:scale-[0.98] ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <div className='flex items-center space-x-4'>
                    <div className='text-2xl'>{option.emoji}</div>
                    <div className='flex-1'>
                      <span
                        className={`font-medium ${isSelected ? 'text-purple-700' : 'group-hover:text-purple-700'}`}
                      >
                        {option.text}
                      </span>
                    </div>
                    {question.allowMultiple ? (
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected
                            ? 'bg-purple-500 border-purple-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle className='w-3 h-3 text-white' />
                        )}
                      </div>
                    ) : (
                      <ChevronRight className='w-5 h-5 text-gray-400 group-hover:text-purple-500' />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Continue Button for Multiple Selection Questions */}
          {question.allowMultiple && (
            <div className='mt-6 text-center'>
              <Button
                onClick={handleMultipleSelectionContinue}
                disabled={
                  currentSelections.length < (question.minSelections || 1)
                }
                className='px-8 py-3'
              >
                Continue with {currentSelections.length}{' '}
                {currentSelections.length === 1 ? 'choice' : 'choices'}
              </Button>
              <p className='text-xs text-muted-foreground mt-2'>
                {currentSelections.length}/{question.maxSelections || 3}{' '}
                selected
                {question.minSelections &&
                  ` (minimum ${question.minSelections})`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Encouragement Message */}
      <div className='mt-6 text-center text-sm text-muted-foreground'>
        {experienceLevel === 'beginner' && (
          <p>
            🌟 You're doing great! • ✨ Almost there! • 🎯 Finding your perfect
            scent
          </p>
        )}
        {experienceLevel === 'enthusiast' && (
          <p>
            🌸 Excellent choices! • 🎯 Refining your profile • ✨ Discovering
            new favorites
          </p>
        )}
        {experienceLevel === 'collector' && (
          <p>
            🎭 Sophisticated selections • 💎 Curating your profile • 🌟
            Exploring rare finds
          </p>
        )}
      </div>
    </div>
  );
}
