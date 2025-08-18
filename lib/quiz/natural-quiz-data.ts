/**
 * Natural Quiz Data - Human Language Approach
 *
 * Much more natural, conversational quiz that doesn't mock users with technical jargon.
 * Uses examples in parentheses to help users understand what we mean.
 */

export type ExperienceLevel = 'beginner' | 'enthusiast' | 'experienced';

export interface QuizOption {
  value: string;
  text: string;
  emoji: string;
  description?: string;
}

export interface NaturalQuestion {
  id: string;
  text: string;
  subtitle?: string;
  options: QuizOption[];
  allowMultiple?: boolean;
  minSelections?: number;
  maxSelections?: number;
}

export interface NaturalQuizData {
  experience_level: ExperienceLevel;
  questions: NaturalQuestion[];
  estimated_time_minutes: number;
}

/**
 * Experience Level Question (Same for All)
 */
export const experienceLevelQuestion: NaturalQuestion = {
  id: 'experience_level',
  text: 'How would you describe yourself with fragrances?',
  options: [
    { value: 'beginner', text: 'Just getting started', emoji: '🌱' },
    { value: 'enthusiast', text: 'I have my favorites', emoji: '🌸' },
    { value: 'experienced', text: 'Love trying new things', emoji: '🎭' },
  ],
};

/**
 * Beginner Quiz - 4 questions total
 */
export const beginnerQuizData: NaturalQuizData = {
  experience_level: 'beginner',
  estimated_time_minutes: 2,
  questions: [
    {
      id: 'scent_preferences_beginner',
      text: 'What kinds of scents appeal to you?',
      subtitle: 'Pick what sounds nice - you can choose multiple',
      allowMultiple: true,
      minSelections: 1,
      maxSelections: 3,
      options: [
        {
          value: 'fresh_clean',
          text: 'Fresh & clean (citrus, aquatic, cucumber)',
          emoji: '🌿',
        },
        {
          value: 'sweet_fruity',
          text: 'Sweet & fruity (vanilla, berries, apple)',
          emoji: '🍓',
        },
        {
          value: 'floral_pretty',
          text: 'Floral & pretty (rose, jasmine, peony)',
          emoji: '🌸',
        },
        {
          value: 'warm_cozy',
          text: 'Warm & cozy (wood, spice, amber)',
          emoji: '🤗',
        },
        { value: 'open_anything', text: "I'm open to anything", emoji: '🎨' },
      ],
    },
    {
      id: 'personality_style',
      text: 'How would you describe your style?',
      options: [
        { value: 'bold_confident', text: 'Bold & confident', emoji: '✨' },
        { value: 'easy_relaxed', text: 'Easy-going & relaxed', emoji: '😌' },
        { value: 'unique_creative', text: 'Unique & creative', emoji: '🎭' },
        { value: 'classic_timeless', text: 'Classic & timeless', emoji: '👑' },
      ],
    },
    {
      id: 'occasions_beginner',
      text: 'When do you want to smell amazing?',
      allowMultiple: true,
      minSelections: 1,
      maxSelections: 3,
      options: [
        { value: 'every_day', text: 'Every day', emoji: '☀️' },
        { value: 'special_occasions', text: 'Special occasions', emoji: '🎉' },
        { value: 'professional', text: 'Professional settings', emoji: '💼' },
        { value: 'weekend_fun', text: 'Weekend fun', emoji: '🎨' },
        {
          value: 'versatile_one',
          text: 'I want one versatile fragrance',
          emoji: '🔄',
        },
      ],
    },
  ],
};

/**
 * Enthusiast Quiz - 5-6 questions
 */
export const enthusiastQuizData: NaturalQuizData = {
  experience_level: 'enthusiast',
  estimated_time_minutes: 4,
  questions: [
    {
      id: 'scent_preferences_enthusiast',
      text: 'What kinds of scents do you gravitate toward?',
      subtitle: 'Choose the categories that excite you',
      allowMultiple: true,
      minSelections: 2,
      maxSelections: 4,
      options: [
        {
          value: 'fresh_citrusy',
          text: 'Fresh & citrusy (lemon, bergamot, grapefruit)',
          emoji: '🍋',
        },
        {
          value: 'fresh_oceanic',
          text: 'Fresh & oceanic (sea salt, marine, water lily)',
          emoji: '🌊',
        },
        {
          value: 'sweet',
          text: 'Sweet (vanilla, caramel, honey)',
          emoji: '🍯',
        },
        {
          value: 'fruity',
          text: 'Fruity (berries, apple, peach)',
          emoji: '🍑',
        },
        {
          value: 'floral',
          text: 'Floral (rose, jasmine, gardenia)',
          emoji: '🌸',
        },
        {
          value: 'warm_spicy',
          text: 'Warm & spicy (cinnamon, pepper, cardamom)',
          emoji: '🌶️',
        },
        { value: 'woody', text: 'Woody (sandalwood, cedar, oak)', emoji: '🌲' },
        { value: 'love_variety', text: 'I love variety', emoji: '🎨' },
      ],
    },
    {
      id: 'personality_style',
      text: 'How would you describe your style?',
      options: [
        { value: 'bold_confident', text: 'Bold & confident', emoji: '✨' },
        { value: 'easy_relaxed', text: 'Easy-going & relaxed', emoji: '😌' },
        { value: 'unique_creative', text: 'Unique & creative', emoji: '🎭' },
        { value: 'classic_timeless', text: 'Classic & timeless', emoji: '👑' },
      ],
    },
    {
      id: 'occasions_enthusiast',
      text: 'What occasions are important to you?',
      allowMultiple: true,
      minSelections: 2,
      maxSelections: 4,
      options: [
        { value: 'daily_signature', text: 'Daily signature', emoji: '☀️' },
        { value: 'romantic_moments', text: 'Romantic moments', emoji: '💕' },
        {
          value: 'professional_presence',
          text: 'Professional presence',
          emoji: '💼',
        },
        { value: 'social_gatherings', text: 'Social gatherings', emoji: '🎉' },
        {
          value: 'weekend_adventures',
          text: 'Weekend adventures',
          emoji: '🏃',
        },
        { value: 'evening_elegance', text: 'Evening elegance', emoji: '🌙' },
        {
          value: 'versatile_options',
          text: 'I want versatile options',
          emoji: '🔄',
        },
      ],
    },
    {
      id: 'seasons_vibe',
      text: 'What season/vibe speaks to you most?',
      options: [
        {
          value: 'spring_garden',
          text: 'Spring garden party (fresh, floral, light)',
          emoji: '🌸',
        },
        {
          value: 'summer_beach',
          text: 'Summer beach day (citrus, aquatic, energizing)',
          emoji: '🏖️',
        },
        {
          value: 'fall_cozy',
          text: 'Fall cozy evening (warm, spicy, comforting)',
          emoji: '🍂',
        },
        {
          value: 'winter_fireside',
          text: 'Winter fireside (rich, deep, enveloping)',
          emoji: '🔥',
        },
        {
          value: 'adapt_seasons',
          text: 'I like adapting with seasons',
          emoji: '🔄',
        },
      ],
    },
  ],
};

/**
 * Experienced Quiz - 5-6 questions with more granular options
 */
export const experiencedQuizData: NaturalQuizData = {
  experience_level: 'experienced',
  estimated_time_minutes: 5,
  questions: [
    {
      id: 'scent_preferences_experienced',
      text: 'What scent families do you love?',
      subtitle: 'Choose the ones that make you happy',
      allowMultiple: true,
      minSelections: 3,
      maxSelections: 6,
      options: [
        {
          value: 'citrus',
          text: 'Citrus (bergamot, lemon, yuzu)',
          emoji: '🍋',
        },
        {
          value: 'aquatic',
          text: 'Aquatic (marine, sea salt, ozone)',
          emoji: '🌊',
        },
        {
          value: 'sweet',
          text: 'Sweet (vanilla, tonka, benzoin)',
          emoji: '🍯',
        },
        {
          value: 'fruity',
          text: 'Fruity (berries, stone fruits, tropical)',
          emoji: '🍑',
        },
        {
          value: 'spicy',
          text: 'Spicy (pepper, cinnamon, clove)',
          emoji: '🌶️',
        },
        { value: 'floral', text: 'Floral (rose, jasmine, iris)', emoji: '🌸' },
        {
          value: 'woody',
          text: 'Woody (sandalwood, cedar, vetiver)',
          emoji: '🌲',
        },
        {
          value: 'fresh_green',
          text: 'Fresh & green (grass, mint, basil)',
          emoji: '🌿',
        },
        {
          value: 'warm_ambery',
          text: 'Warm & ambery (amber, labdanum, resin)',
          emoji: '🧡',
        },
        {
          value: 'unique_unusual',
          text: 'Unique & unusual (leather, smoke, incense)',
          emoji: '🎭',
        },
        {
          value: 'love_fragrances',
          text: 'I just love fragrances',
          emoji: '❤️',
        },
      ],
    },
    {
      id: 'personality_style',
      text: 'How would you describe your style?',
      options: [
        { value: 'bold_confident', text: 'Bold & confident', emoji: '✨' },
        { value: 'easy_relaxed', text: 'Easy-going & relaxed', emoji: '😌' },
        { value: 'unique_creative', text: 'Unique & creative', emoji: '🎭' },
        { value: 'classic_timeless', text: 'Classic & timeless', emoji: '👑' },
      ],
    },
    {
      id: 'occasions_experienced',
      text: 'What occasions matter to you?',
      allowMultiple: true,
      minSelections: 2,
      maxSelections: 4,
      options: [
        { value: 'daily_signature', text: 'Daily signature', emoji: '☀️' },
        {
          value: 'romantic_encounters',
          text: 'Romantic encounters',
          emoji: '💕',
        },
        {
          value: 'professional_authority',
          text: 'Professional authority',
          emoji: '💼',
        },
        { value: 'social_magnetism', text: 'Social magnetism', emoji: '🎉' },
        {
          value: 'weekend_exploration',
          text: 'Weekend exploration',
          emoji: '🏃',
        },
        {
          value: 'evening_sophistication',
          text: 'Evening sophistication',
          emoji: '🌙',
        },
        { value: 'seasonal_rotation', text: 'Seasonal rotation', emoji: '🍂' },
        { value: 'mood_based', text: 'Mood-based selection', emoji: '🎭' },
      ],
    },
    {
      id: 'seasons_vibe',
      text: 'What season/vibe speaks to you most?',
      options: [
        {
          value: 'spring_garden',
          text: 'Spring garden party (fresh, floral, light)',
          emoji: '🌸',
        },
        {
          value: 'summer_beach',
          text: 'Summer beach day (citrus, aquatic, energizing)',
          emoji: '🏖️',
        },
        {
          value: 'fall_cozy',
          text: 'Fall cozy evening (warm, spicy, comforting)',
          emoji: '🍂',
        },
        {
          value: 'winter_fireside',
          text: 'Winter fireside (rich, deep, enveloping)',
          emoji: '🔥',
        },
        {
          value: 'adapt_seasons',
          text: 'I like adapting with seasons',
          emoji: '🔄',
        },
      ],
    },
  ],
};

/**
 * Get quiz data based on experience level (natural approach)
 */
export function getNaturalQuizData(
  experienceLevel: ExperienceLevel
): NaturalQuizData {
  switch (experienceLevel) {
    case 'beginner':
      return beginnerQuizData;
    case 'enthusiast':
      return enthusiastQuizData;
    case 'experienced':
      return experiencedQuizData;
    default:
      return enthusiastQuizData;
  }
}
