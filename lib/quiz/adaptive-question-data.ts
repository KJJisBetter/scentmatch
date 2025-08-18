/**
 * Adaptive Quiz Question Data - Task 2.2-2.6
 *
 * Question structures that scale based on user experience level:
 * - Beginner: 4 options, simple language, 4 questions
 * - Enthusiast: 6 options, balanced complexity, 6 questions
 * - Collector: 8-10 options, sophisticated language, 8 questions
 */

export type ExperienceLevel = 'beginner' | 'enthusiast' | 'collector';

export interface QuizOption {
  value: string;
  text: string;
  emoji: string;
  description?: string;
}

export interface AdaptiveQuestion {
  id: string;
  text: string;
  subtitle?: string;
  options: QuizOption[];
  allowMultiple?: boolean;
  minSelections?: number;
  maxSelections?: number;
}

export interface AdaptiveQuizData {
  experience_level: ExperienceLevel;
  questions: AdaptiveQuestion[];
  estimated_time_minutes: number;
  complexity_description: string;
}

/**
 * Beginner Quiz Structure - 4 simple questions, 4 options each
 */
export const beginnerQuizData: AdaptiveQuizData = {
  experience_level: 'beginner',
  estimated_time_minutes: 2,
  complexity_description: 'Simple and friendly questions to get you started',
  questions: [
    {
      id: 'style_simple',
      text: 'What scents do you enjoy?',
      subtitle: 'Choose what feels right to you',
      options: [
        { value: 'light_fresh', text: 'Light, fresh scents', emoji: '🌿' },
        { value: 'sweet_floral', text: 'Sweet, floral scents', emoji: '🌸' },
        { value: 'warm_cozy', text: 'Warm, cozy scents', emoji: '🤗' },
        {
          value: 'bold_memorable',
          text: 'Bold, memorable scents',
          emoji: '✨',
        },
      ],
    },
    {
      id: 'occasions_simple',
      text: 'When do you want to smell great?',
      options: [
        { value: 'every_day', text: 'Every day', emoji: '☀️' },
        { value: 'work', text: 'Work', emoji: '💼' },
        { value: 'special_occasions', text: 'Special occasions', emoji: '🎉' },
        { value: 'going_out', text: 'Going out', emoji: '🌙' },
      ],
    },
    {
      id: 'strength_simple',
      text: 'How strong should your fragrance be?',
      options: [
        { value: 'subtle', text: 'Subtle - just for me', emoji: '🤫' },
        {
          value: 'noticeable',
          text: 'Noticeable - when people are close',
          emoji: '👥',
        },
        {
          value: 'memorable',
          text: 'Memorable - people remember it',
          emoji: '💫',
        },
        { value: 'not_sure', text: "I'm not sure yet", emoji: '🤷' },
      ],
    },
    {
      id: 'discovery_simple',
      text: 'How do you like to try new fragrances?',
      options: [
        { value: 'samples_first', text: 'Try samples first', emoji: '🧪' },
        { value: 'small_bottles', text: 'Buy small bottles', emoji: '💝' },
        { value: 'ask_friends', text: 'Ask friends for advice', emoji: '👥' },
        { value: 'explore_freely', text: 'Just explore and see', emoji: '🎨' },
      ],
    },
  ],
};

/**
 * Enthusiast Quiz Structure - 6 questions, 6 options each
 */
export const enthusiastQuizData: AdaptiveQuizData = {
  experience_level: 'enthusiast',
  estimated_time_minutes: 4,
  complexity_description:
    'Balanced questions that help refine your preferences',
  questions: [
    {
      id: 'style_balanced',
      text: 'What fragrance styles appeal to you?',
      subtitle: 'You can select multiple options',
      allowMultiple: true,
      minSelections: 1,
      maxSelections: 3,
      options: [
        {
          value: 'elegant_sophisticated',
          text: 'Elegant and sophisticated',
          emoji: '💼',
        },
        {
          value: 'romantic_feminine',
          text: 'Romantic and feminine',
          emoji: '🌸',
        },
        { value: 'fresh_modern', text: 'Fresh and modern', emoji: '🌿' },
        { value: 'warm_comforting', text: 'Warm and comforting', emoji: '🤗' },
        { value: 'bold_confident', text: 'Bold and confident', emoji: '✨' },
        {
          value: 'mysterious_alluring',
          text: 'Mysterious and alluring',
          emoji: '🌙',
        },
      ],
    },
    {
      id: 'families_separated',
      text: 'Which fragrance families do you prefer?',
      allowMultiple: true,
      minSelections: 2,
      maxSelections: 4,
      options: [
        { value: 'floral_bouquet', text: 'Floral bouquets', emoji: '🌺' },
        {
          value: 'citrus_zesty',
          text: 'Citrus (bright and zesty)',
          emoji: '🍋',
        },
        {
          value: 'aquatic_marine',
          text: 'Aquatic (fresh and marine)',
          emoji: '🌊',
        },
        { value: 'woody_warm', text: 'Woody and warm', emoji: '🌲' },
        { value: 'oriental_spicy', text: 'Oriental and spicy', emoji: '🌶️' },
        {
          value: 'gourmand_sweet',
          text: 'Gourmand (sweet and edible)',
          emoji: '🍯',
        },
      ],
    },
    {
      id: 'occasions_detailed',
      text: 'What occasions are most important to you?',
      allowMultiple: true,
      minSelections: 2,
      maxSelections: 4,
      options: [
        { value: 'daily_wear', text: 'Daily wear', emoji: '☀️' },
        { value: 'work_meetings', text: 'Work and meetings', emoji: '🏢' },
        { value: 'date_nights', text: 'Date nights', emoji: '💕' },
        { value: 'weekend_outings', text: 'Weekend outings', emoji: '🎨' },
        { value: 'special_events', text: 'Special events', emoji: '🎉' },
        { value: 'travel_vacation', text: 'Travel and vacation', emoji: '✈️' },
      ],
    },
    {
      id: 'intensity_nuanced',
      text: 'How noticeable should your fragrance be?',
      options: [
        {
          value: 'intimate_personal',
          text: 'Intimate - personal bubble only',
          emoji: '🤫',
        },
        {
          value: 'arm_length',
          text: "Arm's length - close conversations",
          emoji: '🤝',
        },
        {
          value: 'room_presence',
          text: 'Room presence - when you enter',
          emoji: '🚪',
        },
        {
          value: 'signature_memorable',
          text: 'Signature - people remember you',
          emoji: '💫',
        },
        {
          value: 'bold_statement',
          text: 'Bold statement - makes an impact',
          emoji: '🎭',
        },
        { value: 'varies_by_mood', text: 'Varies by my mood', emoji: '🎨' },
      ],
    },
    {
      id: 'characteristics_important',
      text: 'What characteristics matter most to you?',
      allowMultiple: true,
      minSelections: 2,
      maxSelections: 3,
      options: [
        {
          value: 'long_lasting',
          text: 'Long-lasting performance',
          emoji: '⏰',
        },
        {
          value: 'unique_distinctive',
          text: 'Unique and distinctive',
          emoji: '🎯',
        },
        {
          value: 'versatile_adaptable',
          text: 'Versatile and adaptable',
          emoji: '🔄',
        },
        { value: 'compliment_worthy', text: 'Gets compliments', emoji: '💬' },
        {
          value: 'seasonal_appropriate',
          text: 'Perfect for the season',
          emoji: '🍂',
        },
        { value: 'good_value', text: 'Good value for money', emoji: '💰' },
      ],
    },
    {
      id: 'exploration_approach',
      text: 'How do you like to explore new fragrances?',
      options: [
        {
          value: 'samples_careful',
          text: 'Try samples and research carefully',
          emoji: '🧪',
        },
        {
          value: 'recommendations_trusted',
          text: 'Follow trusted recommendations',
          emoji: '👥',
        },
        {
          value: 'discover_browsing',
          text: 'Browse and discover organically',
          emoji: '🎨',
        },
        {
          value: 'seasonal_rotation',
          text: 'Build a seasonal rotation',
          emoji: '🔄',
        },
        {
          value: 'signature_quest',
          text: 'Search for my signature scent',
          emoji: '🎯',
        },
        {
          value: 'collection_building',
          text: 'Build a curated collection',
          emoji: '💎',
        },
      ],
    },
  ],
};

/**
 * Collector Quiz Structure - 8 questions, 8-10 options each
 */
export const collectorQuizData: AdaptiveQuizData = {
  experience_level: 'collector',
  estimated_time_minutes: 8,
  complexity_description:
    'Sophisticated questions for the discerning collector',
  questions: [
    {
      id: 'composition_mastery',
      text: 'What compositional approaches captivate you?',
      subtitle: 'Select the structures that define your taste',
      allowMultiple: true,
      minSelections: 2,
      maxSelections: 5,
      options: [
        {
          value: 'aldehydic_florals',
          text: 'Aldehydic florals with powdery facets',
          emoji: '✨',
        },
        {
          value: 'chypre_oakmoss',
          text: 'Chypre structures with oakmoss foundations',
          emoji: '🌿',
        },
        {
          value: 'fougere_lavender',
          text: 'Fougère compositions with lavender hearts',
          emoji: '💜',
        },
        {
          value: 'oriental_amber',
          text: 'Oriental amber with resinous depths',
          emoji: '🧡',
        },
        {
          value: 'soliflore_purist',
          text: 'Soliflore interpretations',
          emoji: '🌺',
        },
        {
          value: 'gourmand_artisanal',
          text: 'Artisanal gourmand creations',
          emoji: '🍯',
        },
        { value: 'woody_oud', text: 'Oud and rare wood accords', emoji: '🌲' },
        {
          value: 'animalic_vintage',
          text: 'Animalic and vintage-inspired',
          emoji: '🦌',
        },
        {
          value: 'synthetic_molecular',
          text: 'Molecular and synthetic artistry',
          emoji: '⚗️',
        },
        {
          value: 'natural_botanical',
          text: 'Natural botanical essences',
          emoji: '🌱',
        },
      ],
    },
    {
      id: 'olfactory_families_expert',
      text: 'Which olfactory families define your collection philosophy?',
      allowMultiple: true,
      minSelections: 3,
      maxSelections: 6,
      options: [
        {
          value: 'vintage_aldehydic',
          text: 'Vintage aldehydic classics',
          emoji: '👑',
        },
        {
          value: 'modern_florals',
          text: 'Contemporary floral interpretations',
          emoji: '🌸',
        },
        {
          value: 'niche_orientals',
          text: 'Niche oriental masterpieces',
          emoji: '🏛️',
        },
        {
          value: 'artisan_woody',
          text: 'Artisanal woody compositions',
          emoji: '🎨',
        },
        {
          value: 'rare_botanicals',
          text: 'Rare botanical essences',
          emoji: '🌿',
        },
        {
          value: 'historical_recreations',
          text: 'Historical fragrance recreations',
          emoji: '📜',
        },
        {
          value: 'avant_garde',
          text: 'Avant-garde olfactory art',
          emoji: '🎭',
        },
        {
          value: 'limited_editions',
          text: 'Limited edition masterworks',
          emoji: '💎',
        },
      ],
    },
    {
      id: 'occasion_sophistication',
      text: 'What occasions demand your finest selections?',
      allowMultiple: true,
      minSelections: 2,
      maxSelections: 4,
      options: [
        {
          value: 'daily_signature',
          text: 'Daily signature presence',
          emoji: '👑',
        },
        {
          value: 'boardroom_authority',
          text: 'Boardroom authority',
          emoji: '🏛️',
        },
        {
          value: 'cultural_events',
          text: 'Cultural events and galas',
          emoji: '🎭',
        },
        {
          value: 'intimate_evenings',
          text: 'Intimate evening encounters',
          emoji: '🌙',
        },
        {
          value: 'seasonal_ceremonies',
          text: 'Seasonal ceremonies',
          emoji: '🍂',
        },
        {
          value: 'collection_showcasing',
          text: 'Collection showcasing moments',
          emoji: '💎',
        },
        {
          value: 'artistic_appreciation',
          text: 'Artistic appreciation events',
          emoji: '🎨',
        },
        {
          value: 'private_reflection',
          text: 'Private reflection and solitude',
          emoji: '🧘',
        },
      ],
    },
    {
      id: 'projection_mastery',
      text: 'How do you prefer fragrance projection and presence?',
      options: [
        {
          value: 'intimate_skin_scent',
          text: 'Intimate skin scent - personal aura only',
          emoji: '🤫',
        },
        {
          value: 'moderate_sophistication',
          text: 'Moderate sophistication - conversational distance',
          emoji: '💬',
        },
        {
          value: 'authoritative_presence',
          text: 'Authoritative presence - room awareness',
          emoji: '👑',
        },
        {
          value: 'signature_recognition',
          text: 'Signature recognition - memorable trail',
          emoji: '🎯',
        },
        {
          value: 'occasion_adaptive',
          text: 'Occasion-adaptive projection',
          emoji: '🎭',
        },
        {
          value: 'vintage_inspired',
          text: 'Vintage-inspired presence',
          emoji: '📜',
        },
        {
          value: 'artistic_expression',
          text: 'Artistic expression - bold statement',
          emoji: '🎨',
        },
        {
          value: 'molecular_precision',
          text: 'Molecular precision - calculated impact',
          emoji: '⚗️',
        },
      ],
    },
    {
      id: 'seasonal_curation',
      text: 'How do you approach seasonal fragrance curation?',
      allowMultiple: true,
      minSelections: 2,
      maxSelections: 4,
      options: [
        {
          value: 'weather_responsive',
          text: 'Weather-responsive selections',
          emoji: '🌤️',
        },
        {
          value: 'mood_seasonal',
          text: 'Mood and seasonal harmony',
          emoji: '🍂',
        },
        {
          value: 'cultural_calendar',
          text: 'Cultural calendar alignment',
          emoji: '📅',
        },
        {
          value: 'vintage_modern_blend',
          text: 'Vintage-modern seasonal blend',
          emoji: '⚖️',
        },
        {
          value: 'geographic_inspiration',
          text: 'Geographic and climate inspiration',
          emoji: '🗺️',
        },
        {
          value: 'botanical_cycles',
          text: 'Natural botanical cycles',
          emoji: '🌿',
        },
        {
          value: 'historical_periods',
          text: 'Historical period themes',
          emoji: '🏛️',
        },
        {
          value: 'personal_milestones',
          text: 'Personal milestone celebrations',
          emoji: '🎊',
        },
      ],
    },
    {
      id: 'collection_philosophy',
      text: 'What drives your collection philosophy?',
      allowMultiple: true,
      minSelections: 2,
      maxSelections: 4,
      options: [
        {
          value: 'artistic_curation',
          text: 'Artistic curation and aesthetics',
          emoji: '🎨',
        },
        {
          value: 'historical_preservation',
          text: 'Historical preservation',
          emoji: '📜',
        },
        {
          value: 'rare_acquisition',
          text: 'Rare and limited acquisition',
          emoji: '💎',
        },
        {
          value: 'perfumer_mastery',
          text: 'Master perfumer appreciation',
          emoji: '👨‍🎨',
        },
        {
          value: 'cultural_significance',
          text: 'Cultural significance and stories',
          emoji: '📚',
        },
        {
          value: 'technical_innovation',
          text: 'Technical innovation and craft',
          emoji: '⚗️',
        },
        {
          value: 'personal_evolution',
          text: 'Personal olfactory evolution',
          emoji: '🦋',
        },
        {
          value: 'investment_legacy',
          text: 'Investment and legacy building',
          emoji: '🏛️',
        },
      ],
    },
    {
      id: 'artisanal_appreciation',
      text: 'What artisanal elements captivate you most?',
      allowMultiple: true,
      minSelections: 3,
      maxSelections: 5,
      options: [
        {
          value: 'natural_extraction',
          text: 'Natural extraction methods',
          emoji: '🌿',
        },
        {
          value: 'vintage_materials',
          text: 'Vintage and aged materials',
          emoji: '🍷',
        },
        {
          value: 'molecular_innovation',
          text: 'Molecular innovation',
          emoji: '⚗️',
        },
        {
          value: 'traditional_techniques',
          text: 'Traditional crafting techniques',
          emoji: '🏺',
        },
        {
          value: 'rare_ingredients',
          text: 'Rare and exotic ingredients',
          emoji: '💎',
        },
        {
          value: 'artistic_vision',
          text: 'Artistic vision and storytelling',
          emoji: '🎭',
        },
        {
          value: 'sustainable_practices',
          text: 'Sustainable and ethical practices',
          emoji: '♻️',
        },
        {
          value: 'collaborative_artistry',
          text: 'Collaborative artistic projects',
          emoji: '🤝',
        },
        {
          value: 'cultural_authenticity',
          text: 'Cultural authenticity and heritage',
          emoji: '🏮',
        },
        {
          value: 'innovative_presentation',
          text: 'Innovative presentation and packaging',
          emoji: '📦',
        },
      ],
    },
    {
      id: 'aesthetic_balance',
      text: 'How do you balance vintage classics with modern innovations?',
      options: [
        {
          value: 'vintage_purist',
          text: 'Vintage purist - classics define excellence',
          emoji: '👑',
        },
        {
          value: 'modern_pioneer',
          text: 'Modern pioneer - innovation drives discovery',
          emoji: '🚀',
        },
        {
          value: 'balanced_curator',
          text: 'Balanced curator - best of both worlds',
          emoji: '⚖️',
        },
        {
          value: 'contextual_selector',
          text: 'Contextual selector - occasion determines choice',
          emoji: '🎭',
        },
        {
          value: 'evolutionary_collector',
          text: 'Evolutionary - taste develops over time',
          emoji: '🦋',
        },
        {
          value: 'artistic_interpreter',
          text: 'Artistic interpreter of olfactory culture',
          emoji: '🎨',
        },
        {
          value: 'technical_analyst',
          text: 'Technical analyst of composition craft',
          emoji: '⚗️',
        },
        {
          value: 'cultural_historian',
          text: 'Cultural historian of fragrance evolution',
          emoji: '📚',
        },
      ],
    },
  ],
};

/**
 * Get quiz data based on experience level
 */
export function getAdaptiveQuizData(
  experienceLevel: ExperienceLevel
): AdaptiveQuizData {
  switch (experienceLevel) {
    case 'beginner':
      return beginnerQuizData;
    case 'enthusiast':
      return enthusiastQuizData;
    case 'collector':
      return collectorQuizData;
    default:
      return enthusiastQuizData; // Fallback to enthusiast level
  }
}

/**
 * Validate quiz data structure
 */
export function validateQuizStructure(quizData: AdaptiveQuizData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check question count requirements
  const expectedQuestionCount =
    quizData.experience_level === 'beginner'
      ? 4
      : quizData.experience_level === 'enthusiast'
        ? 6
        : 8;

  if (quizData.questions.length !== expectedQuestionCount) {
    errors.push(
      `Expected ${expectedQuestionCount} questions for ${quizData.experience_level}, got ${quizData.questions.length}`
    );
  }

  // Check option count requirements
  quizData.questions.forEach((question, index) => {
    const expectedOptionCount =
      quizData.experience_level === 'beginner'
        ? 4
        : quizData.experience_level === 'enthusiast'
          ? 6
          : question.id.includes('composition') ||
              question.id.includes('artisanal')
            ? 10
            : 8;

    if (question.options.length !== expectedOptionCount) {
      errors.push(
        `Question ${index + 1}: Expected ${expectedOptionCount} options for ${quizData.experience_level}, got ${question.options.length}`
      );
    }

    // Validate option text quality
    question.options.forEach((option, optionIndex) => {
      if (option.text.length < 5) {
        errors.push(
          `Question ${index + 1}, Option ${optionIndex + 1}: Text too short`
        );
      }
      if (option.text.length > 60) {
        errors.push(
          `Question ${index + 1}, Option ${optionIndex + 1}: Text too long`
        );
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
