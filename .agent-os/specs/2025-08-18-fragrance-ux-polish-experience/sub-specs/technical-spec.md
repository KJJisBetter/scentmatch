# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-18-fragrance-ux-polish-experience/spec.md

## Technical Requirements

### Fix Quiz Questions (Replace Specific Components)

**Current Components to Replace:**

- `components/quiz/experience-level-adaptive-quiz.tsx` lines 123-179 (beginner questions)
- `components/quiz/experience-level-adaptive-quiz.tsx` lines 180-244 (enthusiast questions)
- `components/quiz/experience-level-adaptive-quiz.tsx` lines 245-291 (collector questions)

**New Fragrance-Specific Questions:**

```typescript
// Replace personality questions with fragrance preference questions
const fragranceQuestions = [
  {
    id: 'scent_families',
    text: 'Which scent families appeal to you most?',
    type: 'multiple_choice',
    options: [
      {
        value: 'citrus',
        text: 'Fresh & Citrusy',
        emoji: '🍋',
        description: 'Lemon, bergamot, grapefruit',
      },
      {
        value: 'floral',
        text: 'Floral & Romantic',
        emoji: '🌸',
        description: 'Rose, jasmine, lily',
      },
      {
        value: 'woody',
        text: 'Woody & Grounding',
        emoji: '🌲',
        description: 'Sandalwood, cedar, vetiver',
      },
      {
        value: 'oriental',
        text: 'Warm & Spicy',
        emoji: '🌶️',
        description: 'Vanilla, amber, cinnamon',
      },
    ],
  },
  {
    id: 'wearing_occasions',
    text: 'When do you want to smell amazing?',
    type: 'multiple_choice',
    options: [
      { value: 'work', text: 'Professional settings', emoji: '💼' },
      { value: 'dates', text: 'Romantic occasions', emoji: '💕' },
      { value: 'everyday', text: 'Daily confidence', emoji: '☀️' },
      { value: 'special', text: 'Special events', emoji: '✨' },
    ],
  },
  // ... 5 more specific fragrance questions
];
```

### Fix Broken AI Profile Display

**Current Issue:** ConversionFlow component not showing profile prominently
**Fix Required:** Modify `components/quiz/conversion-flow.tsx` to show profile BEFORE conversion

**New Profile Display Component:**

```typescript
// Create prominent profile display component
const FragranceProfileCard = ({ aiProfile, quizResults }) => (
  <Card className="max-w-2xl mx-auto mb-8 border-2 border-purple-200">
    <CardHeader className="text-center bg-gradient-to-r from-purple-50 to-pink-50">
      <h2 className="text-3xl font-bold text-purple-800">
        {aiProfile.profile_name || "Your Fragrance Personality"}
      </h2>
      <p className="text-lg text-purple-600 mt-2">
        {aiProfile.description || "Based on your scent preferences"}
      </p>
    </CardHeader>
    <CardContent className="pt-6">
      {/* Fragrance wheel visualization */}
      <FragranceWheel userPreferences={quizResults.preferred_families} />

      {/* Top accords display */}
      <div className="mt-6">
        <h3 className="font-semibold mb-3">Your Preferred Scent Notes:</h3>
        <div className="flex flex-wrap gap-2">
          {quizResults.top_accords.map(accord => (
            <Badge key={accord} variant="secondary">{accord}</Badge>
          ))}
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-6 p-4 bg-purple-50 rounded-lg">
        <p className="text-sm text-purple-800">
          Based on your preferences for <strong>{quizResults.preferred_families.join(', ')}</strong> scents
          and <strong>{quizResults.occasions.join(', ')}</strong> occasions, you're a <strong>{aiProfile.profile_name}</strong>.
        </p>
      </div>
    </CardContent>
  </Card>
)
```

### Fix Database Name Formatting

**Current Problem:** Names like "Cloud Ariana Grandefor women" in `/data/fragrances.json`
**Solution:** Data cleaning function + migration to clean CSV data

**Name Cleaning Implementation:**

```typescript
// Clean malformed fragrance names
const cleanFragranceName = (fragrance: any) => {
  // Remove brand name duplication and fix spacing
  let cleanName = fragrance.name
    .replace(new RegExp(fragrance.brandName + 'for', 'gi'), '')
    .replace(/([a-z])for\s*(women|men|women and men)/gi, '$1')
    .trim();

  return {
    ...fragrance,
    name: cleanName,
    displayName: `${cleanName} by ${fragrance.brandName}`,
    genderTag: fragrance.gender,
    cleanBrand: fragrance.brandName,
  };
};

// Migration script from research CSV
const migrateToCleanData = async () => {
  const cleanData = await loadCleanCSVData(
    '/research/kaggle_top_brands_selection.cleaned.csv'
  );
  const processedData = cleanData.map(item => ({
    id: `${item.brand.toLowerCase().replace(/\s+/g, '-')}__${item.name.toLowerCase().replace(/\s+/g, '-')}`,
    name: item.name, // Already clean in CSV
    brand: item.brand, // Already clean in CSV
    displayName: `${item.name} by ${item.brand}`,
    accords: JSON.parse(item.main_accords.replace(/'/g, '"')),
    rating: parseFloat(item.rating_value),
    ratingCount: parseInt(item.rating_count),
    popularityScore: parseFloat(item.score),
    gender: item.gender,
    perfumers: JSON.parse(item.perfumers.replace(/'/g, '"')),
  }));

  return processedData;
};
```

### Fix Affiliate Messaging

**Text Replacements Required:**

```typescript
// Replace store-like messaging throughout interface
const messagingUpdates = {
  // Homepage/headers
  'Shop Fragrances' → 'Discover Your Perfect Fragrance',
  'Buy Now' → 'Try Sample',
  'Add to Cart' → 'Find at Retailers',

  // Recommendation cards
  'Purchase' → 'Try Sample at Sephora',
  'Buy Full Size' → 'Shop at Partner Retailers',

  // Footer/disclosure
  add: 'ScentMatch earns commission from our retail partners'
}

// Update recommendation card component
const RecommendationCard = ({ fragrance }) => (
  <Card>
    <CardContent>
      <h3>{fragrance.displayName}</h3>
      <p>{fragrance.description}</p>

      {/* Primary CTA - Samples */}
      <Button variant="default" className="w-full mb-2">
        <ExternalLink className="w-4 h-4 mr-2" />
        Try Sample at Sephora
      </Button>

      {/* Secondary CTA - Full Size */}
      <Button variant="outline" className="w-full">
        Shop Full Size at Ulta
      </Button>

      <p className="text-xs text-muted-foreground mt-2">
        ScentMatch earns commission from partner retailers
      </p>
    </CardContent>
  </Card>
)
```

### Mobile Touch Optimization

**Specific Mobile Fixes:**

- Quiz question buttons: minimum 44px height with proper spacing
- Profile card: stack elements vertically on mobile, horizontal on desktop
- Recommendation cards: single column on mobile, grid on desktop
- Touch targets for fragrance wheel: larger touch zones for mobile interaction

**Responsive Breakpoints:**

```css
/* Mobile-first approach */
.quiz-option {
  @apply min-h-[44px] w-full mb-3 p-4;
}

.profile-card {
  @apply flex-col space-y-4;
}

@media (min-width: 768px) {
  .profile-card {
    @apply flex-row space-y-0 space-x-6;
  }
}
```

### Performance Requirements

- Quiz completion: < 5 seconds total time
- Profile display: < 2 seconds render time after quiz
- Database queries: < 500ms for fragrance search
- Mobile page load: < 3 seconds on 3G connection
- Image optimization: WebP format with fallbacks
