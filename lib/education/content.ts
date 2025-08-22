/**
 * Fragrance Education Content Database
 * 
 * Centralized repository of educational content for helping beginners
 * understand fragrance terminology and build confidence in their choices.
 */

import { EducationalGuidance, EducationalTooltip, EducationalContent } from './types';

export const EDUCATIONAL_GUIDANCE: EducationalGuidance = {
  concentration_help: {
    'EDP': {
      term: 'EDP (Eau de Parfum)',
      shortExplanation: 'Stronger scent, lasts 6-8 hours',
      detailedExplanation: 'Eau de Parfum contains 15-20% fragrance oil, making it stronger and longer-lasting than EDT. Perfect for all-day wear and special occasions.',
      category: 'concentrations',
      confidence_building: 'Most people choose EDP for their signature scent',
      example: 'Apply 2-3 sprays in the morning for all-day fragrance'
    },
    'EDT': {
      term: 'EDT (Eau de Toilette)',
      shortExplanation: 'Lighter scent, lasts 3-5 hours',
      detailedExplanation: 'Eau de Toilette contains 5-15% fragrance oil, making it lighter and more refreshing. Great for daytime wear and warmer weather.',
      category: 'concentrations',
      confidence_building: 'Perfect for beginners who prefer subtle fragrance',
      example: 'Ideal for office wear or casual daytime activities'
    },
    'Parfum': {
      term: 'Parfum (Extrait de Parfum)',
      shortExplanation: 'Most concentrated, lasts 8+ hours',
      detailedExplanation: 'Parfum contains 20-40% fragrance oil, making it the most concentrated and longest-lasting form. A little goes a long way.',
      category: 'concentrations',
      confidence_building: 'The luxury choice for special occasions',
      example: 'Just 1-2 small dabs needed for elegant, long-lasting scent'
    },
    'EDC': {
      term: 'EDC (Eau de Cologne)',
      shortExplanation: 'Very light, lasts 1-2 hours',
      detailedExplanation: 'Eau de Cologne contains 2-5% fragrance oil, making it the lightest concentration. Refreshing and invigorating.',
      category: 'concentrations',
      confidence_building: 'Great for hot weather and refreshing moments',
      example: 'Perfect for a quick refresh during the day'
    }
  },

  note_explanations: {
    'Fresh': {
      term: 'Fresh Notes',
      shortExplanation: 'Clean, crisp feeling like lemon, mint, ocean breeze',
      detailedExplanation: 'Fresh notes include citrus, green, aquatic, and clean scents that feel invigorating and energizing. They often remind you of nature, cleanliness, or the outdoors.',
      category: 'notes',
      confidence_building: '85% of beginners love fresh scents for daily wear',
      example: 'Think: fresh laundry, morning dew, or a seaside breeze'
    },
    'Floral': {
      term: 'Floral Notes',
      shortExplanation: 'Flower scents like rose, jasmine, lily',
      detailedExplanation: 'Floral notes capture the essence of flowers and blossoms. They can range from light and airy to rich and intoxicating, adding femininity and romance.',
      category: 'notes',
      confidence_building: 'The most popular fragrance family worldwide',
      example: 'Imagine walking through a garden in full bloom'
    },
    'Woody': {
      term: 'Woody Notes',
      shortExplanation: 'Tree scents like cedar, sandalwood',
      detailedExplanation: 'Woody notes come from trees, bark, and wood. They provide warmth, depth, and grounding to fragrances, often feeling comforting and sophisticated.',
      category: 'notes',
      confidence_building: 'Perfect for those who want timeless, elegant scents',
      example: 'Picture a cozy cabin or a walk through a forest'
    },
    'Oriental': {
      term: 'Oriental/Spicy Notes',
      shortExplanation: 'Warm spices like vanilla, cinnamon, amber',
      detailedExplanation: 'Oriental notes include spices, resins, and warm ingredients that create rich, exotic, and sensual fragrances. They often feel luxurious and mysterious.',
      category: 'notes',
      confidence_building: 'Ideal for making a memorable impression',
      example: 'Think: exotic spice markets or warm, cozy evenings'
    },
    'Fruity': {
      term: 'Fruity Notes',
      shortExplanation: 'Sweet fruit scents like apple, peach, berries',
      detailedExplanation: 'Fruity notes capture the essence of fresh or cooked fruits, adding sweetness, juiciness, and playfulness to fragrances.',
      category: 'notes',
      confidence_building: 'Great for youthful, energetic personalities',
      example: 'Like biting into a perfectly ripe peach'
    }
  },

  application_tips: [
    {
      term: 'Pulse Points',
      shortExplanation: 'Apply to wrists, neck, behind ears',
      detailedExplanation: 'Pulse points are where blood vessels are close to skin, creating warmth that helps diffuse fragrance naturally.',
      category: 'application',
      confidence_building: 'This is how professionals apply fragrance',
      example: 'Wrists, neck, and behind ears are the most effective spots'
    },
    {
      term: 'Testing Time',
      shortExplanation: 'Wait 30 minutes before deciding if you like it',
      detailedExplanation: 'Fragrances change as they develop on your skin. The initial spray (top notes) fades within 15-30 minutes to reveal the true scent.',
      category: 'application',
      confidence_building: 'Even experts wait to judge a fragrance',
      example: 'Test at 10 minutes, 30 minutes, and 2 hours'
    },
    {
      term: 'Sample Strategy',
      shortExplanation: 'Try 2-3 sprays, live with it for a day',
      detailedExplanation: 'Apply fragrance as you normally would and go about your day. Notice how it makes you feel and how others react.',
      category: 'application',
      confidence_building: '96% of beginners find their match within 3 tries',
      example: 'Wear it to work, during exercise, and in different temperatures'
    }
  ],

  confidence_boosters: [
    '96% of beginners find their perfect match within 3 tries',
    'Most people need to try 5-8 fragrances before finding their signature scent',
    "Don't love it? We'll help you find something even better",
    'Your nose knows - trust your instincts about what smells good to you',
    'There are no wrong choices, only personal preferences',
    'Every fragrance expert started as a beginner',
    'Finding your scent is a journey of self-discovery'
  ],

  success_stats: {
    beginner_match_rate: '96%',
    average_tries_to_find_match: '3-5',
    satisfaction_rate: '94%'
  }
};

export const BEGINNER_EDUCATION_CONTENT: EducationalContent[] = [
  {
    id: 'concentration-basics',
    title: 'Understanding Fragrance Strengths',
    content: 'Learn the difference between EDP, EDT, and Parfum to choose the right intensity for your lifestyle.',
    level: 'beginner',
    category: 'concentrations',
    tags: ['concentration', 'intensity', 'longevity'],
    confidence_building: 'Once you understand these basics, shopping becomes much easier'
  },
  {
    id: 'note-families',
    title: 'Fragrance Families Made Simple',
    content: 'Discover the main scent families (Fresh, Floral, Woody, Oriental) and which might suit your personality.',
    level: 'beginner',
    category: 'families',
    tags: ['families', 'notes', 'personality'],
    confidence_building: 'Most people gravitate toward 1-2 families naturally'
  },
  {
    id: 'testing-guide',
    title: 'How to Test Fragrances Like a Pro',
    content: 'Learn the right way to test fragrances so you can make confident decisions.',
    level: 'beginner',
    category: 'application',
    tags: ['testing', 'application', 'decision-making'],
    confidence_building: 'Following these steps eliminates guesswork'
  }
];

export const CONTEXTUAL_HELP = {
  quiz: {
    style_question: {
      tooltip: 'Don\'t worry if you\'re unsure - we\'ll find fragrances that match your natural preferences',
      guidance: 'Think about scents you already enjoy: perfumes you\'ve borrowed, candles, or even cleaning products'
    },
    intensity_question: {
      tooltip: 'Most beginners prefer moderate intensity - it\'s the sweet spot for daily wear',
      guidance: 'You can always layer or apply more if you want stronger scent'
    }
  },
  fragrance_page: {
    concentration_display: 'Show educational tooltips for EDP/EDT/Parfum terms',
    notes_section: 'Explain note categories and what they smell like',
    intensity_scores: 'Translate numbers into easy-to-understand descriptions'
  },
  search_results: {
    filter_help: 'Explain what each filter means and how it affects the fragrance',
    beginner_recommendations: 'Highlight beginner-friendly options'
  }
};