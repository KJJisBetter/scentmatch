# Fixed Quiz Questions Design

## Problem Analysis

The AI analysis expects specific question IDs and answer values that don't match current quiz:

**Current Quiz Issues:**

- Question ID: `'personality_style'` → AI expects: `'style_simple'/'style_moderate'/'collection_style'`
- Answer values: `'fresh'` → AI expects: `'fresh_clean'`, `'fresh_citrus'`, etc.
- Generic "personality" question instead of fragrance-specific

**AI Expected Mappings (from analyze-enhanced/route.ts):**

```typescript
// Question IDs the AI recognizes:
case 'style_simple':
case 'style_moderate':
case 'collection_style':
case 'occasions_simple':
case 'occasions_detailed':
case 'wearing_occasions':
case 'scent_preference_simple':
case 'fragrance_families':
case 'composition_preferences':
case 'intensity_simple':

// Answer values for scent analysis:
'fresh_clean': { fresh: 0.5 },
'sweet_fruity': { fruity: 0.4, gourmand: 0.2 },
'floral_pretty': { floral: 0.5 },
'warm_cozy': { gourmand: 0.3, woody: 0.3 },
'fresh_citrus': { fresh: 0.4, fruity: 0.2 },
'floral_bouquet': { floral: 0.5 },
'oriental_spicy': { oriental: 0.5 },
'woody_earthy': { woody: 0.5 },
'gourmand_sweet': { gourmand: 0.5 }
```

## Fixed Questions Design

### Beginner Questions (Replace lines 123-179)

```typescript
beginner: [
  {
    id: 'style_simple', // ✅ AI recognizes this ID
    text: 'How would you describe your fragrance style?',
    subtitle: 'Choose the style that feels most like you',
    allowMultiple: false,
    options: [
      {
        value: 'casual_relaxed',
        text: 'Casual & Relaxed',
        emoji: '😊',
        description: 'Easy-going, comfortable scents',
      },
      {
        value: 'polished_professional',
        text: 'Polished & Professional',
        emoji: '💼',
        description: 'Sophisticated, work-appropriate',
      },
      {
        value: 'romantic_feminine',
        text: 'Romantic & Feminine',
        emoji: '💕',
        description: 'Soft, alluring, floral',
      },
      {
        value: 'bold_confident',
        text: 'Bold & Confident',
        emoji: '✨',
        description: 'Strong presence, memorable',
      },
    ],
  },
  {
    id: 'occasions_simple', // ✅ AI recognizes this ID
    text: 'When do you most want to smell amazing?',
    subtitle: 'Choose your primary fragrance occasion',
    allowMultiple: false,
    options: [
      {
        value: 'everyday_casual',
        text: 'Every day',
        emoji: '☀️',
        description: 'Daily confidence boost',
      },
      {
        value: 'work_professional',
        text: 'At work',
        emoji: '🏢',
        description: 'Professional settings',
      },
      {
        value: 'evening_special',
        text: 'Evening & dates',
        emoji: '🌙',
        description: 'Romantic occasions',
      },
      {
        value: 'social_gatherings',
        text: 'Social events',
        emoji: '🎉',
        description: 'Parties & gatherings',
      },
    ],
  },
  {
    id: 'scent_preference_simple', // ✅ AI recognizes this ID
    text: 'Which scent type appeals to you most?',
    subtitle: 'Think about what draws you in',
    allowMultiple: false,
    options: [
      {
        value: 'fresh_clean',
        text: 'Fresh & Clean',
        emoji: '🌿',
        description: 'Citrus, aquatic, crisp',
      },
      {
        value: 'floral_pretty',
        text: 'Floral & Pretty',
        emoji: '🌺',
        description: 'Rose, jasmine, feminine',
      },
      {
        value: 'sweet_fruity',
        text: 'Sweet & Fruity',
        emoji: '🍓',
        description: 'Berry, vanilla, gourmand',
      },
      {
        value: 'warm_cozy',
        text: 'Warm & Cozy',
        emoji: '🤗',
        description: 'Amber, wood, comforting',
      },
    ],
  },
  {
    id: 'intensity_simple', // ✅ AI recognizes this ID
    text: 'How strong should your fragrance be?',
    subtitle: 'Consider your comfort level',
    allowMultiple: false,
    options: [
      {
        value: 'subtle_gentle',
        text: 'Subtle & Gentle',
        emoji: '🤫',
        description: 'Just for me',
      },
      {
        value: 'moderate_noticed',
        text: 'Moderate',
        emoji: '👥',
        description: 'Noticed when close',
      },
      {
        value: 'strong_memorable',
        text: 'Strong & Memorable',
        emoji: '💫',
        description: 'Makes an impression',
      },
    ],
  },
];
```

### Enthusiast Questions (Replace lines 180-244)

```typescript
enthusiast: [
  {
    id: 'style_moderate', // ✅ AI recognizes this ID
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
      { value: 'romantic_feminine', text: 'Romantic & Feminine', emoji: '💕' },
      { value: 'bold_confident', text: 'Bold & Confident', emoji: '✨' },
      { value: 'classical_heritage', text: 'Classic & Timeless', emoji: '👑' },
      { value: 'avant_garde_modern', text: 'Modern & Unique', emoji: '🎨' },
    ],
  },
  {
    id: 'fragrance_families', // ✅ AI recognizes this ID
    text: 'Which fragrance families appeal to you?',
    subtitle: 'Select all families you enjoy or want to explore',
    allowMultiple: true,
    minSelections: 2,
    maxSelections: 4,
    options: [
      {
        value: 'fresh_citrus',
        text: 'Fresh Citrus',
        emoji: '🍋',
        description: 'Lemon, bergamot, grapefruit',
      },
      {
        value: 'floral_bouquet',
        text: 'Floral Bouquet',
        emoji: '🌸',
        description: 'Rose, jasmine, lily',
      },
      {
        value: 'oriental_spicy',
        text: 'Oriental Spicy',
        emoji: '🌶️',
        description: 'Vanilla, amber, cinnamon',
      },
      {
        value: 'woody_earthy',
        text: 'Woody Earthy',
        emoji: '🌲',
        description: 'Sandalwood, cedar, vetiver',
      },
      {
        value: 'gourmand_sweet',
        text: 'Gourmand Sweet',
        emoji: '🍰',
        description: 'Vanilla, chocolate, caramel',
      },
      {
        value: 'fresh_clean',
        text: 'Fresh Aquatic',
        emoji: '💧',
        description: 'Marine, ozonic, clean',
      },
    ],
  },
  {
    id: 'occasions_detailed', // ✅ AI recognizes this ID
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
      { value: 'romantic_dates', text: 'Romantic occasions', emoji: '💕' },
      { value: 'social_gatherings', text: 'Social gatherings', emoji: '🎊' },
      { value: 'everyday_casual', text: 'Daily confidence', emoji: '☀️' },
      { value: 'evening_special', text: 'Special events', emoji: '🌟' },
    ],
  },
  {
    id: 'intensity_simple', // ✅ AI recognizes this ID
    text: 'What fragrance intensity do you prefer?',
    subtitle: 'Consider your lifestyle and preferences',
    allowMultiple: false,
    options: [
      {
        value: 'subtle_personal',
        text: 'Subtle & Personal',
        emoji: '🤫',
        description: 'Close to skin',
      },
      {
        value: 'moderate_noticeable',
        text: 'Moderate & Noticeable',
        emoji: '👥',
        description: 'Pleasant presence',
      },
      {
        value: 'strong_memorable',
        text: 'Strong & Memorable',
        emoji: '💫',
        description: 'Lasting impression',
      },
    ],
  },
];
```

### Collector Questions (Replace lines 245-291)

```typescript
collector: [
  {
    id: 'collection_style', // ✅ AI recognizes this ID
    text: 'How would you characterize your olfactory aesthetic?',
    subtitle: 'Choose the approach that defines your collection',
    allowMultiple: false,
    options: [
      {
        value: 'classical_heritage',
        text: 'Classical heritage compositions',
        emoji: '🏛️',
        description: 'Timeless masterpieces',
      },
      {
        value: 'avant_garde_modern',
        text: 'Avant-garde modern creations',
        emoji: '🎨',
        description: 'Cutting-edge artistry',
      },
      {
        value: 'niche_artisanal',
        text: 'Niche artisanal expressions',
        emoji: '🎭',
        description: 'Unique craftsmanship',
      },
    ],
  },
  {
    id: 'composition_preferences', // ✅ AI recognizes this ID
    text: 'Which compositional elements resonate most?',
    subtitle: 'Select your preferred fragrance characteristics',
    allowMultiple: true,
    minSelections: 2,
    maxSelections: 3,
    options: [
      {
        value: 'fresh_citrus',
        text: 'Citrus complexity',
        emoji: '🍋',
        description: 'Sophisticated citrus blends',
      },
      {
        value: 'floral_bouquet',
        text: 'Floral artistry',
        emoji: '🌸',
        description: 'Complex floral compositions',
      },
      {
        value: 'oriental_spicy',
        text: 'Oriental richness',
        emoji: '🌶️',
        description: 'Deep, spicy orientals',
      },
      {
        value: 'woody_earthy',
        text: 'Woody sophistication',
        emoji: '🌲',
        description: 'Complex wood accords',
      },
    ],
  },
  {
    id: 'wearing_occasions', // ✅ AI recognizes this ID
    text: 'How do you approach fragrance wearing?',
    subtitle: 'Choose your wearing philosophy',
    allowMultiple: false,
    options: [
      {
        value: 'romantic_dates',
        text: 'Curated signature rotation',
        emoji: '👑',
        description: 'Carefully selected favorites',
      },
      {
        value: 'evening_special',
        text: 'Occasion-specific selection',
        emoji: '🎭',
        description: 'Right scent for the moment',
      },
      {
        value: 'social_gatherings',
        text: 'Artistic exploration',
        emoji: '🎨',
        description: 'Discovery and experimentation',
      },
    ],
  },
  {
    id: 'investment_approach', // ✅ AI recognizes this ID
    text: 'What is your approach to fragrance acquisition?',
    subtitle: 'Choose your collection philosophy',
    allowMultiple: false,
    options: [
      {
        value: 'masterpiece_collecting',
        text: 'Collecting recognized masterpieces',
        emoji: '🏆',
        description: 'Iconic compositions',
      },
      {
        value: 'emerging_discovery',
        text: 'Discovering emerging talents',
        emoji: '🌟',
        description: 'New perfumer works',
      },
      {
        value: 'limited_exclusive',
        text: 'Limited and exclusive releases',
        emoji: '💎',
        description: 'Rare and unique',
      },
    ],
  },
];
```

## Implementation Strategy

1. **Replace question sets** in `experience-level-adaptive-quiz.tsx` lines 123-291
2. **Ensure question IDs match** what AI analysis expects
3. **Use answer values** that map to AI's scentMapping
4. **Test data flow** from quiz → AI analysis → recommendations
5. **Verify personality scoring** works with new fragrance-focused responses

This design ensures the AI can properly analyze responses and generate accurate fragrance recommendations based on actual scent preferences rather than generic personality traits.
