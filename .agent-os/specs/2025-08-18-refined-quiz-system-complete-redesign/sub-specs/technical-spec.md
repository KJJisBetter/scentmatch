# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-18-refined-quiz-system-complete-redesign/spec.md

## Technical Requirements

### Complete Quiz Question Structure Redesign

#### Experience-Based Question Scaling

**Question 1: Gender Selection (All Levels)**

- Options: ["Women", "Men", "Unisex"] (fix "uninex" typo)
- Remove "All fragrances" option

**Question 2: Experience Level (All Levels)**

- Beginner: "Just getting started"
- Enthusiast: "I have my favorites"
- Experienced: "Love trying new things"

**Question 3: Scent Preferences (Progressive Complexity)**

_Beginner (4 + open):_

- "Fresh & clean" _(citrus, aquatic, cucumber)_
- "Sweet & fruity" _(vanilla, berries, apple)_
- "Floral & pretty" _(rose, jasmine, peony)_
- "Warm & cozy" _(wood, spice, amber)_
- "I'm open to anything"

_Enthusiast (7 + open):_

- "Fresh & citrusy" _(lemon, bergamot, grapefruit)_
- "Fresh & oceanic" _(sea salt, marine, water lily)_
- "Sweet" _(vanilla, caramel, honey)_
- "Fruity" _(berries, apple, peach)_
- "Floral" _(rose, jasmine, gardenia)_
- "Warm & spicy" _(cinnamon, pepper, cardamom)_
- "Woody" _(sandalwood, cedar, oak)_
- "I love variety"

_Experienced (10 + open):_

- "Citrus" _(bergamot, lemon, yuzu)_
- "Aquatic" _(marine, sea salt, ozone)_
- "Sweet" _(vanilla, tonka, benzoin)_
- "Fruity" _(berries, stone fruits, tropical)_
- "Spicy" _(pepper, cinnamon, clove)_
- "Floral" _(rose, jasmine, iris)_
- "Woody" _(sandalwood, cedar, vetiver)_
- "Fresh & green" _(grass, mint, basil)_
- "Warm & ambery" _(amber, labdanum, resin)_
- "Unique & unusual" _(leather, smoke, incense)_
- "I just love fragrances"

**Question 4: Personality Style (All Levels - Same 4 Options)**

- "Bold & confident"
- "Easy-going & relaxed"
- "Unique & creative"
- "Classic & timeless"

**Question 5: Occasions (Experience-Based Scaling)**

_Beginner (5):_

- "Every day"
- "Special occasions"
- "Professional settings"
- "Weekend fun"
- "I want one versatile fragrance"

_Enthusiast (7):_

- "Daily signature"
- "Romantic moments"
- "Professional presence"
- "Social gatherings"
- "Weekend adventures"
- "Evening elegance"
- "I want versatile options"

_Experienced (8 - No versatile option):_

- "Daily signature"
- "Romantic encounters"
- "Professional authority"
- "Social magnetism"
- "Weekend exploration"
- "Evening sophistication"
- "Seasonal rotation"
- "Mood-based selection"

**Question 6: Season/Vibe (Enthusiast & Experienced Only)**

- "Spring garden party" _(fresh, floral, light)_
- "Summer beach day" _(citrus, aquatic, energizing)_
- "Fall cozy evening" _(warm, spicy, comforting)_
- "Winter fireside" _(rich, deep, enveloping)_
- "I like adapting with seasons"

**Question 7: Previous Favorites (Enthusiast & Experienced Only)**

- Search/select interface for existing fragrances

#### Question Flow Logic

- **Beginner**: 4 questions (skip seasons and favorites)
- **Enthusiast**: 5-6 questions (add seasons, optional favorites)
- **Experienced**: 5-6 questions (same as enthusiast but more granular options)

### AI Recommendation System Enhancement

#### System Prompt for AI Recommendations

```
You are a friendly, knowledgeable fragrance expert who helps people discover their perfect scents. You're approachable and practical - like a friend who happens to know a lot about fragrances. You're confident in your recommendations but never pretentious or overwhelming.

For each of the 3 recommendations, follow this exact structure:

**[Fragrance Name] by [Brand]**

[Personal insight explaining why this matches their quiz answers] [Simple description of the fragrance in appealing terms] [Practical guidance about strength and usage]

**Match: [X]% | Sample: $[X] | [X] sprays recommended**

EXPERIENCE LEVEL ADAPTATION:
- Beginner: Use simple language, focus on feelings/benefits, avoid technical terms
- Enthusiast: Moderate detail, some fragrance vocabulary, practical tips
- Experienced: More sophisticated language, fragrance families, technical details

SCENT MATCHING LOGIC:
[Map each quiz option to specific fragrance notes and families]

PERSONALITY STYLE MATCHING:
- Bold & confident → Intense, memorable, statement scents
- Easy-going & relaxed → Approachable, comfortable, easy-wearing
- Unique & creative → Niche, unusual, artistic compositions
- Classic & timeless → Traditional, elegant, sophisticated

OCCASION MATCHING:
- Every day/Daily signature → Moderate projection, 4-6 hour longevity
- Professional → Subtle, office-appropriate, clean
- Romantic/Special occasions → More intense, sensual, memorable
- Evening/Sophistication → Bold, long-lasting, statement scents
- Versatile → Balanced, adaptable, crowd-pleasing

STRENGTH & SPRAY GUIDANCE:
- Subtle & intimate: 3-4 sprays, close-to-skin, 3-5 hours
- Moderate: 2-3 sprays, arm's length projection, 4-6 hours
- Intense & long-lasting: 1-2 sprays, room-filling, 6-8+ hours

Always explain match percentage and include specific spray guidance.
```

#### API Response Format Enhancement

- Remove personality profile generation completely
- Return exactly 3 fragrance recommendations
- Include AI reasoning for each recommendation
- Add strength classification and spray guidance
- Include match percentage explanation

### Fragrance Data Standardization Requirements

#### Name Cleanup Patterns

- Remove " for Men" suffixes: "Coach for Men" → "Coach"
- Remove " for Women" suffixes: "Chanel No. 5 for Women" → "Chanel No. 5"
- Standardize brand names: Consistent capitalization and spacing
- Clean special characters: Remove unnecessary punctuation
- Validate fragrance/brand separation: Ensure proper data structure

#### Data Validation Rules

- Brand field: Required, no gender suffixes
- Fragrance name field: Required, no gender suffixes
- Gender field: Separate field with values ["women", "men", "unisex"]
- Rating field: Numeric validation
- Notes field: Comma-separated, standardized note names

### Component Architecture Updates

#### ExperienceLevelAdaptiveQuiz Component Changes

- Update all question sets with new structure
- Implement dynamic option rendering based on experience level
- Add conditional question flow (skip seasons for beginners)
- Update response handling for new question formats
- Implement new natural language throughout

#### New AI Insight Display Component

- Create component to display 3 fragrance recommendations
- Include match percentage, pricing, spray guidance
- Format AI insights with proper typography
- Handle different content for different experience levels
- Replace personality profile display entirely

#### ConversionFlow Component Updates

- Modify to handle new result format without personality profiles
- Update for new AI insight structure
- Maintain conversion optimization while showing direct recommendations

### Database Migration Requirements

#### Fragrance Data Cleanup Migration

- Script to remove gender suffixes from all fragrance names
- Standardize brand name formatting
- Add/update gender classification field
- Validate data integrity after cleanup
- Create backup of original data before migration

#### New Fields Addition

- Add intensity classification field (subtle, moderate, intense)
- Add longevity field (3-5, 4-6, 6-8+ hours)
- Add spray_guidance field (1-2, 2-3, 3-4 sprays)
- Update existing records with appropriate classifications

## External Dependencies

No new external dependencies required - working within existing React, Next.js, and TailwindCSS framework.
